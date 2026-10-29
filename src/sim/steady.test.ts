import { describe, expect, it } from 'vitest';
import { cutInOmega } from './alternator';
import { calibrateTailMass, furlingOnset } from './calibration';
import { buildConfig, type Config } from './config';
import { FURLING_SPEED, NAMEPLATE_REF, TAIL_MASS_REF } from './machine';
import { radToRpm } from './physics';
import { presetParams } from './presets';
import { operatingPoint, referenceBattery } from './steady';
import { windGrid, yearlyYield } from './yield';
import type { PiggottParams } from './types';

// The key figures of research §2 through the model: the steady-state machine in a steady wind. Tests that retrieve a
// source figure assert the figure. The two open puzzles (K19 and the winding resistance) are asserted as FINDINGS: the
// test records what the model finds, named so that a reader sees that the 200 W is not retrieved, never tuned.

const base = presetParams('hamlet');
const cfgOf = (patch: Partial<PiggottParams> = {}): Config => buildConfig({ ...base, ...patch });
const point = (cfg: Config, v: number, brake = false) => operatingPoint(cfg, referenceBattery(cfg), brake, v);
const speeds = windGrid(25, 0.25);
const curve = (cfg: Config) => speeds.map((v) => point(cfg, v));
const peak = (cfg: Config) => Math.max(...curve(cfg).map((p) => p.busPower));
const cutIn = (cfg: Config, watts = 1) => speeds.find((v) => point(cfg, v).busPower >= watts) ?? Infinity;

describe('K20: cut-in', () => {
  const cfg = cfgOf();
  it('K20: the first watt reaches the battery between 2.5 and 4 m/s', () => {
    const v = cutIn(cfg);
    expect(v).toBeGreaterThanOrEqual(2.5);
    expect(v).toBeLessThanOrEqual(4);
  });
  it('K20: the bridge starts to conduct into a 12.4 V battery at about 330 rpm (325 rpm in the model)', () => {
    const rpm = radToRpm(cutInOmega(cfg, 12.4));
    expect(rpm).toBeGreaterThan(300);
    expect(rpm).toBeLessThan(360);
  });
  it('K20: nothing flows below the cut-in speed, the rotor free-wheels', () => {
    const p = point(cfg, 2);
    expect(p.busPower).toBe(0);
    expect(p.dcCurrent).toBe(0);
  });
  it('K9/S5: fewer turns do not charge at low wind but give more at high wind', () => {
    const few = cfgOf({ turns: 46 });
    expect(cutIn(few)).toBeGreaterThan(cutIn(cfg) + 0.75);
    expect(point(few, 4).busPower).toBeLessThan(point(cfg, 4).busPower);
    expect(point({ ...few, fixedTail: true }, 12).busPower).toBeGreaterThan(
      point({ ...cfg, fixedTail: true }, 12).busPower,
    );
  });
  it('K9: more turns (the 24 V stator) charge at lower wind speed, but the rotor is held back harder', () => {
    const more = cfgOf({ turns: 152 });
    expect(radToRpm(cutInOmega(more, 12.4))).toBeLessThan(0.55 * radToRpm(cutInOmega(cfg, 12.4)));
    expect(point(more, 10).busPower).toBeLessThan(point(cfg, 10).busPower);
  });
});

