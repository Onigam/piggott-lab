import type { LabSim } from '@onigam/lab-kit/ui';
import { cutInOmega, frequency } from './alternator';
import { furlingOnset } from './calibration';
import { buildConfig, type Config } from './config';
import { advanceSoc, batteryView, lvdNext, solveBus, type BatteryView } from './electrical';
import { yawEquilibrium } from './furling';
import {
  BATTERY_HIGH_VOLTS,
  BATTERY_LOW_VOLTS,
  CURRENT_LIMIT,
  LAMBDA_RUNAWAY,
  SOC_START,
  TAIL_SWING_DEG,
  TIP_SPEED_LIMIT,
  YAW_TIME_CONSTANT,
} from './machine';
import { clamp, radToRpm } from './physics';
import {
  presetParams,
  RANGES,
  scenarioSetup,
  START_HOUR,
  type Ramp,
  type RangedKey,
  type ScheduledEvent,
} from './presets';
import { rotorTorque } from './rotor';
import { electricalTorque, evaluate, frictionTorque, operatingPoint } from './steady';
import type {
  AlarmKey,
  History,
  Ledger,
  OperatingPoint,
  PiggottParams,
  PiggottState,
  PresetId,
  ScenarioId,
  Scope,
} from './types';
import { GAUSS_NODES, GAUSS_WEIGHTS, GustProcess, hubWind, turbulenceIntensity, WeatherProcess } from './wind';
import { powerCurve, windGrid, yearlyYield, type CurvePoint, type YearlyYield } from './yield';

// Real-time simulation of the wind turbine in two time regimes (like the ram pump and Pelton labs):
//  - the FAST dynamics (gusts, rotor speed, yaw) are integrated in real time with a fixed step of 20 ms, whatever the
//    frame rate, at `dt × slowMo`. They are what the 3D scene animates. The rotor torque balance
//    J·dω/dt = T_rotor − T_electrical − T_friction is solved implicitly (a bracketed root), so no frame is unstable;
//  - the SLOW quantities (clock, hour-to-hour weather, battery state of charge, energy counters, scripted events)
//    integrate the *averages* of the steady-state model over the gusts × dt × timeScale, so that at ×3600 a day passes
//    in 24 real seconds without simulating 1.7 million rotor steps.
// Deterministic: all randomness comes from a seeded generator drawn on fixed time grids (wind.ts).

/** Fixed step of the fast dynamics, s. */
const FAST_STEP = 0.02;
/** Longest frame accepted (a hidden tab returning), s. */
const MAX_FRAME = 0.1;
/** Longest chunk of the slow integration, simulated s. */
const SLOW_CHUNK = 300;
/** Minimum real time between two recomputations of the gust-averaged operating point, s. */
const MEAN_INTERVAL = 0.12;
/** Visual rotor: speed cap in turns per real second, and the speeds between which the blur fades in. */
const VISUAL_CAP = 2.5;
const BLUR_FROM = 1.5;
const BLUR_TO = 4;
/** Spacing of the scope samples, s of fast time; length kept. */
const SCOPE_DT = 0.25;
const SCOPE_LENGTH = 240;
/** Spacing of the history samples, simulated s; length kept (48 h). */
const HISTORY_DT = 300;
const HISTORY_LENGTH = 576;
/** The tail counts as "furling" for the alarm once the machine has yawed this far beyond its stop, degrees. */
const FURLING_ALARM_DEG = 3;

const DEG = 180 / Math.PI;

/** The gust-averaged operating point the slow quantities integrate. */
interface Means {
  busPower: number;
  batteryCurrent: number;
  dumpPower: number;
  loadPower: number;
  rotorPower: number;
  windPower: number;
}

/** The parameters that change the machine (the power curve, the furling speed): the key of the caches. */
const machineKey = (p: PiggottParams): unknown[] => [
  p.diameter,
  p.turns,
  p.tailWeight,
  p.fixedTail,
  p.cableLength,
  p.cableSection,
  p.altitude,
  p.batteryAh,
];

