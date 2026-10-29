import * as THREE from 'three';
import type { PartRegistry, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { PiggottSim } from '../sim/engine';
import type { PiggottState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, bounding boxes of the registered parts.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation after a second of running; `over` overrides fields (extreme poses, ranges). */
export function stateWith(over: Partial<PiggottState> = {}): PiggottState {
  const sim = new PiggottSim();
  for (let i = 0; i < 60; i++) sim.step(1 / 60);
  return { ...sim.state, ...over };
}

export const sceneBoxes = (mod: SceneModule<PiggottState>): Map<string, THREE.Box3> => {
  mod.scene.updateMatrixWorld(true);
  const out = new Map<string, THREE.Box3>();
  for (const id of mod.registry.ids()) out.set(id, mod.registry.bounds(id));
  return out;
};

export const touches = (a: THREE.Box3, b: THREE.Box3, tol: number): boolean =>
  a.clone().expandByScalar(tol).intersectsBox(b);

/** Parts whose box touches no other part's box (nor any extra support box) within `tol`. */
export function floating(boxes: Map<string, THREE.Box3>, tol: number, supports: THREE.Box3[] = []): string[] {
  const bad: string[] = [];
  for (const [id, box] of boxes) {
    const other = [...boxes].some(([oid, ob]) => oid !== id && touches(box, ob, tol));
    if (!other && !supports.some((s) => touches(box, s, tol))) bad.push(id);
  }
  return bad;
}

/** True when every object of the tree has finite transforms. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m && !Number.isFinite(m.array[0])) ok = false;
  });
  return ok;
}

export const worldBox = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o, true);

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}
