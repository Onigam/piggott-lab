import type { Config } from './config';
import { TAIL_SWING_ORIGIN_DEG } from './machine';
import { rotorThrust } from './rotor';

// Furling (S4 p. 30-31, K12-K13). The alternator sits an offset e from the yaw axis, so the thrust T of the rotor pushes
// the machine out of the wind with the moment T·e. The tail resists: it can carry a moment up to a limit set by its
// weight (the inclined hinge makes the tail rise as it swings, and its weight brings it back down); beyond that limit it
// lifts and swings, the rotor turns away from the wind, the thrust falls, and a new equilibrium is found. Quasi-static
// balance, with the yaw angle ψ and the fold of the tail φ = ψ − ψ_stop:
//
//   e · ½ρA·Ct(λ)·(v cos ψ)²  =  M_hold(φ)      for ψ > ψ_stop,      M_hold(φ) = M_0 · sin(u0 + φ) / sin(u0)
//
// M_0 is proportional to the tail weight: the one calibrated parameter (furling starts at 10 m/s, K12). The thrust is
// therefore held at about the value it has at the onset: the power plateaus.

/** Moment the tail can hold when it is folded by `fold` radians past its stop, N·m. */
export function holdMoment(cfg: Config, fold: number): number {
  const u0 = (TAIL_SWING_ORIGIN_DEG * Math.PI) / 180;
  return (cfg.holdMoment * Math.sin(u0 + fold)) / Math.sin(u0);
}

/** Moment of the rotor thrust about the yaw axis, N·m (the offset is perpendicular to the rotor axis). */
export function thrustMoment(cfg: Config, omega: number, v: number, yaw: number): number {
  return cfg.offset * rotorThrust(omega, v * Math.cos(yaw), cfg.diameter, cfg.rho);
}

/**
 * Equilibrium yaw for a rotor turning at a given speed in a wind `v`, rad: the stop angle while the thrust moment is
 * below what the tail holds, then the root of the moment balance. Bisection on a function that decreases with yaw.
 */
export function yawEquilibrium(cfg: Config, omega: number, v: number): number {
  const stop = cfg.yawStop;
  if (cfg.fixedTail || v < 0.1) return stop;
  const balance = (yaw: number) => thrustMoment(cfg, omega, v, yaw) - holdMoment(cfg, yaw - stop);
  if (balance(stop) <= 0) return stop;
  if (balance(cfg.yawFurled) >= 0) return cfg.yawFurled;
  let lo = stop;
  let hi = cfg.yawFurled;
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    if (balance(mid) > 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}
