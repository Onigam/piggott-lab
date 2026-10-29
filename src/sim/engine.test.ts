import { describe, expect, it } from 'vitest';
import { PiggottSim } from './engine';
import { BATTERY_HIGH_VOLTS, BATTERY_LOW_VOLTS } from './machine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, presetParams, type RangedKey } from './presets';
import type { PiggottParams, ScenarioId } from './types';

// The time-stepping engine: the live behaviours (the scenarios of research §5), determinism, independence from the
// frame rate, the energy balance, the switches and the regulation of K22. The steady-state figures are in steady.test.ts.

function run(sim: PiggottSim, seconds: number, dt = 1 / 60): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) sim.step(dt);
}

/** A sim in a perfectly steady wind (no gusts, no weather), the machine of the video. */
function steadySim(wind: number, patch: Partial<PiggottParams> = {}, seed = 1): PiggottSim {
  const sim = new PiggottSim(seed);
  sim.set({ weather: false, gusts: 0, obstacleHeight: 0, meanWind: wind, loadPower: 0, ...patch });
  sim.reset(); // start again from these parameters (the averages of the slow quantities are solved at once)
  return sim;
}

describe('presets', () => {
  it('the three sites: calm valley 3.5 m/s, hamlet 5 m/s (the default), windy plateau 7 m/s at 10 m', () => {
    expect(presetParams('calm-valley').meanWind).toBe(3.5);
    expect(presetParams('hamlet').meanWind).toBe(5);
    expect(presetParams('windy-plateau').meanWind).toBe(7);
    expect(new PiggottSim().params.preset).toBe('hamlet');
    expect(PRESET_IDS).toEqual(['calm-valley', 'hamlet', 'windy-plateau']);
  });
  it('applyPreset loads the site and keeps the time controls', () => {
    const sim = new PiggottSim();
    sim.set({ timeScale: 600, slowMo: 0.2 });
    sim.applyPreset('windy-plateau');
    expect(sim.params.meanWind).toBe(7);
    expect(sim.params.preset).toBe('windy-plateau');
    expect(sim.params.timeScale).toBe(600);
    expect(sim.params.slowMo).toBe(0.2);
  });
  it('editing anything but the time controls makes the preset "custom"', () => {
    const sim = new PiggottSim();
    sim.set({ timeScale: 60 });
    expect(sim.params.preset).toBe('hamlet');
    sim.set({ meanWind: 6 });
    expect(sim.params.preset).toBe('custom');
  });
  it('the machine of the video: 1.2 m, 76 turns, tail at its design weight, cable and battery connected', () => {
    const p = presetParams('hamlet');
    expect(p.diameter).toBe(1.2);
    expect(p.turns).toBe(76);
    expect(p.tailWeight).toBe(1);
    expect(p.batteryConnected).toBe(true);
    expect(p.brake).toBe(false);
  });
});

