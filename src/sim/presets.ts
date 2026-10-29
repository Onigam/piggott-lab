import { BATTERY_AH_DEFAULT, DIAMETER_MAX, DIAMETER_MIN, SOC_START, TURNS_REF } from './machine';
import type { PiggottParams, PresetId, ScenarioId } from './types';

// The lab's story and its knobs. Presets are the three generic sites of research §8.6; scenarios are small scripted
// situations used by the lessons. Every number is either REPORTED (K-number), DERIVED, or an ESTIMATE / CALIBRATED value
// of docs/physics.md.

/** Allowed range and slider step of every editable number. */
export const RANGES = {
  meanWind: { min: 1, max: 25, step: 0.5 },
  weibullK: { min: 1.2, max: 3, step: 0.1 },
  gusts: { min: 0, max: 2.5, step: 0.1 },
  mastHeight: { min: 3, max: 24, step: 1 },
  obstacleHeight: { min: 0, max: 15, step: 1 },
  altitude: { min: 0, max: 2500, step: 50 },
  diameter: { min: DIAMETER_MIN, max: DIAMETER_MAX, step: 0.1 },
  turns: { min: 20, max: 200, step: 2 },
  tailWeight: { min: 0.3, max: 3, step: 0.05 },
  cableLength: { min: 2, max: 100, step: 1 },
  cableSection: { min: 1.5, max: 35, step: 0.5 },
  batteryAh: { min: 20, max: 400, step: 10 },
  loadPower: { min: 0, max: 300, step: 5 },
} as const;

export type RangedKey = keyof typeof RANGES;

/** Hour of the simulated day at which every run starts (an arbitrary morning). */
export const START_HOUR = 8;

/** The machine of the video (K1, K7, K12) on the site of the `hamlet` preset: the default of the lab. */
const BASE: PiggottParams = {
  slowMo: 1,
  timeScale: 1,
  running: true,
  preset: 'hamlet',
  meanWind: 5,
  weibullK: 2,
  weather: true,
  gusts: 1,
  mastHeight: 12,
  obstacleHeight: 5,
  altitude: 0,
  diameter: 1.2, // K1
  turns: TURNS_REF, // K7
  tailWeight: 1, // calibrated: furling at 10 m/s (K12)
  fixedTail: false,
  cableLength: 15, // ESTIMATE: a typical run from the mast to the shed; S4 p. 38 tables 30 m
  cableSection: 10, // ESTIMATE: S4 p. 38 asks at least 6 mm² for 500 W at 12 V
  batteryConnected: true,
  brake: false,
  dumpLoad: true,
  batteryAh: BATTERY_AH_DEFAULT, // ESTIMATE
  loadPower: 10, // ESTIMATE: a few lamps and a radio
};

/** Wind, mast and trees of each preset (the machine is the same). */
const SITES: Record<PresetId, Pick<PiggottParams, 'meanWind' | 'obstacleHeight' | 'mastHeight'>> = {
  'calm-valley': { meanWind: 3.5, obstacleHeight: 8, mastHeight: 12 },
  hamlet: { meanWind: 5, obstacleHeight: 5, mastHeight: 12 },
  'windy-plateau': { meanWind: 7, obstacleHeight: 0, mastHeight: 12 },
};

export function presetParams(id: PresetId): PiggottParams {
  return { ...BASE, ...SITES[id], preset: id };
}

/** A change of parameters scheduled at a simulated time (seconds since the start of the scenario). */
export interface ScheduledEvent {
  at: number;
  patch: Partial<PiggottParams>;
}

/** A parameter that moves linearly from `from` to `to` between `at` and `at + duration` (simulated seconds). */
export interface Ramp {
  key: 'meanWind';
  at: number;
  duration: number;
  from: number;
  to: number;
}

export interface ScenarioSetup {
  params: PiggottParams;
  events: ScheduledEvent[];
  ramps: Ramp[];
  /** State of charge the scenario starts with. */
  soc: number;
}

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const s = scenarioBase(id);
  // a scenario is a variation of a preset: the preset select then shows "custom"
  return { ...s, params: { ...s.params, preset: 'custom' } };
}

