import { emf } from './alternator';
import type { Config } from './config';
import { batteryView, busPower, solveBus, type BatteryView, type Bus } from './electrical';
import { yawEquilibrium } from './furling';
import { LAMBDA_RUNAWAY, SOC_REFERENCE } from './machine';
import { windPower } from './physics';
import { powerCoefficient, rotorThrust, rotorTorque, thrustCoefficient } from './rotor';
import type { OperatingPoint } from './types';

// Steady-state solver: the operating point of the machine in a steady wind. Used for the power curve, the yearly yield,
// the cycle averages that integrate the battery over hours (engine.ts) and by the tests. The same torque balance as
// the time-stepping engine, with dω/dt = 0.

/** Bearing and windage friction torque, N·m. */
export function frictionTorque(cfg: Config, omega: number): number {
  return cfg.frictionStatic + cfg.frictionViscous * Math.max(omega, 0);
}

/** Electromagnetic braking torque of the alternator, N·m. */
export function electricalTorque(bus: Bus, omega: number): number {
  return omega > 1e-9 ? bus.pAirGap / omega : 0;
}

/** The battery as the steady solver sees it: the reference state used for power curves (mid charge, no house, no dump). */
export function referenceBattery(cfg: Config, connected = true): BatteryView {
  return { ...batteryView({ ...cfg, loadPower: 0 }, SOC_REFERENCE, connected, true), dumpEnabled: false };
}

/** Everything that is known at one (wind, yaw, speed) point. */
export function evaluate(
  cfg: Config,
  bat: BatteryView,
  brake: boolean,
  v: number,
  yaw: number,
  omega: number,
): OperatingPoint & { bus: Bus } {
  const vn = v * Math.cos(yaw);
  const lambda = vn > 1e-6 ? (omega * cfg.radius) / vn : 0;
  const bus = solveBus(cfg, omega, bat, brake);
  const rotorPower = rotorTorque(omega, vn, cfg.diameter, cfg.rho) * omega;
  const pBus = busPower(bus, brake);
  const open = !brake && !bat.connected;
  return {
    wind: v,
    windNormal: vn,
    omega,
    rpm: (omega * 60) / (2 * Math.PI),
    yaw,
    lambda,
    cp: powerCoefficient(lambda),
    ct: thrustCoefficient(lambda),
    windPower: windPower(v, cfg.diameter, cfg.rho),
    rotorPower,
    thrust: rotorThrust(omega, vn, cfg.diameter, cfg.rho),
    frictionLoss: frictionTorque(cfg, omega) * omega,
    airGapPower: bus.pAirGap,
    copperLoss: bus.pCopper,
    diodeLoss: bus.pDiode,
    cableLoss: bus.pCable,
    emf: emf(cfg, omega),
    openCircuitVolts: bus.vOpen,
    dcCurrent: bus.iGen,
    busVoltage: open ? bus.vOpen : bus.vBus,
    busPower: pBus,
    batteryPower: bat.connected ? bus.vBus * bus.iBattery : 0,
    batteryCurrent: bus.iBattery,
    dumpPower: bus.vBus * bus.iDump,
    loadPower: bat.connected ? bus.vBus * bus.iLoad : 0,
    bus,
  };
}

/**
 * Rotor speed in a steady wind and a given yaw, rad/s: the first point, scanning up from rest, where the electrical and
 * friction torques catch up with the aerodynamic one (the point the rotor reaches when it spins up). Zero when the wind
 * cannot overcome the friction.
 */
export function solveOmega(cfg: Config, bat: BatteryView, brake: boolean, v: number, yaw: number): number {
  const vn = v * Math.cos(yaw);
  if (vn <= 0.05) return 0;
  const torque = (omega: number) =>
    electricalTorque(solveBus(cfg, omega, bat, brake), omega) +
    frictionTorque(cfg, omega) -
    rotorTorque(omega, vn, cfg.diameter, cfg.rho);
  if (torque(0) >= 0) return 0;
  const hi = (LAMBDA_RUNAWAY * vn) / cfg.radius;
  const n = 40;
  let lo = 0;
  let up = hi;
  for (let i = 1; i <= n; i++) {
    const w = (hi * i) / n;
    if (torque(w) >= 0) {
      up = w;
      break;
    }
    lo = w;
  }
  for (let i = 0; i < 36; i++) {
    const mid = 0.5 * (lo + up);
    if (torque(mid) >= 0) up = mid;
    else lo = mid;
  }
  return 0.5 * (lo + up);
}

/** The operating point of the machine in a steady wind `v` (at the hub), furling included. */
export function operatingPoint(
  cfg: Config,
  bat: BatteryView,
  brake: boolean,
  v: number,
): OperatingPoint & { bus: Bus } {
  const stop = cfg.yawStop;
  let yaw = stop;
  let omega = solveOmega(cfg, bat, brake, v, yaw);
  if (!cfg.fixedTail && v > 0.1) {
    // is the tail holding? (the equilibrium yaw at the speed the rotor has on its stop)
    if (yawEquilibrium(cfg, omega, v) > stop) {
      // the rotor speed and the yaw depend on each other (thrust ← λ ← yaw): bisect on the yaw, solving the speed inside
      const moment = (y: number) => {
        const w = solveOmega(cfg, bat, brake, v, y);
        return { w, f: yawEquilibrium(cfg, w, v) - y };
      };
      let lo = stop;
      let hi = cfg.yawFurled;
      for (let i = 0; i < 30; i++) {
        const mid = 0.5 * (lo + hi);
        if (moment(mid).f > 0) lo = mid;
        else hi = mid;
      }
      yaw = 0.5 * (lo + hi);
      omega = solveOmega(cfg, bat, brake, v, yaw);
    }
  }
  return evaluate(cfg, bat, brake, v, yaw, omega);
}
