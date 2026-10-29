import { describe, expect, it } from 'vitest';
import { emf, frequency } from './alternator';
import { buildConfig } from './config';
import {
  CP_MAX,
  LAMBDA_OPT,
  LAMBDA_RUNAWAY,
  MEAN_TURN_LENGTH,
  R_PHASE_REF,
  TIP_SPEED_LIMIT,
  WIRE_MASS_REF,
} from './machine';
import { BETZ, bladePowerRule, rpmToRad, windPower } from './physics';
import { presetParams } from './presets';
import { powerCoefficient, rotorTorque, thrustCoefficient, torqueCoefficient } from './rotor';

// The rotor curve and the alternator, against K10, K15, K16, K17 and K7.

const lambdas = Array.from({ length: 2001 }, (_, i) => i * 0.01);

describe('K15: power coefficient', () => {
  it('K15: Cp never exceeds the Betz limit 16/27 anywhere on 0 ≤ λ ≤ 20', () => {
    for (const l of lambdas) expect(powerCoefficient(l)).toBeLessThan(BETZ);
  });
  it('K15: the peak lies in the 25-35 % of homebuilt blades, at a tip speed ratio between 6 and 7.5', () => {
    let best = 0;
    let at = 0;
    for (const l of lambdas) {
      const cp = powerCoefficient(l);
      if (cp > best) {
        best = cp;
        at = l;
      }
    }
    expect(best).toBeGreaterThanOrEqual(0.25);
    expect(best).toBeLessThanOrEqual(0.35);
    expect(at).toBeGreaterThanOrEqual(6);
    expect(at).toBeLessThanOrEqual(7.5);
    expect(best).toBeCloseTo(CP_MAX, 3);
    expect(at).toBeCloseTo(LAMBDA_OPT, 1);
  });
  it('K16: the design tip speed ratio is 7 (S4 p. 9)', () => {
    expect(LAMBDA_OPT).toBe(7);
  });
  it('Cp is zero at standstill, falls to zero at the runaway tip speed ratio and stays there', () => {
    expect(powerCoefficient(0)).toBe(0);
    expect(powerCoefficient(LAMBDA_RUNAWAY)).toBeCloseTo(0, 9);
    expect(powerCoefficient(LAMBDA_RUNAWAY + 3)).toBe(0);
  });
  it('the stalled rotor has a starting torque, and Cp falls on both sides of the peak', () => {
    expect(torqueCoefficient(0)).toBeGreaterThan(0.02);
    expect(powerCoefficient(3)).toBeLessThan(powerCoefficient(5));
    expect(powerCoefficient(5)).toBeLessThan(powerCoefficient(7));
    expect(powerCoefficient(9)).toBeLessThan(powerCoefficient(7));
  });
  it('K15: the thrust coefficient never falls below Cp (an actuator disc takes more than it gives)', () => {
    for (const l of lambdas) expect(thrustCoefficient(l)).toBeGreaterThanOrEqual(powerCoefficient(l));
    expect(thrustCoefficient(100)).toBeLessThanOrEqual(8 / 9 + 1e-9);
  });
});

describe('K17: power of the blades', () => {
  it('K17: at the design tip speed ratio the blades give 0.15·D²·v³ within 20 % (1.2 m, 10 m/s)', () => {
    const v = 10;
    const d = 1.2;
    const omega = (LAMBDA_OPT * v) / (d / 2);
    const power = rotorTorque(omega, v, d, 1.23) * omega;
    expect(Math.abs(power / bladePowerRule(d, v) - 1)).toBeLessThan(0.2);
    // and it is Cp_max × the power in the wind
    expect(power / windPower(v, d)).toBeCloseTo(CP_MAX, 3);
  });
});

describe('K10 and K7: the alternator', () => {
  const cfg = buildConfig(presetParams('hamlet'));
  it('K10: 1.9 V between phases at 60 rpm', () => {
    expect(emf(cfg, rpmToRad(60))).toBeCloseTo(1.9, 6);
  });
  it('K10: the EMF is proportional to the speed (0.0317 V per rpm)', () => {
    expect(emf(cfg, rpmToRad(300)) / emf(cfg, rpmToRad(60))).toBeCloseTo(5, 9);
  });
  it('K10/K6: 8 poles give 4 Hz at 60 rpm (S4: Hz = rpm × poles / 120 for the number of poles)', () => {
    expect(frequency(cfg, rpmToRad(60))).toBeCloseTo((60 * 8) / 120, 9);
  });
  it('K7: the winding resistance derived from the stator drawing is 0.3-0.45 Ω per phase (research §2 check 4)', () => {
    expect(cfg.rPhase).toBe(R_PHASE_REF);
    expect(R_PHASE_REF).toBeGreaterThan(0.3);
    expect(R_PHASE_REF).toBeLessThan(0.45);
  });
  it('K7: the mean turn derived from the drawing is inside the 0.19-0.24 m of the research', () => {
    expect(MEAN_TURN_LENGTH).toBeGreaterThan(0.19);
    expect(MEAN_TURN_LENGTH).toBeLessThan(0.24);
  });
  it('K7: the wire mass of that winding is within 20 % of the reported "about 1.5 kg" (the geometry is a little short)', () => {
    expect(Math.abs(WIRE_MASS_REF / 1.5 - 1)).toBeLessThan(0.2);
  });
  it('K9: more turns, more volts and a quadratic rise of the resistance (the same winding window)', () => {
    const more = buildConfig({ ...presetParams('hamlet'), turns: 152 });
    expect(more.keLl / cfg.keLl).toBeCloseTo(2, 9);
    expect(more.rPhase / cfg.rPhase).toBeCloseTo(4, 9);
    // the wire is thinner: 1.4 mm / √2
    expect(more.wireDiameter).toBeCloseTo(1.4e-3 / Math.SQRT2, 9);
  });
  it('the tip speed limit is the 200 mph of S4 (89 m/s)', () => {
    expect(TIP_SPEED_LIMIT).toBeCloseTo(89.4, 0);
  });
});
