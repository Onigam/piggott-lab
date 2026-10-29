import * as THREE from 'three';
import { MAT, group } from '@onigam/lab-kit/three';
import type { PartRegistry } from '@onigam/lab-kit/three';
import { partIds } from '../../part-ids';
import { CRADLE, HUB, MAGNET, ROTOR_DISC, SHAFT, STACK, STATOR, STATOR_RODS } from '../dims';
import type { Detail } from '../common';
import { CutKit, rect, type Poly } from '../cut';
import { mergeStatic } from '../merge';
import { anchor } from '../world';
import {
  buildCoils,
  buildGauge,
  buildHub,
  buildMagnets,
  buildMoulds,
  buildRods,
  buildRotor,
  buildShaft,
  buildStator,
  buildWiring,
  GAUGE,
  MOULD_LAYOUT,
  poleNorth,
} from './parts';

// The alternator as one model: the ten parts of the `alternator` world, the section caps, the turning of the hub, the rotor and
// the magnets. The `alternator` world registers the ten parts one by one; the `turbine` world registers the whole as ONE part
// (`alternator`) and leaves out the moulds, so both draw the very same geometry.
//
// What turns (with `rotorAngle`): the bearing hub with its four long rods, the magnet rotor and its magnets. What never turns:
// the stub axle with its cradle, the stator with its coils, the wiring, the three stator rods, the castle nut on the axle.

export const ALTERNATOR_IDS = partIds('alternator');
export type AlternatorPartId = (typeof ALTERNATOR_IDS)[number];

/** Height of the axle above the bench floor in the `alternator` world, m (not physical: the stand). */
export const AXIS_HEIGHT = 0.22;

/**
 * Explode offsets, alternator frame, metres. Everything that slides on the stub axle leaves towards the front (-X), in the order
 * it comes off: the hub with its rods (the barrel slides out of the rotor and the stator), the rotor, its magnets (they come out
 * of the pockets towards the stator side), the coils (out of their pockets), then the stator, which carries its three rods (cast
 * in, they stay inside it). The stub axle with its cradle is pushed back. Gauge and moulds are tools: they move aside.
 */
export const EXPLODE: Record<AlternatorPartId, [number, number, number]> = {
  'bearing-hub': [-0.3, 0, 0],
  'magnet-rotor': [-0.2, 0, 0],
  magnets: [-0.15, 0, 0],
  coils: [-0.1, 0, 0],
  'star-wiring': [-0.1, 0, 0],
  stator: [-0.04, 0, 0],
  studs: [-0.04, 0, 0],
  shaft: [0.1, 0, 0],
  'air-gap': [0, 0.16, 0],
  moulds: [0, 0, 0.3],
};

export interface AlternatorOptions {
  detail?: Detail;
  /** Part that owns the section caps of `id`: itself in the world, 'alternator' inside the turbine. */
  capOwner?: (id: string) => string;
  /** Draw the section caps (default yes; the site does not need them). */
  caps?: boolean;
  /** Leave out the feeler gauge (a tool, not part of the machine: the turbine world does). Default: drawn. */
  gauge?: boolean;
  /** The moulds lie on the bench `floorY` under the frame (alternator world only). */
  moulds?: { floorY: number } | null;
}

export interface AlternatorModel {
  /** Alternator frame (origin on the axis, in the mid-plane of the stator). */
  root: THREE.Group;
  parts: Record<string, THREE.Group>;
  /** Groups that turn with the rotor angle (inside their part). */
  spins: THREE.Group[];
  cut: CutKit;
  anchors: Record<string, THREE.Object3D>;
  /** Turn the rotating parts; with the section on, stop them where the plane cuts a magnet. */
  update(angle: number, cutaway: boolean, registry: PartRegistry | null): void;
  /** Register the ten parts one by one (the `alternator` world). */
  register(registry: PartRegistry): void;
}

const mir = (x0: number, x1: number, y0: number, y1: number): Poly[] => [rect(x0, y0, x1, y1), rect(x0, -y1, x1, -y0)];
const hex = (m: THREE.MeshStandardMaterial): number => m.color.getHex();