export class PiggottSim implements LabSim {
  readonly params: PiggottParams;
  readonly state: PiggottState;
  /** The last minute of wind, rpm and power, for the time-series charts. */
  readonly scope: Scope = { t: [], wind: [], rpm: [], rotorPower: [], busPower: [] };
  /** Slow history for the chart of the battery (48 simulated hours). */
  readonly history: History = { hours: [], soc: [], wind: [], power: [] };
  /** Energy balance of the fast clock (tests check that it closes). */
  readonly ledger: Ledger = { rotor: 0, friction: 0, copper: 0, diode: 0, cable: 0, bus: 0 };

  private listeners = new Set<() => void>();
  private cfg: Config;
  private gust: GustProcess;
  private weather: WeatherProcess;

  // fast state
  private omega = 0;
  private yaw = 0;
  private fastTime = 0;
  private fastAcc = 0;
  private wind = 0;
  private last: OperatingPoint;
  private lvdOpen = false;
  private angle = 0;
  private blur = 0;
  private scopeTimer = 0;

  // slow state
  private soc = SOC_START;
  private simTime = 0;
  private windMean = 0;
  private means: Means = { busPower: 0, batteryCurrent: 0, dumpPower: 0, loadPower: 0, rotorPower: 0, windPower: 0 };
  private dirty = true;
  private sinceMean = 0;
  private meanSoc = SOC_START;
  private meanWindAt = 0;
  private historyTimer = 0;
  private events: ScheduledEvent[] = [];
  private ramps: Ramp[] = [];
  private energy = { wind: 0, rotor: 0, bus: 0, dump: 0, load: 0, today: 0 };
  private day = 0;

  // curves computed on demand, keyed by the parameters that change them
  private curveKey = '';
  private curveCache: CurvePoint[] = [];
  private yearlyKey = '';
  private yearlyCache: YearlyYield | null = null;
  private onsetKey = '';
  private onsetCache = Infinity;

  constructor(
    private seed = 1,
    preset: PresetId = 'hamlet',
  ) {
    this.params = presetParams(preset);
    this.cfg = buildConfig(this.params);
    this.gust = new GustProcess(seed);
    this.weather = new WeatherProcess(seed, this.params.weibullK);
    this.state = emptyState();
    this.last = evaluate(this.cfg, this.battery(), false, 0, this.cfg.yawStop, 0);
    this.reset();
  }

  // ------------------------------------------------------------------ LabSim

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  /** Notify the listeners (UI re-render). */
  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters live. Values are clamped to their range; editing the site or the machine makes the preset 'custom'. */
  set(patch: Partial<PiggottParams>): void {
    const p = this.params;
    const next: Partial<PiggottParams> = { ...patch };
    for (const key of Object.keys(RANGES) as RangedKey[]) {
      if (!(key in next)) continue;
      const v = next[key];
      if (typeof v === 'number' && Number.isFinite(v))
        (next as Record<string, number>)[key] = clamp(v, RANGES[key].min, RANGES[key].max);
      else delete next[key];
    }
    for (const key of ['slowMo', 'timeScale'] as const) {
      const v = next[key];
      if (v !== undefined && !(v > 0)) delete next[key];
    }
    Object.assign(p, next);
    const edited = Object.keys(next).some((k) => !['slowMo', 'timeScale', 'running', 'preset'].includes(k));
    if (edited && patch.preset === undefined) {
      p.preset = 'custom';
      // a manual change of a quantity that a scenario moves cancels the script on that quantity
      this.events = this.events.filter((e) => !Object.keys(e.patch).some((k) => k in next));
      this.ramps = this.ramps.filter((r) => !(r.key in next));
    }
    this.rebuild();
    this.publish();
    this.emit();
  }

  applyPreset(id: PresetId): void {
    this.assign(presetParams(id));
    this.reset();
  }

