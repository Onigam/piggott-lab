// The single source of dimensions of the 3D worlds, in metres (BRIEF §5). The five worlds, the part sheets and the drawings
// all read these constants; nothing is retyped elsewhere. Whatever `src/sim/machine.ts` already knows (rotor diameter, blade
// count, magnets, coils, stator size, offset, hinge angles) is IMPORTED from there, never repeated; this file only adds
// geometry.
//
// The machine is the one of the video: the Low-tech Lab wiki (S3) for the layout and the 1.2 m sizes, the maker's plans (S4,
// small machine supplement p. 43-49) for the numbers the wiki does not give. Provenance of every value, in its comment:
//   reported (Kn, Sn …)   stated in a source (K-number of research §2, S-number of §1, page of the plans S4)
//   derived (…)           computed from reported figures, the computation is given
//   estimate: …           the sources are silent: a guess with its reasoning. Part sheets and drawings must flag these.
//
// Frames
//   alternator frame  X along the stub axle, FRONT (the wind side, the blades) towards -X, the rear (cradle, frame, tail)
//                     towards +X; origin on the axis in the mid-plane of the stator; Y up, Z towards the viewer. The section
//                     plane of the section tool is z = 0. Angles ψ are measured from +Y towards +Z.
//   head frame        the alternator frame moved so that the origin is on the YAW axis at the height of the axle: the axle is at
//                     (y, z) = (0, +offset) and the stator mid-plane at x = HEAD.statorX. The wind blows towards +X (the rotor
//                     faces -X). The head turns about +Y by `yaw`.
//   rotor frame       X along the axle, origin on the rear face of the plywood disc (x' = 0); the disc, the blade roots and the
//                     plywood triangle lie at x' <= 0 (in front).
//   site frame        X = the direction the wind blows towards (it comes from the west), Y up, Z south, origin on the ground
//                     at the foot of the mast.
//
// The partition of the alternator world (docs/3d.md):
//   shaft         stub axle ("fusée") + the car-hub housing flange + the steel cradle it is screwed on (⌀ 140 × 8 mm)
//   bearing-hub   hub bell (flat plate and barrel) + its two bearings and castle nut + the 4 long M12 rods with their 16 nuts
//   magnet-rotor  230 × 6 mm steel disc + resin casting       magnets   the 8 neodymium blocks
//   stator        resin casting (the 3 rods are cast in)      coils     the 6 coils      star-wiring  links, neutral, 3-core cable
//   studs         the 3 slotted M12 × 70 stator rods, with their nuts (they set the air gap)
//   air-gap       a feeler gauge (1 mm leaf)                   moulds    the rotor and stator moulds

import {
  BLADE_COUNT,
  COIL_COUNT,
  COIL_FORMER,
  COIL_HOLE_LENGTH,
  COIL_HOLE_WIDTH,
  COIL_OUTLINE_LENGTH,
  COIL_OUTLINE_WIDTH,
  DIAMETER_REF,
  HINGE_TILT_DEG,
  MAGNETS_PER_DISC,
  OFFSET_REF,
  STATOR_OUTER,
  TAIL_REST_DEG,
  TAIL_SWING_DEG,
} from '../sim/machine';

const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ hardware

/** Metric hardware (catalogue sizes). estimate: standard parts; the sources name M12 for the rods, the discs and the cradle holes. */
export const M12 = {
  diameter: 0.012,
  clearanceHole: 0.013,
  nutAcrossFlats: 0.019,
  nutThickness: 0.01,
  washerOuter: 0.024,
  washerThickness: 0.0025,
} as const;

// ------------------------------------------------------------------------------------------------ blades (rotor frame)

