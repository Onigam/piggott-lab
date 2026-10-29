import type { Config } from './config';
import { BRIDGE_FACTOR, RECTIFIER_DROP } from './machine';
import { radToRpm } from './physics';

// The axial-flux alternator, three phases in star, feeding a three-phase diode bridge (S4 p. 36). Quasi-static: at every
// speed the currents are those of the periodic regime.
//
//   E_ll = ke·ω                      EMF between phases (rms), ke calibrated on the bench test K10
//   V_oc = 1.35·E_ll                 rectified open-circuit voltage (3√2/π; S4 writes 1.4)
//   I = (V_oc − 2V_d − V_bus) / R_dc    with R_dc = 2R_ph + R_cable + (3/π)·p·ω·L_ph
//
// The 2R_ph is the resistance of the two phases that conduct at any time; (3/π)·p·ω·L is the voltage lost to the
// commutation (overlap) of the diodes, a reactance that grows with speed. The air-gap power is
// P_ag = I·(V_oc − R_x·I): the reactive drop costs voltage but no heat. Heat: copper 2R_ph·I², diodes V_d·I, cable R·I².

/** EMF between phases, rms, V. */
export function emf(cfg: Config, omega: number): number {
  return cfg.keLl * omega;
}

/** Rectified open-circuit voltage, V. */
export function openCircuitVolts(cfg: Config, omega: number): number {
  return BRIDGE_FACTOR * emf(cfg, omega);
}

/** Commutation resistance of the bridge at a speed, Ω: (3/π)·p·ω·L. */
export function commutationResistance(cfg: Config, omega: number): number {
  return (3 / Math.PI) * cfg.polePairs * omega * cfg.lPhase;
}

/** Resistance in series with the battery seen by the bridge, Ω: two phases + cable + commutation. */
export function seriesResistance(cfg: Config, omega: number): number {
  return 2 * cfg.rPhase + cfg.cableR + commutationResistance(cfg, omega);
}

/** Open-circuit voltage minus the diode drop: the voltage available to charge the battery, V (can be negative). */
export function drivingVoltage(cfg: Config, omega: number): number {
  return openCircuitVolts(cfg, omega) - RECTIFIER_DROP;
}

/** Electrical frequency, Hz (poles × rpm / 120, S4 p. 36). */
export function frequency(cfg: Config, omega: number): number {
  return (cfg.polePairs * radToRpm(omega)) / 60;
}

/** Rotor speed at which the bridge starts to conduct into a battery at `volts`, rad/s (the cut-in speed, K20). */
export function cutInOmega(cfg: Config, volts: number): number {
  return (volts + RECTIFIER_DROP) / (BRIDGE_FACTOR * cfg.keLl);
}