describe('the live machine follows the steady-state model', () => {
  it('after a minute in a steady 8 m/s wind the rotor is where the steady solver puts it', () => {
    const sim = steadySim(8);
    run(sim, 60);
    const steady = sim.steadyPoint(sim.state.windMean);
    expect(sim.state.rpm / steady.rpm).toBeCloseTo(1, 2);
    expect(sim.state.busPower / steady.busPower).toBeCloseTo(1, 2);
    expect(sim.state.lambda).toBeGreaterThan(2);
    expect(sim.state.lambda).toBeLessThan(4);
  });
  it('the rotor spins up from rest in a few seconds (inertia), and does not start in a calm', () => {
    const sim = steadySim(8);
    expect(sim.state.rpm).toBe(0);
    run(sim, 1);
    expect(sim.state.rpm).toBeGreaterThan(0);
    expect(sim.state.rpm).toBeLessThan(200);
    run(sim, 20);
    expect(sim.state.rpm).toBeGreaterThan(350);
    const calm = steadySim(0.3);
    run(calm, 10);
    expect(calm.state.rpm).toBe(0);
  });
  it('K20: at 2 m/s the rotor turns but the battery gets nothing; at 5 m/s it charges', () => {
    const low = steadySim(2);
    run(low, 60);
    expect(low.state.rpm).toBeGreaterThan(50); // it starts slowly, then free-wheels below the charging speed
    expect(low.state.busPower).toBe(0);
    const ok = steadySim(5);
    run(ok, 30);
    expect(ok.state.busPower).toBeGreaterThan(5);
    expect(ok.state.batteryCurrent).toBeGreaterThan(0.5);
  });
  it('the books close: rotor energy = friction + copper + diodes + cable + bus + kinetic energy, to 3 %', () => {
    const sim = new PiggottSim(3);
    sim.set({ weather: false, gusts: 1.5, meanWind: 7, loadPower: 0 });
    run(sim, 90);
    const l = sim.ledger;
    const kinetic = 0.5 * 0.13 * sim.state.omega ** 2;
    const out = l.friction + l.copper + l.diode + l.cable + l.bus + kinetic;
    expect(l.rotor).toBeGreaterThan(1000);
    expect(Math.abs(out / l.rotor - 1)).toBeLessThan(0.03);
  });
  it('the battery never gets more than the rotor gives (instant by instant in a slowly changing wind)', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('wind-sweep');
    for (let i = 0; i < 300; i++) {
      run(sim, 1);
      expect(sim.state.busPower).toBeLessThanOrEqual(sim.state.rotorPower + 1);
      expect(sim.state.rotorPower).toBeLessThanOrEqual(sim.state.windPower + 1e-6);
    }
  });
});

