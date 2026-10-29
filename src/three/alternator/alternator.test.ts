import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { partIds } from '../../part-ids';
import { AIR_GAP, HUB, MAGNET, ROTOR_DISC, STACK, STATOR } from '../dims';
import { finiteTree, floating, isolateOne, sceneBoxes, stateWith, view, worldBox } from '../test-utils';
import { AXIS_HEIGHT, EXPLODE } from './model';
import { createAlternatorScene } from './scene';

// The `alternator` world by script: ids, the single magnet rotor, the 1 mm gap, what turns and what never turns, the section, the
// explode (every part slides off along its own path, in the order it comes off), NaN-free animation.

const IDS = partIds('alternator');

describe('alternator world', () => {
  const mod = createAlternatorScene();
  const reg = mod.registry;
  const closed = () => {
    reg.setAllFactors(0);
    return sceneBoxes(mod);
  };

  it('registers exactly the ten frozen ids (one magnet rotor), each with meshes of its own', () => {
    expect([...reg.ids()].sort()).toEqual([...IDS].sort());
    expect(IDS).toHaveLength(10);
    for (const id of IDS) expect(reg.get(id)!.meshes.length, id).toBeGreaterThan(0);
  });

  it('has hotspots for every part, three main labels, each anchored in the scene', () => {
    mod.scene.updateMatrixWorld(true);
    expect(mod.hotspots.map((h) => h.partId).sort()).toEqual([...IDS].sort());
    expect(mod.hotspots.filter((h) => !h.minor).map((h) => h.partId)).toEqual([
      'magnet-rotor',
      'stator',
      'bearing-hub',
    ]);
    for (const h of mod.hotspots) {
      let o: THREE.Object3D | null = h.anchor;
      while (o && o !== mod.scene) o = o.parent;
      expect(o, h.partId).toBe(mod.scene);
    }
  });

  it('has no floating part: each part touches another, the holder under the cradle or the bench', () => {
    const boxes = closed();
    const support = [
      worldBox(mod.stand),
      new THREE.Box3(new THREE.Vector3(-3, -AXIS_HEIGHT - 0.01, -3), new THREE.Vector3(3, -AXIS_HEIGHT + 0.002, 3)),
    ];
    expect(floating(boxes, 0.002, support)).toEqual([]);
    for (const [id, b] of boxes) expect(b.min.y, id).toBeGreaterThanOrEqual(-AXIS_HEIGHT - 0.002);
  });

  it('keeps the air gap of 1 mm between the magnets and the stator, and one disc of 8 magnets', () => {
    const boxes = closed();
    expect(boxes.get('stator')!.min.x - boxes.get('magnets')!.max.x).toBeCloseTo(AIR_GAP, 6);
    expect(boxes.get('magnet-rotor')!.max.x).toBeCloseTo(STACK.magnetFace, 6);
    // 8 boxes of 24 vertices
    let vertices = 0;
    reg.get('magnets')!.meshes.forEach((m) => (vertices += m.geometry.attributes.position.count));
    expect(vertices).toBe(MAGNET.count * 24);
    expect(reg.get('magnet-rotor-front')).toBeUndefined();
    const b = boxes.get('magnet-rotor')!;
    expect(b.max.y - b.min.y).toBeCloseTo(ROTOR_DISC.castingDiameter, 3);
  });

  it('lets the barrel of the hub through the rotor and the stator without touching them', () => {
    expect(HUB.barrelDiameter / 2).toBeLessThan(ROTOR_DISC.centreHole / 2);
    expect(HUB.barrelDiameter / 2).toBeLessThan(STATOR.holeRadius);
    const b = closed().get('bearing-hub')!;
    expect(b.min.x).toBeLessThan(STACK.rodFront + 1e-6);
    expect(b.max.x).toBeCloseTo(STACK.barrelBack, 6);
  });

  it('turns only the hub with its rods, the rotor and the magnets; the axle, stator, coils, wiring and stator rods never turn', () => {
    expect(mod.model.spins.map((s) => s.name).sort()).toEqual([
      'bearing-hub-spin',
      'magnet-rotor-spin',
      'magnets-spin',
    ]);
    const still = ['shaft', 'stator', 'coils', 'star-wiring', 'studs', 'air-gap'];
    const snap = () => still.map((id) => reg.bounds(id).min.toArray().concat(reg.bounds(id).max.toArray()));
    mod.update(stateWith({ rotorAngle: 0 }), 1 / 60, view());
    mod.scene.updateMatrixWorld(true);
    const a = snap();
    mod.update(stateWith({ rotorAngle: 1.0 }), 1 / 60, view());
    mod.scene.updateMatrixWorld(true);
    const b = snap();
    b.forEach((row, i) => row.forEach((v, j) => expect(v, still[i]).toBeCloseTo(a[i][j], 9)));
    for (const s of mod.model.spins) expect(s.rotation.x).toBeCloseTo(1.0, 9);
    // the castle nut on the axle is in the hub part but does not turn
    const fixed = reg.get('bearing-hub')!.object.getObjectByName('bearing-hub-fixed')!;
    expect(fixed.parent?.name).toBe('bearing-hub');
    expect(fixed.rotation.x).toBe(0);
    mod.update(stateWith({ rotorAngle: 0 }), 1 / 60, view());
  });

  it('draws the section on the axial plane: caps for the cut parts, the discs stopped on a magnet, caps follow the display', () => {
    mod.update(stateWith({ rotorAngle: 0.3 }), 1 / 60, view({ cutaway: true }));
    for (const s of mod.model.spins) expect((s.rotation.x / (Math.PI / 4)) % 1, 'parked on a magnet').toBeCloseTo(0, 9);
    const caps: THREE.Mesh[] = [];
    mod.scene.traverse((o) => o.userData.cap && caps.push(o as THREE.Mesh));
    const owners = new Set(caps.map((c) => c.userData.ownerPart));
    for (const id of ['shaft', 'stator', 'coils', 'studs', 'bearing-hub', 'magnet-rotor', 'magnets'])
      expect(owners.has(id), id).toBe(true);
    for (const c of caps) expect(c.visible).toBe(true);
    reg.setDisplay('stator', 'ghost');
    mod.update(stateWith(), 1 / 60, view({ cutaway: true }));
    for (const c of caps) expect(c.visible, c.userData.ownerPart).toBe(c.userData.ownerPart !== 'stator');
    reg.setDisplay('stator', 'solid');
    mod.update(stateWith(), 1 / 60, view({ cutaway: false }));
    for (const c of caps) expect(c.visible).toBe(false);
  });

  it('explodes every part along its own insertion path, in the order it comes off, without crossing a neighbour', () => {
    const before = closed();
    for (const id of IDS) expect(reg.get(id)!.explode.length(), id).toBeGreaterThan(0);
    reg.setAllFactors(1);
    const after = sceneBoxes(mod);
    reg.setAllFactors(0);
    for (const id of IDS) {
      const e = EXPLODE[id as keyof typeof EXPLODE];
      const d = after.get(id)!.min.clone().sub(before.get(id)!.min);
      expect(d.x, id).toBeCloseTo(e[0], 9);
      expect(d.y, id).toBeCloseTo(e[1], 9);
      expect(d.z, id).toBeCloseTo(e[2], 9);
    }
    // the chain on the axle, front to rear: hub, rotor, magnets, coils, stator, cradle: each one clear of the next by 10 mm or more
    const chain = ['bearing-hub', 'magnet-rotor', 'magnets', 'coils', 'stator'] as const;
    for (let i = 0; i < chain.length - 1; i++)
      expect(after.get(chain[i])!.max.x + 0.01, `${chain[i]} before ${chain[i + 1]}`).toBeLessThan(
        after.get(chain[i + 1])!.min.x,
      );
    expect(after.get('stator')!.max.x).toBeLessThan(after.get('shaft')!.min.x);
    // the axle with its cradle goes back; the stator takes its rods with it (cast in), so they stay in the same place relative to it
    expect(after.get('shaft')!.min.x).toBeGreaterThan(before.get('shaft')!.min.x);
    expect(after.get('studs')!.min.x - after.get('stator')!.min.x).toBeCloseTo(
      before.get('studs')!.min.x - before.get('stator')!.min.x,
      9,
    );
  });

  it('animates and isolates every part without NaN', () => {
    const cases = [stateWith(), stateWith({ rotorAngle: 6.2, rotorBlur: 1, diameter: 4.2, yaw: 85, tailSwing: 95 })];
    for (const s of cases)
      for (const v of [{}, { cutaway: true }, { schematic: true }, { slowMo: 0.02, cutaway: true }]) {
        for (let i = 0; i < 3; i++) mod.update(s, 1 / 60, view(v));
        expect(finiteTree(mod.scene)).toBe(true);
      }
    for (const id of IDS)
      for (const mode of ['hidden', 'ghost'] as const) {
        isolateOne(reg, id, mode);
        mod.update(stateWith(), 1 / 60, view({ cutaway: true }));
        expect(reg.get(id)!.meshes.every((m) => m.visible)).toBe(true);
        expect(Number.isFinite(reg.bounds(id).min.x)).toBe(true);
      }
    reg.setAllDisplay('solid');
  });
});
