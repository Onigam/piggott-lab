import { buildConfig, type Config } from './config';
import { NAMEPLATE_REF, DIAMETER_REF } from './machine';
import { weibullCdf, weibullScale } from './physics';
import { operatingPoint, referenceBattery } from './steady';
import type { OperatingPoint, PiggottParams } from './types';
import { GAUSS_NODES, GAUSS_WEIGHTS, hubWind, turbulenceIntensity } from './wind';

// Power curve and yearly yield (research §5.7): the steady-state machine over a range of wind speeds, then the integral
// of the curve over the Weibull distribution of the site. The battery is the reference one (mid charge, nothing else on
// the bus), so "battery power" here is what the turbine could deliver to a battery that always has room.

/** One point of the power curve. */
export type CurvePoint = OperatingPoint;

/** Wind speeds of the curve, m/s: 0 to `vmax` in steps of `step`. */
export function windGrid(vmax = 25, step = 0.5): number[] {
  const n = Math.round(vmax / step);
  return Array.from({ length: n + 1 }, (_, i) => i * step);
}

/** The steady-state power curve of a machine: one operating point per wind speed. */
export function powerCurve(cfg: Config, speeds: number[] = windGrid()): CurvePoint[] {
  const bat = referenceBattery(cfg);
  return speeds.map((v) => operatingPoint(cfg, bat, false, v));
}

/** Linear interpolation in a curve of battery power. */
function interpolate(speeds: number[], values: number[], v: number): number {
  if (v <= speeds[0]) return values[0];
  const last = speeds.length - 1;
  if (v >= speeds[last]) return values[last];
  const step = speeds[1] - speeds[0];
  const i = Math.min(last - 1, Math.floor((v - speeds[0]) / step));
  const f = (v - speeds[i]) / (speeds[i + 1] - speeds[i]);
  return values[i] + (values[i + 1] - values[i]) * f;
}

/**
 * Mean of a curve over a turbulent wind of mean `u` and relative intensity `ti` (Gauss-Hermite, 5 points). The rotor is
 * treated as following the gusts (quasi-static): its inertia is ignored (docs/physics.md §5).
 */
export function turbulentMean(speeds: number[], values: number[], u: number, ti: number): number {
  let sum = 0;
  for (let i = 0; i < GAUSS_NODES.length; i++) {
    sum += GAUSS_WEIGHTS[i] * interpolate(speeds, values, Math.max(0, u * (1 + ti * GAUSS_NODES[i])));
  }
  return sum;
}

export interface YieldBin {
  /** Centre of the 1 m/s bin, m/s. */
  wind: number;
  /** Hours of the year in this bin. */
  hours: number;
  /** Energy delivered to the battery bus in this bin, kWh. */
  energy: number;
}

export interface YearlyYield {
  /** Mean wind speed at the hub, m/s, and the Weibull parameters. */
  hubWind: number;
  scale: number;
  shape: number;
  /** Energy delivered to the battery bus, kWh per year; mean power, W. */
  energy: number;
  meanPower: number;
  /** Capacity factor against the nameplate (200 W × (D/1.2)², K2), 0..1. */
  capacityFactor: number;
  nameplate: number;
  /** kWh per m² of swept area per year (compare with the 100-300 of K25). */
  specific: number;
  /** Energy the wind carries through the disc in the year, kWh, and the share the battery gets. */
  windEnergy: number;
  efficiency: number;
  bins: YieldBin[];
}

/** Nameplate power of a machine of a given diameter, W: the 200 W of K2 scaled with the swept area. */
export function nameplate(diameter: number): number {
  return NAMEPLATE_REF * Math.pow(diameter / DIAMETER_REF, 2);
}

const HOURS_PER_YEAR = 8760;
/** Number of 1 m/s bins kept for the chart (the last one holds everything above). */
const BIN_COUNT = 30;

/**
 * Yearly yield of a machine on its site: ∫ P(v) f(v) dv over the Weibull distribution of the hub wind, 8 760 h, with
 * the turbulence of the site averaged into the curve. `curve` may be passed when it has been computed already.
 */
export function yearlyYield(params: PiggottParams, curve?: CurvePoint[]): YearlyYield {
  const cfg = buildConfig(params);
  const mean = hubWind(params.meanWind, params.mastHeight, params.obstacleHeight);
  // the table reaches 4.5 times the mean wind (the Rayleigh tail beyond is below 1e-8 of the hours), 35 m/s at least
  const top = Math.max(35, Math.ceil((4.5 * mean) / 5) * 5);
  const speeds = windGrid(top, 0.5);
  const points = curve && curve.length === speeds.length ? curve : powerCurve(cfg, speeds);
  const bus = points.map((p) => p.busPower);
  const wind = points.map((p) => p.windPower);
  const ti = turbulenceIntensity(params.mastHeight, params.obstacleHeight) * params.gusts;
  const k = params.weibullK;
  const c = weibullScale(mean, k);
  // integrate on a fine grid (0.25 m/s) and collect into 1 m/s bins
  const bins: YieldBin[] = Array.from({ length: BIN_COUNT }, (_, i) => ({ wind: i + 0.5, hours: 0, energy: 0 }));
  let energy = 0;
  let windEnergy = 0;
  const dv = 0.25;
  for (let v = dv / 2; v < top; v += dv) {
    const hours = HOURS_PER_YEAR * (weibullCdf(v + dv / 2, c, k) - weibullCdf(v - dv / 2, c, k));
    const e = (turbulentMean(speeds, bus, v, ti) * hours) / 1000;
    energy += e;
    windEnergy += (turbulentMean(speeds, wind, v, ti) * hours) / 1000;
    const bin = bins[Math.min(bins.length - 1, Math.floor(v))];
    bin.hours += hours;
    bin.energy += e;
  }
  const np = nameplate(params.diameter);
  return {
    hubWind: mean,
    scale: c,
    shape: k,
    energy,
    meanPower: (energy * 1000) / HOURS_PER_YEAR,
    capacityFactor: (energy * 1000) / HOURS_PER_YEAR / np,
    nameplate: np,
    specific: energy / ((Math.PI * params.diameter ** 2) / 4),
    windEnergy,
    efficiency: windEnergy > 0 ? energy / windEnergy : 0,
    bins,
  };
}