export function createAlternatorModel(opts: AlternatorOptions = {}): AlternatorModel {
  const detail = opts.detail ?? 'full';
  const owner = opts.capOwner ?? ((id: string) => id);
  const cut = new CutKit();
  const root = group('alternator');
  const parts: Record<string, THREE.Group> = {};
  const spins: THREE.Group[] = [];

  const mergeOpts = { isClipped: (m: THREE.Material) => cut.clips(m) };
  const finish = (id: string, g: THREE.Group, merge: THREE.Group[] = [g]) => {
    g.name = id;
    cut.clip(g);
    for (const m of merge) mergeStatic(m, { ...mergeOpts, name: id });
    parts[id] = g;
    root.add(g);
    return g;
  };
  /** A rotating part: the meshes built by `build` turn inside a group of their own, the part itself only moves with the explode. */
  const spinning = (id: string, built: THREE.Group, fixed?: THREE.Group): THREE.Group => {
    const part = group(id);
    built.name = `${id}-spin`;
    part.add(built);
    if (fixed) part.add(fixed);
    spins.push(built);
    return finish(id, part, fixed ? [built, fixed] : [built]);
  };
  const caps = (id: string, part: THREE.Object3D, polys: Poly[], tint?: THREE.ColorRepresentation) => {
    if (opts.caps !== false) cut.cap(owner(id), part, polys, 0, tint);
  };

  const steelCut = 0x8f959d;
  const resinCut = 0xe3a955;
  const zincCut = 0xb7bcc2;
  const sh = STACK.statorHalf;
  const ra = SHAFT.diameter / 2;

  // ---- fixed: stub axle, housing flange and cradle (the rods pass through the cradle at the top; the lower hole is empty)
  const shaft = finish('shaft', buildShaft(detail));
  const rr = STATOR_RODS.circleRadius;
  const hr = 0.0065;
  caps(
    'shaft',
    shaft,
    [
      rect(STACK.axleFront, -ra, STACK.housingFront, ra),
      rect(STACK.housingFront, -CRADLE.housingDiameter / 2, STACK.cradleFront, CRADLE.housingDiameter / 2),
      rect(STACK.cradleFront, rr + hr, STACK.cradleBack, CRADLE.diameter / 2),
      rect(STACK.cradleFront, -(rr - hr), STACK.cradleBack, rr - hr),
      rect(STACK.cradleFront, -CRADLE.diameter / 2, STACK.cradleBack, -(rr + hr)),
    ],
    steelCut,
  );

  const stator = finish('stator', buildStator(detail));
  caps(
    'stator',
    stator,
    [
      rect(-sh, STATOR.holeRadius, sh, rr - STATOR_RODS.diameter / 2),
      rect(-sh, rr + STATOR_RODS.diameter / 2, sh, STATOR.coilInner),
      rect(-sh, -STATOR.coilInner, sh, -STATOR.holeRadius),
      ...mir(-sh, sh, MAGNET.centreRadius - MAGNET.width / 2, MAGNET.centreRadius + MAGNET.width / 2),
      ...mir(-sh, sh, STATOR.coilOuter, STATOR.outer / 2),
    ],
    resinCut,
  );
  const coils = finish('coils', buildCoils());
  caps('coils', coils, [
    ...mir(-sh, sh, STATOR.coilInner, MAGNET.centreRadius - MAGNET.width / 2),
    ...mir(-sh, sh, MAGNET.centreRadius + MAGNET.width / 2, STATOR.coilOuter),
  ]);
  finish('star-wiring', buildWiring());
  const rods = finish('studs', buildRods());
  caps(
    'studs',
    rods,
    [rect(STACK.statorRodFront, rr - STATOR_RODS.diameter / 2, STACK.statorRodBack, rr + STATOR_RODS.diameter / 2)],
    zincCut,
  );
  if (opts.gauge !== false) finish('air-gap', buildGauge());

  // ---- rotating
  const hubBuilt = buildHub(detail);
  const hub = spinning('bearing-hub', hubBuilt.spin, hubBuilt.fixed);
  const R = HUB.boreRadius;
  const b1 = STACK.axleFront + HUB.nutThickness;
  const b2 = STACK.barrelBack - 0.0025 - HUB.bearingWidth;
  caps(
    'bearing-hub',
    hub,
    [
      ...mir(STACK.plateFront, STACK.discFront, R, HUB.plateDiameter / 2),
      ...mir(STACK.discFront, STACK.barrelBack, R, HUB.barrelDiameter / 2),
      ...mir(b1, b1 + HUB.bearingWidth, ra, R),
      ...mir(b2, b2 + HUB.bearingWidth, ra, R),
      ...mir(STACK.axleFront, b1, ra, HUB.nutAcrossFlats / 2 - 0.0015),
    ],
    0x7b818a,
  );

  const rotor = spinning('magnet-rotor', buildRotor(detail));
  const mc = MAGNET.centreRadius;
  caps(
    'magnet-rotor',
    rotor,
    [
      ...mir(STACK.discFront, STACK.magnetBack, ROTOR_DISC.centreHole / 2, ROTOR_DISC.diameter / 2),
      ...mir(STACK.magnetBack, STACK.magnetFace, ROTOR_DISC.resinInnerRadius, mc - MAGNET.width / 2),
      ...mir(STACK.magnetBack, STACK.magnetFace, mc + MAGNET.width / 2, ROTOR_DISC.castingDiameter / 2),
      ...mir(STACK.discFront, STACK.magnetBack, ROTOR_DISC.diameter / 2, ROTOR_DISC.castingDiameter / 2),
    ],
    resinCut,
  );

  const magnets = spinning('magnets', buildMagnets());
  caps(
    'magnets',
    magnets,
    mir(STACK.magnetBack, STACK.magnetFace, mc - MAGNET.width / 2, mc + MAGNET.width / 2),
    hex(poleNorth(0) ? MAT.magnetN() : MAT.magnetS()),
  );

  if (opts.moulds) {
    const moulds = finish('moulds', buildMoulds());
    moulds.position.y = opts.moulds.floorY;
  }

  // ---- anchors of the labels (children of the parts, so that they follow the explode)
  const A: Record<string, THREE.Object3D> = {
    'magnet-rotor': anchor(parts['magnet-rotor'], STACK.discFront - 0.001, 0.12, 0),
    magnets: anchor(parts.magnets, STACK.magnetFace - MAGNET.thickness / 2, -mc * 0.72, mc * 0.72),
    stator: anchor(parts.stator, 0, -0.133, 0.0),
    coils: anchor(parts.coils, 0, STATOR.coilOuter * Math.cos(Math.PI / 3), STATOR.coilOuter * Math.sin(Math.PI / 3)),
    'star-wiring': anchor(parts['star-wiring'], 0, 0, STATOR.outer / 2 + 0.003),
    shaft: anchor(parts.shaft, STACK.cradleBack, -CRADLE.diameter / 2 - 0.003, 0),
    'bearing-hub': anchor(parts['bearing-hub'], STACK.axleFront - 0.002, 0.0, 0),
    studs: anchor(parts.studs, STACK.cradleBack + 0.014, 0, STATOR_RODS.circleRadius),
  };

  if (parts['air-gap']) A['air-gap'] = anchor(parts['air-gap'], STACK.magnetFace - 0.013, GAUGE.y1 + 0.004, 0);
  if (parts.moulds) A.moulds = anchor(parts.moulds, MOULD_LAYOUT.x, 0.1, MOULD_LAYOUT.z);

  const park = Math.PI / 4;
  const model: AlternatorModel = {
    root,
    parts,
    spins,
    cut,
    anchors: A,
    update(angle, cutaway, registry) {
      // with the section on, stop where the plane (ψ = 0 and 180°) cuts a magnet
      const a = cutaway ? Math.round(angle / park) * park : angle;
      for (const s of spins) s.rotation.x = a;
      cut.update(root, cutaway, registry);
    },
    register(reg) {
      for (const id of ALTERNATOR_IDS) {
        const part = parts[id];
        if (part) reg.add(id, part, new THREE.Vector3(...EXPLODE[id]));
      }
    },
  };
  return model;
}