describe('K12: furling', () => {
  const cfg = cfgOf();
  it('K12: the tail starts to lift between 8 and 12 m/s', () => {
    const v = furlingOnset(cfg);
    expect(v).toBeGreaterThan(8);
    expect(v).toBeLessThan(12);
  });
  it('K12: the weight of the tail is the one calibrated number — it finds 10 m/s and the stored constant is that weight', () => {
    expect(furlingOnset(cfg)).toBeCloseTo(FURLING_SPEED, 1);
    expect(Math.abs(calibrateTailMass() / TAIL_MASS_REF - 1)).toBeLessThan(0.01);
  });
  it('S4 p. 31: a heavier tail furls later, a lighter one earlier (about as the square root of the weight)', () => {
    const light = furlingOnset(cfgOf({ tailWeight: 0.6 }));
    const heavy = furlingOnset(cfgOf({ tailWeight: 1.8 }));
    expect(light).toBeLessThan(furlingOnset(cfg));
    expect(heavy).toBeGreaterThan(furlingOnset(cfg));
    expect(heavy / light).toBeGreaterThan(1.4);
    expect(heavy / light).toBeLessThan(2.1);
  });
  it('K12: the rotor turns progressively out of the wind: 5° on the stop, more than 40° at 16 m/s, never more than 85°', () => {
    expect((point(cfg, 5).yaw * 180) / Math.PI).toBeCloseTo(5, 1);
    expect((point(cfg, 16).yaw * 180) / Math.PI).toBeGreaterThan(40);
    expect((point(cfg, 35).yaw * 180) / Math.PI).toBeLessThanOrEqual(85);
    let last = 0;
    for (const v of [8, 10, 11, 12, 14, 16, 20, 25, 30]) {
      const yaw = point(cfg, v).yaw;
      expect(yaw).toBeGreaterThanOrEqual(last - 1e-9);
      last = yaw;
    }
  });
  it('K12: the thrust is held — it grows less than a fifth from 10 to 30 m/s while a fixed tail takes 15 times more', () => {
    const furled = point(cfg, 30).thrust / point(cfg, 10).thrust;
    expect(furled).toBeLessThan(1.2);
    const fixed = { ...cfg, fixedTail: true };
    expect(point(fixed, 30).thrust / point(fixed, 10).thrust).toBeGreaterThan(8);
  });
  it('K19: the power is flat after the furling: within 20 % of the peak from 12 to 25 m/s', () => {
    const top = peak(cfg);
    for (let v = 12; v <= 25; v += 1) {
      const p = point(cfg, v).busPower;
      expect(p).toBeGreaterThan(0.8 * top);
      expect(p).toBeLessThanOrEqual(top + 1e-9);
    }
  });
  it('the fixed tail has no furling and keeps its 5° of yaw', () => {
    const fixed = { ...cfg, fixedTail: true };
    expect(furlingOnset(fixed)).toBe(Infinity);
    expect(point(fixed, 20).yaw).toBeCloseTo((5 * Math.PI) / 180, 9);
  });
  it('a storm: with a fixed tail the alternator is overloaded (more than 20 A) and the tips pass 89 m/s; with the tail folding it is not', () => {
    const fixed = { ...cfg, fixedTail: true };
    const stormFixed = point(fixed, 25);
    expect(stormFixed.dcCurrent).toBeGreaterThan(20);
    expect(stormFixed.omega * fixed.radius).toBeGreaterThan(89);
    expect(stormFixed.copperLoss).toBeGreaterThan(500);
    const stormFurled = point(cfg, 25);
    expect(stormFurled.dcCurrent).toBeLessThan(20);
    expect(stormFurled.omega * cfg.radius).toBeLessThan(89);
    expect(stormFurled.copperLoss).toBeLessThan(0.1 * stormFixed.copperLoss);
  });
});

