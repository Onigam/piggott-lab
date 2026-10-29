import * as THREE from 'three';
import { MAT, group, mesh } from '@onigam/lab-kit/three';
import {
  AIR_GAP,
  CABLE,
  COIL_PHASE,
  CRADLE,
  HUB,
  M12,
  MAGNET,
  ROTOR_DISC,
  ROTOR_RODS,
  SHAFT,
  STACK,
  STATOR,
  STATOR_RODS,
} from '../dims';
import {
  DEG,
  TAU,
  crispRuns,
  cylinderX,
  discShape,
  extrudeX,
  lathe,
  nutX,
  polyHole,
  ringX,
  seg,
  shapePoint,
  solidX,
  tubeGeometry,
  type Detail,
} from '../common';

// The builders of the alternator parts, in the ALTERNATOR frame (docs in dims.ts): X along the stub axle, front towards -X, origin
// on the axis in the mid-plane of the stator, ψ from +Y towards +Z. Each builder returns a group at the origin; the model
// (model.ts) turns the rotating ones, merges them, registers them or embeds them in the turbine.

/** Warm amber of the polyester resin of the castings. */
export const resinMaterial = (): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color: 0xc98f3d, roughness: 0.32, metalness: 0 });

/** Angles ψ of the four long rotor rods (on the 100 mm circle), the eight magnets (every 45°), the six coils and the three stator rods. */
export const ROD_ANGLES = ROTOR_RODS.anglesDeg.map((a) => a * DEG);
export const MAGNET_ANGLES = Array.from({ length: MAGNET.count }, (_, k) => (k * TAU) / MAGNET.count);
export const COIL_ANGLES = Array.from({ length: STATOR.coilCount }, (_, k) => (k * TAU) / STATOR.coilCount);
export const STATOR_ROD_ANGLES = STATOR_RODS.anglesDeg.map((a) => a * DEG);

const yz = (r: number, psi: number): [number, number] => [r * Math.cos(psi), r * Math.sin(psi)];

// ---------------------------------------------------------------------------------------------------------- the coil outline

/** Outline of a winding in (t, r) relative to its own centre line: the 86 × 70 box cut by the neighbours, the rim and the central hole. */
export function coilOutline(): [number, number][] {
  const hw = STATOR.coilOutlineLength / 2;
  const wedge = (r: number) =>
    r * Math.tan(Math.PI / STATOR.coilCount) - STATOR.coilGap / 2 / Math.cos(Math.PI / STATOR.coilCount);
  const r0 = STATOR.coilInner;
  const r1 = STATOR.coilOuter;
  const side: [number, number][] = [];
  const hw0 = Math.min(hw, wedge(r0));
  side.push([hw0, r0]);
  if (wedge(r0) < hw) {
    // where the neighbour's edge meets the full width of the box
    side.push([
      hw,
      (hw + STATOR.coilGap / 2 / Math.cos(Math.PI / STATOR.coilCount)) / Math.tan(Math.PI / STATOR.coilCount),
    ]);
  }
  side.push([hw, Math.sqrt(r1 * r1 - hw * hw)]);
  const arc: [number, number][] = [];
  const a0 = Math.asin(hw / r1);
  for (let i = 1; i < 7; i++) {
    const a = a0 - (2 * a0 * i) / 7;
    arc.push([r1 * Math.sin(a), r1 * Math.cos(a)]);
  }
  const right = [...side, ...arc];
  const left = side
    .slice()
    .reverse()
    .map(([t, r]) => [-t, r] as [number, number]);
  return [...right, ...left];
}

/** The outline of coil k as shape-plane points (absolute, at angle ψ). */
const outlineAt = (psi: number): [number, number][] => coilOutline().map(([t, r]) => shapePoint(r, t, psi));

// ---------------------------------------------------------------------------------------------------------- shaft: stub axle + housing flange + cradle

