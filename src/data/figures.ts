// The figures that the texts of src/data write by {placeholder}, so that the French and the English spellings of a number
// (7,5 / 7.5) can never drift apart, and so that one test (data.test.ts) can check every model result against the
// simulation. A figure that a SOURCE reports (76 turns, 230 mm, 1.9 V, the 12 m of the French rule…) is written in the
// text itself and checked against the allow-list of data.test.ts; a figure that is DERIVED or a MODEL RESULT lives here.
//
// MODEL = outputs of src/sim for the machine of the video (1.2 m, 76 turns, 12 V) on the `hamlet` preset with the reference
// battery (docs/physics.md §7). They are rounded as the texts print them; data.test.ts recomputes each one from the sim.
// Nothing here is tuned to the 200 W of the label (docs/research.md K2/K19): the label and the model are told apart in every text.

import {
  BLADE_COUNT,
  BATTERY_HIGH_VOLTS,
  BATTERY_LOW_VOLTS,
  BENCH_RPM,
  BENCH_VOLTS_LL,
  DIAMETER_REF,
  DUMP_MAX_CURRENT,
  FURLING_SPEED,
  MAGNETS_PER_DISC,
  NAMEPLATE_REF,
  OFFSET_REF,
  R_PHASE_REF,
  TIP_SPEED_LIMIT,
  TURNS_REF,
  WIRE_MASS_REF,
} from '../sim/machine';
import { RANGES } from '../sim/presets';
import { BLADE } from '../three/dims';
import { round } from './units';

/** Results of the simulation quoted in the texts (default machine, `hamlet` site unless the key says otherwise). */
export const MODEL = {
  peak: 62.9, // W to the battery at the best, in a steady wind (docs/physics.md §7.1)
  peakWind: 14.5, // m/s where that peak sits
  w10: 50.4, // W at 10 m/s at the hub
  w12: 60.4, // W at 12 m/s at the hub
  w25: 55.9, // W at 25 m/s: the plateau after the furling
  cutIn: 2.6, // m/s: first watt to the battery
  cutInRpm: 325, // rpm at which the bridge starts to conduct into a 12.4 V battery
  rpm10: 417, // rotor speed at 10 m/s
  rpm12: 436, // rotor speed at 12 m/s
  lambda10: 2.6, // tip speed ratio at 10 m/s (the blades are designed for 7)
  cp10: 0.11, // power coefficient at 10 m/s (0.30 at the design tip speed ratio)
  etaAlt12: 80, // % of the air-gap power that leaves the stator at 12 m/s (the rest heats the copper)
  copper12: 17.5, // W of copper loss at 12 m/s
  rotor12: 90, // W of rotor power at 12 m/s
  windPower12: 1202, // W in the wind through the disc at 12 m/s (derived, ½ρAv³)
  eta12: 5, // % of the wind power at 12 m/s that reaches the battery
  yaw10: 6, // ° of yaw at 10 m/s (the tail rests on its stop: 5° + 1°)
  yaw12: 25, // ° at 12 m/s
  yaw16: 46, // ° at 16 m/s
  yaw25: 65, // ° at 25 m/s
  thrust25: 41, // N of thrust at 25 m/s with the folding tail
  thrustFixed25: 373, // N with the tail locked
  copperFixed25: 2198, // W of copper loss with the tail locked at 25 m/s
  ampsFixed25: 54, // A with the tail locked at 25 m/s
  tipFixed25: 174, // m/s tip speed with the tail locked at 25 m/s
  furlLight: 7.3, // m/s: onset of furling with a tail 0.6 × as heavy
  furlHeavy: 13.8, // m/s: onset with a tail 1.8 × as heavy
  amps12: 4.9, // A of rectified current at 12 m/s
  runawayRpm: 1315, // rpm, battery disconnected, 8 m/s (steady state)
  runawayVolts: 56, // V at the open terminals at that speed
  brakeRpm: 83, // rpm with the brake switch closed, 8 m/s
  thinLoss: 11, // % of the power generated that a 2.5 mm² cable over 40 m burns at 8 m/s
  defaultLoss: 1, // % for the lab's default cable (10 mm², 15 m) at the same wind
  hamletKwh: 132, // kWh per year to the battery, hamlet site
  hamletKwhM2: 117, // kWh per m² of swept area per year (compare with 100-300)
  hamletCf: 7.6, // % capacity factor against the 200 W of the label
  windyKwh: 242, // kWh per year, windy plateau
  calmKwh12: 45, // kWh per year, calm valley, 12 m mast among 8 m trees
  calmKwh6: 17, // same with a 6 m mast
  calmKwh18: 74, // same with an 18 m mast
  hub6: 3.4, // m/s at the hub of a 6 m mast among 5 m trees, 5 m/s at 10 m
  hub12: 4.9, // same, 12 m mast
  hub18: 5.5, // same, 18 m mast
  turb6: 0.26, // turbulence intensity at 6 m (σ / mean)
  turb12: 0.13, // at 12 m
  turn30Cut: 5.2, // m/s: cut-in of a stator wound with 30 turns
  turn30W12: 234, // W at 12 m/s of that stator if the tail did not fold (physics §7.5)
  diode12: 7, // W lost in the rectifier diodes at 12 m/s
} as const;

const HOURS_YEAR = 8760;
const AREA = Math.PI * (DIAMETER_REF / 2) ** 2; // m², swept area of the 1.2 m rotor
const HOUSE_WATTS = 10; // W, the default house load of the simulation (assumption, src/sim/machine.ts)

