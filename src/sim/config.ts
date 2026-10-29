import { cableResistance } from '@onigam/lab-kit/sim/electric';
import {
  BATTERY_R_FULL_100AH,
  BATTERY_R_INT_100AH,
  DIAMETER_REF,
  FRICTION_STATIC_REF,
  FRICTION_VISCOUS_REF,
  G,
  INERTIA_REF,
  KE_EXPONENT,
  KE_LL_REF,
  L_PHASE_REF,
  OFFSET_EXPONENT,
  OFFSET_REF,
  POLE_PAIRS,
  R_EXPONENT,
  R_PHASE_REF,
  TAIL_ARM,
  TAIL_MASS_REF,
  TAIL_MOMENT_EXPONENT,
  TURNS_REF,
  WIRE_DIAMETER_REF,
  YAW_FURLED_DEG,
  YAW_STOP_DEG,
} from './machine';
import { airDensity, sweptArea } from './physics';
import type { PiggottParams } from './types';

// Everything the solvers need, derived once from the parameters: the scaling rules of docs/physics.md §1.8 live here.

export interface Config {
  diameter: number;
  radius: number;
  area: number;
  /** Air density, kg/m³. */
  rho: number;
  /** D / 1.2 m. */
  scale: number;
  // alternator (referred to the rectifier input)
  /** EMF constant, V·s/rad, line-to-line rms. */
  keLl: number;
  /** Resistance and inductance of one phase, Ω and H. */
  rPhase: number;
  lPhase: number;
  polePairs: number;
  /** Turns per coil and wire diameter that fills the same winding window, m. */
  turns: number;
  wireDiameter: number;
  /** Round-trip resistance of the cable, Ω. */
  cableR: number;
  // mechanics
  inertia: number;
  frictionStatic: number;
  frictionViscous: number;
  // furling
  fixedTail: boolean;
  /** Offset of the alternator from the yaw axis, m. */
  offset: number;
  /** Largest moment the tail can hold on its stop before it lifts, N·m. */
  holdMoment: number;
  yawStop: number;
  yawFurled: number;
  // battery
  batteryAh: number;
  batteryRInt: number;
  batteryRFull: number;
  dumpEnabled: boolean;
  loadPower: number;
}

export function buildConfig(p: PiggottParams): Config {
  const s = p.diameter / DIAMETER_REF;
  const n = p.turns / TURNS_REF;
  const scale = (exp: number) => Math.pow(s, exp);
  const moment0 = TAIL_MASS_REF * G * TAIL_ARM * p.tailWeight * scale(TAIL_MOMENT_EXPONENT);
  return {
    diameter: p.diameter,
    radius: p.diameter / 2,
    area: sweptArea(p.diameter),
    rho: airDensity(p.altitude),
    scale: s,
    keLl: KE_LL_REF * n * scale(KE_EXPONENT),
    rPhase: R_PHASE_REF * n * n * scale(R_EXPONENT),
    lPhase: L_PHASE_REF * n * n * scale(R_EXPONENT),
    polePairs: POLE_PAIRS,
    turns: p.turns,
    wireDiameter: WIRE_DIAMETER_REF / Math.sqrt(n),
    cableR: cableResistance(p.cableLength, p.cableSection),
    inertia: INERTIA_REF * scale(5),
    frictionStatic: FRICTION_STATIC_REF * scale(3),
    frictionViscous: FRICTION_VISCOUS_REF * scale(4),
    fixedTail: p.fixedTail,
    offset: OFFSET_REF * scale(OFFSET_EXPONENT),
    holdMoment: moment0,
    yawStop: (YAW_STOP_DEG * Math.PI) / 180,
    yawFurled: (YAW_FURLED_DEG * Math.PI) / 180,
    batteryAh: p.batteryAh,
    batteryRInt: BATTERY_R_INT_100AH * (100 / p.batteryAh),
    batteryRFull: BATTERY_R_FULL_100AH * (100 / p.batteryAh),
    dumpEnabled: p.dumpLoad,
    loadPower: p.loadPower,
  };
}