describe('K2/K19: the 200 W — an open puzzle, recorded as a finding', () => {
  const cfg = cfgOf();
  it('K19 FINDING: with the 76-turn winding the furling machine does not reach 200 W; its peak power at the battery is 50-100 W', () => {
    const top = peak(cfg);
    expect(top).toBeGreaterThan(50);
    expect(top).toBeLessThan(100);
    expect(top).toBeLessThan(NAMEPLATE_REF);
  });
  it('K19 FINDING: at 10 m/s and at 12 m/s the battery gets 40-60 W and 50-75 W (rotor 70-115 W)', () => {
    const p10 = point(cfg, 10);
    const p12 = point(cfg, 12);
    expect(p10.busPower).toBeGreaterThan(40);
    expect(p10.busPower).toBeLessThan(60);
    expect(p12.busPower).toBeGreaterThan(50);
    expect(p12.busPower).toBeLessThan(75);
    expect(p10.rotorPower).toBeGreaterThan(60);
    expect(p12.rotorPower).toBeLessThan(120);
  });
  it('K19 FINDING: the alternator holds the rotor down at a tip speed ratio of 2.4-2.9 at 10 m/s, in the stall, where Cp is 0.07-0.12 (S4 p. 38)', () => {
    const p = point(cfg, 10);
    expect(p.lambda).toBeGreaterThan(2.2);
    expect(p.lambda).toBeLessThan(3);
    expect(p.cp).toBeGreaterThan(0.07);
    expect(p.cp).toBeLessThan(0.13);
    expect(p.cp).toBeLessThan(0.5 * 0.3);
  });
  it('K19 FINDING: with a fixed tail the 200 W is reached only at about 19 m/s, and then the copper burns nearly as much as the battery gets', () => {
    const fixed = { ...cfg, fixedTail: true };
    const v200 = speeds.find((v) => point(fixed, v).busPower >= 200) ?? Infinity;
    expect(v200).toBeGreaterThan(17);
    expect(v200).toBeLessThan(22);
    expect(point(fixed, v200).copperLoss).toBeGreaterThan(0.8 * point(fixed, v200).busPower);
  });
  it('K19: a winding made for 12 m/s (30 turns) gives more than 200 W at 12 m/s without furling, but does not charge below 5 m/s', () => {
    const rewound = { ...cfgOf({ turns: 30 }), fixedTail: true };
    expect(point(rewound, 12).busPower).toBeGreaterThan(200);
    expect(cutIn(rewound)).toBeGreaterThan(5);
  });
  it('winding puzzle FINDING: the copper is not what limits the machine at its peak: the alternator is 75-85 % efficient at 12 m/s (copper 15-25 W)', () => {
    const p = point(cfg, 12);
    const eta = 1 - p.copperLoss / p.airGapPower;
    expect(eta).toBeGreaterThan(0.75);
    expect(eta).toBeLessThan(0.85);
    expect(p.copperLoss).toBeGreaterThan(15);
    expect(p.copperLoss).toBeLessThan(30);
  });
  it('winding puzzle: at 200 W and 14 V (14.3 A) the 0.37 Ω winding would burn 150 W, the research estimate (§2 check 4)', () => {
    const current = 200 / 14;
    expect(2 * cfg.rPhase * current * current).toBeGreaterThan(140);
    expect(2 * cfg.rPhase * current * current).toBeLessThan(160);
  });
});

describe('K18: the larger machines (diameter parameter)', () => {
  it('power scales with the swept area: 2.4 m gives 4 times the 1.2 m machine at the same wind, to 3 % (cable scaled with the current)', () => {
    const small = cfgOf({ cableLength: 15, cableSection: 10 });
    const large = cfgOf({ diameter: 2.4, cableLength: 15, cableSection: 40 });
    for (const v of [5, 8, 12]) {
      const ratio = point(large, v).busPower / point(small, v).busPower;
      expect(ratio).toBeGreaterThan(3.88);
      expect(ratio).toBeLessThan(4.12);
    }
  });
  it('the scaled alternators start charging at the same wind speed and the machines furl at the same wind speed', () => {
    for (const d of [1, 2.4, 4.2]) {
      const cfg = cfgOf({ diameter: d, cableSection: 10 * (d / 1.2) ** 2 });
      expect(cutIn(cfg)).toBeCloseTo(cutIn(cfgOf()), 0);
      expect(furlingOnset(cfg)).toBeCloseTo(10, 0);
    }
  });
  it('K18 FINDING: the 2.4 m machine gives 150-350 W at 12 m/s in the model, against the "about 500 W normally" of the plans', () => {
    const large = cfgOf({ diameter: 2.4, cableSection: 40 });
    const p = point(large, 12).busPower;
    expect(p).toBeGreaterThan(150);
    expect(p).toBeLessThan(350);
  });
  it('K18 FINDING: the 2 m and 4 m machines of S7 (500 W and 2 000 W at 12 m/s) get 130-230 W and 600-900 W', () => {
    const d2 = point(cfgOf({ diameter: 2, cableSection: 28 }), 12).busPower;
    const d4 = point(cfgOf({ diameter: 4, cableSection: 110 }), 12).busPower;
    expect(d2).toBeGreaterThan(130);
    expect(d2).toBeLessThan(230);
    expect(d4).toBeGreaterThan(600);
    expect(d4).toBeLessThan(900);
  });
});

