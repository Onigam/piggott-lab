import { drivingVoltage, openCircuitVolts, seriesResistance, commutationResistance } from './alternator';
import type { Config } from './config';
import {
  BATTERY_HIGH_VOLTS,
  BATTERY_LOW_VOLTS,
  CHARGE_EFFICIENCY,
  DUMP_MAX_CURRENT,
  LVD_RECONNECT_VOLTS,
  RECTIFIER_DROP,
} from './machine';
import { clamp } from './physics';

// Battery, regulation and the DC bus. A 12 V flooded lead-acid battery (the kit only has a 48 V LiFePO4 curve, see
// docs/kit-requests.md), a dump load that holds the bus at 14 V, a low-voltage disconnect on the house at 11.5 V (K22).

/** Resting voltage of a 12 V lead-acid battery against its state of charge. estimate (typical flooded battery). */
const OCV_TABLE: [number, number][] = [
  [0, 11.7],
  [0.1, 11.85],
  [0.25, 12.0],
  [0.5, 12.25],
  [0.75, 12.5],
  [0.9, 12.68],
  [1, 12.85],
];

export function batteryOcv(soc: number): number {
  const s = clamp(soc, 0, 1);
  for (let i = 1; i < OCV_TABLE.length; i++) {
    if (s <= OCV_TABLE[i][0]) {
      const [s0, v0] = OCV_TABLE[i - 1];
      const [s1, v1] = OCV_TABLE[i];
      return v0 + ((v1 - v0) * (s - s0)) / (s1 - s0);
    }
  }
  return OCV_TABLE[OCV_TABLE.length - 1][1];
}

/**
 * Internal resistance seen by the charge current, Ω: the ohmic part + a polarisation that grows (as the cube) above 70 %
 * charge, so that a battery that is nearly full cannot take the current at 14 V: it is "full". estimate: the sources only give the 14 V limit (K22).
 */
export function batteryResistance(cfg: Config, soc: number): number {
  const full = clamp((soc - 0.7) / 0.3, 0, 1);
  return cfg.batteryRInt + cfg.batteryRFull * full * full * full;
}

/** What the bus solver needs to know about the battery side. */
export interface BatteryView {
  connected: boolean;
  /** Open-circuit voltage, V. */
  ocv: number;
  /** Internal resistance, Ω. */
  resistance: number;
  /** Current drawn by the house (0 when the low-voltage disconnect is open), A. */
  loadCurrent: number;
  dumpEnabled: boolean;
}

export function batteryView(cfg: Config, soc: number, connected: boolean, loadsOn: boolean): BatteryView {
  return {
    connected,
    ocv: batteryOcv(soc),
    resistance: batteryResistance(cfg, soc),
    // the house is a constant-power load; its current is taken at the nominal 12 V so that it does not feed back
    loadCurrent: connected && loadsOn ? cfg.loadPower / 12 : 0,
    dumpEnabled: cfg.dumpEnabled,
  };
}

/** The bus at one rotor speed. Currents in A, voltages in V, powers in W. */
export interface Bus {
  /** Rectified current out of the alternator. */
  iGen: number;
  /** Battery terminal voltage. */
  vBus: number;
  /** Net current into the battery (negative = discharging). */
  iBattery: number;
  iDump: number;
  iLoad: number;
  /** Open-circuit voltage of the bridge, V. */
  vOpen: number;
  /** Air-gap power (the mechanical power the alternator takes), W. */
  pAirGap: number;
  /** Copper loss of the two conducting phases, diode loss, cable loss, W. */
  pCopper: number;
  pDiode: number;
  pCable: number;
}

/**
 * Solve the DC bus for a rotor speed. The bridge is a source `A − R·I` (A = V_oc − diode drop); the battery is
 * `OCV + r·I`; the dump load is a shunt regulator that takes whatever it takes (up to 16 A) to keep the bus at 14 V.
 * `brake` closes the brake switch: the DC output is shorted and the battery is isolated (it still feeds the house).
 */
export function solveBus(cfg: Config, omega: number, bat: BatteryView, brake: boolean): Bus {
  const vOpen = openCircuitVolts(cfg, omega);
  const a = drivingVoltage(cfg, omega);
  const rSeries = seriesResistance(cfg, omega);
  const rx = commutationResistance(cfg, omega);
  const iL = bat.loadCurrent;
  let iGen = 0;
  let vBus = bat.connected ? bat.ocv - bat.resistance * iL : vOpen;
  let iDump = 0;

  if (brake) {
    iGen = Math.max(0, a / rSeries);
  } else if (bat.connected) {
    iGen = Math.max(0, (a - bat.ocv + bat.resistance * iL) / (rSeries + bat.resistance));
    vBus = bat.ocv + bat.resistance * (iGen - iL);
    if (bat.dumpEnabled && iGen > 0 && vBus > BATTERY_HIGH_VOLTS) {
      // shunt regulation: hold the bus at 14 V and send the surplus to the dump
      iGen = Math.max(0, (a - BATTERY_HIGH_VOLTS) / rSeries);
      const iBatteryAtLimit = (BATTERY_HIGH_VOLTS - bat.ocv) / bat.resistance;
      iDump = Math.max(0, iGen - iL - iBatteryAtLimit);
      vBus = BATTERY_HIGH_VOLTS;
      if (iDump > DUMP_MAX_CURRENT) {
        // the dump is saturated: the bus voltage rises above the limit
        iDump = DUMP_MAX_CURRENT;
        iGen = Math.max(0, (a - bat.ocv + bat.resistance * (iL + iDump)) / (rSeries + bat.resistance));
        vBus = bat.ocv + bat.resistance * (iGen - iL - iDump);
      }
    }
  }

  const pAirGap = iGen * (vOpen - rx * iGen);
  return {
    iGen,
    vBus,
    // with the brake closed the bridge feeds the short, not the battery, which still supplies the house
    iBattery: bat.connected ? (brake ? -iL : iGen - iDump - iL) : 0,
    iDump,
    iLoad: iL,
    vOpen,
    pAirGap,
    pCopper: 2 * cfg.rPhase * iGen * iGen,
    pDiode: RECTIFIER_DROP * iGen,
    pCable: cfg.cableR * iGen * iGen,
  };
}

/** Power delivered by the turbine to the battery bus (battery + dump + house), W. Zero with the brake closed. */
export function busPower(bus: Bus, brake: boolean): number {
  return brake ? 0 : bus.vBus * bus.iGen;
}

/** State of charge after `dt` seconds at a net current into the battery (A), with the Ah efficiency of charging. */
export function advanceSoc(cfg: Config, soc: number, current: number, dt: number): number {
  const ah = (current * dt) / 3600;
  const stored = ah > 0 ? ah * CHARGE_EFFICIENCY : ah;
  return clamp(soc + stored / cfg.batteryAh, 0, 1);
}

/** The low-voltage disconnect with its hysteresis: opens below 11.5 V, closes again above 12.5 V (K22). */
export function lvdNext(open: boolean, loadedVolts: number): boolean {
  if (open) return loadedVolts < LVD_RECONNECT_VOLTS;
  return loadedVolts < BATTERY_LOW_VOLTS;
}
