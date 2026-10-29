import * as THREE from 'three';
import { MAST } from '../dims';

// Thin lines of the site (the mast, the guys, the cable run). A real 60 mm mast or 4 mm guy is invisible from 40 m, so the
// material widens the tube along its normals by the distance to the camera: it is never thinner than about `minPixels` on the
// screen, and is drawn at its true size when the camera is close. Picking is by distance to the centre line. (Ported from the
// ram lab, docs/kit-requests.md.)

/** World size of one screen pixel per metre of distance at the stage's 40 degree field of view and ~800 px height. */
const PIXEL_PER_METRE = 0.00091;

export function minWidthMaterial(base: THREE.MeshStandardMaterial, minPixels: number = MAST.minPixels) {
  const uniforms = { uPipeRadius: { value: 0.01 }, uPipePix: { value: (PIXEL_PER_METRE * minPixels) / 2 } };
  base.onBeforeCompile = (shader) => {
    shader.uniforms.uPipeRadius = uniforms.uPipeRadius;
    shader.uniforms.uPipePix = uniforms.uPipePix;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uPipeRadius;\nuniform float uPipePix;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        {
          vec4 wp = modelMatrix * vec4( transformed, 1.0 );
          float dist = distance( cameraPosition, wp.xyz );
          transformed += normalize( normal ) * max( 0.0, dist * uPipePix - uPipeRadius );
        }`,
      );
  };
  base.customProgramCacheKey = () => 'min-width-line';
  return { material: base, uniforms };
}

/** Segments (pairs of points) of a thin line set, in the frame of the mesh. */
export type Segments = [THREE.Vector3, THREE.Vector3][];

/**
 * Picking for a line that is widened on screen: a ray is tested against the centre lines with a tolerance of about two pixels
 * (the same widening the material applies), and against the true radius when close.
 */
export function pickAlong(mesh: THREE.Mesh, segments: () => Segments, radius: () => number): void {
  const onRay = new THREE.Vector3();
  const onSeg = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  mesh.raycast = (raycaster, intersects) => {
    const ray = raycaster.ray;
    let best = Infinity;
    let hit: THREE.Vector3 | null = null;
    mesh.updateWorldMatrix(true, false);
    for (const [p, q] of segments()) {
      a.copy(p).applyMatrix4(mesh.matrixWorld);
      b.copy(q).applyMatrix4(mesh.matrixWorld);
      const dsq = ray.distanceSqToSegment(a, b, onRay, onSeg);
      const dist = ray.origin.distanceTo(onSeg);
      const tol = Math.max(radius(), dist * 0.0018);
      if (dsq < tol * tol && dist < best && dist >= raycaster.near && dist <= raycaster.far) {
        best = dist;
        hit = onSeg.clone();
      }
    }
    if (hit) intersects.push({ distance: best, point: hit, object: mesh });
  };
}
