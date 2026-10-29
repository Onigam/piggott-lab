import type { UiKey } from '../i18n/ui';
import { BETZ } from '../sim/physics';
import { powerCoefficient } from '../sim/rotor';
import type { PiggottParams, PiggottState, PresetId, ScenarioId, Scope } from '../sim/types';
import type { CurvePoint, YearlyYield } from '../sim/yield';

// What the simulation panel plots and says, as plain functions of the simulation (no DOM), so that a test can check the
// numbers behind the charts and the wording of the status line without a browser.

export const PRESET_KEYS: Record<PresetId, UiKey> = {
  'calm-valley': 'presetCalmValley',
  hamlet: 'presetHamlet',
  'windy-plateau': 'presetWindyPlateau',
};

export const SCENARIO_KEYS: Record<ScenarioId, UiKey> = {
  'wind-sweep': 'scenarioWindSweep',
  gusts: 'scenarioGusts',
  storm: 'scenarioStorm',
  'storm-fixed-tail': 'scenarioStormFixedTail',
  'battery-full': 'scenarioBatteryFull',
  runaway: 'scenarioRunaway',
  'brake-switch': 'scenarioBrakeSwitch',
  'thin-cable': 'scenarioThinCable',
  'low-mast': 'scenarioLowMast',
  'few-turns': 'scenarioFewTurns',
  'stator-24v': 'scenarioStator24v',
};