export const BLADE = {
  count: BLADE_COUNT,
  /** Blade length from the centre of the hub to the tip, m. reported: K4 (600 mm after trimming) = the rotor radius. */
  length: DIAMETER_REF / 2,
  /**
   * The six stations of the plans (S4 p. 43, 1.2 m machine), root to tip. Width of the plank, vertical drop of the trailing
   * edge from the flat bench, and thickness, all reported (K5); the first station is the uncarved root (no drop). The
   * radii of the stations are an estimate: S4 marks a scale every 100 mm and the tip is at 600 mm, so station i is at 100·i mm.
   */
  stationRadius: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  stationWidth: [0.153, 0.153, 0.1, 0.08, 0.065, 0.055],
  stationDrop: [0, 0.045, 0.019, 0.01, 0.006, 0.003],
  stationThickness: [0.049, 0.022, 0.014, 0.01, 0.008, 0.006],
  /** The root block is the plank as it comes: 153 mm × 49 mm. derived: the first station (the wiki says 150 × 45). */
  rootWidth: 0.153,
  rootThickness: 0.049,
  /** Angle of the cut at the root: three blades make 120° each. reported: S3 step 4-5 (120°) = 360° / count. */
  rootAngleDeg: 360 / BLADE_COUNT,
  /** Where the thickest point of a section lies, as a share of the chord from the leading edge. estimate: a flat-bottomed wing section. */
  camberPoint: 0.3,
  /** Timber blank of one blade: the root section × this length. estimate: the 600 mm blade plus 50 mm to trim the tip (S3 step 2: "4-5 cm" extra at the tip). */
  blankLength: 0.65,
  /** Thickness of a station template (plywood cut-out). estimate. */
  templateThickness: 0.004,
} as const;

/** Pitch of the flat face to the rotor plane at a station, rad. derived: atan(drop / width) of the plans' table. */
export const bladePitch = (i: number): number => Math.atan2(BLADE.stationDrop[i], BLADE.stationWidth[i]);

/**
 * The plywood that clamps the three roots: a disc on the extrados (rear) side, against the rods' first nuts, and a triangle on the
 * intrados (front) side. reported: S3 step 6 (9 mm plywood; the disc has a 60 mm recess for the hub). The diameter of the disc is
 * not in the wiki: 200 mm, estimate taken from the plans (S4 p. 43, a 200 mm disc). Triangle: estimate (circumradius 120 mm).
 */
export const HUB_DISC = {
  diameter: 0.2,
  thickness: 0.009,
  /** Hole for the front of the hub. reported: S3 step 7 (60 mm); 64 mm drawn for clearance. */
  recess: 0.064,
  triangleRadius: 0.12,
  triangleThickness: 0.009,
} as const;

// ------------------------------------------------------------------------------------------------ magnet rotor

export const ROTOR_DISC = {
  /** Steel disc. reported: K6 (230 mm × 6 mm), four 12 mm holes on a 100 mm circle (S3 step 17). */
  diameter: 0.23,
  thickness: 0.006,
  /** Outer diameter of the resin casting. reported: S4 p. 44 (240 mm). */
  castingDiameter: 0.24,
  boltCircleDiameter: 0.1,
  boltCount: 4,
  /** Hole in the middle for the barrel of the hub. estimate: 64 mm round a 60 mm barrel (S4 gives 1½ in for the 1 in shaft of the plans). */
  centreHole: 0.064,
  /** Inner radius of the resin ring ("keep the central part clear of resin", S4 p. 44). estimate: outside the nuts on the bolt circle. */
  resinInnerRadius: 0.062,
} as const;

export const MAGNET = {
  count: MAGNETS_PER_DISC,
  /** 46 × 30 × 10 mm, N40. reported: K6. The long side is tangential, the 30 mm side radial (estimate: it matches the pole pitch). */
  length: COIL_HOLE_LENGTH,
  width: COIL_HOLE_WIDTH,
  thickness: 0.01,
  /** Radius of the centre of the magnets. estimate: 95 mm puts them between the bolt circle (r = 50 + nuts) and the 115 mm rim. */
  centreRadius: 0.095,
} as const;

/** Gap between the faces of the magnets and the stator. reported: K11 (about 1 mm), set with the stator nuts (S3 step 26). */
export const AIR_GAP = 0.001;

/** The 4 long rods of the rotor and their nuts. reported: S3 step 26 (four 12 × 140 mm rods and 16 nuts: 4 per rod). */
export const ROTOR_RODS = {
  count: 4,
  length: 0.14,
  diameter: M12.diameter,
  nutsPerRod: 4,
  /** Angles ψ of the four rods on the 100 mm circle (between the stator rods and the cut plane). */
  anglesDeg: [45, 135, 225, 315],
} as const;

