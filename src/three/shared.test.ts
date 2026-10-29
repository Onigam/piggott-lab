import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { lazyBuilder } from '@onigam/lab-kit/three';
import { partIds } from '../part-ids';
import { createAlternatorModel } from './alternator/model';
import { createAlternatorScene } from './alternator/scene';
import { createRotorModel } from './blades/rotor';
import { createBladesScene } from './blades/scene';
import {
  createAlternatorScene as lazyAlternator,
  createBladesScene as lazyBlades,
  createTurbineScene as lazyTurbine,
} from './index';
import { MERGE } from './merge';
import { createHead } from './turbine/model';

// What the parent and the child worlds share (the same pieces built with the same code), the effect of merging, the lazy worlds.

const triangles = (o: THREE.Object3D): number => {
  let n = 0;
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh && !m.userData.cap)
      n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
  });
  return n;
};
const box = (o: THREE.Object3D, origin: THREE.Vector3) => {
  o.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(o, true).translate(origin.clone().negate());
};

describe('shared pieces', () => {
  it('draws the same alternator in the turbine and in the alternator world: same parts, same boxes, same triangles', () => {
    const head = createHead({ detail: 'full' });
    const world = createAlternatorScene().model;
    head.head.updateMatrixWorld(true);
    world.root.updateMatrixWorld(true);
    const shared = Object.keys(world.parts).filter((id) => id !== 'moulds' && id !== 'air-gap');
    expect(Object.keys(head.alt.parts).sort()).toEqual([...shared].sort());
    for (const id of shared) {
      const a = box(head.alt.parts[id], head.alt.root.position);
      const b = box(world.parts[id], world.root.position);
      expect(
        a.min.toArray().map((v) => +v.toFixed(7)),
        id,
      ).toEqual(b.min.toArray().map((v) => +v.toFixed(7)));
      expect(
        a.max.toArray().map((v) => +v.toFixed(7)),
        id,
      ).toEqual(b.max.toArray().map((v) => +v.toFixed(7)));
      expect(triangles(head.alt.parts[id]), id).toBe(triangles(world.parts[id]));
    }
    // the gauge and the moulds are tools of the workshop: not in the machine
    expect(head.alt.parts['air-gap']).toBeUndefined();
    expect(head.alt.parts.moulds).toBeUndefined();
  });

  it('draws the same rotor in the turbine and in the blades world: the same blades and the same plywood', () => {
    const a = createHead({ detail: 'full' }).rotor;
    const b = createBladesScene().model;
    const c = createRotorModel('full');
    for (const [x, y] of [
      [a, b],
      [a, c],
    ] as const) {
      expect(triangles(x.blades)).toBe(triangles(y.blades));
      expect(triangles(x.hub)).toBe(triangles(y.hub));
      const pa = (x.blades.children[0] as THREE.Mesh).geometry.attributes.position.array;
      const pb = (y.blades.children[0] as THREE.Mesh).geometry.attributes.position.array;
      expect(Array.from(pa)).toEqual(Array.from(pb));
    }
  });

  it('merges static meshes into few draw calls without changing the picture', () => {
    const build = (merge: boolean) => {
      MERGE.enabled = merge;
      try {
        return createAlternatorModel({ moulds: { floorY: -0.34 } });
      } finally {
        MERGE.enabled = true;
      }
    };
    const plain = build(false);
    const merged = build(true);
    const count = (o: THREE.Object3D) => {
      let n = 0;
      o.traverse((c) => (c as THREE.Mesh).isMesh && n++);
      return n;
    };
    expect(count(merged.root)).toBeLessThan(count(plain.root) / 3);
    for (const id of Object.keys(plain.parts)) {
      expect(triangles(merged.parts[id]), id).toBe(triangles(plain.parts[id]));
      const a = box(merged.parts[id], new THREE.Vector3());
      const b = box(plain.parts[id], new THREE.Vector3());
      expect(a.min.distanceTo(b.min), id).toBeLessThan(1e-6);
      expect(a.max.distanceTo(b.max), id).toBeLessThan(1e-6);
    }
  });
});

describe('lazy worlds', () => {
  it('builds the turbine, alternator and blades worlds at their first use, with the frozen ids', () => {
    for (const [make, id, world] of [
      [lazyTurbine, 'turbine', 'turbine'],
      [lazyAlternator, 'alternator', 'alternator'],
      [lazyBlades, 'blades', 'blades'],
    ] as const) {
      const mod = make();
      expect(lazyBuilder(mod)).toBeTypeOf('function');
      expect(mod.id).toBe(id);
      expect([...mod.registry.ids()].sort()).toEqual([...partIds(world)].sort());
      expect(mod.hotspots.length).toBeGreaterThan(0);
      expect(mod.minDistance).toBeLessThan(mod.maxDistance);
    }
  });
});