/** [value, decimals] of every number the texts write by placeholder. Reported, derived or model, as the comment says. */
export const FIG = {
  // reported (research.md §2, machine.ts)
  diameter: [DIAMETER_REF, 2], // K1
  blades: [BLADE_COUNT, 0], // K4
  rated: [NAMEPLATE_REF, 0], // K2: the label, nominal, wind speed not given
  magnets: [MAGNETS_PER_DISC, 0], // K6, per disc
  turns: [TURNS_REF, 0], // K7
  benchVolts: [BENCH_VOLTS_LL, 1], // K10
  benchRpm: [BENCH_RPM, 0], // K10
  furling: [FURLING_SPEED, 0], // K12
  offset: [OFFSET_REF * 1000, 0], // K13, mm
  tipLimit: [TIP_SPEED_LIMIT, 0], // S4 p. 9, 200 mph
  low: [BATTERY_LOW_VOLTS, 1], // K22
  high: [BATTERY_HIGH_VOLTS, 0], // K22
  // from src/three/dims.ts (the plans' blade, S4 p. 43), mm
  bladeL: [BLADE.length * 1000, 0],
  rootW: [BLADE.rootWidth * 1000, 0],
  rootT: [BLADE.rootThickness * 1000, 0],
  tipW: [BLADE.stationWidth[5]! * 1000, 0],
  tipT: [BLADE.stationThickness[5]! * 1000, 0],
  // derived from reported figures
  area: [round(AREA, 3), 3], // m²
  wind10: [round(0.5 * 1.23 * AREA * 10 ** 3), 0], // W in the wind at 10 m/s (K14)
  rpm3: [334, 0], // rpm at 3 m/s and tip speed ratio 7 (K16)
  hz60: [(BENCH_RPM * MAGNETS_PER_DISC) / 120, 0], // Hz at 60 rpm: rpm × poles / 120 (S4 p. 36), 8 poles → 4 Hz
  rph: [round(R_PHASE_REF, 2), 2], // Ω, resistance of one phase (stator drawing of S4 p. 46)
  wireKg: [round(WIRE_MASS_REF, 2), 2], // kg of copper from the geometry, against the 1.5 kg reported
  houseKwh: [round((HOUSE_WATTS * HOURS_YEAR) / 1000, 1), 1], // kWh per year of a 10 W house
  house: [HOUSE_WATTS, 0],
  mastMin: [RANGES.mastHeight.min, 0], // m, the lab's mast slider
  mastMax: [RANGES.mastHeight.max, 0],
  dumpW: [BATTERY_HIGH_VOLTS * DUMP_MAX_CURRENT, 0], // W: 14 V × the 16 A relay of the plans' circuit
  // model results
  peak: [MODEL.peak, 0],
  peakWind: [MODEL.peakWind, 1],
  w10: [MODEL.w10, 0],
  w12: [MODEL.w12, 0],
  w25: [MODEL.w25, 0],
  cutIn: [MODEL.cutIn, 1],
  cutInRpm: [MODEL.cutInRpm, 0],
  rpm10: [MODEL.rpm10, 0],
  rpm12: [MODEL.rpm12, 0],
  lambda10: [MODEL.lambda10, 1],
  cp10: [MODEL.cp10, 2],
  etaAlt12: [MODEL.etaAlt12, 0],
  copper12: [MODEL.copper12, 0],
  rotor12: [MODEL.rotor12, 0],
  windPower12: [MODEL.windPower12, 0],
  eta12: [MODEL.eta12, 0],
  yaw10: [MODEL.yaw10, 0],
  yaw12: [MODEL.yaw12, 0],
  yaw16: [MODEL.yaw16, 0],
  yaw25: [MODEL.yaw25, 0],
  thrust25: [MODEL.thrust25, 0],
  thrustFixed25: [MODEL.thrustFixed25, 0],
  copperFixed25: [MODEL.copperFixed25, 0],
  ampsFixed25: [MODEL.ampsFixed25, 0],
  tipFixed25: [MODEL.tipFixed25, 0],
  furlLight: [MODEL.furlLight, 1],
  furlHeavy: [MODEL.furlHeavy, 1],
  amps12: [MODEL.amps12, 0],
  runawayRpm: [MODEL.runawayRpm, 0],
  runawayVolts: [MODEL.runawayVolts, 0],
  brakeRpm: [MODEL.brakeRpm, 0],
  thinLoss: [MODEL.thinLoss, 0],
  defaultLoss: [MODEL.defaultLoss, 0],
  hamletKwh: [MODEL.hamletKwh, 0],
  hamletKwhM2: [MODEL.hamletKwhM2, 0],
  hamletCf: [MODEL.hamletCf, 1],
  windyKwh: [MODEL.windyKwh, 0],
  calmKwh12: [MODEL.calmKwh12, 0],
  calmKwh6: [MODEL.calmKwh6, 0],
  calmKwh18: [MODEL.calmKwh18, 0],
  hub6: [MODEL.hub6, 1],
  hub12: [MODEL.hub12, 1],
  hub18: [MODEL.hub18, 1],
  turb6: [MODEL.turb6, 2],
  turb12: [MODEL.turb12, 2],
  turn30Cut: [MODEL.turn30Cut, 1],
  turn30W12: [MODEL.turn30W12, 0],
  kePerRpm: [BENCH_VOLTS_LL / BENCH_RPM, 3], // V per rpm between phases (K10)
  diode12: [MODEL.diode12, 0],
} as const satisfies Record<string, readonly [number, number]>;

export type FigName = keyof typeof FIG;

/** Placeholders that are model results or derived from reported figures: a text that uses one must say so (see `lf` in part-helpers.ts). */
export const MODEL_KEYS: ReadonlySet<string> = new Set(Object.keys(MODEL));
export const DERIVED_KEYS: ReadonlySet<string> = new Set([
  'area',
  'wind10',
  'rpm3',
  'hz60',
  'rph',
  'wireKg',
  'houseKwh',
  'dumpW',
  'kePerRpm',
]);
