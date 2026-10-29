import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { partIds } from '../../part-ids';
import { HEAD, TAIL, tailPivot } from '../dims';
import { finiteTree, floating, isolateOne, sceneBoxes, stateWith, view, worldBox } from '../test-utils';
import { EXPLODE } from './model';
import { FLOOR_Y, createTurbineScene } from './scene';

// The `turbine` world by script: ids, the machine standing on its mast, yaw about the vertical axis and the swing of the tail about its
// inclined hinge (the tail stays attached to the boom and the boom to the frame), furling, section, explode, NaN-free animation.

const IDS = partIds('turbine');
const DEG = Math.PI / 180;

/** Vertices of a part's meshes in world space. */
function vertices(o: THREE.Object3D): THREE.Vector3[] {
  o.updateWorldMatrix(true, true);
  const out: THREE.Vector3[] = [];
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh || m.userData.cap) return;
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      out.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld));
  });
  return out;
}

describe('turbine world', () => {
  const mod = createTurbineScene();
  const reg = mod.registry;
  const head = mod.model;
  const rest = (over = {}) => {
    for (let i = 0; i < 400; i++) mod.update(stateWith({ yaw: 0, tailSwing: 0, ...over }), 1 / 60, view());
    mod.scene.updateMatrixWorld(true);
  };

  it('registers exactly the eight frozen ids, each with meshes of its own', () => {
    expect([...reg.ids()].sort()).toEqual([...IDS].sort());
    for (const id of IDS) expect(reg.get(id)!.meshes.length, id).toBeGreaterThan(0);
  });

  it('has hotspots for every part; the rotor and the alternator open their worlds', () => {
    expect(mod.hotspots.map((h) => h.partId).sort()).toEqual([...IDS].sort());
    expect(mod.hotspots.find((h) => h.partId === 'rotor')!.goto).toBe('blades');
    expect(mod.hotspots.find((h) => h.partId === 'alternator')!.goto).toBe('alternator');
    expect(mod.hotspots.filter((h) => !h.minor).map((h) => h.partId)).toEqual([
      'rotor',
      'alternator',
      'yaw-bearing',
      'tail-vane',
    ]);
    mod.scene.updateMatrixWorld(true);
    for (const h of mod.hotspots) {
      let o: THREE.Object3D | null = h.anchor;
      while (o && o !== mod.scene) o = o.parent;
      expect(o, h.partId).toBe(mod.scene);
    }
  });

  it('has no floating part: every part touches another, the bench block holds the mast piece', () => {
    rest();
    const block = new THREE.Box3(new THREE.Vector3(-1, FLOOR_Y - 0.01, -1), new THREE.Vector3(1, FLOOR_Y + 0.11, 1));
    expect(floating(sceneBoxes(mod), 0.002, [block])).toEqual([]);
    for (const [id, b] of sceneBoxes(mod)) expect(b.min.y, id).toBeGreaterThanOrEqual(FLOOR_Y - 0.002);
  });

  it('offsets the axle 41 mm from the yaw axis and puts the rotor on the axle', () => {
    rest();
    expect(head.alt.root.position.z).toBeCloseTo(HEAD.offset, 9);
    expect(head.rotor.root.position.z).toBeCloseTo(HEAD.offset, 9);
    const stub = reg.bounds('yaw-bearing');
    expect((stub.min.x + stub.max.x) / 2).toBeCloseTo(0, 3);
    expect((stub.min.z + stub.max.z) / 2).toBeCloseTo(0, 3);
  });

  it('turns the whole head about the vertical yaw axis and leaves the mast where it is', () => {
    rest();
    const mast = reg.bounds('yaw-bearing').clone();
    const frameBefore = vertices(reg.get('nacelle-frame')!.object);
    rest({ yaw: 40 });
    const frameAfter = vertices(reg.get('nacelle-frame')!.object);
    expect(reg.bounds('yaw-bearing').min.toArray()).toEqual(mast.min.toArray());
    // rotation of +40° about +Y: x' = x cos + z sin, z' = -x sin + z cos; heights unchanged, distance to the axis unchanged
    const c = Math.cos(40 * DEG);
    const s = Math.sin(40 * DEG);
    for (let i = 0; i < frameBefore.length; i += 7) {
      const p = frameBefore[i];
      const q = frameAfter[i];
      expect(q.y).toBeCloseTo(p.y, 6);
      expect(q.x).toBeCloseTo(p.x * c + p.z * s, 5);
      expect(q.z).toBeCloseTo(-p.x * s + p.z * c, 5);
    }
  });

  it('swings the tail about its inclined hinge: attached to the hinge, rigid, rising, nearly parallel to the rotor plane when furled', () => {
    rest();
    const P = new THREE.Vector3(...tailPivot());
    const hingeBox = reg.bounds('tail-hinge').clone();
    const frameBox = reg.bounds('nacelle-frame').clone();
    const boom0 = vertices(reg.get('tail-boom')!.object);
    const vane0 = vertices(reg.get('tail-vane')!.object);
    const far = (vs: THREE.Vector3[]) => vs.reduce((a, v) => (v.distanceTo(P) > a.distanceTo(P) ? v : a));
    const end0 = far(boom0);
    const gap = (a: THREE.Vector3[], b: THREE.Vector3[]) => {
      let d = Infinity;
      for (let i = 0; i < a.length; i += 3) for (let j = 0; j < b.length; j++) d = Math.min(d, a[i].distanceTo(b[j]));
      return d;
    };
    const gap0 = gap(boom0, vane0);
    expect(gap0).toBeLessThan(0.002); // the vane stands on the T-bar at the end of the boom
    expect(boom0.some((v) => v.distanceTo(P) < TAIL.sleeveOuter / 2 + 0.01)).toBe(true);

    rest({ tailSwing: TAIL.swingDeg });
    const boom1 = vertices(reg.get('tail-boom')!.object);
    const vane1 = vertices(reg.get('tail-vane')!.object);
    const end1 = far(boom1);
    // rigid about the hinge point: the end of the boom stays as far from it, the vane keeps its distance to the boom
    expect(end1.distanceTo(P)).toBeCloseTo(end0.distanceTo(P), 6);
    expect(gap(boom1, vane1)).toBeCloseTo(gap0, 6);
    // the frame and the fixed half of the hinge did not move
    expect(reg.bounds('tail-hinge').min.toArray()).toEqual(hingeBox.min.toArray());
    expect(reg.bounds('nacelle-frame').max.toArray()).toEqual(frameBox.max.toArray());
    // direction: the boom turns from 10° to the axle towards +Z, rises, ends nearly parallel to the rotor plane (normal X)
    const d0 = end0.clone().sub(P).normalize();
    const d1 = end1.clone().sub(P).normalize();
    expect((Math.atan2(d0.z, d0.x) * 180) / Math.PI).toBeCloseTo(10, 0);
    expect(Math.abs((Math.atan2(d1.z, d1.x) * 180) / Math.PI - 104)).toBeLessThan(8); // the farthest vertex is a corner of the T-bar
    expect(d1.y).toBeGreaterThan(d0.y + 0.3);
  });

  it('furls like the sources say: the tail is downwind of the machine, which has turned 85° away', () => {
    rest({ yaw: 85, tailSwing: TAIL.swingDeg });
    const P = new THREE.Vector3(...tailPivot());
    P.applyAxisAngle(new THREE.Vector3(0, 1, 0), 85 * DEG);
    const end = vertices(reg.get('tail-vane')!.object).reduce((a, v) => (v.distanceTo(P) > a.distanceTo(P) ? v : a));
    const dir = end.clone().sub(P);
    dir.y = 0;
    // the wind blows towards +X: the tail points along it, within 25°
    expect((Math.acos(dir.normalize().x) * 180) / Math.PI).toBeLessThan(25);
    // and the rotor plane is now nearly parallel to the wind: its normal (the axle) is 85° from the wind
    const axle = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), 85 * DEG);
    expect((Math.acos(Math.abs(axle.x)) * 180) / Math.PI).toBeGreaterThan(80);
    rest();
  });

  it('turns the rotor with rotorAngle and shows the blur disc with rotorBlur, outside every part', () => {
    mod.update(stateWith({ rotorAngle: 1.3, rotorBlur: 0 }), 1 / 60, view());
    expect(head.rotor.spin.rotation.x).toBeCloseTo(1.3, 9);
    expect(head.rotor.blur.visible).toBe(false);
    mod.update(stateWith({ rotorAngle: 2.0, rotorBlur: 0.8 }), 1 / 60, view());
    expect(head.rotor.blur.visible).toBe(true);
    expect(head.rotor.blurMaterial.opacity).toBeGreaterThan(0.3);
    expect(reg.get('rotor')!.meshes).not.toContain(head.rotor.blur);
    expect(head.rotor.blur.userData.ownerPart).toBe('rotor');
    reg.setDisplay('rotor', 'ghost');
    mod.update(stateWith({ rotorBlur: 1 }), 1 / 60, view());
    expect(head.rotor.blur.visible).toBe(false);
    reg.setDisplay('rotor', 'solid');
  });

  it('cuts the alternator in its axial plane, with the head standing still, and its caps belong to the part `alternator`', () => {
    for (let i = 0; i < 300; i++) mod.update(stateWith({ yaw: 40, tailSwing: 60 }), 1 / 60, view({ cutaway: true }));
    expect(head.pose.yaw).toBeCloseTo(0, 2);
    expect(head.pose.swing).toBeCloseTo(0, 2);
    const caps: THREE.Mesh[] = [];
    mod.scene.traverse((o) => o.userData.cap && caps.push(o as THREE.Mesh));
    expect(caps.length).toBeGreaterThan(5);
    for (const c of caps) {
      expect(c.userData.ownerPart).toBe('alternator');
      expect(c.visible).toBe(true);
    }
    reg.setDisplay('alternator', 'ghost');
    mod.update(stateWith(), 1 / 60, view({ cutaway: true }));
    for (const c of caps) expect(c.visible).toBe(false);
    reg.setDisplay('alternator', 'solid');
    rest();
  });

  it('explodes each part along its own path, in the order of disassembly', () => {
    rest();
    const before = sceneBoxes(mod);
    for (const id of IDS) expect(reg.get(id)!.explode.length(), id).toBeGreaterThan(0);
    reg.setAllFactors(1);
    for (let i = 0; i < 300; i++) mod.update(stateWith({ yaw: 0, tailSwing: 0 }), 1 / 60, view());
    const after = sceneBoxes(mod);
    reg.setAllFactors(0);
    for (const id of IDS) {
      const e = EXPLODE[id as keyof typeof EXPLODE];
      const d = after.get(id)!.min.clone().sub(before.get(id)!.min);
      expect(d.x, id).toBeCloseTo(e[0], 6);
      expect(d.y, id).toBeCloseTo(e[1], 6);
      expect(d.z, id).toBeCloseTo(e[2], 6);
    }
    // blades off the rods first, then the alternator off the angle iron: clear of each other along the axle
    expect(after.get('rotor')!.max.x).toBeLessThan(after.get('alternator')!.min.x);
    // the frame lifts off the stub; the tail's sleeve slides up its pipe far enough to leave it (the pipe is 150 mm, the sleeve 130 mm)
    expect(after.get('nacelle-frame')!.min.y).toBeGreaterThan(after.get('yaw-bearing')!.max.y);
    const along = (id: string) => new THREE.Vector3(...EXPLODE[id as keyof typeof EXPLODE]);
    const slide = along('tail-boom').sub(along('tail-hinge'));
    expect(slide.length()).toBeGreaterThan(TAIL.sleeveLength);
    expect(slide.normalize().dot(new THREE.Vector3(...tailPivot()).set(0, 1, 0))).toBeGreaterThan(0.9);
    rest();
  });

  it('animates the whole range of the state and isolates every part without NaN', () => {
    const cases = [
      stateWith({ yaw: 0, tailSwing: 0, furled: 0 }),
      stateWith({ yaw: 85, tailSwing: 95, furled: 1, rotorBlur: 1, rotorAngle: 6.28, runaway: true, overspeed: true }),
      stateWith({ yaw: 5, tailSwing: 0.2, rotorBlur: 0.5, diameter: 1, mastHeight: 3 }),
      stateWith({ yaw: 90, tailSwing: 115, diameter: 4.2, mastHeight: 24, rotorAngle: 100 }),
    ];
    for (const s of cases)
      for (const v of [{}, { cutaway: true }, { schematic: true }, { slowMo: 0.02 }]) {
        for (let i = 0; i < 3; i++) mod.update(s, 1 / 60, view(v));
        expect(finiteTree(mod.scene)).toBe(true);
        for (const id of IDS) expect(Number.isFinite(reg.bounds(id).min.x), id).toBe(true);
      }
    for (const id of IDS)
      for (const mode of ['hidden', 'ghost'] as const) {
        isolateOne(reg, id, mode);
        for (let i = 0; i < 3; i++) mod.update(stateWith({ yaw: 30, tailSwing: 40 }), 1 / 60, view({ cutaway: true }));
        expect(reg.get(id)!.meshes.every((m) => m.visible)).toBe(true);
      }
    reg.setAllDisplay('solid');
    expect(worldBox(mod.scene).isEmpty()).toBe(false);
  });
});
