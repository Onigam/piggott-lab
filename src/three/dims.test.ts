import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import * as MACHINE from '../sim/machine';
import * as DIMS from './dims';

// The single source of dimensions: finite and positive, equal to the numbers of src/sim/machine.ts where both know one, and the
// reported figures of the sources.

describe('dimensions', () => {
  const SIGNED = new Set([
    'STACK.magnetFace',
    'STACK.magnetBack',
    'STACK.discFront',
    'STACK.plateFront',
    'STACK.axleFront',
    'STACK.rodBack',
    'STACK.rodFront',
    'STACK.bladeOrigin',
    'STACK.bladeFront',
    'STACK.statorRodFront',
    'HEAD.statorX',
    'HEAD.beamZ0',
    'HEAD_Y.beamTop',
    'HEAD_Y.beamBottom',
    'HEAD_Y.pipeBottom',
    'HEAD_Y.capTop',
    'TAIL.hingeZ',
    'DEVICES.brakeSwitch.x',
    'DEVICES.rectifier.x',
    'DEVICES.fuse.x',
    'DEVICES.battery.x',
    'DEVICES.battery.z',
    'DEVICES.monitor.x',
  ]);
  const walk = (obj: Record<string, unknown>, path: string, out: string[]) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = `${path}.${k}`;
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) out.push(`${name} is not finite`);
        else if (v <= 0 && !SIGNED.has(name) && v !== 0) out.push(`${name} = ${v} is not positive`);
      } else if (Array.isArray(v)) v.forEach((x, i) => !Number.isFinite(x) && out.push(`${name}[${i}] is not finite`));
      else if (v && typeof v === 'object') walk(v as Record<string, unknown>, name, out);
    }
  };

  it('exports finite numbers, positive except the signed positions of the frames', () => {
    const out: string[] = [];
    for (const [name, v] of Object.entries(DIMS))
      if (v && typeof v === 'object') walk(v as Record<string, unknown>, name, out);
    expect(out).toEqual([]);
  });

  it('agrees with src/sim/machine.ts on every number both know', () => {
    expect(DIMS.BLADE.count).toBe(MACHINE.BLADE_COUNT);
    expect(DIMS.BLADE.length * 2).toBe(MACHINE.DIAMETER_REF);
    expect(DIMS.MAGNET.count).toBe(MACHINE.MAGNETS_PER_DISC);
    expect(DIMS.MAGNET.length).toBe(MACHINE.COIL_HOLE_LENGTH);
    expect(DIMS.MAGNET.width).toBe(MACHINE.COIL_HOLE_WIDTH);
    expect(DIMS.STATOR.coilCount).toBe(MACHINE.COIL_COUNT);
    expect(DIMS.STATOR.outer).toBe(MACHINE.STATOR_OUTER);
    expect(DIMS.STATOR.thickness).toBe(MACHINE.COIL_FORMER);
    expect(DIMS.STATOR.coilOutlineLength).toBe(MACHINE.COIL_OUTLINE_LENGTH);
    expect(DIMS.STATOR.coilOutlineWidth).toBe(MACHINE.COIL_OUTLINE_WIDTH);
    expect(DIMS.HEAD.offset).toBe(MACHINE.OFFSET_REF);
    expect(DIMS.TAIL.tiltDeg).toBe(MACHINE.HINGE_TILT_DEG);
    expect(DIMS.TAIL.restDeg).toBe(MACHINE.TAIL_REST_DEG);
    expect(DIMS.TAIL.swingDeg).toBe(MACHINE.TAIL_SWING_DEG);
    expect(DIMS.mastRadius(MACHINE.DIAMETER_REF) * 2).toBeCloseTo(DIMS.MAST.pipeOuter, 9);
  });

  it('quotes the reported figures of the sources', () => {
    // blade stations (S4 p. 43), root block, magnets, disc, stator, rods, nacelle, tail
    expect(DIMS.BLADE.stationWidth).toEqual([0.153, 0.153, 0.1, 0.08, 0.065, 0.055]);
    expect(DIMS.BLADE.stationDrop).toEqual([0, 0.045, 0.019, 0.01, 0.006, 0.003]);
    expect(DIMS.BLADE.stationThickness).toEqual([0.049, 0.022, 0.014, 0.01, 0.008, 0.006]);
    expect(DIMS.BLADE.rootAngleDeg).toBe(120);
    expect(DIMS.ROTOR_DISC.diameter).toBe(0.23);
    expect(DIMS.ROTOR_DISC.thickness).toBe(0.006);
    expect(DIMS.ROTOR_DISC.castingDiameter).toBe(0.24);
    expect(DIMS.MAGNET.thickness).toBe(0.01);
    expect(DIMS.AIR_GAP).toBe(0.001);
    expect(DIMS.STATOR_RODS.count).toBe(3);
    expect(DIMS.STATOR_RODS.length).toBe(0.07);
    expect(DIMS.ROTOR_RODS.count * DIMS.ROTOR_RODS.nutsPerRod).toBe(16);
    expect(DIMS.ROTOR_RODS.length).toBe(0.14);
    expect(DIMS.CRADLE.diameter).toBe(0.14);
    expect(DIMS.CRADLE.thickness).toBe(0.008);
    expect(DIMS.NACELLE.length).toBe(0.206);
    expect(DIMS.YAW.pipeOuter).toBe(0.0422);
    expect(DIMS.TAIL.boomOuter).toBe(0.0334);
    expect(DIMS.TAIL.vaneLength * DIMS.TAIL.vaneHeight).toBeCloseTo(0.135, 9);
    expect(DIMS.HUB_DISC.thickness).toBe(0.009);
    expect(DIMS.HUB_DISC.diameter).toBe(0.2);
  });

  it('derives the pitch of the stations from the plans (17° at the first carved section, 3° at the tip)', () => {
    expect((DIMS.bladePitch(0) * 180) / Math.PI).toBe(0);
    expect((DIMS.bladePitch(1) * 180) / Math.PI).toBeCloseTo(16.4, 1);
    expect((DIMS.bladePitch(5) * 180) / Math.PI).toBeCloseTo(3.1, 1);
  });

  it('stacks the alternator without overlap: stator, gap, magnets, disc, plate, rods and nuts', () => {
    const S = DIMS.STACK;
    expect(S.magnetFace + S.statorHalf).toBeCloseTo(-DIMS.AIR_GAP, 9);
    expect(S.magnetBack).toBeCloseTo(S.magnetFace - DIMS.MAGNET.thickness, 9);
    expect(S.discFront).toBeCloseTo(S.magnetBack - DIMS.ROTOR_DISC.thickness, 9);
    expect(S.plateFront).toBeCloseTo(S.discFront - DIMS.HUB.plateThickness, 9);
    // the barrel of the hub ends before the housing flange, which ends on the cradle
    expect(S.barrelBack).toBeLessThan(S.housingFront);
    expect(S.housingFront).toBeLessThan(S.cradleFront);
    // the 140 mm rods: from the nut cast in the rotor to the tip, 14.5 mm beyond the last nut of the blade assembly
    const lastNut = S.bladeFront - DIMS.M12.washerThickness - 2 * DIMS.M12.nutThickness;
    expect(S.rodBack - S.rodFront).toBeCloseTo(DIMS.ROTOR_RODS.length, 9);
    expect(lastNut - S.rodFront).toBeGreaterThan(0.01);
    expect(lastNut - S.rodFront).toBeLessThan(0.02);
    // the 70 mm stator rods: flush with the front face of the stator, through the cradle, past the rear nut
    const rearNut = S.cradleBack + DIMS.M12.washerThickness + DIMS.M12.nutThickness;
    expect(S.statorRodBack).toBeGreaterThan(rearNut);
    expect(S.statorRodBack - rearNut).toBeLessThan(0.01);
  });

  it('puts the hinge of the tail where the sources say: 20° from the vertical, 55° in plan, the tail rising as it swings', () => {
    const u = new THREE.Vector3(...DIMS.tailAxis());
    expect(u.length()).toBeCloseTo(1, 9);
    expect((Math.acos(u.y) * 180) / Math.PI).toBeCloseTo(20, 6);
    expect((Math.atan2(-u.z, u.x) * 180) / Math.PI).toBeCloseTo(55, 6);
    const b0 = new THREE.Vector3(...DIMS.tailRestDirection());
    expect((Math.atan2(b0.z, b0.x) * 180) / Math.PI).toBeCloseTo(10, 6); // 80° to the rotor plane
    // swinging by φ turns the boom by -φ about the axis: it ends nearly parallel to the rotor plane, higher than it started
    const furled = b0.clone().applyAxisAngle(u, (-DIMS.TAIL.swingDeg * Math.PI) / 180);
    expect(Math.abs(90 - (Math.atan2(furled.z, furled.x) * 180) / Math.PI)).toBeLessThan(20);
    expect(furled.z).toBeGreaterThan(0.8);
    expect(furled.y).toBeGreaterThan(b0.y + 0.3);
    // the weight brings it back: the height only grows over the whole swing
    let prev = b0.y;
    for (let a = 5; a <= DIMS.TAIL.swingDeg; a += 5) {
      const y = b0.clone().applyAxisAngle(u, (-a * Math.PI) / 180).y;
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = y;
    }
  });

  it('keeps the 41 mm offset between the yaw axis and the axle, and the yaw pipe under the angle iron', () => {
    expect(DIMS.HEAD.offset).toBe(0.041);
    const beam = [
      DIMS.HEAD.statorX + DIMS.STACK.cradleBack,
      DIMS.HEAD.statorX + DIMS.STACK.cradleBack + DIMS.NACELLE.length,
    ];
    expect(beam[0]).toBeLessThan(-DIMS.YAW.pipeOuter / 2);
    expect(beam[1]).toBeGreaterThan(DIMS.YAW.pipeOuter / 2);
  });
});
