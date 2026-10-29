import { describe, expect, it } from 'vitest';
import { cableResistance } from '@onigam/lab-kit/sim/electric';
import {
  BATTERY_HIGH_VOLTS,
  BATTERY_LOW_VOLTS,
  COIL_COUNT,
  DIAMETER_REF,
  KE_LL_REF,
  MAGNETS_PER_DISC,
  OFFSET_24,
  OFFSET_REF,
  RHO_SEA,
} from './machine';
import {
  airDensity,
  BETZ,
  bladePowerRule,
  cableLossShare,
  gamma,
  normalCdf,
  normalQuantile,
  rpmAtTipSpeedRatio,
  sweptArea,
  weibullCdf,
  weibullQuantile,
  weibullScale,
  windPower,
} from './physics';
import { buildConfig } from './config';
import { presetParams } from './presets';

// The arithmetic of the sources (research §2), checked against the figures themselves. Each name carries its K-number:
// a failing test points at the source figure it was written for.

describe('K14: power in the wind', () => {
  it('K14: the swept area of a 1.2 m rotor is 1.131 m²', () => {
    expect(sweptArea(1.2)).toBeCloseTo(1.131, 3);
  });
  it('K14: 0.70 W at 1 m/s (S3)', () => {
    expect(windPower(1, 1.2)).toBeCloseTo(0.7, 1);
  });
  it('K14: 696 W at 10 m/s, within 1 %', () => {
    expect(Math.abs(windPower(10, 1.2) / 696 - 1)).toBeLessThan(0.01);
  });
  it('K14: the density of the sources is the default (1.23 kg/m³) and falls with the altitude', () => {
    expect(airDensity(0)).toBe(RHO_SEA);
    expect(RHO_SEA).toBe(1.23);
    expect(airDensity(1000)).toBeLessThan(airDensity(0));
    expect(airDensity(1000)).toBeCloseTo(1.09, 1);
  });
  it('K14: the cube of the speed — twice the wind is eight times the power (S4 p. 9)', () => {
    expect(windPower(10, 1.2) / windPower(5, 1.2)).toBeCloseTo(8, 6);
  });
  it('K14: four times the power for twice the diameter (S4 p. 9)', () => {
    expect(windPower(8, 2.4) / windPower(8, 1.2)).toBeCloseTo(4, 6);
  });
});

describe('K15-K17: blades', () => {
  it('K15: the Betz limit is 16/27 = 0.593 (S8)', () => {
    expect(BETZ).toBeCloseTo(0.593, 3);
  });
  it('K16: 334 rpm for a 1.2 m rotor at tip speed ratio 7 in a 3 m/s wind', () => {
    expect(rpmAtTipSpeedRatio(7, 3, 1.2)).toBeCloseTo(334, 0);
  });
  it('K16: S4 worked example, 2.4 m at 3 m/s and tip speed ratio 7 is 167 rpm', () => {
    expect(rpmAtTipSpeedRatio(7, 3, 2.4)).toBeCloseTo(167, 0);
  });
  it('K17: the rule of thumb 0.15·D²·v³ gives 216 W for 1.2 m at 10 m/s', () => {
    expect(bladePowerRule(1.2, 10)).toBeCloseTo(216, 6);
  });
  it('K17: S4 example, 900 W (864 W unrounded) for 2.4 m at 10 m/s', () => {
    expect(bladePowerRule(2.4, 10)).toBeCloseTo(864, 6);
    expect(Math.abs(bladePowerRule(2.4, 10) / 900 - 1)).toBeLessThan(0.05);
  });
  it('K15/K17: the rule corresponds to a power coefficient of 0.31, inside the 25-35 % of homebuilt blades', () => {
    const cp = bladePowerRule(1.2, 10) / windPower(10, 1.2);
    expect(cp).toBeGreaterThan(0.25);
    expect(cp).toBeLessThan(0.35);
    expect(cp).toBeCloseTo(0.31, 2);
  });
});

