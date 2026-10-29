import { buildConfig, type Config } from './config';
import { FURLING_SPEED, TAIL_MASS_REF, YAW_STOP_DEG } from './machine';
import { presetParams } from './presets';
import { operatingPoint, referenceBattery } from './steady';
import type { PiggottParams } from './types';

// Calibration of the one fitted constant of the furling model: the effective tail weight that makes the machine start
// to furl at the 10 m/s of K12. docs/physics.md §3 explains why the result is stored in machine.ts (TAIL_MASS_REF);
// a test checks that this function still finds it.

/** Folding of the tail, in degrees beyond its stop, that counts as "furling has started". */
export const ONSET_FOLD_DEG = 1;

/**
 * The lowest steady hub wind speed, m/s, at which the tail has lifted by more than `ONSET_FOLD_DEG` (Infinity if it
 * never does below 40 m/s, or if the tail is fixed). Scan, then bisection. Uses the reference battery (mid charge, no
 * house, no dump).
 */
export function furlingOnset(cfg: Config): number {
  if (cfg.fixedTail) return Infinity;
  const bat = referenceBattery(cfg);
  const folded = (v: number) =>
    (operatingPoint(cfg, bat, false, v).yaw * 180) / Math.PI > YAW_STOP_DEG + ONSET_FOLD_DEG;
  let lo = 1;
  let hi = 0;
  for (let v = 2; v <= 40; v += 0.5) {
    if (folded(v)) {
      hi = v;
      break;
    }
    lo = v;
  }
  if (hi === 0) return Infinity;
  for (let i = 0; i < 24; i++) {
    const mid = 0.5 * (lo + hi);
    if (folded(mid)) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

/**
 * Effective tail weight, kg (for the 1.2 m machine), that makes the machine start to furl at `target` m/s. The hold
 * moment is proportional to the weight, so the search is a bisection on the weight factor.
 */
export function calibrateTailMass(params: PiggottParams = presetParams('hamlet'), target = FURLING_SPEED): number {
  const base = { ...params, tailWeight: 1, fixedTail: false };
  let lo = 0.05;
  let hi = 8;
  for (let i = 0; i < 40; i++) {
    const mid = Math.sqrt(lo * hi);
    if (furlingOnset(buildConfig({ ...base, tailWeight: mid })) < target) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi) * TAIL_MASS_REF;
}