// ------------------------------------------------------------------------------------------------ stator

export const STATOR = {
  outer: STATOR_OUTER,
  /** Thickness of the cast disc = the coil former. reported: S4 p. 46 (11 mm). */
  thickness: COIL_FORMER,
  /** Hole in the middle for the barrel of the hub (⌀ 63). estimate: 1.5 mm clear of the 60 mm barrel. */
  holeRadius: 0.0315,
  coilCount: COIL_COUNT,
  /** Hole of a coil = the footprint of a magnet, filled with resin. reported: K6, S4 p. 46. */
  coilHoleLength: COIL_HOLE_LENGTH,
  coilHoleWidth: COIL_HOLE_WIDTH,
  /** Outline of a winding as dimensioned (3½ × 2½ in). reported: S4 p. 46. Drawn clipped by the neighbours and the rim. */
  coilOutlineLength: COIL_OUTLINE_LENGTH,
  coilOutlineWidth: COIL_OUTLINE_WIDTH,
  /** Radial extent of a winding: outside the inner ring and the rods, inside the rim. derived: the 70 mm outline cut to 65 mm by the rim (r = 127.5 mm). */
  coilInner: 0.0625,
  coilOuter: 0.1275,
  /** Gap between neighbouring windings, m. estimate. */
  coilGap: 0.0015,
} as const;

/** Coil k sits at ψ = 60°·k (coil 0 straight up). Series star: phase A = coils 0 + 3, B = 2 + 5, C = 1 + 4 (4 pole pairs: 240° of electrical angle per coil). */
export const COIL_PHASE = ['A', 'C', 'B', 'A', 'C', 'B'] as const;

/**
 * The three stator rods: M12 × 70 mm, slotted at one end, cast into the stator and nutted on the cradle. reported: S3 steps 9, 15,
 * 26. They stand on the 100 mm circle of the cradle's holes (S3 step 8: four 12 mm holes; one is lost under the weld of the angle
 * iron, so the rods use the other three: ψ = 0°, 90°, 270°). estimate: the circle is the 100 mm of the hub's bolts.
 */
export const STATOR_RODS = {
  count: 3,
  length: 0.07,
  diameter: M12.diameter,
  circleRadius: 0.05,
  anglesDeg: [0, 90, 270],
  /** Slot cut at the end that screws into the cradle. reported: S3 step 9 (10 mm). */
  slot: 0.01,
} as const;

// ------------------------------------------------------------------------------------------------ the stack (alternator frame)

const statorHalf = COIL_FORMER / 2;
const magnetFace = -(statorHalf + AIR_GAP);
const magnetBack = magnetFace - MAGNET.thickness;
const discFront = magnetBack - ROTOR_DISC.thickness;

export const HUB = {
  /** Flat plate of the hub bell (the bell is cut down to it, S3 step 18) and its barrel with the bearings. estimate: a small car hub. */
  plateDiameter: 0.13,
  plateThickness: 0.0075,
  barrelDiameter: 0.06,
  boreRadius: 0.0235,
  bearingWidth: 0.012,
  /** Castle nut on the end of the stub axle. estimate. */
  nutAcrossFlats: 0.036,
  nutThickness: 0.012,
} as const;

const plateFront = discFront - HUB.plateThickness;
/** Clamp stack of a rod in front of the plate: a washer and a nut (the blade assembly rests on it). */
const stackFront = M12.washerThickness + M12.nutThickness;
const bladeOrigin = plateFront - stackFront;

export const CRADLE = {
  /** Steel disc welded to the end of the angle iron, 12 mm holes, a 3 mm centre hole. reported: S3 step 8 (⌀ 140 × 8 mm). */
  diameter: 0.14,
  thickness: 0.008,
  centreHole: 0.003,
  /** Hole for the three-core cable, ψ = 300°, r = 40 mm. estimate. */
  cableHole: 0.014,
  cableHoleRadius: 0.04,
  cableHoleDeg: 300,
  /** Flange of the car-hub housing bolted to the front face. estimate. */
  housingDiameter: 0.08,
  housingThickness: 0.01,
} as const;