export function buildShaft(detail: Detail): THREE.Group {
  const g = group('shaft');
  const steel = MAT.steel();
  const frame = MAT.steelBlack();
  const s = seg(detail, 36);
  // the stub axle of the car hub, solid, from the nut in front of the plate to the cradle
  g.add(mesh(cylinderX(SHAFT.diameter / 2, STACK.axleFront, STACK.cradleFront, seg(detail, 20)), steel));
  // flange of the hub housing, bolted on the cradle
  g.add(mesh(cylinderX(CRADLE.housingDiameter / 2, STACK.housingFront, STACK.cradleFront, s), steel));
  // the cradle: a 140 × 8 mm disc, four 12 mm holes on the 100 mm circle, a 3 mm centre hole, a hole for the cable
  const holes = [0, 90, 180, 270].map((a) => ({
    r: M12.clearanceHole / 2,
    at: shapePoint(STATOR_RODS.circleRadius, 0, a * DEG),
  }));
  const cableHole = {
    r: CRADLE.cableHole / 2,
    at: shapePoint(CRADLE.cableHoleRadius, 0, CRADLE.cableHoleDeg * DEG),
  };
  const centre = { r: CRADLE.centreHole / 2, at: [0, 0] as [number, number] };
  g.add(
    mesh(
      extrudeX(discShape(CRADLE.diameter / 2, [centre, cableHole, ...holes]), CRADLE.thickness, STACK.cradleFront, s),
      frame,
    ),
  );
  return g;
}

// ---------------------------------------------------------------------------------------------------------- hub bell (spins) + castle nut (fixed)

export function buildHub(detail: Detail): { spin: THREE.Group; fixed: THREE.Group } {
  const spin = group('bearing-hub-spin');
  const fixed = group('bearing-hub-fixed');
  const iron = MAT.laminations();
  const R = HUB.boreRadius;
  const s = seg(detail, 40);
  // the bell cut down to its flat plate, and the barrel that carries the bearings through the rotor and the stator
  spin.add(
    mesh(
      solidX(
        [
          [R, STACK.plateFront],
          [HUB.plateDiameter / 2, STACK.plateFront],
          [HUB.plateDiameter / 2, STACK.discFront],
          [HUB.barrelDiameter / 2, STACK.discFront],
          [HUB.barrelDiameter / 2, STACK.barrelBack],
          [R, STACK.barrelBack],
        ],
        s,
      ),
      iron,
    ),
  );
  const ri = SHAFT.diameter / 2;
  const nickel = MAT.nickel();
  const rollers = MAT.aluDark();
  // the castle nut presses the front bearing; the bearings are drawn turning (their inner races stay on the axle in fact)
  const nutX0 = STACK.axleFront;
  const b1 = nutX0 + HUB.nutThickness;
  const b2 = STACK.barrelBack - 0.0025 - HUB.bearingWidth;
  for (const bx of [b1, b2]) {
    spin.add(mesh(ringX(R, R - 0.003, bx, bx + HUB.bearingWidth, s), nickel));
    spin.add(mesh(ringX(R - 0.003, ri + 0.0026, bx + 0.001, bx + HUB.bearingWidth - 0.001, s), rollers));
    spin.add(mesh(ringX(ri + 0.0026, ri, bx, bx + HUB.bearingWidth, s), nickel));
  }
  fixed.add(mesh(nutX(HUB.nutAcrossFlats, HUB.nutThickness, SHAFT.diameter, nutX0, 1), MAT.steel()));
  // the four long rods (12 × 140 mm) and their 16 nuts: one nut cast in the rotor, one under the blade assembly, two on the front
  const zinc = MAT.zinc();
  const rod = cylinderX(ROTOR_RODS.diameter / 2, STACK.rodFront, STACK.rodBack, seg(detail, 12));
  const nut = nutX(M12.nutAcrossFlats, M12.nutThickness, 0, 0, 1);
  const washer = ringX(M12.washerOuter / 2, M12.diameter / 2, 0, M12.washerThickness, 16);
  const Rb = ROTOR_DISC.boltCircleDiameter / 2;
  for (const psi of ROD_ANGLES) {
    const [y, z] = yz(Rb, psi);
    spin.add(mesh(rod, zinc, [0, y, z]));
    if (detail === 'site') continue;
    const at = (x: number, geo: THREE.BufferGeometry, mat: THREE.Material, back = false) => {
      const m = mesh(geo, mat, [x, y, z]);
      m.rotation.x = psi + Math.PI / 6;
      if (back) m.rotation.z = Math.PI; // extends towards the front
      spin.add(m);
    };
    at(STACK.magnetBack, nut, zinc); // cast in the rotor, flush with the faces of the magnets
    at(STACK.plateFront, washer, zinc, true);
    at(STACK.plateFront - M12.washerThickness, nut, zinc, true);
    at(STACK.bladeFront, washer, zinc, true);
    at(STACK.bladeFront - M12.washerThickness, nut, zinc, true);
    at(STACK.bladeFront - M12.washerThickness - M12.nutThickness, nut, zinc, true);
  }
  return { spin, fixed };
}

