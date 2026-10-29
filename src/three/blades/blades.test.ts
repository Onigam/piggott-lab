import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { partIds } from '../../part-ids';
import { BLADE, HUB_DISC } from '../dims';
import { bladeGeometry, profile, sectionAt, sectionOutline } from './geometry';
import { createBladesScene } from './scene';
import { finiteTree, floating, isolateOne, sceneBoxes, stateWith, view, worldBox } from '../test-utils';

// The `blades` world by script: ids, the geometry of the carved blade against the plans, floating and buried parts, explode,
// NaN-free animation.

const IDS = partIds('blades');

describe('blade geometry', () => {
  const g = bladeGeometry();
  const pos = g.attributes.position;
  it('follows the six stations of the plans', () => {
    BLADE.stationRadius.forEach((r, i) => {
      const s = sectionAt(r);
      expect(s.width).toBeCloseTo(BLADE.stationWidth[i], 6);
      expect(s.thickness).toBeCloseTo(BLADE.stationThickness[i], 6);
      if (i > 0) expect(s.drop).toBeCloseTo(BLADE.stationDrop[i], 6);
    });
    // chord 153 -> 55 mm, thickness 22 -> 6 mm from the first carved section to the tip
    expect(sectionAt(0.6).width).toBeCloseTo(0.055, 6);
    expect(sectionAt(0.2).thickness).toBeCloseTo(0.022, 6);
  });
  it('is 600 mm long, flat-faced in front of the root plane and tapered on the trailing side', () => {
    const box = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
    expect(box.min.y).toBeCloseTo(0, 6);
    expect(box.max.y).toBeCloseTo(BLADE.length, 6);
    // the leading edge is the straight edge of the plank: z = +76.5 mm at every radius
    expect(box.max.z).toBeCloseTo(BLADE.rootWidth / 2, 6);
    expect(box.min.x).toBeCloseTo(-BLADE.rootThickness, 6);
    expect(box.max.x).toBeLessThanOrEqual(1e-9); // never behind the plane of the roots
  });
  it("twists: the trailing edge drops downwind by the plans' drop at each station", () => {
    // at the first carved station the lowest point behind the leading edge is `drop` further downwind
    const byRow = (r: number) => {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < pos.count; i++)
        if (Math.abs(pos.getY(i) - r) < 1e-6) {
          lo = Math.min(lo, pos.getX(i));
          hi = Math.max(hi, pos.getX(i));
        }
      return [lo, hi];
    };
    expect(byRow(0.2)[0]).toBeCloseTo(-BLADE.rootThickness, 6);
    // the flat face runs from x = -49 mm at the leading edge to -49 + 45 mm at the trailing edge
    let teX = -Infinity;
    for (let i = 0; i < pos.count; i++)
      if (Math.abs(pos.getY(i) - 0.2) < 1e-6 && pos.getZ(i) < -0.07) teX = Math.max(teX, pos.getX(i));
    expect(teX).toBeCloseTo(-BLADE.rootThickness + BLADE.stationDrop[1], 6);
  });
  it('has outward normals (a sample of triangles points away from its section)', () => {
    const nor = g.attributes.normal;
    let bad = 0;
    let n = 0;
    for (let t = 0; t < pos.count; t += 3) {
      const c = new THREE.Vector3();
      const nn = new THREE.Vector3();
      for (let k = 0; k < 3; k++) {
        c.add(new THREE.Vector3(pos.getX(t + k), pos.getY(t + k), pos.getZ(t + k)));
        nn.add(new THREE.Vector3(nor.getX(t + k), nor.getY(t + k), nor.getZ(t + k)));
      }
      c.divideScalar(3);
      if (nn.lengthSq() < 1e-9 || c.y < 0.12) continue; // the carved part (the root is a block, checked by the box test)
      // centre of the section at this radius: halfway across the width, in the middle of the thickness
      const s = sectionAt(c.y);
      const centre = new THREE.Vector3(
        -BLADE.rootThickness + s.drop / 2 + s.thickness / 3,
        c.y,
        BLADE.rootWidth / 2 - s.width / 2,
      );
      const out = c.clone().sub(centre);
      out.y = 0;
      n++;
      if (out.dot(nn.normalize()) < -1e-6) bad++;
    }
    expect(n).toBeGreaterThan(500);
    expect(bad / n).toBeLessThan(0.02);
  });
  it('has a section whose thickest point is at 30 % of the chord, blocks at the root', () => {
    expect(profile(BLADE.camberPoint, 1)).toBeCloseTo(1, 9);
    expect(profile(0.9, 1)).toBeLessThan(0.5);
    expect(profile(0.5, 0)).toBe(1);
    const o = sectionOutline(3);
    expect(Math.max(...o.map((p) => p[1]))).toBeCloseTo(BLADE.stationThickness[3], 3);
  });
});