describe('determinism and frame rate', () => {
  it('the same seed gives the same run, exactly', () => {
    const a = new PiggottSim(7);
    const b = new PiggottSim(7);
    run(a, 45);
    run(b, 45);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(a.scope.wind).toEqual(b.scope.wind);
  });
  it('another seed gives another wind', () => {
    const a = new PiggottSim(7);
    const b = new PiggottSim(8);
    run(a, 45);
    run(b, 45);
    expect(a.scope.wind).not.toEqual(b.scope.wind);
  });
  it('the gusts have the mean and the intensity of the site (σ / mean within 25 % of the value asked)', () => {
    const sim = new PiggottSim(11);
    sim.set({ weather: false, obstacleHeight: 0, mastHeight: 12, meanWind: 6, gusts: 1 });
    const samples: number[] = [];
    for (let i = 0; i < 1500; i++) {
      run(sim, 1);
      samples.push(sim.state.wind);
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
    expect(mean / sim.state.windMean).toBeGreaterThan(0.95);
    expect(mean / sim.state.windMean).toBeLessThan(1.05);
    expect(sd / mean / sim.state.turbulence).toBeGreaterThan(0.75);
    expect(sd / mean / sim.state.turbulence).toBeLessThan(1.25);
  });
  it('the result does not depend on the frame rate: 30, 60 and 144 frames a second agree to 3 %', () => {
    const results = [30, 60, 144].map((fps) => {
      const sim = new PiggottSim(5);
      sim.set({ weather: false, gusts: 1, meanWind: 6, loadPower: 0 });
      run(sim, 40, 1 / fps);
      return { rpm: sim.state.rpm, soc: sim.state.soc, energy: sim.state.energyBus, wind: sim.state.wind };
    });
    for (const r of results.slice(1)) {
      expect(Math.abs(r.rpm / results[0].rpm - 1)).toBeLessThan(0.03);
      expect(Math.abs(r.energy / results[0].energy - 1)).toBeLessThan(0.03);
      expect(r.wind).toBeCloseTo(results[0].wind, 1);
    }
  });
  it('the slow motion slows the rotor and the gusts, not the clock', () => {
    const slow = new PiggottSim(5);
    slow.set({ slowMo: 0.2, weather: false });
    const fast = new PiggottSim(5);
    fast.set({ weather: false });
    run(slow, 10);
    run(fast, 10);
    expect(slow.state.simTime).toBeCloseTo(10, 3);
    expect(slow.scope.t[slow.scope.t.length - 1]).toBeCloseTo(2, 0);
    expect(fast.scope.t[fast.scope.t.length - 1]).toBeCloseTo(10, 0);
  });
  it('nothing moves while paused', () => {
    const sim = new PiggottSim();
    sim.set({ running: false });
    run(sim, 5);
    expect(sim.state.simTime).toBe(0);
    expect(sim.state.rpm).toBe(0);
  });
});

describe('slow quantities (battery, clock) at high time speed', () => {
  it('a day at ×3600 passes in 24 real seconds and the clock rolls over at midnight', () => {
    const sim = steadySim(6, { timeScale: 3600, batteryAh: 400 });
    run(sim, 24);
    expect(sim.state.day).toBe(1);
    expect(sim.state.hour).toBeCloseTo(8, 0);
    expect(sim.state.simTime).toBeCloseTo(86400, -1);
  });
  it('the energy the bus receives in a day is the mean power × 24 h, to 5 %', () => {
    const sim = steadySim(6, { timeScale: 3600, batteryAh: 400, dumpLoad: false });
    run(sim, 23.9);
    const perDay = sim.state.energyBus;
    const expected = sim.steadyPoint(sim.state.windMean).busPower * 23.9;
    expect(perDay).toBeGreaterThan(100);
    expect(Math.abs(perDay / expected - 1)).toBeLessThan(0.05);
  });
  it('the state of charge falls with the house load as I·t / capacity: 12 W for an hour on 100 Ah is 1 %', () => {
    const sim = steadySim(0, { loadPower: 12, timeScale: 3600 });
    const soc0 = sim.state.soc;
    run(sim, 1);
    // 12 W / 12 V = 1 A for an hour = 1 Ah of 100 Ah
    expect(soc0 - sim.state.soc).toBeCloseTo(0.01, 3);
  });
  it('the weather wanders around the site mean: over a simulated month the mean wind is within 15 % of the site mean', () => {
    const sim = new PiggottSim(21);
    sim.set({ timeScale: 3600, gusts: 0, obstacleHeight: 0 });
    const base = sim.state.windMean;
    let sum = 0;
    let n = 0;
    let min = Infinity;
    let max = 0;
    for (let i = 0; i < 720; i++) {
      run(sim, 1);
      sum += sim.state.windMean;
      n++;
      min = Math.min(min, sim.state.windMean);
      max = Math.max(max, sim.state.windMean);
    }
    expect(Math.abs(sum / n / base - 1)).toBeLessThan(0.15);
    expect(max).toBeGreaterThan(1.3 * base);
    expect(min).toBeLessThan(0.7 * base);
  });
});

describe('K22: battery regulation', () => {
  it('K22: the dump load holds the bus at 14 V on a full battery and the surplus goes to the dump', () => {
    const sim = new PiggottSim(2);
    sim.applyScenario('battery-full');
    sim.set({ meanWind: 11 });
    run(sim, 30);
    const s = sim.state;
    expect(s.dumpActive).toBe(true);
    expect(s.dumpPower).toBeGreaterThan(10);
    expect(s.busVoltage).toBeLessThanOrEqual(BATTERY_HIGH_VOLTS + 1e-6);
    expect(s.busVoltage).toBeGreaterThan(BATTERY_HIGH_VOLTS - 0.01);
    expect(s.alarms).toContain('batteryFull');
    expect(s.alarms).not.toContain('overcharge');
  });
  it('K22: without the dump load a full battery is pushed above 14 V (overcharge)', () => {
    const sim = new PiggottSim(2);
    sim.applyScenario('battery-full');
    sim.set({ meanWind: 11, dumpLoad: false });
    run(sim, 30);
    expect(sim.state.busVoltage).toBeGreaterThan(BATTERY_HIGH_VOLTS + 0.05);
    expect(sim.state.alarms).toContain('overcharge');
    expect(sim.state.dumpPower).toBe(0);
  });
  it('K22: below 11.5 V the low-voltage disconnect cuts the house off, and the house comes back when the battery has recovered', () => {
    const sim = steadySim(0, { loadPower: 150, batteryAh: 40, timeScale: 600 });
    sim.reset(0.2);
    let cut = false;
    for (let i = 0; i < 2400 && !cut; i++) {
      run(sim, 0.25);
      cut = sim.state.lvdOpen;
    }
    expect(cut).toBe(true);
    expect(sim.state.loadPower).toBe(0);
    expect(sim.state.alarms).toContain('lowBattery');
    // a wind comes: the battery charges, and above 12.5 V the house reconnects
    sim.set({ meanWind: 12, loadPower: 5 });
    let back = false;
    for (let i = 0; i < 2400 && !back; i++) {
      run(sim, 0.25);
      back = !sim.state.lvdOpen;
    }
    expect(back).toBe(true);
  });
  it('K22: the brake switch shorts the alternator and never the battery: the battery keeps its voltage and feeds the house', () => {
    const sim = steadySim(8, { loadPower: 24 });
    run(sim, 20);
    const before = sim.state.busVoltage;
    sim.set({ brake: true });
    run(sim, 30);
    const s = sim.state;
    expect(s.busPower).toBe(0);
    expect(s.rpm).toBeLessThan(120);
    expect(s.batteryCurrent).toBeLessThan(0); // the battery supplies the house
    expect(s.busVoltage).toBeGreaterThan(BATTERY_LOW_VOLTS);
    expect(Math.abs(s.busVoltage - before)).toBeLessThan(0.6);
    expect(s.alarms).toContain('brakeOn');
    sim.set({ brake: false });
    run(sim, 30);
    expect(sim.state.busPower).toBeGreaterThan(20);
  });
  it('K22: with the battery disconnected the rotor runs away, and the brake switch stops it', () => {
    const sim = steadySim(8);
    run(sim, 20);
    const rpm = sim.state.rpm;
    sim.set({ batteryConnected: false });
    run(sim, 30);
    expect(sim.state.runaway).toBe(true);
    expect(sim.state.alarms).toContain('runaway');
    expect(sim.state.rpm).toBeGreaterThan(2.5 * rpm);
    expect(sim.state.busPower).toBe(0);
    expect(sim.state.openCircuitVolts).toBeGreaterThan(40);
    sim.set({ brake: true });
    run(sim, 30);
    expect(sim.state.rpm).toBeLessThan(0.5 * rpm);
    expect(sim.state.runaway).toBe(false);
  });
});

describe('scenarios', () => {
  it('every scenario starts, runs for a minute and leaves finite numbers', () => {
    for (const id of SCENARIO_IDS) {
      const sim = new PiggottSim(4);
      sim.applyScenario(id);
      expect(sim.params.preset).toBe('custom');
      run(sim, 60);
      for (const [key, value] of Object.entries(sim.state)) {
        if (typeof value === 'number') expect(Number.isFinite(value), `${id}.${key}`).toBe(true);
      }
    }
  });
  it('an unknown scenario id falls back to the hamlet', () => {
    const sim = new PiggottSim();
    sim.applyScenario('nonsense' as ScenarioId);
    expect(sim.params.meanWind).toBe(5);
  });
  it('wind-sweep: a steady wind rises from 1 to 20 m/s and the battery power rises, then plateaus after the furling (K12, K19)', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('wind-sweep');
    const powers: { v: number; p: number; yaw: number }[] = [];
    for (let i = 0; i < 310; i++) {
      run(sim, 1);
      powers.push({ v: sim.state.wind, p: sim.state.busPower, yaw: sim.state.yaw });
    }
    const at = (v: number) => powers.find((x) => x.v >= v)!;
    expect(at(2).p).toBe(0);
    expect(at(6).p).toBeGreaterThan(10);
    expect(at(9).p).toBeGreaterThan(at(6).p);
    expect(at(9).yaw).toBeLessThan(6);
    expect(at(14).yaw).toBeGreaterThan(30);
    const top = Math.max(...powers.map((x) => x.p));
    expect(at(14).p).toBeGreaterThan(0.85 * top);
    expect(at(19).p).toBeGreaterThan(0.85 * top);
    expect(sim.state.wind).toBeGreaterThan(19);
  });
  it('storm: the tail folds (more than 55° at 20 m/s), the alternator stays under 20 A and the tips under 89 m/s (K12)', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('storm');
    let maxCurrent = 0;
    let maxTip = 0;
    let maxYaw = 0;
    for (let i = 0; i < 200; i++) {
      run(sim, 1);
      maxCurrent = Math.max(maxCurrent, sim.state.dcCurrent);
      maxTip = Math.max(maxTip, sim.state.tipSpeed);
      maxYaw = Math.max(maxYaw, sim.state.yaw);
    }
    expect(maxYaw).toBeGreaterThan(55);
    expect(maxCurrent).toBeLessThan(20);
    expect(maxTip).toBeLessThan(89);
    expect(sim.state.alarms).not.toContain('overspeed');
    expect(sim.state.alarms).toContain('furling');
  });
  it('storm with a fixed tail: overload, then overspeed — the alternator cooks and the tips pass 89 m/s', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('storm-fixed-tail');
    const seen = new Set<string>();
    let maxThrust = 0;
    for (let i = 0; i < 200; i++) {
      run(sim, 1);
      sim.state.alarms.forEach((a) => seen.add(a));
      maxThrust = Math.max(maxThrust, sim.state.thrust);
    }
    expect(seen.has('overload')).toBe(true);
    expect(seen.has('overspeed')).toBe(true);
    expect(seen.has('furling')).toBe(false);
    expect(maxThrust).toBeGreaterThan(250);
    expect(sim.state.yaw).toBeLessThan(6);
  });
  it('gusts: the power jumps about while the mean is steady', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('gusts');
    run(sim, 20);
    const powers: number[] = [];
    for (let i = 0; i < 100; i++) {
      run(sim, 1);
      powers.push(sim.state.busPower);
    }
    expect(Math.max(...powers) - Math.min(...powers)).toBeGreaterThan(20);
    expect(sim.state.turbulence).toBeGreaterThan(0.3);
  });
  it('battery-full: starts at 95 %, the dump load is available (K22)', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('battery-full');
    expect(sim.state.soc).toBeCloseTo(0.95, 2);
    expect(sim.params.dumpLoad).toBe(true);
  });
  it('runaway: the battery is disconnected after 20 s and the brake closed after 70 s', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('runaway');
    run(sim, 15);
    const rpm = sim.state.rpm;
    expect(sim.state.alarms).not.toContain('runaway');
    run(sim, 30);
    expect(sim.state.runaway).toBe(true);
    expect(sim.state.rpm).toBeGreaterThan(2.5 * rpm);
    run(sim, 50);
    expect(sim.state.brake).toBe(true);
    expect(sim.state.rpm).toBeLessThan(0.5 * rpm);
  });
  it('brake-switch: the brake closes after 20 s and opens after 70 s', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('brake-switch');
    run(sim, 40);
    expect(sim.state.brake).toBe(true);
    expect(sim.state.busPower).toBe(0);
    run(sim, 60);
    expect(sim.state.brake).toBe(false);
    expect(sim.state.rpm).toBeGreaterThan(300);
  });
  it('thin-cable (K21): 2.5 mm² over 40 m wastes more than 10 % of the power generated at 8 m/s, against under 2 % for the default cable', () => {
    const thin = new PiggottSim(1);
    thin.applyScenario('thin-cable');
    thin.set({ gusts: 0 });
    run(thin, 40);
    const shareThin = thin.state.cableLoss / (thin.state.cableLoss + thin.state.busPower);
    expect(shareThin).toBeGreaterThan(0.1);
    const normal = steadySim(8);
    run(normal, 40);
    expect(normal.state.cableLoss / (normal.state.cableLoss + normal.state.busPower)).toBeLessThan(0.02);
  });
  it('low-mast (K24): a 6 m mast among 8 m trees gets less than 75 % of the wind of a 12 m mast, and less than 55 % of its energy', () => {
    const low = new PiggottSim(1);
    low.applyScenario('low-mast');
    const ok = new PiggottSim(1);
    ok.set({ weather: false, obstacleHeight: 8 });
    run(low, 60);
    run(ok, 60);
    expect(low.state.windMean / ok.state.windMean).toBeLessThan(0.75);
    expect(low.state.turbulence).toBeGreaterThan(ok.state.turbulence);
    expect(low.getYearly().energy / ok.getYearly().energy).toBeLessThan(0.55);
  });
  it('few-turns (K9, S5): half the turns and nothing charges at 4 m/s, while the default winding does', () => {
    const few = new PiggottSim(1);
    few.applyScenario('few-turns');
    run(few, 60);
    expect(few.state.busPower).toBe(0);
    expect(few.state.rpm).toBeGreaterThan(400); // it spins freely, below the voltage that charges
    const normal = steadySim(4);
    run(normal, 60);
    expect(normal.state.busPower).toBeGreaterThan(3);
  });
  it('stator-24v (K9): twice the turns on a 12 V battery charges at half the speed but holds the rotor back: less power at 8 m/s', () => {
    const v24 = new PiggottSim(1);
    v24.applyScenario('stator-24v');
    v24.set({ gusts: 0 });
    const normal = steadySim(8);
    run(v24, 60);
    run(normal, 60);
    expect(v24.state.cutInRpm).toBeCloseTo(normal.state.cutInRpm / 2, -1);
    expect(v24.state.rpm).toBeLessThan(0.7 * normal.state.rpm);
    expect(v24.state.busPower).toBeLessThan(0.6 * normal.state.busPower);
  });
});

