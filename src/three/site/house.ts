import * as THREE from 'three';
import { MAT, group, mesh } from '@onigam/lab-kit/three';
import { HOUSE } from '../dims';
import { tubeGeometry } from '../common';
import { dynamic, mergeStatic } from '../merge';

// The house the battery serves: stone walls, a slate roof, a chimney, windows whose panes glow when the house draws power. Frame:
// origin on the ground under the middle, +Z = south (the front, with the door). The supply cable (from the shed) is a tube given
// in world points and drawn in this frame.

export interface House {
  group: THREE.Group;
  /** Material of the panes: `emissiveIntensity` is animated (the registry may swap the mesh material, never this one). */
  panes: THREE.MeshStandardMaterial;
  /** World points of the supply cable are converted by this offset (the house stands at HOUSE.x, HOUSE.z). */
  anchor: THREE.Object3D;
}

export function buildHouse(supply: THREE.Vector3[]): House {
  const g = group('house');
  const L = HOUSE.length;
  const W = HOUSE.width;
  const Hh = HOUSE.wallHeight;
  const rise = HOUSE.ridgeRise;
  const walls = MAT.stone();
  const roof = MAT.slate();
  const wood = MAT.woodDark();
  g.add(mesh(new THREE.BoxGeometry(L + 0.4, 0.3, W + 0.4), MAT.concrete(), [0, 0.05, 0]));
  g.add(mesh(new THREE.BoxGeometry(L, Hh, W), walls, [0, 0.2 + Hh / 2, 0]));
  const gable = new THREE.Shape();
  gable.moveTo(-W / 2, 0);
  gable.lineTo(W / 2, 0);
  gable.lineTo(0, rise);
  gable.closePath();
  for (const sx of [-1, 1]) {
    const gm = mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.04, bevelEnabled: false }), walls);
    gm.rotation.y = Math.PI / 2;
    gm.position.set(sx * (L / 2 - 0.02), 0.2 + Hh, 0);
    g.add(gm);
  }
  const slope = Math.atan2(rise, W / 2);
  const slab = Math.hypot(W / 2, rise) + 0.4;
  for (const sz of [-1, 1]) {
    const s = mesh(new THREE.BoxGeometry(L + 0.7, 0.1, slab), roof);
    s.position.set(0, 0.2 + Hh + rise / 2 - 0.02, (sz * W) / 4 - sz * 0.1);
    s.rotation.x = sz * slope;
    g.add(s);
  }
  g.add(mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), walls, [L / 2 - 1.5, 0.2 + Hh + rise * 0.75, -W / 4]));
  // windows (south and north) and the door
  const panes = new THREE.MeshStandardMaterial({
    color: 0x8aa0b4,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xffc46b,
    emissiveIntensity: 0,
  });
  const frame = MAT.woodLight();
  const window = (x: number, z: number, dir: number) => {
    g.add(mesh(new THREE.BoxGeometry(1.1, 1.3, 0.08), frame, [x, 0.2 + 1.5, z + dir * 0.02]));
    const p = mesh(new THREE.BoxGeometry(0.94, 1.14, 0.06), panes, [x, 0.2 + 1.5, z + dir * 0.05]);
    p.castShadow = false;
    dynamic(p);
    g.add(p);
  };
  for (const x of [-L / 2 + 1.5, -L / 2 + 3.7, L / 2 - 1.6]) {
    window(x, W / 2, 1);
    window(x, -W / 2, -1);
  }
  g.add(mesh(new THREE.BoxGeometry(1.1, 2.1, 0.1), wood, [0.6, 0.2 + 1.05, W / 2 + 0.05]));
  // the supply cable arrives at the west wall (points in the frame of the house)
  g.add(mesh(tubeGeometry(supply, 0.01, 60, 5), MAT.cableBlack()));
  mergeStatic(g, { name: 'house' });
  const anchor = new THREE.Object3D();
  anchor.position.set(-L / 2 + 0.1, 0.2 + Hh + rise * 0.45, 0);
  g.add(anchor);
  return { group: g, panes, anchor };
}