  applyScenario(id: ScenarioId): void {
    const { params, events, ramps, soc } = scenarioSetup(id);
    this.assign(params);
    this.reset(soc);
    this.events = events.map((e) => ({ ...e, patch: { ...e.patch } }));
    this.ramps = ramps.map((r) => ({ ...r }));
    this.applyRamps();
    this.rebuild();
    this.computeMeans();
    this.publish();
    this.emit();
  }

  /** Copy a parameter set over the live one, keeping the time controls. */
  private assign(src: PiggottParams): void {
    const keep = { slowMo: this.params.slowMo, timeScale: this.params.timeScale, running: this.params.running };
    Object.assign(this.params, src, keep);
  }

  /** Start again from the present parameters: clock, battery, rotor and counters go back to their initial state. */
  reset(soc: number = SOC_START): void {
    const p = this.params;
    this.cfg = buildConfig(p);
    this.gust = new GustProcess(this.seed);
    this.weather = new WeatherProcess(this.seed, p.weibullK);
    this.events = [];
    this.ramps = [];
    this.soc = soc;
    this.simTime = 0;
    this.day = 0;
    this.omega = 0;
    this.yaw = this.cfg.yawStop;
    this.fastTime = 0;
    this.fastAcc = 0;
    this.lvdOpen = false;
    this.angle = 0;
    this.blur = 0;
    this.scopeTimer = 0;
    this.historyTimer = 0;
    this.energy = { wind: 0, rotor: 0, bus: 0, dump: 0, load: 0, today: 0 };
    Object.assign(this.ledger, { rotor: 0, friction: 0, copper: 0, diode: 0, cable: 0, bus: 0 });
    this.scope.t.length = this.scope.wind.length = this.scope.rpm.length = 0;
    this.scope.rotorPower.length = this.scope.busPower.length = 0;
    this.history.hours.length = this.history.soc.length = this.history.wind.length = this.history.power.length = 0;
    this.updateWindMean();
    this.wind = this.windMean;
    this.dirty = true;
    this.computeMeans();
    this.last = evaluate(this.cfg, this.battery(), p.brake, this.windMean, this.yaw, 0);
    this.pushHistory();
    this.publish();
    this.emit();
  }

  // ------------------------------------------------------------------ stepping

  /** Advance by `dtReal` real seconds. */
  step(dtReal: number): void {
    const p = this.params;
    if (!p.running) return;
    const dt = Math.min(Math.max(dtReal, 0), MAX_FRAME);
    this.sinceMean += dt;

    // fast dynamics: a fixed step, whatever the frame rate
    this.fastAcc += dt * p.slowMo;
    while (this.fastAcc >= FAST_STEP) {
      this.fastAcc -= FAST_STEP;
      this.fastStep(FAST_STEP);
    }
    // slow quantities
    this.advance(dt * p.timeScale);

    // what the 3D view shows: the angle moves with the real frame, capped
    const rev = (radToRpm(this.omega) / 60) * p.slowMo; // turns per real second
    const shown = VISUAL_CAP * Math.tanh(rev / VISUAL_CAP);
    this.angle = (this.angle + 2 * Math.PI * shown * dt) % (2 * Math.PI);
    this.blur = clamp((rev - BLUR_FROM) / (BLUR_TO - BLUR_FROM), 0, 1);
    this.publish();
  }

  /** The battery as the bus solver sees it now. */
  private battery(): BatteryView {
    return batteryView(this.cfg, this.soc, this.params.batteryConnected, !this.lvdOpen);
  }

  /** The wind at the hub at a fast time: the hour's mean with the gusts on top. */
  private windAt(t: number): number {
    const g = this.gust.at(t); // always drawn, so that the process stays on its grid
    const ti = turbulenceIntensity(this.params.mastHeight, this.params.obstacleHeight) * this.params.gusts;
    return Math.max(0, this.windMean * (1 + ti * g));
  }

