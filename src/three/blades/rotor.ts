import * as THREE from 'three';
import { MAT, group, mesh } from '@onigam/lab-kit/three';
import { BLADE, HUB_DISC, M12, ROTOR_DISC, ROTOR_RODS } from '../dims';
import { DEG, TAU, discShape, extrudeX, polyShape, seg, shapePoint, type Detail } from '../common';
import { mergeStatic } from '../merge';
import { bladeGeometry } from './geometry';

// The rotor assembly: three carved blades clamped between a plywood disc (behind, the extrados side) and a plywood triangle
// (in front), in the ROTOR frame (X along the axle, origin on the rear face of the disc, everything in front at x' <= 0). The
// `blades` world registers the two groups as `blade` and `hub-disc`; the `turbine` world registers the whole as ONE part,
// `rotor`, so both show the same geometry. The four rods and their nuts belong to the hub of the alternator. The blur disc is
// NOT part of either: it is a sheet of motion, never picked or ghosted.

export interface RotorModel {
  /** Rotor frame. The groups below are inside `spin`, which turns about X with the rotor angle. */
  root: THREE.Group;
  spin: THREE.Group;
  /** The three blades (one registered group in the blades world). */
  blades: THREE.Group;
  /** The plywood disc and the plywood triangle. */
  hub: THREE.Group;
  /** The triangle, a child of `hub`: the explode of the blades world lifts it above the blades. */
  triangle: THREE.Object3D;
  /** Translucent disc of the swept area, shown when the rotor turns fast (rotorBlur). Its material is animated directly. */
  blur: THREE.Mesh;
  blurMaterial: THREE.MeshBasicMaterial;
}

/** Radial alpha of the blur disc: transparent at the hub, strongest towards the tips, soft edge. */
function blurTexture(): THREE.DataTexture {
  const n = 64;
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const d = Math.hypot((i + 0.5) / n - 0.5, (j + 0.5) / n - 0.5) * 2;
      const inner = Math.min(1, Math.max(0, (d - 0.12) / 0.3));
      const outer = Math.min(1, Math.max(0, (1 - d) / 0.06));
      const k = (j * n + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * inner * outer * (0.55 + 0.45 * d));
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createRotorModel(detail: Detail = 'full'): RotorModel {
  const root = group('rotor-frame');
  const spin = group('rotor-spin');
  root.add(spin);

  // ---- three blades, 120° apart, sharing one geometry (blade 0 points up when the angle is 0), roots in front of the disc
  const blades = group('blade');
  const geo = bladeGeometry();
  geo.translate(-HUB_DISC.thickness, 0, 0);
  for (let k = 0; k < BLADE.count; k++) {
    const b = mesh(geo, MAT.wood());
    b.rotation.x = (k * TAU) / BLADE.count;
    b.name = `blade-${k}`;
    blades.add(b);
  }
  mergeStatic(blades, { name: 'blades' });

  // ---- plywood: a disc behind the roots and a triangle in front of them, four M12 holes on the 100 mm circle
  const hub = group('hub-disc');
  const rods = ROTOR_RODS.anglesDeg.map((a) => a * DEG);
  const boltHoles = rods.map((psi) => ({
    r: M12.clearanceHole / 2,
    at: shapePoint(ROTOR_DISC.boltCircleDiameter / 2, 0, psi),
  }));
  const ply = MAT.osb();
  const recess = { r: HUB_DISC.recess / 2, at: [0, 0] as [number, number] };
  hub.add(
    mesh(
      extrudeX(
        discShape(HUB_DISC.diameter / 2, [recess, ...boltHoles]),
        HUB_DISC.thickness,
        -HUB_DISC.thickness,
        seg(detail, 40),
      ),
      ply,
    ),
  );
  const tri = polyShape([0, 120, 240].map((a) => shapePoint(HUB_DISC.triangleRadius, 0, a * DEG)));
  for (const h of boltHoles) {
    const p = new THREE.Path();
    p.absarc(h.at[0], h.at[1], h.r, 0, TAU, true);
    tri.holes.push(p);
  }
  const x1 = -HUB_DISC.thickness - BLADE.rootThickness;
  const triangle = mesh(extrudeX(tri, HUB_DISC.triangleThickness, x1 - HUB_DISC.triangleThickness), ply);
  triangle.name = 'triangle';
  triangle.userData.keep = true; // stays a mesh of its own: the explode of the blades world lifts it above the roots
  hub.add(triangle);
  mergeStatic(hub, { name: 'hub-disc' });

  // ---- the sheet of motion
  const blurMaterial = new THREE.MeshBasicMaterial({
    map: blurTexture(),
    color: 0xd7b98d,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const blurGeo = new THREE.CircleGeometry(BLADE.length, 64);
  blurGeo.rotateY(Math.PI / 2);
  const blur = new THREE.Mesh(blurGeo, blurMaterial);
  blur.position.x = -(HUB_DISC.thickness + BLADE.rootThickness / 2);
  blur.renderOrder = 5;
  blur.visible = false;
  blur.castShadow = false;
  blur.userData.noShadow = true;
  blur.name = 'blur-disc';
  root.add(blur);

  spin.add(blades, hub);
  return { root, spin, blades, hub, triangle, blur, blurMaterial };
}