/**
 * X positions in the alternator frame, m. The front is negative. Everything follows from the reported thicknesses; the hub sizes
 * are estimates (a small car hub). The stator rods run 11 mm through the stator, 34.5 mm to the cradle and 12.5 mm past it.
 */
export const STACK = {
  statorHalf,
  /** Faces of the magnets, the steel disc, the hub plate. */
  magnetFace,
  magnetBack,
  discFront,
  plateFront,
  /** Hub barrel: from the plate backwards through the rotor and the stator, ending 0.5 mm before the housing flange. */
  barrelBack: statorHalf + 0.024,
  /** Housing flange and cradle (front and back faces). */
  housingFront: statorHalf + 0.024 + 0.0005,
  cradleFront: statorHalf + 0.024 + 0.0005 + CRADLE.housingThickness,
  cradleBack: statorHalf + 0.024 + 0.0005 + CRADLE.housingThickness + CRADLE.thickness,
  /** Stub axle: from the cradle to the nut in front of the plate (10.5 mm in front of the plate). */
  axleFront: plateFront - 0.0105,
  /** Rotor rods: from the nuts cast in the rotor (flush with the magnet faces) forward. */
  rodBack: magnetFace,
  rodFront: magnetFace - ROTOR_RODS.length,
  /** Origin of the rotor frame (rear face of the plywood disc) and the front of the blade assembly. */
  bladeOrigin,
  bladeFront: bladeOrigin - HUB_DISC.thickness - BLADE.rootThickness - HUB_DISC.triangleThickness,
  /** Stator rods: front end flush with the stator face, 70 mm long. */
  statorRodFront: -statorHalf,
  statorRodBack: -statorHalf + STATOR_RODS.length,
} as const;

export const SHAFT = {
  /** Stub axle ("fusée") of the car hub, solid. estimate: ⌀ 25.4 mm, the bore of a small hub bearing. */
  diameter: 0.0254,
} as const;

// ------------------------------------------------------------------------------------------------ nacelle, yaw, tail (head frame)

export const NACELLE = {
  /** Angle iron 50 × 50 × 6 mm, 206 mm, horizontal leg on top, vertical leg hanging on the +Z side. reported: S3 step 24, S4 p. 47. */
  leg: 0.05,
  thickness: 0.006,
  length: 0.206,
} as const;

export const HEAD = {
  /** X of the yaw axis in the alternator frame: under the middle of the angle iron, which starts at the back of the cradle. estimate (S3 only says "centred on the 14 mm hole"). */
  yawAltX: STACK.cradleBack + NACELLE.length / 2,
  /** X of the stator mid-plane in the head frame (the head origin is on the yaw axis). */
  statorX: -(STACK.cradleBack + NACELLE.length / 2),
  /** Offset of the axle from the yaw axis. reported: K13 (41 mm); machine.ts has it. */
  offset: OFFSET_REF,
  /** Z of the beam's horizontal leg: it covers the yaw pipe on one side and carries the cradle on the other. estimate. */
  beamZ0: -0.005,
} as const;

export const YAW = {
  /** Yaw pipe (welded under the beam, centred on the 14 mm hole) 42.2 mm, 100 mm long, over a 33.4 mm pipe. reported: S3 step 24, S4 p. 47. */
  pipeOuter: 0.0422,
  pipeWall: 0.00356,
  pipeLength: 0.1,
  stubOuter: 0.0334,
  stubWall: 0.0032,
  /** Collar welded on the stub under the pipe + a 2 mm thrust washer: the head's weight rests on them. estimate. */
  collarOuter: 0.05,
  collarHeight: 0.02,
  washerThickness: 0.002,
  /** Stub between the collar and the mast cap. estimate. */
  stubBelowCollar: 0.02,
  /** Mast top: a 6 mm cap on the 60.3 mm mast pipe. estimate. */
  capThickness: 0.006,
  /** Length of mast pipe drawn under the cap in the turbine world. estimate. */
  mastPiece: 0.5,
  /** Hole in the beam for the cable, over the pipe. reported: S3 step 24 (14 mm); its centre (Z) is an estimate. */
  cableHole: 0.014,
  holeZ: 0.004,
} as const;

