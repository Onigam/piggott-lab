// Geometry of the head (rotor, alternator, angle iron, yaw pipe, tail) in millimetres, in the HEAD frame of dims.ts: origin on
// the yaw axis at the height of the axle, X towards the tail (the wind blows towards +X), Y up, Z towards the viewer of the side
// view. Read from dims.ts, nothing is retyped. Used by the general arrangement and the furling sheet.
import type { Pt } from '@onigam/lab-kit/drawings';
import {
  COIL_PHASE,
  HEAD,
  HEAD_Y,
  HUB_DISC,
  STACK,
  TAIL,
  YAW,
  BLADE,
  tailAxis,
  tailPivot,
  tailRestDirection,
} from '../three/dims';
import { profile, sectionAt, ROOT_APEX } from '../three/blades/geometry';
import { DEG, k } from './geom';

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Rotation of a vector about a unit axis (Rodrigues), degrees, right-handed. */
export function rotate(v: V3, axis: V3, deg: number): V3 {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  const kv = cross(axis, v);
  const kd = dot(axis, v) * (1 - c);
  return [
    v[0] * c + kv[0] * s + axis[0] * kd,
    v[1] * c + kv[1] * s + axis[1] * kd,
    v[2] * c + kv[2] * s + axis[2] * kd,
  ];
}

/** X of an alternator-frame position in the head frame, mm. */
export const hx = (xAlt: number): number => k(HEAD.statorX + xAlt);

/** Positions along the axle in the head frame, mm. */
export const X = {
  stator: hx(0),
  statorFront: hx(-STACK.statorHalf),
  statorBack: hx(STACK.statorHalf),
  magnetFace: hx(STACK.magnetFace),
  magnetBack: hx(STACK.magnetBack),
  discFront: hx(STACK.discFront),
  plateFront: hx(STACK.plateFront),
  axleFront: hx(STACK.axleFront),
  barrelBack: hx(STACK.barrelBack),
  housingFront: hx(STACK.housingFront),
  cradleFront: hx(STACK.cradleFront),
  cradleBack: hx(STACK.cradleBack),
  bladeOrigin: hx(STACK.bladeOrigin),
  bladeFront: hx(STACK.bladeFront),
  rodFront: hx(STACK.rodFront),
  beam0: k(HEAD.statorX + STACK.cradleBack),
  beam1: k(HEAD.statorX + STACK.cradleBack + 0.206),
} as const;

/** Heights in the head frame, mm. */
export const Y = {
  beamTop: k(HEAD_Y.beamTop),
  beamBottom: k(HEAD_Y.beamBottom),
  pipeBottom: k(HEAD_Y.pipeBottom),
  capTop: k(HEAD_Y.capTop),
  capBottom: k(HEAD_Y.capTop - YAW.capThickness),
  washerBottom: k(HEAD_Y.pipeBottom - YAW.washerThickness),
  collarBottom: k(HEAD_Y.pipeBottom - YAW.washerThickness - YAW.collarHeight),
} as const;

/** Where the tail pivots (centre of the sleeve), mm. */
export const PIVOT: V3 = tailPivot().map(k) as V3;
export const AXIS: V3 = tailAxis();

/** The tail in a given swing (degrees from its stop): directions of the boom, of the T-bar and the side the vane stands on. */
export function tailPose(swing: number): { boom: V3; up: V3; side: V3 } {
  const b0 = tailRestDirection();
  const up0: V3 = [0, 1, 0];
  const side0 = cross(b0, up0);
  const r = (v: V3): V3 => rotate(v, AXIS, -swing);
  return { boom: r(b0), up: r(up0), side: r(side0) };
}

/** Corners of the vane (a rectangle, mm) and of the T-bar for a swing, in the head frame. */
export function tailShapes(swing: number): {
  boomStart: V3;
  boomEnd: V3;
  bar: V3[];
  vane: V3[];
  sleeve: V3[];
  innerPipe: V3[];
} {
  const { boom, up, side } = tailPose(swing);
  const P = PIVOT;
  const ro = k(TAIL.sleeveOuter) / 2;
  const at = (s: number, u: number, l: number): V3 => add(add(add(P, scale(boom, s)), scale(up, u)), scale(side, l));
  const len = k(TAIL.boomLength);
  const bw = k(TAIL.barWidth);
  const lateral = k(TAIL.barThickness + TAIL.vaneThickness) / 2;
  const hv = k(TAIL.vaneHeight) / 2;
  const x0 = len - bw / 2;
  const x1 = x0 + k(TAIL.vaneLength);
  // the sleeve and the inner pipe lie along the hinge axis through the pivot
  const half = (l: number): V3[] => [add(P, scale(AXIS, -l / 2)), add(P, scale(AXIS, l / 2))];
  return {
    boomStart: at(ro - 4, 0, 0),
    boomEnd: at(len, 0, 0),
    bar: [
      at(len - bw / 2, -k(TAIL.barLength) / 2, 0),
      at(len + bw / 2, -k(TAIL.barLength) / 2, 0),
      at(len + bw / 2, k(TAIL.barLength) / 2, 0),
      at(len - bw / 2, k(TAIL.barLength) / 2, 0),
    ],
    vane: [at(x0, -hv, lateral), at(x1, -hv, lateral), at(x1, hv, lateral), at(x0, hv, lateral)],
    sleeve: half(k(TAIL.sleeveLength)),
    innerPipe: half(k(TAIL.innerLength)),
  };
}

/** Phase letter of coil `i` (series star). */
export const phaseOf = (i: number): 'A' | 'B' | 'C' => COIL_PHASE[i]!;

// ------------------------------------------------------------------------------------------------ the blade, from the 3D builder

/** Outline of the blade as seen from the front, in (tangential, radial) mm with the leading edge on +T (blade pointing along +radial). */
export function bladePlanform(): { lead: Pt[]; trail: Pt[]; rootApex: number } {
  const lead: Pt[] = [];
  const trail: Pt[] = [];
  const half = k(BLADE.rootWidth) / 2;
  const R = k(BLADE.length);
  const step = 10;
  for (let r = 0; r <= R + 1e-9; r += step) {
    const s = sectionAt(r / 1000);
    const q = Math.min(1, r / k(ROOT_APEX));
    lead.push([half * q, r]);
    trail.push([(half - k(s.width)) * q, r]);
  }
  return { lead, trail, rootApex: k(ROOT_APEX) };
}

/**
 * Silhouette of one blade seen from the side (looking along the tangential axis), in (axial x', radial r) mm: x' = 0 on the rear
 * face of the plywood disc (rotor frame), negative in front. The blades lie between the disc and the triangle.
 */
export function bladeProfileSide(): { front: Pt[]; back: Pt[] } {
  const front: Pt[] = [];
  const back: Pt[] = [];
  const R = k(BLADE.length);
  const ply = k(HUB_DISC.thickness);
  for (let r = 0; r <= R + 1e-9; r += 10) {
    const { width, drop, thickness, carve } = sectionAt(r / 1000);
    const a0 = -k(BLADE.rootThickness) - ply;
    let hi = a0;
    for (let i = 0; i <= 20; i++) {
      const s = i / 20;
      const h = k(thickness) * profile(s, carve);
      hi = Math.max(hi, Math.min(-ply, a0 + s * k(drop) + h));
    }
    void width;
    front.push([a0, r]);
    back.push([hi, r]);
  }
  return { front, back };
}