describe('what the 3D view reads', () => {
  it('the visual rotor never turns faster than 2.5 turns per real second, however fast the rotor is', () => {
    const sim = steadySim(8);
    run(sim, 10);
    expect(sim.state.rpm).toBeGreaterThan(300); // more than 5 turns a second really
    let last = sim.state.rotorAngle;
    for (let i = 0; i < 120; i++) {
      sim.step(1 / 60);
      let d = sim.state.rotorAngle - last;
      if (d < 0) d += 2 * Math.PI;
      expect(d / (1 / 60) / (2 * Math.PI)).toBeLessThanOrEqual(2.5 + 1e-9);
      last = sim.state.rotorAngle;
    }
  });
  it('the blur disc is 0 for a slow rotor, 1 for a fast one, and the slow motion brings the blades back', () => {
    const sim = steadySim(8);
    expect(sim.state.rotorBlur).toBe(0);
    run(sim, 10);
    expect(sim.state.rotorBlur).toBe(1);
    sim.set({ slowMo: 0.05 });
    sim.step(1 / 60);
    expect(sim.state.rotorBlur).toBe(0);
    // the visible speed is the real one in slow motion: about 6.5 turns/s × 0.05
    const angle = sim.state.rotorAngle;
    run(sim, 1);
    let d = sim.state.rotorAngle - angle;
    if (d < 0) d += 2 * Math.PI;
    expect(d / (2 * Math.PI)).toBeGreaterThan(0.25);
    expect(d / (2 * Math.PI)).toBeLessThan(0.4);
  });
  it('the yaw and the tail swing follow the furling: 5° and 0° on the stop, 95° at the most', () => {
    const calm = steadySim(5);
    run(calm, 10);
    expect(calm.state.yaw).toBeCloseTo(5, 0);
    expect(calm.state.tailSwing).toBeCloseTo(0, 0);
    expect(calm.state.furled).toBeCloseTo(0, 2);
    const storm = steadySim(15);
    run(storm, 30);
    expect(storm.state.furled).toBeGreaterThan(0.4);
    expect(storm.state.tailSwing).toBeLessThanOrEqual(95);
    expect(storm.state.tailSwing).toBeGreaterThan(35);
  });
  it('the state carries the chain of losses and the efficiencies are fractions', () => {
    const sim = steadySim(9);
    run(sim, 30);
    const s = sim.state;
    for (const eta of [s.etaMech, s.etaAlternator, s.etaRectifier, s.etaCable, s.etaRotor, s.etaChain]) {
      expect(eta).toBeGreaterThan(0);
      expect(eta).toBeLessThanOrEqual(1);
    }
    expect(s.etaChain).toBeCloseTo(s.etaMech * s.etaAlternator * s.etaRectifier * s.etaCable, 1);
    expect(s.copperLoss).toBeGreaterThan(0);
    expect(s.diodeLoss).toBeCloseTo(1.5 * s.dcCurrent, 6);
  });
  it('the scope keeps the last minute and the history the last 48 hours', () => {
    const sim = new PiggottSim(1);
    sim.set({ timeScale: 3600 });
    run(sim, 100);
    expect(sim.scope.t.length).toBeLessThanOrEqual(240);
    expect(sim.scope.t.length).toBe(sim.scope.wind.length);
    expect(sim.history.hours.length).toBeLessThanOrEqual(576);
    expect(sim.history.hours.length).toBeGreaterThan(100);
    expect(sim.history.hours.length).toBe(sim.history.soc.length);
  });
});