describe('K25: yearly yield', () => {
  const open = (patch: Partial<PiggottParams>) => yearlyYield({ ...base, obstacleHeight: 0, ...patch });
  it('K25: the hamlet (5 m/s) and the windy plateau (7 m/s) lie inside the 113-340 kWh a year of 1.131 m² of rotor', () => {
    const hamlet = open({ meanWind: 5 });
    const plateau = open({ meanWind: 7 });
    expect(hamlet.energy).toBeGreaterThan(113);
    expect(hamlet.energy).toBeLessThan(340);
    expect(plateau.energy).toBeGreaterThan(113);
    expect(plateau.energy).toBeLessThan(340);
    expect(plateau.specific).toBeGreaterThan(100);
    expect(plateau.specific).toBeLessThan(300);
  });
  it('K25 FINDING: the calm valley (3.5 m/s at 10 m, 3 m/s at the hub in the trees) is below the bracket, as the plans say about low winds', () => {
    const calm = yearlyYield(presetParams('calm-valley'));
    expect(calm.energy).toBeLessThan(113);
    expect(calm.energy).toBeGreaterThan(20);
  });
  it('K25: the capacity factor against the 200 W of K2 is 5-15 % for the three sites (a sober figure), rising with the wind', () => {
    const cf = ['calm-valley', 'hamlet', 'windy-plateau'].map(
      (id) => yearlyYield(presetParams(id as 'hamlet')).capacityFactor,
    );
    expect(cf[0]).toBeLessThan(cf[1]);
    expect(cf[1]).toBeLessThan(cf[2]);
    expect(cf[1]).toBeGreaterThan(0.05);
    expect(cf[1]).toBeLessThan(0.15);
    expect(cf[2]).toBeLessThan(0.2);
  });
  it('K25: the same mean speed carries very different wind energy (shape 1.5 against 3: almost twice), but this machine hardly notices', () => {
    const spread = open({ weibullK: 1.5 });
    const narrow = open({ weibullK: 3 });
    expect(spread.windEnergy / narrow.windEnergy).toBeGreaterThan(1.8);
    // FINDING: held in the stall, the machine's power curve is nearly a straight line of the wind speed, not a cube
    expect(Math.abs(spread.energy / narrow.energy - 1)).toBeLessThan(0.25);
  });
  it('K24: the mast height matters: a 6 m mast among 8 m trees yields less than a third of an 18 m mast', () => {
    const low = yearlyYield({ ...base, mastHeight: 6, obstacleHeight: 8 });
    const high = yearlyYield({ ...base, mastHeight: 18, obstacleHeight: 8 });
    expect(low.energy / high.energy).toBeLessThan(0.35);
    expect(low.hubWind).toBeLessThan(high.hubWind);
  });
  it('the energy per bin adds up to the yearly energy and the hours to 8 760', () => {
    const y = open({});
    expect(y.bins.reduce((a, b) => a + b.energy, 0)).toBeCloseTo(y.energy, 6);
    expect(y.bins.reduce((a, b) => a + b.hours, 0)).toBeGreaterThan(8750);
    expect(y.bins.reduce((a, b) => a + b.hours, 0)).toBeLessThan(8760.1);
  });
  it('most of the hours are at low wind, most of the energy at higher wind than the most frequent bin', () => {
    const y = open({});
    const hourMode = y.bins.reduce((a, b) => (b.hours > a.hours ? b : a));
    const energyMode = y.bins.reduce((a, b) => (b.energy > a.energy ? b : a));
    expect(energyMode.wind).toBeGreaterThan(hourMode.wind);
  });
});

