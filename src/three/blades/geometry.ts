import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BLADE, bladePitch } from '../dims';
import { smoothstep } from '../common';

// The carved blade, built from the six stations of the plans (S4 p. 43). Blade frame = rotor frame: the radial axis is +Y (the
// blade lies along it, root at the centre), the tangential axis is +Z (the direction of motion: the leading edge is on +Z),
// the axial axis is +X (downwind). The roots lie in the slab x' ∈ [-rootThickness, 0] (x' = 0 touches the front magnet
// rotor); the flat windward face is in front (towards -X) and tilts back by the pitch of the station; the back (leeward) face
// is curved. The leading edge is the straight edge of the plank (estimate: the plank is tapered on the trailing side).

const M = 14; // points across a section, from the leading to the trailing edge
const HALF = BLADE.rootWidth / 2;

/** Monotone cubic interpolation (Fritsch-Carlson) of ys over xs: no overshoot between stations. */
export function pchip(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  const h = xs.slice(1).map((x, i) => x - xs[i]);
  const d = ys.slice(1).map((y, i) => (y - ys[i]) / h[i]);
  const m = new Array<number>(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) m[i] = m[i + 1] = 0;
    else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        m[i] = k * a * d[i];
        m[i + 1] = k * b * d[i];
      }
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

const R = BLADE.stationRadius;
const widthAt = pchip(R, BLADE.stationWidth);
const dropAt = pchip(R, BLADE.stationDrop);
const thickAt = pchip(R, BLADE.stationThickness);

/** Distance along the blade where the root's 60° cuts meet the full width of the plank (the apex of the wedge is at r = 0). */
export const ROOT_APEX = HALF / Math.tan(((BLADE.rootAngleDeg / 2) * Math.PI) / 180);

/** Cross-section parameters at radius r: width and drop of the flat face, thickness, and how far the plank has been carved (0 = block, 1 = wing section). */
export function sectionAt(r: number): { width: number; drop: number; thickness: number; carve: number } {
  if (r <= R[0]) return { width: BLADE.rootWidth, drop: 0, thickness: BLADE.rootThickness, carve: 0 };
  return {
    width: widthAt(r),
    drop: Math.max(0, dropAt(r)),
    thickness: thickAt(r),
    carve: smoothstep(R[0], R[1], r),
  };
}

/** Thickness profile over the chord (s = 0 at the leading edge, 1 at the trailing edge), 1 at its thickest point. 1 for a block. */
export function profile(s: number, carve: number): number {
  const k = Math.log(0.5) / Math.log(BLADE.camberPoint);
  const wing = Math.sin(Math.PI * Math.pow(s, k));
  return 1 + (wing - 1) * carve;
}

/** Fractions along the chord, denser at the leading edge. */
const chordFractions = Array.from({ length: M }, (_, j) => (1 - Math.cos((Math.PI * j) / (M - 1))) / 2);

/** Radii of the sections: the root wedge, the block, then every 20 mm to the tip. */
const radii = (): number[] => {
  const out = [0, ROOT_APEX, R[0]];
  for (let r = R[0] + 0.02; r < R[R.length - 1] - 1e-9; r += 0.02) out.push(+r.toFixed(4));
  out.push(R[R.length - 1]);
  return out;
};

type V = [number, number, number];

/** The windward and back points of the section at radius r, as (x', y, z) with the leading edge at z = +HALF. */
function sectionPoints(r: number): { w: V[]; b: V[] } {
  const { width, drop, thickness, carve } = sectionAt(r);
  const squeeze = Math.min(1, r / ROOT_APEX); // the root wedge: the plank narrows to a point at the hub centre
  const A0 = -BLADE.rootThickness;
  const w: V[] = [];
  const b: V[] = [];
  for (const s of chordFractions) {
    const A = A0 + s * drop;
    const T = (HALF - s * width) * squeeze;
    // the thickness of the plans is measured on the bench, straight up from the flat face: the leading edge stays straight
    const h = thickness * profile(s, carve);
    w.push([A, r, T]);
    b.push([Math.min(0, A + h), r, T]); // never behind the root plane
  }
  return { w, b };
}

/** A grid of points (rows × columns) as an indexed geometry with smooth normals; `flip` reverses the winding. */
function grid(rows: V[][], flip: boolean): THREE.BufferGeometry {
  const cols = rows[0].length;
  const pos: number[] = [];
  for (const row of rows) for (const p of row) pos.push(p[0], p[1], p[2]);
  const idx: number[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + cols;
      const c = a + 1;
      const d = b + 1;
      if (flip) idx.push(a, c, b, c, d, b);
      else idx.push(a, b, c, c, b, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Flat cap closing the section at the tip, facing +Y. */
function tipCap(w: V[], b: V[]): THREE.BufferGeometry {
  const ring = [...w, ...b.slice().reverse()];
  const c: V = [0, 0, 0];
  for (const p of ring) {
    c[0] += p[0] / ring.length;
    c[1] += p[1] / ring.length;
    c[2] += p[2] / ring.length;
  }
  const pos: number[] = [...c];
  for (const p of ring) pos.push(...p);
  const idx: number[] = [];
  for (let i = 0; i < ring.length; i++) idx.push(0, 1 + i, 1 + ((i + 1) % ring.length));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

/** One blade in the blade frame (see the top of the file). Four smooth strips (windward, back, leading and trailing walls) and the tip. */
export function bladeGeometry(): THREE.BufferGeometry {
  const secs = radii().map(sectionPoints);
  const windward = grid(
    secs.map((s) => s.w),
    false,
  );
  const back = grid(
    secs.map((s) => s.b),
    true,
  );
  const leading = grid(
    secs.map((s) => [s.w[0], s.b[0]]),
    true,
  );
  const trailing = grid(
    secs.map((s) => [s.w[M - 1], s.b[M - 1]]),
    false,
  );
  const last = secs[secs.length - 1];
  const parts = [windward, back, leading, trailing, tipCap(last.w, last.b)];
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Outline of the section at station i, in (c, h): c along the flat face from the leading edge, h perpendicular to it (towards the back). */
export function sectionOutline(i: number): [number, number][] {
  const r = BLADE.stationRadius[i];
  const { width, drop, thickness, carve } = sectionAt(r);
  const len = Math.hypot(drop, width);
  const pts: [number, number][] = [];
  chordFractions.forEach((s) => pts.push([s * len, 0]));
  for (let j = M - 1; j >= 0; j--) pts.push([chordFractions[j] * len, thickness * profile(chordFractions[j], carve)]);
  return pts;
}

/** Pitch of the flat face to the rotor plane at station i, degrees (for labels). */
export const stationPitchDeg = (i: number): number => (bladePitch(i) * 180) / Math.PI;