describe('K21: losses in the cable', () => {
  // S4 p. 38: 12 V and 500 W at the battery, percentages of the power generated
  it('K21: 38 % at 12 V, 6 mm², 30 m one way (hand check: 41.7 A, 304 W lost)', () => {
    const current = 500 / 12;
    expect(current).toBeCloseTo(41.67, 2);
    expect(current * current * cableResistance(30, 6)).toBeCloseTo(304, 0);
    expect(cableLossShare(500, 12, 30, 6)).toBeCloseTo(0.38, 2);
  });
  it('K21: 13 % at 24 V and 4 % at 48 V, same cable', () => {
    expect(cableLossShare(500, 24, 30, 6)).toBeCloseTo(0.13, 2);
    expect(cableLossShare(500, 48, 30, 6)).toBeCloseTo(0.04, 2);
  });
  it('K21: more entries of the same table (12 V 2.5 mm² 60 %; 12 V 10 mm² 27 %; 12 V 6 mm² 60 m 55 %; 48 V 25 mm² 90 m 3 %), to one point', () => {
    // the plans round to a whole percent, and use a resistivity a little higher for the thinnest wire (59.3 against 60 %)
    const within = (value: number, table: number) => Math.abs(value - table) < 0.01;
    expect(within(cableLossShare(500, 12, 30, 2.5), 0.6)).toBe(true);
    expect(within(cableLossShare(500, 12, 30, 10), 0.27)).toBe(true);
    expect(within(cableLossShare(500, 12, 60, 6), 0.55)).toBe(true);
    expect(within(cableLossShare(500, 48, 90, 25), 0.03)).toBe(true);
  });
  it('K21: at half the power the loss in proportion to the power delivered is exactly half (the plans say "one half")', () => {
    const lossPerWatt = (p: number) => (cableLossShare(p, 12, 30, 6) * p) / (1 - cableLossShare(p, 12, 30, 6)) / p;
    expect(lossPerWatt(250) / lossPerWatt(500)).toBeCloseTo(0.5, 6);
    // …and in proportion to the power generated it is a little more than half, because the generated power also falls
    expect(cableLossShare(250, 12, 30, 6) / cableLossShare(500, 12, 30, 6)).toBeLessThan(0.65);
  });
  it('K21: the cable resistance is the round trip, ρ·2L/S (0.0175 Ω·mm²/m)', () => {
    expect(cableResistance(30, 6)).toBeCloseTo(0.175, 6);
  });
});

describe('K22: battery limits', () => {
  it('K22: 11.5 V too low, 14 V too high', () => {
    expect(BATTERY_LOW_VOLTS).toBe(11.5);
    expect(BATTERY_HIGH_VOLTS).toBe(14);
  });
});

describe('K6-K10, K13: the machine of the sources', () => {
  it('K8: four magnets for three coils (8 : 6)', () => {
    expect(MAGNETS_PER_DISC / COIL_COUNT).toBeCloseTo(4 / 3, 6);
  });
  it('K10: the bench test constant is 1.9 V / (2π rad/s) = 0.302 V·s/rad, i.e. 0.0317 V per rpm', () => {
    expect(KE_LL_REF).toBeCloseTo(0.3024, 4);
    expect(KE_LL_REF * ((60 * 2 * Math.PI) / 60)).toBeCloseTo(1.9, 6);
    expect((KE_LL_REF * 2 * Math.PI) / 60).toBeCloseTo(0.0317, 4);
  });
  it('K13: alternator offset 41 mm (1.2 m) and 125 mm (2.4 m), a power law through the two', () => {
    const at = (d: number) => buildConfig({ ...presetParams('hamlet'), diameter: d }).offset;
    expect(at(1.2)).toBeCloseTo(OFFSET_REF, 6);
    expect(at(2.4)).toBeCloseTo(OFFSET_24, 6);
    expect(at(1.8)).toBeGreaterThan(OFFSET_REF);
    expect(at(1.8)).toBeLessThan(OFFSET_24);
  });
  it('K1: the reference diameter is 1.2 m', () => {
    expect(DIAMETER_REF).toBe(1.2);
  });
});

describe('numerical helpers', () => {
  it('Γ(1.5) = √π/2 and Γ(5) = 24', () => {
    expect(gamma(1.5)).toBeCloseTo(Math.sqrt(Math.PI) / 2, 8);
    expect(gamma(5)).toBeCloseTo(24, 6);
  });
  it('Weibull with k = 2 (Rayleigh): scale = mean / 0.8862, and the quantile inverts the distribution', () => {
    const c = weibullScale(5, 2);
    expect(c).toBeCloseTo(5.642, 3);
    expect(weibullCdf(weibullQuantile(0.3, c, 2), c, 2)).toBeCloseTo(0.3, 9);
    // the median of a Rayleigh wind is 0.939 of its mean
    expect(weibullQuantile(0.5, c, 2) / 5).toBeCloseTo(0.939, 3);
  });
  it('normal quantile and distribution are inverses', () => {
    for (const p of [0.001, 0.05, 0.3, 0.5, 0.8, 0.999]) expect(normalCdf(normalQuantile(p))).toBeCloseTo(p, 5);
  });
});