// ---------------------------------------------------------------------------------------------------------- magnet rotor (spins)

/** One steel disc, its resin casting (a ring with a pocket for each magnet, a lip round the disc) on the face that looks at the stator. */
export function buildRotor(detail: Detail): THREE.Group {
  const g = group('magnet-rotor');
  const steel = MAT.steel();
  const resin = resinMaterial();
  const s = seg(detail, 48);
  const bolts = ROD_ANGLES.map((psi) => ({
    r: M12.diameter / 2,
    at: shapePoint(ROTOR_DISC.boltCircleDiameter / 2, 0, psi),
  }));
  const hole = { r: ROTOR_DISC.centreHole / 2, at: [0, 0] as [number, number] };
  g.add(
    mesh(
      extrudeX(discShape(ROTOR_DISC.diameter / 2, [hole, ...bolts]), ROTOR_DISC.thickness, STACK.discFront, s),
      steel,
    ),
  );
  const ring = discShape(ROTOR_DISC.castingDiameter / 2, []);
  const centre = new THREE.Path();
  centre.absarc(0, 0, ROTOR_DISC.resinInnerRadius, 0, TAU, true);
  ring.holes.push(centre);
  const hl = MAGNET.length / 2;
  const hw = MAGNET.width / 2;
  const c = MAGNET.centreRadius;
  for (const psi of MAGNET_ANGLES) {
    ring.holes.push(
      polyHole([
        shapePoint(c - hw, -hl, psi),
        shapePoint(c - hw, hl, psi),
        shapePoint(c + hw, hl, psi),
        shapePoint(c + hw, -hl, psi),
      ]),
    );
  }
  g.add(mesh(extrudeX(ring, MAGNET.thickness, STACK.magnetBack, s), resin));
  g.add(
    mesh(ringX(ROTOR_DISC.castingDiameter / 2, ROTOR_DISC.diameter / 2, STACK.discFront, STACK.magnetBack, s), resin),
  );
  return g;
}

// ---------------------------------------------------------------------------------------------------------- magnets (spin)

/** Colour of a magnet by the pole that faces the stator: red = north, blue = south, alternating round the disc. */
export const poleNorth = (k: number): boolean => k % 2 === 0;

export function buildMagnets(): THREE.Group {
  const g = group('magnets');
  const geo = new THREE.BoxGeometry(MAGNET.thickness, MAGNET.width, MAGNET.length);
  const north = MAT.magnetN();
  const south = MAT.magnetS();
  const x = STACK.magnetFace - MAGNET.thickness / 2;
  MAGNET_ANGLES.forEach((psi, k) => {
    const [y, z] = yz(MAGNET.centreRadius, psi);
    const m = mesh(geo, poleNorth(k) ? north : south, [x, y, z]);
    m.rotation.x = psi;
    g.add(m);
  });
  return g;
}

// ---------------------------------------------------------------------------------------------------------- stator

