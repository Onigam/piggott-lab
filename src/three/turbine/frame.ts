import * as THREE from 'three';
import { MAT, group, mesh } from '@onigam/lab-kit/three';
import { DIAMETER_REF } from '../../sim/machine';
import {
  CABLE,
  COIL_PHASE,
  CRADLE,
  HEAD,
  HEAD_Y,
  NACELLE,
  STACK,
  TAIL,
  YAW,
  mastRadius,
  tailAxis,
  tailPivot,
  tailRestDirection,
} from '../dims';
import { CABLE_EXIT_X } from '../alternator/parts';
import { TAU, crispRuns, lathe, ringX, seg, tubeGeometry, type Detail } from '../common';

// The steel of the head, in the HEAD frame (origin on the yaw axis at the height of the axle, X towards the tail, see dims.ts):
// the angle iron with the yaw pipe under it, the fixed half of the yaw bearing (stub, collar, washer, mast cap and a piece of
// mast), the fixed half of the tail hinge, the swinging tail (boom with its sleeve, T-bar and vane) and the cable that goes down
// the mast. Everything here is plain geometry; model.ts assembles it, moves it and registers it.

const U = new THREE.Vector3(...tailAxis());
const B0 = new THREE.Vector3(...tailRestDirection());
const UP = new THREE.Vector3(0, 1, 0);
/** Horizontal direction at right angles to the boom, towards a larger swing (the side the vane stands on). */
const SIDE = new THREE.Vector3().crossVectors(B0, UP).normalize();
const XAXIS = new THREE.Vector3(1, 0, 0);

/** A tube (ring) between two points of the head frame, with an optional end plate: built around X, then turned onto the axis. */
function pipe(outer: number, wall: number, a: THREE.Vector3, b: THREE.Vector3, segments: number): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const g = ringX(outer, outer - wall, -len / 2, len / 2, segments);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(XAXIS, b.clone().sub(a).normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

const beamX0 = () => HEAD.statorX + STACK.cradleBack;
const beamX1 = () => beamX0() + NACELLE.length;

// ---------------------------------------------------------------------------------------------------------- nacelle frame

/** Angle iron 50 × 50 × 6 (horizontal leg on top with the 14 mm cable hole, vertical leg hanging on the +Z side) and the yaw pipe welded under it. */
export function buildNacelleFrame(detail: Detail): THREE.Group {
  const g = group('nacelle-frame');
  const paint = MAT.steelBlack();
  const x0 = beamX0();
  const x1 = beamX1();
  const z0 = HEAD.beamZ0;
  const z1 = z0 + NACELLE.leg;
  // horizontal leg: a shape in (x, -z) with the hole over the yaw pipe, extruded up
  const leg = new THREE.Shape();
  leg.moveTo(x0, -z0);
  leg.lineTo(x1, -z0);
  leg.lineTo(x1, -z1);
  leg.lineTo(x0, -z1);
  leg.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, -YAW.holeZ, YAW.cableHole / 2, 0, TAU, true);
  leg.holes.push(hole);
  const legGeo = new THREE.ExtrudeGeometry(leg, { depth: NACELLE.thickness, bevelEnabled: false, curveSegments: 16 });
  legGeo.rotateX(-Math.PI / 2);
  legGeo.translate(0, HEAD_Y.beamBottom, 0);
  g.add(mesh(legGeo, paint));
  const hang = NACELLE.leg - NACELLE.thickness;
  g.add(
    mesh(new THREE.BoxGeometry(NACELLE.length, hang, NACELLE.thickness), paint, [
      (x0 + x1) / 2,
      HEAD_Y.beamBottom - hang / 2,
      z1 - NACELLE.thickness / 2,
    ]),
  );
  // yaw pipe 42.2 mm, 100 mm, centred on the hole, hanging under the angle iron
  const ro = YAW.pipeOuter / 2;
  g.add(
    mesh(
      lathe(
        crispRuns([
          [ro - YAW.pipeWall, HEAD_Y.pipeBottom],
          [ro, HEAD_Y.pipeBottom],
          [ro, HEAD_Y.beamBottom],
          [ro - YAW.pipeWall, HEAD_Y.beamBottom],
        ]),
        seg(detail, 32),
      ),
      MAT.steel(),
    ),
  );
  return g;
}

// ---------------------------------------------------------------------------------------------------------- yaw bearing (fixed half)