/** Heights in the head frame (y = 0 at the axle axis), derived from the sizes above. */
export const HEAD_Y = {
  beamTop: -SHAFT.diameter / 2,
  beamBottom: -SHAFT.diameter / 2 - NACELLE.thickness,
  pipeBottom: -SHAFT.diameter / 2 - NACELLE.thickness - YAW.pipeLength,
  /** Top of the mast cap: where the mast pipe ends. Hub height of the site = the mast top + this. */
  capTop:
    -SHAFT.diameter / 2 -
    NACELLE.thickness -
    YAW.pipeLength -
    YAW.washerThickness -
    YAW.collarHeight -
    YAW.stubBelowCollar,
} as const;

export const TAIL = {
  /** Hinge axis: 20° from the vertical, its plan view at 55° to the axle, leaning towards the rear and the -Z side. reported: K13. */
  tiltDeg: HINGE_TILT_DEG,
  planDeg: 55,
  /** Boom at rest: 80° to the rotor plane = 10° to the axle, on the +Z side. reported: K13 (machine.ts TAIL_REST_DEG). */
  restDeg: TAIL_REST_DEG,
  /** Swing to the furled position. reported: K13 (95°). */
  swingDeg: TAIL_SWING_DEG,
  /** Boom: a 33.4 mm pipe, 500 mm (S4; the wiki says 700). reported: K13. */
  boomOuter: 0.0334,
  boomWall: 0.0032,
  boomLength: 0.5,
  /** T-bar welded across the end of the boom, vertical at rest: 12 in × 1 in × ¼ in. reported: S4 p. 48. */
  barLength: 0.3,
  barWidth: 0.025,
  barThickness: 0.006,
  /** Vane: 0.135 m² of 6 mm plywood, 18 × 12 in, bolted to the T-bar and extending behind it. reported: S4 p. 47-49 (K13), S3 step 25 (6 mm); 0.45 × 0.30 m is the same area in the same proportion. */
  vaneLength: 0.45,
  vaneHeight: 0.3,
  vaneThickness: 0.006,
  /** Hinge: a 33.4 mm pipe of 150 mm fixed to the frame, a 42.2 mm sleeve of 130 mm turning on it, a 6 mm cap plate. reported: S3 step 24-25, S4 p. 47. */
  innerLength: 0.15,
  sleeveLength: 0.13,
  sleeveOuter: 0.0422,
  sleeveWall: 0.00356,
  capThickness: 0.006,
  /** Plate welded between the inner pipe and the end of the angle iron (S4: at 20°, half the size of the big machine's). estimate. */
  plateWidth: 0.05,
  plateThickness: 0.006,
  /** The notch of the sleeve rides on a pin of the inner pipe. estimate. */
  pinDiameter: 0.01,
  /** Centre of the sleeve, head frame: 35 mm behind the end of the angle iron, at the level of its middle. estimate. */
  pivotBehind: 0.035,
  hingeZ: 0.0,
} as const;

/** Centre of the hinge sleeve in the head frame. derived. */
export const tailPivot = (): [number, number, number] => [
  HEAD.statorX + STACK.cradleBack + NACELLE.length + TAIL.pivotBehind,
  (HEAD_Y.beamTop + HEAD_Y.beamBottom) / 2,
  TAIL.hingeZ,
];

/** Hinge axis (unit, pointing up) and the boom direction at rest in the head frame. derived from TAIL: the numbers of K13. */
export function tailAxis(): [number, number, number] {
  const t = TAIL.tiltDeg * DEG;
  const b = -TAIL.planDeg * DEG;
  return [Math.sin(t) * Math.cos(b), Math.cos(t), Math.sin(t) * Math.sin(b)];
}
export function tailRestDirection(): [number, number, number] {
  const a = (90 - TAIL.restDeg) * DEG;
  return [Math.cos(a), 0, Math.sin(a)];
}

export const CABLE = {
  /** Three-core flexible cable of 2.5 mm². reported: S3 step 13. Outer diameter of a core with its insulation: estimate. */
  coreDiameter: 0.0045,
  /** Magnet-wire leads inside the stator casting (two strands of the 1.4 mm wire). estimate. */
  leadDiameter: 0.0022,
} as const;