describe('robustness of set()', () => {
  it('values are clamped to their range and non-numbers are ignored', () => {
    const sim = new PiggottSim();
    sim.set({ diameter: 9, turns: 1, mastHeight: Number.NaN });
    expect(sim.params.diameter).toBe(RANGES.diameter.max);
    expect(sim.params.turns).toBe(RANGES.turns.min);
    expect(sim.params.mastHeight).toBe(12);
  });
  it('a scripted change is cancelled when the visitor edits the quantity it moves', () => {
    const sim = new PiggottSim(1);
    sim.applyScenario('wind-sweep');
    run(sim, 30);
    sim.set({ meanWind: 4 });
    run(sim, 60);
    expect(sim.params.meanWind).toBe(4);
  });
  it('no number goes non-finite under 400 random edits during a run', () => {
    const sim = new PiggottSim(9);
    let seed = 12345;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const keys = Object.keys(RANGES) as RangedKey[];
    for (let i = 0; i < 400; i++) {
      const key = keys[Math.floor(rnd() * keys.length)];
      const { min, max } = RANGES[key];
      sim.set({ [key]: min + rnd() * (max - min) } as Partial<PiggottParams>);
      if (rnd() < 0.15) sim.set({ brake: rnd() < 0.5 });
      if (rnd() < 0.15) sim.set({ batteryConnected: rnd() < 0.7 });
      if (rnd() < 0.1) sim.set({ fixedTail: rnd() < 0.5 });
      if (rnd() < 0.1) sim.set({ timeScale: [1, 60, 600, 3600][Math.floor(rnd() * 4)] });
      run(sim, 0.5);
      for (const [k, v] of Object.entries(sim.state)) {
        if (typeof v === 'number') expect(Number.isFinite(v), k).toBe(true);
      }
    }
  });
  it('the power curve, the yearly yield and the furling speed are cached until the machine changes', () => {
    const sim = new PiggottSim();
    const c1 = sim.getCurve();
    expect(sim.getCurve()).toBe(c1);
    expect(sim.getYearly()).toBe(sim.getYearly());
    expect(sim.getFurlingOnset()).toBeCloseTo(10, 1);
    sim.set({ tailWeight: 2 });
    expect(sim.getCurve()).not.toBe(c1);
    expect(sim.getFurlingOnset()).toBeGreaterThan(12);
  });
});