export function buildStator(detail: Detail): THREE.Group {
  const g = group('stator');
  const resin = resinMaterial();
  const s = seg(detail, 64);
  const outer = discShape(STATOR.outer / 2, []);
  const hub = new THREE.Path();
  hub.absarc(0, 0, STATOR.holeRadius, 0, TAU, true);
  outer.holes.push(hub);
  for (const psi of COIL_ANGLES) outer.holes.push(polyHole(outlineAt(psi)));
  g.add(mesh(extrudeX(outer, STATOR.thickness, -STATOR.thickness / 2, s), resin));
  // the resin that fills the hole of each coil, flush with both faces
  const core = new THREE.BoxGeometry(STATOR.thickness, STATOR.coilHoleWidth, STATOR.coilHoleLength);
  for (const psi of COIL_ANGLES) {
    const [y, z] = yz(MAGNET.centreRadius, psi);
    const c = mesh(core, resin, [0, y, z]);
    c.rotation.x = psi;
    g.add(c);
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------------- coils

export function buildCoils(): THREE.Group {
  const g = group('coils');
  const copper = MAT.copper();
  const hl = STATOR.coilHoleLength / 2;
  const hw = STATOR.coilHoleWidth / 2;
  const c = MAGNET.centreRadius;
  for (const psi of COIL_ANGLES) {
    const shape = new THREE.Shape(outlineAt(psi).map(([x, y]) => new THREE.Vector2(x, y)));
    shape.holes.push(
      polyHole([
        shapePoint(c - hw, -hl, psi),
        shapePoint(c - hw, hl, psi),
        shapePoint(c + hw, hl, psi),
        shapePoint(c + hw, -hl, psi),
      ]),
    );
    g.add(mesh(extrudeX(shape, STATOR.thickness, -STATOR.thickness / 2, 12), copper));
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------------- star wiring

/** The straight run of the three-core cable behind the cradle starts here (alternator frame x). */
export const CABLE_EXIT_X = STACK.cradleBack + 0.012;
/** Where the three cores gather, ψ = 300°, r = 40 mm (the hole of the cradle). */
const gland = (): [number, number] => yz(CRADLE.cableHoleRadius, CRADLE.cableHoleDeg * DEG);

/**
 * Series star (S3 steps 12-13, S4 p. 46), drawn legibly, the real links are cast in the resin. Each phase joins two opposite coils
 * (n, n + 3) by a half hoop round the rim, at its own height on the edge. The inner ends of coils 0, 1, 2 meet on a ring on the
 * rear face (the neutral point, black). The inner ends of coils 3, 4, 5 are the outputs: three leads on the rear face gather at
 * the gland (ψ = 300°) and leave through the hole of the cradle as the three cores of the cable.
 */
export function buildWiring(): THREE.Group {
  const g = group('star-wiring');
  const rRim = STATOR.outer / 2 + 0.0011;
  const rod = 0.0011;
  const phaseMaterial = { A: MAT.cableRed(), B: MAT.warningYellow(), C: MAT.cableBlue() };
  const place = (geo: THREE.BufferGeometry, mat: THREE.Material) => g.add(mesh(geo, mat));
  const band: Record<'A' | 'B' | 'C', number> = { A: -0.0035, C: 0, B: 0.0035 };
  for (const ph of ['A', 'B', 'C'] as const) {
    const [first] = COIL_PHASE.map((p, k) => [p, k] as const)
      .filter(([p]) => p === ph)
      .map(([, k]) => k);
    const a0 = COIL_ANGLES[first];
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const [y, z] = yz(rRim, a0 + (Math.PI * i) / 12);
      pts.push(new THREE.Vector3(band[ph], y, z));
    }
    place(tubeGeometry(pts, rod, 32, 6), phaseMaterial[ph]);
    for (const a of [a0, a0 + Math.PI]) {
      const [y, z] = yz(STATOR.outer / 2, a);
      const t = mesh(new THREE.CylinderGeometry(rod, rod, 0.0024, 6), phaseMaterial[ph], [band[ph], y, z]);
      t.rotation.x = a;
      g.add(t);
    }
  }
  // neutral: inner ends of coils 0, 1, 2 joined by an arc on the rear face
  const xRear = STACK.statorHalf - 0.0006;
  const rStar = STATOR.coilInner - 0.002;
  const arc: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const [y, z] = yz(rStar, COIL_ANGLES[0] + ((COIL_ANGLES[2] - COIL_ANGLES[0]) * i) / 8);
    arc.push(new THREE.Vector3(xRear, y, z));
  }
  place(tubeGeometry(arc, CABLE.leadDiameter / 2, 16, 6), MAT.cableBlack());
  // outputs: inner ends of coils 3, 4, 5, over the rear face to the gland, then the cores through the cradle
  const [gy, gz] = gland();
  const triangle = (k: number) => {
    const a = (k * TAU) / 3;
    return [0.0045 * Math.cos(a), 0.0045 * Math.sin(a)] as const;
  };
  [3, 4, 5].forEach((ci, k) => {
    const mat = phaseMaterial[COIL_PHASE[ci]];
    const psi = COIL_ANGLES[ci];
    const rr = CRADLE.cableHoleRadius - 0.002 + k * 0.002;
    const pts: THREE.Vector3[] = [new THREE.Vector3(xRear, ...yz(STATOR.coilInner, psi))];
    pts.push(new THREE.Vector3(xRear, ...yz(rr, psi)));
    const steps = 4;
    const target = CRADLE.cableHoleDeg * DEG;
    for (let i = 1; i <= steps; i++) pts.push(new THREE.Vector3(xRear, ...yz(rr, psi + ((target - psi) * i) / steps)));
    place(tubeGeometry(pts, CABLE.leadDiameter / 2, 24, 6), mat);
    const [ty, tz] = triangle(k);
    place(
      tubeGeometry(
        [
          new THREE.Vector3(xRear, gy + ty, gz + tz),
          new THREE.Vector3(STACK.cradleFront, gy + ty, gz + tz),
          new THREE.Vector3(STACK.cradleBack, gy + ty, gz + tz),
          new THREE.Vector3(CABLE_EXIT_X, gy + ty, gz + tz),
        ],
        CABLE.coreDiameter / 2,
        12,
        6,
      ),
      mat,
    );
  });
  return g;
}

// ---------------------------------------------------------------------------------------------------------- studs: the three stator rods

/** M12 × 70 rods, slotted at the rear end, cast into the stator, through the cradle; two nuts on the stator side and one behind the cradle set the gap. */
export function buildRods(): THREE.Group {
  const g = group('studs');
  const rod = cylinderX(STATOR_RODS.diameter / 2, STACK.statorRodFront, STACK.statorRodBack, 12);
  const nut = nutX(M12.nutAcrossFlats, M12.nutThickness, 0, 0, 1);
  const washer = ringX(M12.washerOuter / 2, M12.diameter / 2, 0, M12.washerThickness, 16);
  const zinc = MAT.zinc();
  const dark = MAT.steelBlack();
  for (const psi of STATOR_ROD_ANGLES) {
    const [y, z] = yz(STATOR_RODS.circleRadius, psi);
    g.add(mesh(rod, zinc, [0, y, z]));
    // the screwdriver slot at the rear end
    const slot = mesh(new THREE.BoxGeometry(STATOR_RODS.slot, 0.002, STATOR_RODS.diameter + 0.001), dark, [
      STACK.statorRodBack - STATOR_RODS.slot / 2,
      y,
      z,
    ]);
    slot.rotation.x = psi;
    g.add(slot);
    const at = (x: number, geo: THREE.BufferGeometry, mat: THREE.Material, towardsFront = false) => {
      const m = mesh(geo, mat, [x, y, z]);
      m.rotation.x = psi + Math.PI / 6;
      if (towardsFront) m.rotation.z = Math.PI;
      g.add(m);
    };
    // behind the stator: a washer and a nut that hold it; in front of the cradle: a lock nut; behind the cradle: a nut
    at(STACK.statorHalf, washer, zinc);
    at(STACK.statorHalf + M12.washerThickness, nut, zinc);
    at(STACK.cradleFront, nut, zinc, true);
    at(STACK.cradleBack, washer, zinc);
    at(STACK.cradleBack + M12.washerThickness, nut, zinc);
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------------- air gap gauge

/** A feeler gauge: a 1 mm brass leaf slid in the gap from above, with its folded tab. The gap is the thing it measures, not a solid. */
export function buildGauge(): THREE.Group {
  const g = group('air-gap');
  const brass = MAT.brass();
  const x = STACK.magnetFace + AIR_GAP / 2;
  const leaf = AIR_GAP * 0.8;
  g.add(mesh(new THREE.BoxGeometry(leaf, GAUGE.y1 - GAUGE.y0, 0.014), brass, [x, (GAUGE.y0 + GAUGE.y1) / 2, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.014, 0.0012, 0.014), brass, [x - 0.007, GAUGE.y1 + 0.001, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.014, 0.0012, 0.014), MAT.steelBlack(), [x - 0.007, GAUGE.y1 + 0.0024, 0]));
  return g;
}

/** Sizes of the leaf: it enters the gap from r = 101 mm and leaves the rim (r = 132 mm) by 20 mm. */
export const GAUGE = { y0: 0.101, y1: 0.152 };

// ---------------------------------------------------------------------------------------------------------- moulds

/** The two moulds of the resin work, lying on the bench: rotor (ring cavity with the magnets in place) and stator (coil blocks and rod pins). */
/** Where the moulds lie on the bench (stacked, the stator mould on the rotor mould): x and depth z of their common axis. */
export const MOULD_LAYOUT = { x: 0.3, z: 0 };

export function buildMoulds(): THREE.Group {
  const g = group('moulds');
  const ply = MAT.woodLight();
  const dark = MAT.woodDark();
  const grey = MAT.printGrey();
  const north = MAT.magnetN();
  const pin = MAT.zinc();
  const flat = (r: number, h: number, mat: THREE.Material, x: number, y: number, z = 0) =>
    g.add(mesh(new THREE.CylinderGeometry(r, r, h, 48), mat, [x, y + h / 2, z]));
  const wall = (ro: number, ri: number, h: number, x: number, y: number, z: number) =>
    g.add(
      mesh(
        lathe(
          crispRuns([
            [ri, 0],
            [ro, 0],
            [ro, h],
            [ri, h],
          ]),
          48,
        ),
        dark,
        [x, y, z],
      ),
    );
  // rotor mould
  const r0: [number, number] = [MOULD_LAYOUT.x, MOULD_LAYOUT.z];
  flat(0.15, 0.02, ply, r0[0], 0, r0[1]);
  wall(0.128, 0.12, 0.02, r0[0], 0.02, r0[1]);
  flat(ROTOR_DISC.centreHole / 2, 0.03, dark, r0[0], 0.02, r0[1]);
  const block = new THREE.BoxGeometry(MAGNET.length, MAGNET.thickness, MAGNET.width);
  MAGNET_ANGLES.forEach((psi) => {
    const m = mesh(block, north, [
      r0[0] + MAGNET.centreRadius * Math.sin(psi),
      0.02 + MAGNET.thickness / 2,
      r0[1] + MAGNET.centreRadius * Math.cos(psi),
    ]);
    m.rotation.y = psi;
    g.add(m);
  });
  // stator mould: the two moulds are stored one on the other, the stator mould resting on the rim of the rotor mould
  const sy = 0.04;
  const s0: [number, number] = [MOULD_LAYOUT.x, MOULD_LAYOUT.z];
  flat(0.16, 0.02, ply, s0[0], sy, s0[1]);
  wall(0.138, 0.131, 0.025, s0[0], 0.02 + sy, s0[1]);
  flat(STATOR.holeRadius, 0.02, dark, s0[0], 0.02 + sy, s0[1]);
  COIL_ANGLES.forEach((psi) => {
    const shape = new THREE.Shape(coilOutline().map(([t, r]) => new THREE.Vector2(t, r)));
    shape.holes.push(
      polyHole([
        [-STATOR.coilHoleLength / 2, MAGNET.centreRadius - STATOR.coilHoleWidth / 2],
        [STATOR.coilHoleLength / 2, MAGNET.centreRadius - STATOR.coilHoleWidth / 2],
        [STATOR.coilHoleLength / 2, MAGNET.centreRadius + STATOR.coilHoleWidth / 2],
        [-STATOR.coilHoleLength / 2, MAGNET.centreRadius + STATOR.coilHoleWidth / 2],
      ]),
    );
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.011, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); // shape (t, r) -> (x, -z); stands up
    const m = mesh(geo, grey, [s0[0], 0.02 + sy, s0[1]]);
    m.rotation.y = psi + Math.PI;
    g.add(m);
  });
  for (const psi of STATOR_ROD_ANGLES) {
    g.add(
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), pin, [
        s0[0] + STATOR_RODS.circleRadius * Math.sin(psi),
        0.055 + sy,
        s0[1] + STATOR_RODS.circleRadius * Math.cos(psi),
      ]),
    );
  }
  return g;
}