const steady = (p: PiggottParams): PiggottParams => ({ ...p, weather: false });

function scenarioBase(id: ScenarioId): ScenarioSetup {
  const hamlet = presetParams('hamlet');
  const calm = { events: [], ramps: [], soc: SOC_START };
  switch (id) {
    case 'wind-sweep':
      // a perfectly steady wind rising from 1 to 20 m/s in 5 minutes: the power curve is drawn by the machine itself
      return {
        params: steady({ ...hamlet, gusts: 0, obstacleHeight: 0, meanWind: 1 }),
        events: [],
        ramps: [{ key: 'meanWind', at: 5, duration: 300, from: 1, to: 20 }],
        soc: SOC_START,
      };
    case 'gusts':
      return { ...calm, params: steady({ ...hamlet, meanWind: 7, gusts: 2.2, obstacleHeight: 8 }) };
    case 'storm':
      // the wind climbs from 6 to 25 m/s over three minutes: the tail folds, the power plateaus (K12)
      return {
        params: steady({ ...hamlet, gusts: 1.2, obstacleHeight: 0, meanWind: 6 }),
        events: [],
        ramps: [{ key: 'meanWind', at: 5, duration: 180, from: 6, to: 25 }],
        soc: SOC_START,
      };
    case 'storm-fixed-tail':
      return {
        params: steady({ ...hamlet, gusts: 1.2, obstacleHeight: 0, meanWind: 6, fixedTail: true }),
        events: [],
        ramps: [{ key: 'meanWind', at: 5, duration: 180, from: 6, to: 25 }],
        soc: SOC_START,
      };
    case 'battery-full':
      // a nearly full battery in a good wind: it cannot take the current, the dump load holds the bus at 14 V (K22)
      return {
        ...calm,
        params: steady({ ...hamlet, meanWind: 9, gusts: 0.6, loadPower: 0 }),
        soc: 0.95,
      };
    case 'runaway':
      // the battery is disconnected after 20 s (K22: the rotor runs away); the brake switch is closed after a minute
      return {
        params: steady({ ...hamlet, meanWind: 8, gusts: 0.6 }),
        events: [
          { at: 20, patch: { batteryConnected: false } },
          { at: 70, patch: { brake: true } },
        ],
        ramps: [],
        soc: SOC_START,
      };
    case 'brake-switch':
      return {
        params: steady({ ...hamlet, meanWind: 8, gusts: 0.6 }),
        events: [
          { at: 20, patch: { brake: true } },
          { at: 70, patch: { brake: false } },
        ],
        ramps: [],
        soc: SOC_START,
      };
    case 'thin-cable':
      // K21: 2.5 mm² over 40 m at 12 V wastes a large share of the power
      return { ...calm, params: steady({ ...hamlet, meanWind: 8, gusts: 0.6, cableSection: 2.5, cableLength: 40 }) };
    case 'low-mast':
      return {
        ...calm,
        params: { ...hamlet, mastHeight: 6, obstacleHeight: 8, gusts: 1, weather: false },
      };
    case 'few-turns':
      // half the turns: the cut-in wind doubles (K9, S5): nothing charges at 4 m/s
      return { ...calm, params: steady({ ...hamlet, meanWind: 4, gusts: 0.6, turns: 38 }) };
    case 'stator-24v':
      // the 24 V stator (twice the turns, K9) on a 12 V battery
      return { ...calm, params: steady({ ...hamlet, meanWind: 8, gusts: 0.6, turns: 152 }) };
    default:
      return { ...calm, params: hamlet };
  }
}

export const PRESET_IDS: PresetId[] = ['calm-valley', 'hamlet', 'windy-plateau'];
export const SCENARIO_IDS: ScenarioId[] = [
  'wind-sweep',
  'gusts',
  'storm',
  'storm-fixed-tail',
  'battery-full',
  'runaway',
  'brake-switch',
  'thin-cable',
  'low-mast',
  'few-turns',
  'stator-24v',
];