  private fastStep(h: number): void {
    const p = this.params;
    const cfg = this.cfg;
    const v = this.windAt(this.fastTime);
    this.wind = v;

    // furling: the machine follows its equilibrium yaw with a time constant
    const target = yawEquilibrium(cfg, this.omega, v);
    this.yaw += (target - this.yaw) * (1 - Math.exp(-h / YAW_TIME_CONSTANT));

    // rotor speed: implicit step of J·dω/dt = T_rotor − T_electrical − T_friction
    const bat = this.battery();
    const vn = v * Math.cos(this.yaw);
    const omega1 = this.implicitOmega(bat, vn, this.omega, h);
    const pt = evaluate(cfg, bat, p.brake, v, this.yaw, omega1);
    this.omega = omega1;
    this.last = pt;
    if (p.batteryConnected) {
      const open = lvdNext(this.lvdOpen, pt.bus.vBus);
      if (open !== this.lvdOpen) this.dirty = true; // the house on or off changes the averages
      this.lvdOpen = open;
    }

    // energy ledger
    const l = this.ledger;
    l.rotor += pt.rotorPower * h;
    l.friction += pt.frictionLoss * h;
    l.copper += pt.copperLoss * h;
    l.diode += pt.diodeLoss * h;
    l.cable += pt.cableLoss * h;
    l.bus += pt.busPower * h;

    this.fastTime += h;
    this.scopeTimer += h;
    if (this.scopeTimer >= SCOPE_DT) {
      this.scopeTimer -= SCOPE_DT;
      const sc = this.scope;
      sc.t.push(this.fastTime);
      sc.wind.push(v);
      sc.rpm.push(pt.rpm);
      sc.rotorPower.push(pt.rotorPower);
      sc.busPower.push(pt.busPower);
      if (sc.t.length > SCOPE_LENGTH) {
        sc.t.shift();
        sc.wind.shift();
        sc.rpm.shift();
        sc.rotorPower.shift();
        sc.busPower.shift();
      }
    }
  }

  /**
   * One implicit Euler step of the rotor speed: the root of
   * `J (ω − ω0)/h + T_elec(ω) + T_fric(ω) − T_aero(ω) = 0`, found by bisection (the function increases with ω as
   * long as J/h is larger than the slope of the aerodynamic torque, which holds for h ≤ 0.1 s).
   */
  private implicitOmega(bat: BatteryView, vn: number, omega0: number, h: number): number {
    const cfg = this.cfg;
    const brake = this.params.brake;
    const f = (w: number) =>
      (cfg.inertia * (w - omega0)) / h +
      electricalTorque(solveBus(cfg, w, bat, brake), w) +
      frictionTorque(cfg, w) -
      rotorTorque(w, vn, cfg.diameter, cfg.rho);
    if (f(0) >= 0) return 0;
    let lo = 0;
    let hi = Math.max(omega0, (LAMBDA_RUNAWAY * Math.max(vn, 0)) / cfg.radius) + 1e-6;
    for (let i = 0; i < 44; i++) {
      const mid = 0.5 * (lo + hi);
      if (f(mid) >= 0) hi = mid;
      else lo = mid;
    }
    return 0.5 * (lo + hi);
  }

  // ------------------------------------------------------------------ slow quantities

  /** Hour-to-hour mean wind at the hub now, m/s. */
  private updateWindMean(): void {
    const p = this.params;
    const base = hubWind(p.meanWind, p.mastHeight, p.obstacleHeight);
    this.windMean = p.weather ? base * this.weather.factor(this.simTime, p.weibullK) : base;
  }

