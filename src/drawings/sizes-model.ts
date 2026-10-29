// The seven rotor diameters of the family on one power chart (docs/research.md K3, §9): the simulation's battery power against the
// wind speed, computed once on first use. The sizes are ONE parameter of the model (the diameter), not seven machines: the
// alternator and the tail follow the scaling rules of docs/physics.md §1.8, and the cable section follows the swept area so that
// every size keeps the cable losses of the 1.2 m machine (the same rule as src/sim/steady.test.ts, K18).
import { buildConfig } from '../sim/config';
import { DIAMETER_REF } from '../sim/machine';
import { presetParams } from '../sim/presets';
import { nameplate, powerCurve, windGrid } from '../sim/yield';

/** Rotor diameters of the Tripalium family, m (K3). */
export const SIZES = [1.0, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2] as const;

export interface SizeCurve {
  diameter: number;
  /** The label scaled with the swept area: 200 W × (D / 1.2)², W. The wind speed of the rating is not given (K2, K19). */
  label: number;
  /** Wind speeds, m/s, and the model's battery power at each, W. */
  winds: number[];
  power: number[];
  /** Model power at 12 m/s, W, and the best power over the range with its wind speed. */
  at12: number;
  peak: number;
  peakWind: number;
}

/** Cable cross-section of a size, mm²: 10 mm² at 1.2 m, scaled with the swept area. */
export const cableSection = (diameter: number): number =>
  presetParams('hamlet').cableSection * (diameter / DIAMETER_REF) ** 2;

let cache: SizeCurve[] | null = null;

/** The seven curves, computed on first call (the hamlet site, a reference battery at mid charge, 15 m of cable). */
export function sizeCurves(): SizeCurve[] {
  if (cache) return cache;
  const winds = windGrid(25, 0.5);
  const base = presetParams('hamlet');
  cache = SIZES.map((diameter) => {
    const cfg = buildConfig({ ...base, diameter, cableSection: cableSection(diameter) });
    const power = powerCurve(cfg, winds).map((p) => p.busPower);
    const peak = Math.max(...power);
    return {
      diameter,
      label: nameplate(diameter),
      winds,
      power,
      at12: power[winds.indexOf(12)]!,
      peak,
      peakWind: winds[power.indexOf(peak)]!,
    };
  });
  return cache;
}

/** The model's battery power at one wind speed for any diameter (same site, same cable rule): used for the published sizes that are not in the family. */
export function modelPower(diameter: number, wind: number): number {
  const cfg = buildConfig({ ...presetParams('hamlet'), diameter, cableSection: cableSection(diameter) });
  return powerCurve(cfg, [wind])[0]!.busPower;
}