/** Stub 33.4 mm inside the yaw pipe, collar and thrust washer, the cap of the mast and (turbine world) a piece of mast pipe. */
export function buildYawBearing(detail: Detail, mastPiece: boolean): THREE.Group {
  const g = group('yaw-bearing');
  const s = seg(detail, 32);
  const rs = YAW.stubOuter / 2;
  const ring = (ro: number, ri: number, y0: number, y1: number, mat: THREE.Material) =>
    g.add(
      mesh(
        lathe(
          crispRuns([
            [ri, y0],
            [ro, y0],
            [ro, y1],
            [ri, y1],
          ]),
          s,
        ),
        mat,
      ),
    );
  const steel = MAT.steel();
  const washerTop = HEAD_Y.pipeBottom;
  const collarTop = washerTop - YAW.washerThickness;
  const mastR = mastRadius(DIAMETER_REF);
  const capBottom = HEAD_Y.capTop - YAW.capThickness;
  // stub: from under the angle iron (10 mm clear of it) down into the mast
  ring(rs, rs - YAW.stubWall, capBottom - 0.05, HEAD_Y.beamBottom - 0.01, steel);
  ring(YAW.collarOuter / 2, rs, collarTop - YAW.collarHeight, collarTop, steel);
  ring(YAW.collarOuter / 2 - 0.0025, rs, washerTop - YAW.washerThickness, washerTop, MAT.brass());
  ring(mastR, rs, capBottom, HEAD_Y.capTop, steel);
  if (mastPiece) ring(mastR, mastR - 0.0039, capBottom - YAW.mastPiece, capBottom, MAT.zinc());
  return g;
}

// ---------------------------------------------------------------------------------------------------------- tail hinge (fixed half)

/** Rotation that carries the sleeve (built along +Y) onto the hinge axis. */
export const hingeQuaternion = (): THREE.Quaternion => new THREE.Quaternion().setFromUnitVectors(UP, U);

/** Unit vector at right angles to the hinge axis that points to the rear of the head, in the plane of the horizontal. */
const rearInPlane = (): THREE.Vector3 => XAXIS.clone().addScaledVector(U, -XAXIS.dot(U)).normalize();

/** Horizontal-ish direction (⟂ axis) where the stop tab of the sleeve stands at rest: behind the sleeve, towards the angle iron. */
const tabDirection = (): THREE.Vector3 => rearInPlane().negate();

export function buildTailHinge(detail: Detail): THREE.Group {
  const g = group('tail-hinge');
  const steel = MAT.steelBlack();
  const P = new THREE.Vector3(...tailPivot());
  const ri = TAIL.boomOuter / 2;
  // inner pipe 33.4 mm × 150 mm, centred on the hinge point and along the axis
  const a = P.clone().addScaledVector(U, -TAIL.innerLength / 2);
  const b = P.clone().addScaledVector(U, TAIL.innerLength / 2);
  g.add(mesh(pipe(ri, TAIL.boomWall, a, b, seg(detail, 20)), MAT.steel()));
  // plate welded between the pipe and the end face of the angle iron
  const r = rearInPlane();
  const reach = P.x - beamX1();
  const plateLen = reach + ri + 0.012;
  const plate = mesh(new THREE.BoxGeometry(plateLen, TAIL.plateThickness, TAIL.plateWidth), steel);
  plate.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, U, new THREE.Vector3().crossVectors(r, U)));
  plate.position.copy(P).addScaledVector(r, -(plateLen / 2 - ri - 0.012));
  g.add(plate);
  // pin of the rest stop, welded on the pipe just under the sleeve, next to the tab of the sleeve (see buildTailBoom)
  const t = tabDirection();
  const sleeveBottom = -TAIL.sleeveLength / 2;
  const pinDir = t.clone().applyAxisAngle(U, 0.5); // 29° from the tab, on the side the sleeve cannot go back to
  const pin = mesh(new THREE.CylinderGeometry(TAIL.pinDiameter / 2, TAIL.pinDiameter / 2, 0.026, 10), MAT.zinc());
  pin.quaternion.setFromUnitVectors(UP, pinDir);
  pin.position
    .copy(P)
    .addScaledVector(U, sleeveBottom - 0.0075)
    .addScaledVector(pinDir, ri + 0.008);
  g.add(pin);
  return g;
}

// ---------------------------------------------------------------------------------------------------------- tail boom + vane (swing about the hinge)

export function buildTailBoom(detail: Detail): THREE.Group {
  const g = group('tail-boom');
  const steel = MAT.steel();
  const ro = TAIL.sleeveOuter / 2;
  const ri = TAIL.boomOuter / 2 + 0.0005;
  // sleeve 42.2 mm × 130 mm over the inner pipe, with a 6 mm cap plate on top
  const o = new THREE.Vector3();
  const half = TAIL.sleeveLength / 2;
  g.add(
    mesh(
      pipe(ro, ro - ri, o.clone().addScaledVector(U, -half), o.clone().addScaledVector(U, half), seg(detail, 28)),
      steel,
    ),
  );
  const cap = mesh(new THREE.CylinderGeometry(ro, ro, TAIL.capThickness, seg(detail, 28)), steel);
  cap.quaternion.copy(hingeQuaternion());
  cap.position.copy(U).multiplyScalar(half + TAIL.capThickness / 2);
  g.add(cap);
  // tab hanging under the rim: it rests on the pin of the frame
  const tab = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), steel);
  tab.quaternion.copy(hingeQuaternion());
  tab.position
    .copy(U)
    .multiplyScalar(-half - 0.004)
    .addScaledVector(tabDirection(), ro - 0.002);
  g.add(tab);
  // boom 33.4 mm × 500 mm welded to the sleeve, then the T-bar across its end (vertical at rest)
  const a = B0.clone().multiplyScalar(ro - 0.004);
  const b = B0.clone().multiplyScalar(TAIL.boomLength);
  g.add(mesh(pipe(TAIL.boomOuter / 2, TAIL.boomWall, a, b, seg(detail, 16)), steel));
  const bar = mesh(new THREE.BoxGeometry(TAIL.barWidth, TAIL.barLength, TAIL.barThickness), steel);
  bar.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(B0, UP, SIDE));
  bar.position.copy(B0).multiplyScalar(TAIL.boomLength);
  g.add(bar);
  return g;
}