  /** Integrate the slow quantities over `dtSim` simulated seconds (split at scripted events and at midnight). */
  private advance(dtSim: number): void {
    let remaining = dtSim;
    let guard = 0;
    while (remaining > 1e-9 && guard++ < 10000) {
      let chunk = Math.min(remaining, SLOW_CHUNK);
      chunk = Math.min(chunk, 86400 - ((START_HOUR * 3600 + this.simTime) % 86400));
      const next = this.events[0];
      if (next && next.at > this.simTime) chunk = Math.min(chunk, next.at - this.simTime);
      this.integrate(chunk);
      remaining -= chunk;
      while (this.events.length && this.events[0].at <= this.simTime + 1e-6) {
        const e = this.events.shift()!;
        Object.assign(this.params, e.patch, { preset: 'custom' });
        this.rebuild();
        this.emit();
      }
    }
  }

  private integrate(dtSim: number): void {
    this.simTime += dtSim;
    this.applyRamps();
    this.updateWindMean();
    // the gust-averaged operating point is re-solved when something it depends on has moved
    const stale =
      this.dirty || Math.abs(this.soc - this.meanSoc) > 0.01 || Math.abs(this.windMean - this.meanWindAt) > 0.05;
    if (stale && this.sinceMean >= MEAN_INTERVAL) this.computeMeans();
    const m = this.means;
    this.soc = advanceSoc(this.cfg, this.soc, m.batteryCurrent, dtSim);
    const wh = dtSim / 3600;
    this.energy.wind += m.windPower * wh;
    this.energy.rotor += m.rotorPower * wh;
    this.energy.bus += m.busPower * wh;
    this.energy.dump += m.dumpPower * wh;
    this.energy.load += m.loadPower * wh;
    this.energy.today += m.busPower * wh;

    const abs = START_HOUR * 3600 + this.simTime;
    const day = Math.floor(abs / 86400) - Math.floor((START_HOUR * 3600) / 86400);
    if (day !== this.day) {
      this.day = day;
      this.energy.today = 0;
    }
    this.historyTimer += dtSim;
    while (this.historyTimer >= HISTORY_DT) {
      this.historyTimer -= HISTORY_DT;
      this.pushHistory(this.simTime - this.historyTimer);
    }
  }

  private applyRamps(): void {
    for (const r of this.ramps) {
      const f = clamp((this.simTime - r.at) / r.duration, 0, 1);
      this.params[r.key] = r.from + (r.to - r.from) * f;
      this.dirty = true;
    }
    this.ramps = this.ramps.filter((r) => this.simTime < r.at + r.duration);
  }

  /** The operating point averaged over the gusts (5-point Gauss-Hermite on the wind speed), for the slow integration. */
  private computeMeans(): void {
    const p = this.params;
    const bat = this.battery();
    const ti = turbulenceIntensity(p.mastHeight, p.obstacleHeight) * p.gusts;
    const sum: Means = { busPower: 0, batteryCurrent: 0, dumpPower: 0, loadPower: 0, rotorPower: 0, windPower: 0 };
    for (let i = 0; i < GAUSS_NODES.length; i++) {
      const v = Math.max(0, this.windMean * (1 + ti * GAUSS_NODES[i]));
      const o = operatingPoint(this.cfg, bat, p.brake, v);
      const w = GAUSS_WEIGHTS[i];
      sum.busPower += w * o.busPower;
      sum.batteryCurrent += w * o.batteryCurrent;
      sum.dumpPower += w * o.dumpPower;
      sum.loadPower += w * o.loadPower;
      sum.rotorPower += w * o.rotorPower;
      sum.windPower += w * o.windPower;
    }
    this.means = sum;
    this.dirty = false;
    this.sinceMean = 0;
    this.meanSoc = this.soc;
    this.meanWindAt = this.windMean;
  }

  private pushHistory(t: number = this.simTime): void {
    const h = this.history;
    h.hours.push(t / 3600);
    h.soc.push(this.soc * 100);
    h.wind.push(this.windMean);
    h.power.push(this.means.busPower);
    if (h.hours.length > HISTORY_LENGTH) {
      h.hours.shift();
      h.soc.shift();
      h.wind.shift();
      h.power.shift();
    }
  }