/** A round upper bound of a chart axis: 1, 2, 2.5 or 5 times a power of ten. */
export function niceCeil(v: number): number {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

export interface PowerChartData {
  xs: number[];
  ys: Record<'wind' | 'betz' | 'rotor' | 'battery' | 'rated', number[]>;
  /** Upper end of the power axis, W: the wind and Betz lines leave the chart through the top (their points are dropped). */
  yMax: number;
}

/**
 * The power curve: power of the wind, Betz limit (16/27 of it), rotor and battery against the wind speed at the hub, and
 * the rated power. The axis stops at 2.4 times the best rotor power, so the lines of the wind and of Betz, which grow with
 * the cube of the speed, leave the chart: the distance between them and the two curves is the lesson.
 */
export function powerChartData(curve: CurvePoint[], rated: number): PowerChartData {
  const top = Math.max(1, ...curve.map((p) => p.rotorPower), rated * 0.5);
  const yMax = niceCeil(Math.max(2.4 * top, rated * 1.15));
  const inside = (v: number) => (v <= yMax ? v : NaN);
  return {
    xs: curve.map((p) => p.wind),
    ys: {
      wind: curve.map((p) => inside(p.windPower)),
      betz: curve.map((p) => inside(BETZ * p.windPower)),
      rotor: curve.map((p) => p.rotorPower),
      battery: curve.map((p) => p.busPower),
      rated: curve.map(() => rated),
    },
    yMax,
  };
}

/** Cp(λ) from 0 to 12 and the Betz line. */
export function cpChartData(): { xs: number[]; ys: Record<'cp' | 'betz', number[]> } {
  const xs = Array.from({ length: 121 }, (_, i) => i * 0.1);
  return { xs, ys: { cp: xs.map((l) => powerCoefficient(l)), betz: xs.map(() => BETZ) } };
}

/** The last minute, with time counted back from now (0 at the right edge). */
export function liveChartData(scope: Scope): {
  xs: number[];
  ys: Record<'wind' | 'rpm' | 'rotor' | 'battery', number[]>;
} {
  const n = scope.t.length;
  const last = n ? scope.t[n - 1] : 0;
  return {
    xs: scope.t.map((x) => x - last),
    ys: { wind: scope.wind, rpm: scope.rpm, rotor: scope.rotorPower, battery: scope.busPower },
  };
}

/** Share of the hours and of the energy of the year in each 1 m/s band, %. */
export function weibullChartData(y: YearlyYield): { xs: number[]; ys: Record<'hours' | 'energy', number[]> } {
  const hours = y.bins.reduce((a, b) => a + b.hours, 0) || 1;
  const energy = y.bins.reduce((a, b) => a + b.energy, 0) || 1;
  return {
    xs: y.bins.map((b) => b.wind),
    ys: {
      hours: y.bins.map((b) => (100 * b.hours) / hours),
      energy: y.bins.map((b) => (100 * b.energy) / energy),
    },
  };
}

export type Tone = 'note' | 'warn';

/**
 * What the status line says now: one message, the most important first. `warn` messages get the warning callout.
 */
export function statusOf(state: PiggottState, params: PiggottParams): { key: UiKey; tone: Tone } {
  const a = state.alarms;
  if (a.includes('runaway')) return { key: 'statusRunaway', tone: 'warn' };
  if (a.includes('overspeed')) return { key: 'statusOverspeed', tone: 'warn' };
  if (a.includes('overload')) return { key: 'statusOverload', tone: 'warn' };
  if (a.includes('overcharge')) return { key: 'statusOvercharge', tone: 'warn' };
  if (a.includes('lowBattery')) return { key: 'statusLow', tone: 'warn' };
  if (params.brake) return { key: 'statusBrake', tone: 'note' };
  if (a.includes('batteryFull')) return { key: 'statusFull', tone: 'note' };
  if (a.includes('furling')) return { key: 'statusFurling', tone: 'note' };
  if (state.busPower > 0.5) return { key: 'statusCharging', tone: 'note' };
  if (state.rpm > 20) return { key: 'statusBelowCutIn', tone: 'note' };
  return { key: 'statusStill', tone: 'note' };
}

/** The readouts of the live grid, in reading order: label key, value, unit, digits. */
export interface Readout {
  key: UiKey;
  value: number;
  unit: string;
  digits: number;
}

export function mainReadouts(s: PiggottState, rpmUnit: string): Readout[] {
  return [
    { key: 'liveWind', value: s.wind, unit: 'm/s', digits: 1 },
    { key: 'liveRpm', value: s.rpm, unit: rpmUnit, digits: 0 },
    { key: 'liveLambda', value: s.lambda, unit: '', digits: 1 },
    { key: 'liveCp', value: s.cp, unit: '', digits: 2 },
    { key: 'liveRotorPower', value: s.rotorPower, unit: 'W', digits: 0 },
    { key: 'liveBatteryPower', value: s.busPower, unit: 'W', digits: 0 },
    { key: 'liveBatteryCurrent', value: s.batteryCurrent, unit: 'A', digits: 1 },
    { key: 'liveBatteryVolts', value: s.busVoltage, unit: 'V', digits: 1 },
    { key: 'liveSoc', value: s.soc * 100, unit: '%', digits: 0 },
  ];
}

export function moreReadouts(s: PiggottState): Readout[] {
  return [
    { key: 'liveWindMean', value: s.windMean, unit: 'm/s', digits: 1 },
    { key: 'liveWindPower', value: s.windPower, unit: 'W', digits: 0 },
    { key: 'liveThrust', value: s.thrust, unit: 'N', digits: 0 },
    { key: 'liveYaw', value: s.yaw, unit: '°', digits: 0 },
    { key: 'liveOpenVolts', value: s.openCircuitVolts, unit: 'V', digits: 1 },
    { key: 'liveCopperLoss', value: s.copperLoss, unit: 'W', digits: 1 },
    { key: 'liveCableLoss', value: s.cableLoss, unit: 'W', digits: 1 },
    { key: 'liveDump', value: s.dumpPower, unit: 'W', digits: 0 },
    { key: 'liveHouse', value: s.loadPower, unit: 'W', digits: 0 },
  ];
}

/** The segments of the power chain, W: what the battery gets and what each stage burns (they add up to the rotor power). */
export function chainSegments(s: PiggottState): { key: UiKey; watts: number; colour: string }[] {
  return [
    { key: 'chainBattery', watts: Math.max(0, s.busPower), colour: 'var(--water)' },
    { key: 'chainBearings', watts: Math.max(0, s.frictionLoss), colour: 'var(--ink-4)' },
    { key: 'chainCopper', watts: Math.max(0, s.copperLoss), colour: 'var(--copper)' },
    { key: 'chainDiodes', watts: Math.max(0, s.diodeLoss), colour: 'var(--sun)' },
    { key: 'chainCable', watts: Math.max(0, s.cableLoss), colour: 'var(--violet)' },
  ];
}
