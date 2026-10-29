import {
  CP_MAX,
  CQ_START,
  CT_FULL,
  CT_STALLED,
  LAMBDA_CT,
  LAMBDA_OPT,
  LAMBDA_RUNAWAY,
  LAMBDA_START_FADE,
} from './machine';
import { sweptArea } from './physics';

// Aerodynamics of the three-bladed rotor. The sources give a peak (K15), a design tip speed ratio (K16) and a rule of
// thumb at the peak (K17), nothing else: the shape of the curve is ours (docs/physics.md §1.2).

/** Exponent of the rising side so that the main term peaks exactly at the design tip speed ratio (see `cp`). */
const RISE = LAMBDA_OPT / (LAMBDA_RUNAWAY - LAMBDA_OPT);

/**
 * Torque coefficient Cq = Cp/λ (torque = ½ρA·R·v²·Cq). Main term: Cp = Cp_max·(λ/λ_opt)^m·(λ_r − λ)/(λ_r − λ_opt), zero at
 * the runaway tip speed ratio λ_r, with m chosen so that the maximum is at λ_opt. Plus a starting-torque term that fades
 * out by λ = 3 (stalled blades at standstill).
 */
export function torqueCoefficient(lambda: number): number {
  if (!(lambda >= 0)) return CQ_START;
  let cq = 0;
  if (lambda < LAMBDA_RUNAWAY) {
    cq =
      (CP_MAX / LAMBDA_OPT) *
      Math.pow(lambda / LAMBDA_OPT, RISE - 1) *
      ((LAMBDA_RUNAWAY - lambda) / (LAMBDA_RUNAWAY - LAMBDA_OPT));
  }
  if (lambda < LAMBDA_START_FADE) cq += CQ_START * (1 - lambda / LAMBDA_START_FADE) ** 2;
  return cq;
}

/** Power coefficient Cp(λ) = λ·Cq(λ): 0 at standstill, peak CP_MAX at λ = 7 (K15, K16), 0 again at the runaway λ = 10. */
export function powerCoefficient(lambda: number): number {
  return lambda > 0 ? lambda * torqueCoefficient(lambda) : 0;
}

/**
 * Thrust coefficient Ct(λ): 0.35 for a stalled, slow rotor rising to the Betz optimum 8/9 for a loaded fast one
 * (actuator disc: Ct = 4a(1 − a) = 8/9 at a = 1/3). Not in the sources: assumed shape.
 */
export function thrustCoefficient(lambda: number): number {
  const x = Math.max(lambda, 0) / LAMBDA_CT;
  return CT_STALLED + (CT_FULL - CT_STALLED) * (1 - Math.exp(-x * x));
}

/** Aerodynamic torque on the shaft, N·m, in a wind `vn` blowing normal to the rotor. */
export function rotorTorque(omega: number, vn: number, diameter: number, rho: number): number {
  if (vn <= 1e-6) return 0;
  const lambda = (omega * diameter) / 2 / vn;
  return 0.5 * rho * sweptArea(diameter) * (diameter / 2) * vn * vn * torqueCoefficient(lambda);
}

/** Thrust on the rotor, N. */
export function rotorThrust(omega: number, vn: number, diameter: number, rho: number): number {
  if (vn <= 1e-6) return 0;
  const lambda = (omega * diameter) / 2 / vn;
  return 0.5 * rho * sweptArea(diameter) * vn * vn * thrustCoefficient(lambda);
}