  /** Rebuild what depends on the parameters (the configuration, the wind) after an edit. */
  private rebuild(): void {
    this.cfg = buildConfig(this.params);
    this.dirty = true;
    this.updateWindMean();
  }

  // ------------------------------------------------------------------ curves for the panel

  /** The steady-state power curve of the present machine (0 to 25 m/s), cached until the machine changes. */
  getCurve(): CurvePoint[] {
    const key = JSON.stringify(machineKey(this.params));
    if (key !== this.curveKey) {
      this.curveKey = key;
      this.curveCache = powerCurve(this.cfg, windGrid(25, 0.5));
    }
    return this.curveCache;
  }

  /** The yearly yield of the present machine on its site (Weibull distribution), cached until something changes. */
  getYearly(): YearlyYield {
    const p = this.params;
    const key = JSON.stringify([...machineKey(p), p.meanWind, p.weibullK, p.mastHeight, p.obstacleHeight, p.gusts]);
    if (key !== this.yearlyKey || !this.yearlyCache) {
      this.yearlyKey = key;
      this.yearlyCache = yearlyYield(p);
    }
    return this.yearlyCache;
  }

  /** Wind speed at which the tail starts to lift for the present machine, m/s (Infinity with a fixed tail). */
  getFurlingOnset(): number {
    const key = JSON.stringify(machineKey(this.params));
    if (key !== this.onsetKey) {
      this.onsetKey = key;
      this.onsetCache = furlingOnset(this.cfg);
    }
    return this.onsetCache;
  }

  /** The machine in a steady wind at the hub, with the present switches (does not touch the live run). */
  steadyPoint(v: number): OperatingPoint {
    return operatingPoint(this.cfg, this.battery(), this.params.brake, v);
  }

  // ------------------------------------------------------------------ published state

  private publish(): void {
    const p = this.params;
    const cfg = this.cfg;
    const s = this.state;
    const o = this.last;
    const bat = this.battery();

    const tipSpeed = o.omega * cfg.radius;
    const folded = clamp((o.yaw - cfg.yawStop) / (cfg.yawFurled - cfg.yawStop), 0, 1);

    s.simTime = this.simTime;
    s.day = this.day;
    s.hour = ((START_HOUR * 3600 + this.simTime) / 3600) % 24;

    s.wind = this.wind;
    s.windMean = this.windMean;
    s.turbulence = turbulenceIntensity(p.mastHeight, p.obstacleHeight) * p.gusts;
    s.airDensity = cfg.rho;

    s.rpm = o.rpm;
    s.omega = o.omega;
    s.tipSpeed = tipSpeed;
    s.lambda = o.lambda;
    s.cp = o.cp;
    s.ct = o.ct;
    s.windPower = o.windPower;
    s.rotorPower = o.rotorPower;
    s.thrust = o.thrust;

    s.rotorAngle = this.angle;
    s.rotorBlur = this.blur;
    s.yaw = o.yaw * DEG;
    s.tailSwing = TAIL_SWING_DEG * folded;
    s.furled = folded;

    s.emf = o.emf;
    s.openCircuitVolts = o.openCircuitVolts;
    s.frequency = frequency(cfg, o.omega);
    s.dcCurrent = o.dcCurrent;
    s.busVoltage = o.busVoltage;
    s.busPower = o.busPower;
    s.batteryCurrent = o.batteryCurrent;
    s.batteryPower = o.batteryPower;
    s.soc = this.soc;
    s.dumpPower = o.dumpPower;
    s.loadPower = o.loadPower;
    s.frictionLoss = o.frictionLoss;
    s.copperLoss = o.copperLoss;
    s.diodeLoss = o.diodeLoss;
    s.cableLoss = o.cableLoss;

    const ratio = (num: number, den: number) => (den > 0.5 ? clamp(num / den, 0, 1) : 0);
    const afterCopper = o.airGapPower - o.copperLoss;
    const afterDiodes = afterCopper - o.diodeLoss;
    s.etaRotor = ratio(o.rotorPower, o.windPower);
    s.etaMech = ratio(o.rotorPower - o.frictionLoss, o.rotorPower);
    s.etaAlternator = ratio(afterCopper, o.airGapPower);
    s.etaRectifier = ratio(afterDiodes, afterCopper);
    s.etaCable = ratio(afterDiodes - o.cableLoss, afterDiodes);
    s.etaChain = ratio(o.busPower, o.rotorPower);
    s.cutInRpm = radToRpm(cutInOmega(cfg, bat.ocv));

    s.brake = p.brake;
    s.batteryConnected = p.batteryConnected;
    s.dumpActive = o.dumpPower > 0.5;
    s.lvdOpen = this.lvdOpen;
    s.runaway = !p.brake && !p.batteryConnected && o.omega > 1.1 * cutInOmega(cfg, 12.6);
    s.overspeed = tipSpeed > TIP_SPEED_LIMIT;
    s.overload = o.dcCurrent > CURRENT_LIMIT;
    const v = s.busVoltage;
    s.lowBattery = p.batteryConnected && (this.lvdOpen || v < BATTERY_LOW_VOLTS);
    s.batteryFull = p.batteryConnected && (s.dumpActive || this.soc >= 0.99 || v >= BATTERY_HIGH_VOLTS - 1e-3);
    s.overcharge = p.batteryConnected && !p.brake && v > BATTERY_HIGH_VOLTS + 0.05;

    s.energyWind = this.energy.wind;
    s.energyRotor = this.energy.rotor;
    s.energyBus = this.energy.bus;
    s.energyDump = this.energy.dump;
    s.energyLoad = this.energy.load;
    s.energyToday = this.energy.today;

    s.alarms = this.alarms();
  }

