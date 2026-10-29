import { clamp, gamma, normalCdf, normalQuantile } from './physics';

// The wind: shear with height, the effect of trees and buildings (a slower, more turbulent wake when the hub is not well
// above them), a seeded gust process for the live view and a slow "weather" process for the hour-to-hour mean. Both
// processes are drawn on fixed time grids so that the result does not depend on the frame rate.
//
// Not in the sources, which only say that the mast must "clear the turbulence" and that "the higher the better" (K24):
// the numbers below are estimates, chosen to be plausible and to show the effect (docs/physics.md §1.1).

/** Height at which the weather-station mean wind is given, m. */
export const REFERENCE_HEIGHT = 10;
/** Power-law exponent of the wind profile over open ground (the usual 1/7). estimate. */
export const SHEAR_OPEN = 0.14;
/** Extra exponent per metre of obstacle height (rougher ground, steeper profile). estimate. */
export const SHEAR_PER_OBSTACLE_METRE = 0.008;
/** Turbulence intensity (σ/mean) over open ground at hub height. estimate (0.1-0.2 is usual onshore). */
export const TURBULENCE_OPEN = 0.12;
/** Turbulence intensity added by the wake of obstacles when the hub sits at their top. estimate. */
export const TURBULENCE_WAKE = 0.3;
/** Loss of mean wind speed when the hub sits at the top of the obstacles (share of the free wind). estimate. */
export const WAKE_DEFICIT = 0.35;

/** Power-law exponent of the wind profile for obstacles of a given height. */
export function shearExponent(obstacleHeight: number): number {
  return SHEAR_OPEN + SHEAR_PER_OBSTACLE_METRE * obstacleHeight;
}

/**
 * How much of the obstacles' wake the hub is in, 0..1: 1 when the hub is at or below the tops, falling off with the
 * clearance over the tops on a length of 0.7 times their height (at least 3 m).
 */
export function wakeShare(mastHeight: number, obstacleHeight: number): number {
  if (obstacleHeight <= 0) return 0;
  const clearance = mastHeight - obstacleHeight;
  const length = Math.max(3, 0.7 * obstacleHeight);
  return Math.exp(-Math.max(0, clearance) / length);
}

/** Mean wind speed at the hub, m/s, from the 10 m open-ground figure of the site. */
export function hubWind(meanWind: number, mastHeight: number, obstacleHeight: number): number {
  const shear = Math.pow(mastHeight / REFERENCE_HEIGHT, shearExponent(obstacleHeight));
  return meanWind * shear * (1 - WAKE_DEFICIT * wakeShare(mastHeight, obstacleHeight));
}

/** Turbulence intensity at the hub (σ of the wind speed over its mean), with no gust multiplier. */
export function turbulenceIntensity(mastHeight: number, obstacleHeight: number): number {
  const wake = TURBULENCE_WAKE * wakeShare(mastHeight, obstacleHeight);
  return Math.sqrt(TURBULENCE_OPEN * TURBULENCE_OPEN + wake * wake);
}

/** mulberry32: a small seeded generator, deterministic across platforms. */
export class Rng {
  private a: number;
  private spare: number | null = null;
  constructor(seed: number) {
    this.a = seed >>> 0;
  }
  next(): number {
    this.a = (this.a + 0x6d2b79f5) >>> 0;
    let t = this.a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Standard normal deviate (Box-Muller). */
  normal(): number {
    if (this.spare !== null) {
      const s = this.spare;
      this.spare = null;
      return s;
    }
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    const r = Math.sqrt(-2 * Math.log(u));
    this.spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  }
}

/** An Ornstein-Uhlenbeck process on a fixed grid, unit variance, read by linear interpolation. */
class GridOu {
  private i = 0;
  private x0: number;
  private x1: number;
  private readonly phi: number;
  private readonly sigma: number;
  constructor(
    private rng: Rng,
    private dt: number,
    tau: number,
    start: number | null,
  ) {
    this.phi = Math.exp(-dt / tau);
    this.sigma = Math.sqrt(1 - this.phi * this.phi);
    this.x0 = start ?? rng.normal();
    this.x1 = this.step(this.x0);
  }
  private step(x: number): number {
    return this.phi * x + this.sigma * this.rng.normal();
  }
  at(t: number): number {
    const n = Math.max(0, Math.floor(t / this.dt));
    while (this.i < n) {
      this.x0 = this.x1;
      this.x1 = this.step(this.x0);
      this.i++;
    }
    const f = clamp(t / this.dt - this.i, 0, 1);
    return this.x0 + (this.x1 - this.x0) * f;
  }
}

/** Grid step of the gust process, s of fast time. */
const GUST_DT = 0.1;
/** Correlation times of the two parts of the gust process, s, and the share of the variance of the slow one. estimate. */
const GUST_TAU_SLOW = 10;
const GUST_TAU_FAST = 1.5;
const GUST_SLOW_SHARE = 0.75;

/** Unit-variance turbulence: a slow swell (10 s) and quicker puffs (1.5 s). Read at increasing times. */
export class GustProcess {
  private slow: GridOu;
  private fast: GridOu;
  constructor(seed: number) {
    const rng = new Rng(seed);
    this.slow = new GridOu(rng, GUST_DT, GUST_TAU_SLOW, null);
    this.fast = new GridOu(rng, GUST_DT, GUST_TAU_FAST, null);
  }
  at(t: number): number {
    return Math.sqrt(GUST_SLOW_SHARE) * this.slow.at(t) + Math.sqrt(1 - GUST_SLOW_SHARE) * this.fast.at(t);
  }
}

/** Grid step of the weather process, simulated s, and its correlation time. estimate: a weather system lasts hours. */
const WEATHER_DT = 600;
const WEATHER_TAU = 4 * 3600;

/**
 * The hour-to-hour mean wind as a multiple of the site mean. A Gaussian process mapped through the Weibull quantile
 * function: the marginal distribution is exactly Weibull(k) (so the yearly yield of `yearlyYield` is what the long run
 * of the live view converges to), and it starts at the mean.
 */
export class WeatherProcess {
  private ou: GridOu;
  constructor(seed: number, k: number) {
    const rng = new Rng(seed ^ 0x9e3779b9);
    // start where the multiplier is exactly 1: (−ln(1−q))^(1/k) = Γ(1 + 1/k)
    const q0 = 1 - Math.exp(-Math.pow(gamma(1 + 1 / k), k));
    this.ou = new GridOu(rng, WEATHER_DT, WEATHER_TAU, normalQuantile(q0));
  }
  /** Multiple of the site mean at simulated time t (s), for a Weibull shape k. */
  factor(t: number, k: number): number {
    const q = clamp(normalCdf(this.ou.at(t)), 1e-9, 1 - 1e-9);
    return Math.pow(-Math.log(1 - q), 1 / k) / gamma(1 + 1 / k);
  }
}

/** Nodes and weights of the 5-point Gauss-Hermite rule for a standard normal variable (probabilists' convention). */
export const GAUSS_NODES = [-2.856970013872805, -1.355626179974266, 0, 1.355626179974266, 2.856970013872805];
export const GAUSS_WEIGHTS = [
  0.01125741132772, 0.222075922005613, 0.533333333333333, 0.222075922005613, 0.01125741132772,
];
