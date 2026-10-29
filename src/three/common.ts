import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Small shared helpers of the four worlds: revolved profiles, extruded discs along the shaft, hex nuts, tubes, the paper floor,
// flow dots. Ported from the ram lab (docs/kit-requests.md says what should move to the kit). Geometry and materials only (no
// canvas, no GL context), so everything here also runs in Node under vitest.

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A profile is a polyline of (radius, axial position) points, revolved around the shaft axis (X after `latheX`). */
export type Profile = [number, number][];

/** Level of detail of a model: the site draws the machine from far away, the detailed worlds from close. */
export type Detail = 'full' | 'site';
/** Radial segments of a round part for a level of detail. */
export const seg = (detail: Detail, n: number): number => (detail === 'site' ? Math.max(8, n >> 2) : n);

/**
 * Revolve profile runs around Y and merge them. Each run is smooth inside, runs meet at crisp edges. Walk a closed profile so
 * that the faces look outwards (outer surface towards +y, top rim inwards, bore towards -y, bottom rim outwards).
 */
export function lathe(runs: Profile[], segments = 48): THREE.BufferGeometry {
  const parts = runs
    .filter((run) => run.length >= 2)
    .map(
      (run) =>
        new THREE.LatheGeometry(
          run.map(([r, y]) => new THREE.Vector2(r, y)),
          segments,
        ),
    );
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (parts.length > 1) parts.forEach((p) => p.dispose());
  return merged;
}

/** The consecutive segments of a closed polygon (r, a) as separate runs: a revolved solid with crisp edges. */
export function crispRuns(poly: Profile): Profile[] {
  const runs: Profile[] = [];
  for (let i = 0; i < poly.length; i++) runs.push([poly[i], poly[(i + 1) % poly.length]]);
  return runs;
}

/** Turn a geometry built along +Y (a lathe, a nut) so that its axis is X: y becomes x. */
export function alongX<T extends THREE.BufferGeometry>(g: T): T {
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** A revolved solid around X: a closed polygon of (radius, x). */
export function solidX(poly: Profile, segments = 48): THREE.BufferGeometry {
  return alongX(lathe(crispRuns(poly), segments));
}

/** A ring (outer radius, inner radius) around X from x0 to x1. */
export function ringX(outerR: number, innerR: number, x0: number, x1: number, segments = 40): THREE.BufferGeometry {
  return solidX(
    [
      [innerR, x0],
      [outerR, x0],
      [outerR, x1],
      [innerR, x1],
    ],
    segments,
  );
}

/** A solid cylinder around X from x0 to x1. */
export function cylinderX(r: number, x0: number, x1: number, segments = 24): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), segments, 1);
  g.rotateZ(-Math.PI / 2);
  g.translate((x0 + x1) / 2, 0, 0);
  return g;
}

/**
 * Extrude a shape along the shaft: the geometry spans x0 to x0 + depth, the shape's (sx, sy) become (y, z) = (sy, -sx), so
 * that a point at radius R and angle ψ (from +Y towards +Z) is `shapePoint(R, ψ)`.
 */
export function extrudeX(shape: THREE.Shape, depth: number, x0 = 0, curveSegments = 24): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  return g;
}

/** The shape-plane coordinates of the point at radius `r` along the direction ψ and `t` sideways (towards increasing ψ). */
export function shapePoint(r: number, t: number, psi: number): [number, number] {
  const y = r * Math.cos(psi) - t * Math.sin(psi);
  const z = r * Math.sin(psi) + t * Math.cos(psi);
  return [-z, y];
}

/** A disc shape (radius, centred) with round holes at given shape-plane points. */
export function discShape(radius: number, holes: { r: number; at: [number, number] }[] = []): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(0, 0, radius, 0, TAU, false);
  for (const h of holes) {
    const p = new THREE.Path();
    p.absarc(h.at[0], h.at[1], h.r, 0, TAU, true);
    s.holes.push(p);
  }
  return s;
}