  private alarms(): AlarmKey[] {
    const s = this.state;
    const out: AlarmKey[] = [];
    if (s.lowBattery) out.push('lowBattery');
    if (s.batteryFull) out.push('batteryFull');
    if (s.overcharge) out.push('overcharge');
    if (s.overspeed) out.push('overspeed');
    if (s.runaway) out.push('runaway');
    if (s.brake) out.push('brakeOn');
    if (s.yaw > this.cfg.yawStop * DEG + FURLING_ALARM_DEG) out.push('furling');
    if (s.overload) out.push('overload');
    return out;
  }
}

function emptyState(): PiggottState {
  return {
    simTime: 0,
    day: 0,
    hour: START_HOUR,
    wind: 0,
    windMean: 0,
    turbulence: 0,
    airDensity: 0,
    rpm: 0,
    omega: 0,
    tipSpeed: 0,
    lambda: 0,
    cp: 0,
    ct: 0,
    windPower: 0,
    rotorPower: 0,
    thrust: 0,
    rotorAngle: 0,
    rotorBlur: 0,
    yaw: 0,
    tailSwing: 0,
    furled: 0,
    emf: 0,
    openCircuitVolts: 0,
    frequency: 0,
    dcCurrent: 0,
    busVoltage: 0,
    busPower: 0,
    batteryCurrent: 0,
    batteryPower: 0,
    soc: SOC_START,
    dumpPower: 0,
    loadPower: 0,
    frictionLoss: 0,
    copperLoss: 0,
    diodeLoss: 0,
    cableLoss: 0,
    etaMech: 0,
    etaAlternator: 0,
    etaRectifier: 0,
    etaCable: 0,
    etaRotor: 0,
    etaChain: 0,
    cutInRpm: 0,
    brake: false,
    batteryConnected: true,
    dumpActive: false,
    lvdOpen: false,
    runaway: false,
    overspeed: false,
    overload: false,
    lowBattery: false,
    batteryFull: false,
    overcharge: false,
    energyWind: 0,
    energyRotor: 0,
    energyBus: 0,
    energyDump: 0,
    energyLoad: 0,
    energyToday: 0,
    alarms: [],
  };
}