// ------------------------------------------------------------------------------------------------ site

export const MAST = {
  /** Mast: 60 mm steel pipe (2 in, 60.3 mm). reported: S4 p. 40. It grows with the rotor (see `mastRadius`). */
  pipeOuter: 0.0603,
  pipeWall: 0.0039,
  /** Guys every ~4 m, four per level, from the top down. reported: K24 / S4 p. 40 (tower page of the large machine, assumed alike). */
  guySpacing: 4,
  guyAzimuthsDeg: [45, 135, 225, 315],
  /** Distance of an anchor from the mast as a share of its guy's height. estimate: 0.7 gives guys at 55° to the ground. */
  guyAnchorRatio: 0.7,
  guyDiameter: 0.004,
  /** Smallest drawn width of a thin line on screen (guys, mast and cable seen from afar), pixels. Visual only. */
  minPixels: 2.2,
  /** Hinged base: a concrete pad with two steel lugs and a cross pin, so the mast can be lowered. estimate. */
  padSize: 0.9,
  padHeight: 0.35,
  padAbove: 0.1,
  lugHeight: 0.22,
  pinDiameter: 0.024,
} as const;

/** Radius of the mast pipe at a rotor diameter: the mast grows with the machine (1.2 m: 60.3 mm). estimate: the sources size only the small machine. */
export const mastRadius = (diameter: number): number => (MAST.pipeOuter / 2) * (diameter / DIAMETER_REF);

export const SHED = {
  /** The battery shed, cut open at the front. estimate: a garden shed of 2.6 × 1.8 m. */
  x: 5.5,
  z: 9,
  width: 2.6,
  depth: 1.8,
  wallHeight: 2.2,
  /** Plywood board that carries the devices, on the back wall: lower edge, height, width. estimate. */
  boardBottom: 0.75,
  boardHeight: 1.15,
  boardWidth: 2.2,
  /** Cable run from the foot of the mast to the shed: L-shaped, about 15 m with the wiring inside. estimate (the default cable length of the presets). */
  cableRadius: 0.012,
} as const;

export const HOUSE = {
  /** The house the battery serves. estimate. */
  x: 21,
  z: 10,
  length: 8,
  width: 5,
  wallHeight: 2.6,
  ridgeRise: 1.7,
} as const;

export const OBSTACLES = {
  /** Trees and hedges near the mast: how many, and the ring they stand in (distance from the mast). estimate. */
  count: 40,
  minRadius: 8,
  maxRadius: 34,
  /** Share of the tree height taken by the trunk. estimate. */
  trunkShare: 0.35,
  seed: 20261029,
} as const;

/** The wind sock near the shed (it points the same way for the whole run). estimate. */
export const WINDSOCK = { x: 2.5, z: 5.5, poleHeight: 4.5, length: 1.3, mouth: 0.36 } as const;

/**
 * The devices on the board of the shed, in the frame of the shed (origin on the floor at the middle, +Z towards the viewer,
 * +X to the right). Each box is width × height × depth; `x` is its centre along the board, `y` the height of its centre.
 * Sizes are estimates (catalogue sizes of a 20 A switch, a rectifier on a heatsink, a 12 V controller, a 12 V 100 Ah battery;
 * the simulation default is ONE 100 Ah battery).
 */
export const DEVICES = {
  brakeSwitch: { w: 0.14, h: 0.16, d: 0.09, x: -0.9, y: 1.55 },
  rectifier: { w: 0.16, h: 0.12, d: 0.065, x: -0.52, y: 1.55 },
  fuse: { w: 0.1, h: 0.05, d: 0.05, x: -0.16, y: 1.55 },
  controller: { w: 0.2, h: 0.14, d: 0.06, x: 0.3, y: 1.5 },
  dumpLoad: { w: 0.3, h: 0.2, d: 0.1, x: 0.86, y: 1.4 },
  /** One 12 V 100 Ah battery on the floor in front of the board. */
  battery: { w: 0.41, h: 0.22, d: 0.17, x: -0.35, z: -0.5 },
  /** LED bar of the state of charge, on the board above the battery. */
  monitor: { w: 0.3, h: 0.05, d: 0.02, x: -0.35, y: 0.95 },
} as const;