describe('energy conservation and the switches', () => {
  const cfg = cfgOf();
  it('the battery never gets more than the rotor gives, at any wind speed and any size', () => {
    for (const c of [
      cfg,
      cfgOf({ diameter: 2.4, cableSection: 40 }),
      cfgOf({ turns: 30 }),
      { ...cfg, fixedTail: true },
    ]) {
      for (const p of curve(c)) {
        expect(p.busPower).toBeLessThanOrEqual(p.rotorPower + 1e-9);
        expect(p.batteryPower).toBeLessThanOrEqual(p.busPower + 1e-9);
      }
    }
  });
  it('the books close: rotor power = friction + air gap; air gap = bus + copper + diodes + cable (to 1e-6)', () => {
    for (const p of curve(cfg)) {
      if (p.omega === 0) continue;
      expect(Math.abs(p.rotorPower - p.frictionLoss - p.airGapPower)).toBeLessThan(1e-4 * Math.max(1, p.rotorPower));
      expect(Math.abs(p.airGapPower - p.busPower - p.copperLoss - p.diodeLoss - p.cableLoss)).toBeLessThan(
        1e-6 * Math.max(1, p.airGapPower),
      );
    }
  });
  it('K22: the brake switch short-circuits the alternator, not the battery: no power to the battery, the rotor nearly stops', () => {
    const free = point(cfg, 8);
    const braked = point(cfg, 8, true);
    expect(braked.busPower).toBe(0);
    expect(braked.rpm).toBeLessThan(0.3 * free.rpm);
    expect(braked.dcCurrent).toBeGreaterThan(0);
    // the battery is isolated: its voltage is its own, and the short only heats the winding and the cable
    expect(braked.busVoltage).toBeCloseTo(12.35, 1);
    expect(braked.copperLoss + braked.diodeLoss + braked.cableLoss).toBeCloseTo(braked.airGapPower, 6);
  });
  it('S4 p. 36: shorted, the alternator can only turn slowly: under 200 rpm at 15 m/s, less than half the free speed', () => {
    expect(point(cfg, 15, true).rpm).toBeLessThan(200);
    expect(point(cfg, 15, true).rpm).toBeLessThan(0.5 * point(cfg, 15).rpm);
  });
  it('K22: with the battery disconnected the rotor runs away: no current, tips well above 40 m/s at 8 m/s, and the voltage is dangerous', () => {
    const open = operatingPoint(cfg, referenceBattery(cfg, false), false, 8);
    expect(open.dcCurrent).toBe(0);
    expect(open.busPower).toBe(0);
    expect(open.rpm).toBeGreaterThan(2.5 * point(cfg, 8).rpm);
    expect(open.omega * cfg.radius).toBeGreaterThan(40);
    expect(open.openCircuitVolts).toBeGreaterThan(40);
  });
  it('S4 p. 38: a little cable resistance lets the rotor run faster, so it loses less to the stall (thin cable raises the rotor power)', () => {
    const thin = cfgOf({ cableSection: 2.5, cableLength: 40 });
    expect(point(thin, 12).rotorPower).toBeGreaterThan(point(cfg, 12).rotorPower);
    expect(point(thin, 12).cableLoss).toBeGreaterThan(10 * point(cfg, 12).cableLoss);
  });
  it('K21 in the model: the cable loss is I²R of the round trip', () => {
    const thin = cfgOf({ cableSection: 2.5, cableLength: 40 });
    const p = point(thin, 12);
    expect(p.cableLoss).toBeCloseTo(p.dcCurrent ** 2 * ((0.0175 * 2 * 40) / 2.5), 9);
  });
  it('a calm day: no wind, nothing turns', () => {
    const p = point(cfg, 0);
    expect(p.rpm).toBe(0);
    expect(p.busPower).toBe(0);
  });
  it('the altitude lowers the density and the power in proportion', () => {
    const high = cfgOf({ altitude: 1500 });
    expect(point(high, 6).windPower / point(cfg, 6).windPower).toBeCloseTo(Math.exp(-1500 / 8500), 6);
  });
});