export function buildTailVane(detail: Detail): THREE.Group {
  const g = group('tail-vane');
  const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(B0, UP, SIDE));
  const lateral = (TAIL.barThickness + TAIL.vaneThickness) / 2;
  const centre = B0.clone()
    .multiplyScalar(TAIL.boomLength - TAIL.barWidth / 2 + TAIL.vaneLength / 2)
    .addScaledVector(SIDE, lateral);
  const plate = mesh(new THREE.BoxGeometry(TAIL.vaneLength, TAIL.vaneHeight, TAIL.vaneThickness), MAT.woodLight());
  plate.quaternion.copy(quat);
  plate.position.copy(centre);
  g.add(plate);
  if (detail === 'full') {
    // three bolts through the T-bar
    const head = new THREE.CylinderGeometry(0.007, 0.007, 0.004, 6);
    const dark = MAT.zinc();
    for (const h of [-0.1, 0, 0.1]) {
      const m = mesh(head, dark);
      m.quaternion.setFromUnitVectors(UP, SIDE);
      m.position
        .copy(B0)
        .multiplyScalar(TAIL.boomLength)
        .addScaledVector(UP, h)
        .addScaledVector(SIDE, lateral + TAIL.vaneThickness / 2 + 0.002);
      g.add(m);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------------- the cable down the mast

/** Phase colours of the three cores, in the order they leave the stator (coils 3, 4, 5). */
export const CORE_PHASES = [COIL_PHASE[3], COIL_PHASE[4], COIL_PHASE[5]] as const;

/**
 * The three-core cable (3 × 2.5 mm²): out of the cradle, along the angle iron, down through the 14 mm hole, the yaw pipe and the
 * stub, and on into the mast. The three cores keep their triangle all the way. The part ends in the mast, under the cap.
 */
export function buildWireLoop(detail: Detail): THREE.Group {
  const g = group('wire-loop');
  const mats = { A: MAT.cableRed(), B: MAT.warningYellow(), C: MAT.cableBlue() };
  const r = CABLE.coreDiameter / 2;
  const xe = HEAD.statorX + CABLE_EXIT_X;
  const yc = HEAD_Y.beamTop + 0.0055;
  const zc = 0.006;
  const gz = HEAD.offset + CRADLE.cableHoleRadius * Math.sin((CRADLE.cableHoleDeg * Math.PI) / 180);
  const gy = CRADLE.cableHoleRadius * Math.cos((CRADLE.cableHoleDeg * Math.PI) / 180);
  const bottom = HEAD_Y.capTop - YAW.capThickness - YAW.mastPiece * 0.9;
  CORE_PHASES.forEach((ph, k) => {
    const a = (k * TAU) / 3;
    const ty = 0.0045 * Math.cos(a);
    const tz = 0.0045 * Math.sin(a);
    const pts = [
      new THREE.Vector3(xe, gy + ty, gz + tz),
      new THREE.Vector3(xe + 0.013, gy * 0.55 + ty, (gz + zc) / 2 + tz),
      new THREE.Vector3(xe + 0.034, yc + ty, zc + tz),
      new THREE.Vector3(-0.03, yc + ty, zc + tz),
      new THREE.Vector3(-0.011 + ty * 0.4, yc + ty * 0.5, YAW.holeZ + tz),
      new THREE.Vector3(ty, yc - 0.016, YAW.holeZ + tz),
      new THREE.Vector3(ty, HEAD_Y.beamBottom - 0.05, YAW.holeZ + tz),
      new THREE.Vector3(ty, bottom, YAW.holeZ + tz),
    ];
    g.add(mesh(tubeGeometry(pts, r, detail === 'site' ? 24 : 90, 6), mats[ph]));
  });
  return g;
}

/** The mast stub of the turbine world stands in a wooden block on the bench: the cable ends inside it. Size of the block, m. */
export const MAST_BLOCK = { size: 0.3, height: 0.15, sunk: 0.05 };