/** A polygon as a hole path (shape plane). Holes must be wound opposite to the outline: clockwise for a counter-clockwise outline. */
export function polyHole(points: [number, number][]): THREE.Path {
  const area = points.reduce((a, p, i) => {
    const q = points[(i + 1) % points.length];
    return a + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const pts = area > 0 ? [...points].reverse() : points;
  const p = new THREE.Path();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  p.closePath();
  return p;
}

/** A polygon as an outline shape (counter-clockwise). */
export function polyShape(points: [number, number][]): THREE.Shape {
  const area = points.reduce((a, p, i) => {
    const q = points[(i + 1) % points.length];
    return a + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const pts = area < 0 ? [...points].reverse() : points;
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/**
 * Hex nut standing on Y from y = 0 to `thickness`, corners along ±X, with a small chamfer on the outline so that its edges
 * catch the light (`bore` is the diameter of the hole, 0 = solid).
 */
export function hexNut(acrossFlats: number, thickness: number, bore = 0, chamfer = 0.0003): THREE.BufferGeometry {
  const R = (acrossFlats - 2 * chamfer) / Math.sqrt(3);
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const x = R * Math.cos((i * Math.PI) / 3);
    const y = R * Math.sin((i * Math.PI) / 3);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  if (bore > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, bore / 2 + chamfer, 0, TAU, true);
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * chamfer,
    bevelEnabled: true,
    bevelThickness: chamfer,
    bevelSize: chamfer,
    bevelSegments: 1,
    curveSegments: 12,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, chamfer, 0);
  return g;
}

/** A nut with its axis along X, from x0 (the face against the part) towards `dir` (+1 or -1). */
export function nutX(
  acrossFlats: number,
  thickness: number,
  bore: number,
  x0: number,
  dir: 1 | -1,
): THREE.BufferGeometry {
  const g = alongX(hexNut(acrossFlats, thickness, bore));
  if (dir < 0) g.rotateZ(Math.PI); // a hexagon is symmetric: turning it over puts it on the other side of the face
  g.translate(x0, 0, 0);
  return g;
}

/**
 * Drafting-table floor: a paper disc with a grid, as a DataTexture (no canvas, so it also builds in Node). `tile` is the
 * side of one texture tile in metres (eight cells of one fifth each), `radius` the radius of the disc.
 */
export function paperFloor(radius = 12, tile = 8, y = 0): THREE.Mesh {
  const N = 512;
  const data = new Uint8Array(N * N * 4);
  const cell = N / 8;
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const k = (py * N + px) * 4;
      let a = 0;
      const mx = px % cell;
      const my = py % cell;
      if (mx < 2 || my < 2) a = 0.16;
      else if (mx % (cell / 5) < 1 || my % (cell / 5) < 1) a = 0.06;
      data[k] = Math.round(239 * (1 - a) + 40 * a);
      data[k + 1] = Math.round(230 * (1 - a) + 60 * a);
      data[k + 2] = Math.round(211 * (1 - a) + 90 * a);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((2 * radius) / tile, (2 * radius) / tile);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  floor.name = 'floor';
  return floor;
}

/** Soft round sprite (white, alpha falling to the edge) for dots; a DataTexture, so no canvas is needed. */
export function softDotTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot((i + 0.5) / size - 0.5, (j + 0.5) / size - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 1.8) * (a > 0 ? 1 : 0));
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Flag a whole subtree as never casting shadows (overlays): the registry respects `userData.noShadow`. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/** A tube along points (Catmull-Rom through them), for cables and wires. */
export function tubeGeometry(
  points: THREE.Vector3[],
  radius: number,
  segments = 24,
  radial = 6,
  closed = false,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

export const v3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ flow dots

/** A polyline with its cumulative length, to place a dot at a distance along it. */
export class DotPath {
  readonly cum: number[] = [0];
  constructor(readonly points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  get length(): number {
    return this.cum[this.cum.length - 1];
  }
  at(u: number, out: THREE.Vector3): THREE.Vector3 {
    const L = this.length;
    if (L <= 0) return out.copy(this.points[0]);
    let d = u % L;
    if (d < 0) d += L;
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 0 ? (d - this.cum[lo]) / segLen : 0;
    return out.lerpVectors(this.points[lo], this.points[hi], t);
  }
}

export interface FlowDotsOptions {
  color: number;
  /** World size (metres) or, with `pixels`, screen size (pixels). */
  size: number;
  pixels?: boolean;
  opacity?: number;
  /** Draw through the walls (the "Flux" overlay). */
  throughWalls?: boolean;
}

/** Dots that travel along polylines: the speed of each path is set every frame (signed). Decoration of a size set by the simulation. */
export class FlowDots {
  readonly object: THREE.Points;
  private readonly paths: { path: DotPath; offset: number[]; first: number }[] = [];
  private readonly pos: Float32Array;
  private total = 0;
  private readonly tmp = new THREE.Vector3();
  private geometry: THREE.BufferGeometry;

  constructor(
    private readonly max: number,
    opts: FlowDotsOptions,
  ) {
    this.pos = new Float32Array(max * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      color: opts.color,
      size: opts.size,
      sizeAttenuation: !opts.pixels,
      map: softDotTexture(),
      transparent: true,
      opacity: opts.opacity ?? 0.9,
      depthWrite: false,
      depthTest: !opts.throughWalls,
    });
    this.object = new THREE.Points(this.geometry, mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = opts.throughWalls ? 20 : 4;
    this.object.userData.noShadow = true;
    this.object.castShadow = false;
    this.object.visible = false;
    this.geometry.setDrawRange(0, 0);
  }

  /** Add a path with `count` dots spread evenly along it; returns its index. */
  addPath(points: THREE.Vector3[], count: number): number {
    const path = new DotPath(points);
    const n = Math.max(1, Math.min(count, this.max - this.total));
    const offset: number[] = [];
    for (let i = 0; i < n; i++) offset.push((path.length * i) / n);
    this.paths.push({ path, offset, first: this.total });
    this.total += n;
    this.geometry.setDrawRange(0, this.total);
    this.place();
    return this.paths.length - 1;
  }

  advance(index: number, speed: number, dt: number): void {
    const p = this.paths[index];
    const L = p.path.length;
    if (L <= 0) return;
    for (let i = 0; i < p.offset.length; i++) {
      let u = (p.offset[i] + speed * dt) % L;
      if (u < 0) u += L;
      p.offset[i] = u;
    }
  }

  /** Write the positions after all `advance` calls of a frame. */
  place(): void {
    for (const p of this.paths) {
      for (let i = 0; i < p.offset.length; i++) {
        p.path.at(p.offset[i], this.tmp);
        const k = (p.first + i) * 3;
        this.pos[k] = this.tmp.x;
        this.pos[k + 1] = this.tmp.y;
        this.pos[k + 2] = this.tmp.z;
      }
    }
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  get material(): THREE.PointsMaterial {
    return this.object.material as THREE.PointsMaterial;
  }
}
