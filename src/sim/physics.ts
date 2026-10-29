import { cableResistance } from '@onigam/lab-kit/sim/electric';
import { ATMOSPHERE_SCALE_HEIGHT, RHO_SEA } from './machine';

// Pure formulas of the lab, all SI. Nothing here knows about the machine's state: it is the arithmetic of research §2
// (K14-K17, K21) that the tests check against the sources.

/** Betz limit 16/27 = 0.593 (K15, S8). */
export const BETZ = 16 / 27;

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const rpmToRad = (rpm: number): number => (rpm * 2 * Math.PI) / 60;
export const radToRpm = (w: number): number => (w * 60) / (2 * Math.PI);

/** Air density at an altitude, kg/m³: 1.23 at sea level (S3), falling with the scale height of the atmosphere. */
export function airDensity(altitude: number): number {
  return RHO_SEA * Math.exp(-altitude / ATMOSPHERE_SCALE_HEIGHT);
}

/** Swept area of a rotor of diameter D, m². */
export function sweptArea(diameter: number): number {
  return (Math.PI * diameter * diameter) / 4;
}

/** Power in the wind through the rotor disc: ½ρAv³, W (K14: 696 W at 10 m/s for D = 1.2 m). */
export function windPower(v: number, diameter: number, rho = RHO_SEA): number {
  return 0.5 * rho * sweptArea(diameter) * v * v * v;
}

/** Tip speed ratio λ = ω·R / v. */
export function tipSpeedRatio(omega: number, v: number, diameter: number): number {
  return (omega * diameter) / 2 / v;
}

/** Rotor speed in rpm that gives a tip speed ratio at a wind speed: rpm = v·λ·60 / (πD) (K16: 334 rpm for 3 m/s, λ = 7, D = 1.2 m). */
export function rpmAtTipSpeedRatio(lambda: number, v: number, diameter: number): number {
  return (v * lambda * 60) / (Math.PI * diameter);
}

/** The maker's rule of thumb for the power of the blades, W: 0.15·D²·v³ (K17; S4 p. 9). */
export function bladePowerRule(diameter: number, v: number): number {
  return 0.15 * diameter * diameter * v * v * v;
}

/**
 * Share of the generated power lost in the cable (K21, S4 p. 38): the battery receives `batteryPower` at `volts`,
 * the current flows through the round trip of the cable, loss = I²R, and the share is taken of the power generated
 * (delivered + lost). Hand check: 500 W, 12 V, 6 mm², 30 m one way → 41.7 A, 304 W lost, 37.8 %.
 */
export function cableLossShare(batteryPower: number, volts: number, lengthOneWay: number, section: number): number {
  const current = batteryPower / volts;
  const loss = current * current * cableResistance(lengthOneWay, section);
  return loss / (batteryPower + loss);
}

/** Gamma function (Lanczos approximation, g = 7), for the mean of the Weibull distribution. */
export function gamma(x: number): number {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const y = x - 1;
  let a = c[0];
  const t = y + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (y + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, y + 0.5) * Math.exp(-t) * a;
}

/** Scale parameter c (m/s) of the Weibull distribution with a given mean and shape k: mean = c·Γ(1 + 1/k). */
export function weibullScale(mean: number, k: number): number {
  return mean / gamma(1 + 1 / k);
}

/** Weibull probability density, per m/s. k = 2 is the Rayleigh case. */
export function weibullPdf(v: number, c: number, k: number): number {
  if (v <= 0) return 0;
  return (k / c) * Math.pow(v / c, k - 1) * Math.exp(-Math.pow(v / c, k));
}

/** Weibull cumulative distribution: share of the time the wind is below v. */
export function weibullCdf(v: number, c: number, k: number): number {
  return v <= 0 ? 0 : 1 - Math.exp(-Math.pow(v / c, k));
}

/** Weibull quantile: the wind speed that is exceeded a share 1 − q of the time. */
export function weibullQuantile(q: number, c: number, k: number): number {
  return c * Math.pow(-Math.log(1 - clamp(q, 0, 1 - 1e-12)), 1 / k);
}

/** Standard normal cumulative distribution (Abramowitz-Stegun 7.1.26 for the error function, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Inverse of the standard normal distribution (Acklam's rational approximation, relative error < 1.2e-9). */
export function normalQuantile(p: number): number {
  const q = clamp(p, 1e-12, 1 - 1e-12);
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239,
  ];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968,
    2.938163982698783,
  ];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (q < low) {
    const s = Math.sqrt(-2 * Math.log(q));
    return (
      (((((c[0] * s + c[1]) * s + c[2]) * s + c[3]) * s + c[4]) * s + c[5]) /
      ((((d[0] * s + d[1]) * s + d[2]) * s + d[3]) * s + 1)
    );
  }
  if (q > 1 - low) {
    const s = Math.sqrt(-2 * Math.log(1 - q));
    return (
      -(((((c[0] * s + c[1]) * s + c[2]) * s + c[3]) * s + c[4]) * s + c[5]) /
      ((((d[0] * s + d[1]) * s + d[2]) * s + d[3]) * s + 1)
    );
  }
  const s = q - 0.5;
  const r = s * s;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * s) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}