describe('blades world', () => {
  const mod = createBladesScene();
  const reg = mod.registry;

  it('registers exactly the frozen ids, each with meshes of its own', () => {
    expect([...reg.ids()].sort()).toEqual([...IDS].sort());
    for (const id of IDS) expect(reg.get(id)!.meshes.length, id).toBeGreaterThan(0);
  });

  it('has hotspots for every part and minor labels for the faces, the root and the tip of the blade', () => {
    mod.scene.updateMatrixWorld(true);
    const ids = mod.hotspots.map((h) => h.partId);
    for (const id of IDS) expect(ids).toContain(id);
    expect(mod.hotspots.filter((h) => h.minor).map((h) => h.partId)).toEqual([
      'hub-disc',
      'blade',
      'blade',
      'blade',
      'blade',
    ]);
    expect(mod.hotspots.filter((h) => !h.minor)).toHaveLength(3);
    for (const h of mod.hotspots) {
      let o: THREE.Object3D | null = h.anchor;
      while (o && o !== mod.scene) o = o.parent;
      expect(o, h.label.en).toBe(mod.scene);
    }
  });

  it('has three blades 120° apart clamped between the plywood disc and the triangle', () => {
    mod.scene.updateMatrixWorld(true);
    const b = reg.bounds('blade');
    // radius 600 mm in the plane of the table, thickness of the roots above the post
    expect(Math.max(b.max.x, -b.min.x, b.max.z, -b.min.z)).toBeCloseTo(BLADE.length, 2);
    expect(b.max.y - b.min.y).toBeCloseTo(BLADE.rootThickness, 2);
    const hub = reg.bounds('hub-disc');
    const disc = worldBox(reg.get('hub-disc')!.meshes.find((m) => m.name !== 'triangle')!);
    expect(disc.max.x - disc.min.x).toBeCloseTo(HUB_DISC.diameter, 3);
    expect(hub.max.y - hub.min.y).toBeCloseTo(HUB_DISC.thickness * 2 + BLADE.rootThickness, 3);
    // the three blades are the same piece turned by 120°: the box is nearly symmetric
    expect(b.max.z + b.min.z).toBeLessThan(0.12);
  });

  it('has no floating part: everything stands on the table, the post or another part', () => {
    const boxes = sceneBoxes(mod);
    const post = new THREE.Box3(new THREE.Vector3(-0.3, 0, -0.3), new THREE.Vector3(0.3, 0.35, 0.3));
    const bad = floating(boxes, 0.002, [
      post,
      new THREE.Box3(new THREE.Vector3(-3, -0.01, -3), new THREE.Vector3(3, 0.002, 3)),
    ]);
    expect(bad).toEqual([]);
    for (const [id, box] of boxes) expect(box.min.y, id).toBeGreaterThanOrEqual(-0.002);
  });

  it('explodes along the axis in the order of assembly: disc, blades, triangle, nothing crossing', () => {
    for (const id of IDS) expect(reg.get(id)!.explode.length(), id).toBeGreaterThan(0);
    reg.setAllFactors(1);
    mod.scene.updateMatrixWorld(true);
    const parts = reg.get('hub-disc')!.meshes;
    const triangle = parts.find((m) => m.name === 'triangle')!;
    const disc = parts.find((m) => m !== triangle)!;
    const tb = worldBox(triangle);
    const db = worldBox(disc);
    const bb = reg.bounds('blade');
    expect(bb.min.y).toBeGreaterThan(db.max.y + 0.05);
    expect(tb.min.y).toBeGreaterThan(bb.max.y + 0.05);
    reg.setAllFactors(0);
    mod.scene.updateMatrixWorld(true);
    expect(worldBox(triangle).min.y).toBeCloseTo(0.35 + HUB_DISC.thickness + BLADE.rootThickness, 3);
  });

  it('animates and isolates without NaN', () => {
    for (const s of [stateWith(), stateWith({ rotorAngle: 6.2, rotorBlur: 1, diameter: 4.2, yaw: 85 })]) {
      for (let i = 0; i < 5; i++) mod.update(s, 1 / 60, view({ cutaway: true, schematic: true }));
      expect(finiteTree(mod.scene)).toBe(true);
    }
    for (const id of IDS) {
      for (const mode of ['hidden', 'ghost'] as const) {
        isolateOne(reg, id, mode);
        expect(reg.get(id)!.meshes.every((m) => m.visible)).toBe(true);
        for (const other of IDS)
          if (other !== id) expect(reg.get(other)!.meshes.every((m) => m.visible === (mode === 'ghost'))).toBe(true);
      }
    }
    reg.setAllDisplay('solid');
  });
});
