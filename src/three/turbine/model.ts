import * as THREE from 'three';
import { clamp, damp, group } from '@onigam/lab-kit/three';
import type { PartRegistry, ViewOpts } from '@onigam/lab-kit/three';
import type { PiggottState } from '../../sim/types';
import { partIds } from '../../part-ids';
import { HEAD, HEAD_Y, STACK, TAIL, tailAxis, tailPivot, tailRestDirection } from '../dims';
import { DEG, type Detail } from '../common';
import { mergeStatic } from '../merge';
import { anchor } from '../world';
import { createAlternatorModel, type AlternatorModel } from '../alternator/model';
import { createRotorModel, type RotorModel } from '../blades/rotor';
import {
  buildNacelleFrame,
  buildTailBoom,
  buildTailHinge,
  buildTailVane,
  buildWireLoop,
  buildYawBearing,
} from './frame';

// The whole machine on its mast top: the head (rotor, alternator, angle iron, tail) that yaws about the vertical axis, and the
// fixed half of the yaw bearing under it. The `turbine` world registers its eight parts one by one; the `site` world registers
// the whole as ONE part, `wind-turbine`, built from the same pieces at a coarser level of detail and scaled by the rotor diameter.

export const TURBINE_IDS = partIds('turbine');
export type TurbinePartId = (typeof TURBINE_IDS)[number];

/**
 * Explode offsets, head frame, metres. The blades leave the rods first, the alternator slides forward off the angle iron (the
 * cradle is welded to it in reality), the frame with its yaw pipe and the hinge lifts off the stub, the sleeve of the tail slides up
 * the hinge pipe (offset ≈ 0.25 m along the hinge axis on top of the lift), the vane comes off the T-bar sideways, the cable is
 * drawn aside and the mast piece goes down.
 */
const U = new THREE.Vector3(...tailAxis());
const B0 = new THREE.Vector3(...tailRestDirection());
const SIDE = new THREE.Vector3().crossVectors(B0, new THREE.Vector3(0, 1, 0)).normalize();
const LIFT = 0.2;
export const EXPLODE: Record<TurbinePartId, [number, number, number]> = {
  rotor: [-0.32, 0, 0],
  alternator: [-0.12, 0, 0],
  'nacelle-frame': [0, LIFT, 0],
  'yaw-bearing': [0, -0.15, 0],
  'tail-hinge': [0, LIFT, 0],
  'tail-boom': [0.25 * U.x, LIFT + 0.25 * U.y, 0.25 * U.z],
  'tail-vane': [0.25 * U.x + 0.25 * SIDE.x, LIFT + 0.25 * U.y, 0.25 * U.z + 0.25 * SIDE.z],
  'wire-loop': [0, LIFT, 0.3],
};

export interface HeadOptions {
  detail?: Detail;
  /** A piece of mast pipe under the cap (the turbine world; the site has the real mast). */
  mastPiece?: boolean;
  /** Draw the section caps (needed where the section tool exists). */
  caps?: boolean;
  /** Registered part that owns the blur disc: `rotor` in the turbine world, `wind-turbine` in the site. */
  partId?: string;
}

export interface HeadModel {
  /** Holds the fixed half of the yaw bearing and the head. */
  root: THREE.Group;
  head: THREE.Group;
  /** The swinging tail: boom and vane are inside it. */
  swing: THREE.Group;
  alt: AlternatorModel;
  rotor: RotorModel;
  parts: Record<string, THREE.Object3D>;
  anchors: Record<string, THREE.Object3D>;
  /** Current yaw and tail swing as drawn, degrees. */
  readonly pose: { yaw: number; swing: number };
  update(state: PiggottState, dt: number, view: ViewOpts, registry: PartRegistry | null): void;
  register(registry: PartRegistry): void;
}

const park = Math.PI / 4;

export function createHead(opts: HeadOptions = {}): HeadModel {
  const detail = opts.detail ?? 'full';
  const root = group('machine');
  const head = group('head');
  const parts: Record<string, THREE.Object3D> = {};

  // ---- the alternator and the rotor, on the axle (z = the offset from the yaw axis)
  const alt = createAlternatorModel({
    detail,
    capOwner: () => 'alternator',
    moulds: null,
    gauge: false,
    caps: opts.caps !== false,
  });
  alt.root.position.set(HEAD.statorX, 0, HEAD.offset);
  const rotor = createRotorModel(detail);
  rotor.root.position.set(HEAD.statorX + STACK.bladeOrigin, 0, HEAD.offset);
  rotor.blur.userData.ownerPart = opts.partId ?? 'rotor';
  head.add(alt.root, rotor.root);
  parts.alternator = alt.root;
  parts.rotor = rotor.root;

  // ---- steel
  const merge = (g: THREE.Object3D, name: string) => {
    mergeStatic(g, { name });
    return g;
  };
  const frame = merge(buildNacelleFrame(detail), 'frame');
  const hinge = merge(buildTailHinge(detail), 'hinge');
  const wire = buildWireLoop(detail);
  const mast = merge(buildYawBearing(detail, opts.mastPiece === true), 'yaw');
  head.add(frame, hinge, wire);
  parts['nacelle-frame'] = frame;
  parts['tail-hinge'] = hinge;
  parts['wire-loop'] = wire;
  parts['yaw-bearing'] = mast;

  // ---- the swinging tail: boom and vane about the hinge axis through the sleeve centre
  const swing = group('tail-swing');
  swing.position.set(...tailPivot());
  const boom = merge(buildTailBoom(detail), 'boom');
  const vane = merge(buildTailVane(detail), 'vane');
  swing.add(boom, vane);
  head.add(swing);
  parts['tail-boom'] = boom;
  parts['tail-vane'] = vane;
  root.add(mast, head);

  // ---- anchors of the labels
  const P = new THREE.Vector3(...tailPivot());
  const A: Record<string, THREE.Object3D> = {
    rotor: anchor(rotor.root, -0.085, 0.34, 0),
    alternator: anchor(alt.root, STACK.cradleFront - 0.02, 0.135, 0),
    'nacelle-frame': anchor(frame, 0.06, HEAD_Y.beamTop + 0.002, 0.04),
    'yaw-bearing': anchor(mast, 0.034, HEAD_Y.pipeBottom - 0.025, 0),
    'tail-hinge': anchor(hinge, P.x, P.y + 0.1, P.z),
    'tail-boom': anchor(boom, B0.x * 0.3, 0.025, B0.z * 0.3),
    'tail-vane': anchor(vane, B0.x * 0.7 + SIDE.x * 0.01, 0.02, B0.z * 0.7 + SIDE.z * 0.01),
    'wire-loop': anchor(wire, -0.05, HEAD_Y.beamTop + 0.03, 0.01),
  };

  const pose = { yaw: 0, swing: 0 };
  const axis = new THREE.Vector3(...tailAxis());
  const q = new THREE.Quaternion();

  /** True while a part is exploded, hidden or drawn as a wire: the machine is held in its rest pose then. */
  const away = (reg: PartRegistry | null): boolean => {
    if (!reg) return false;
    for (const e of reg.parts.values())
      if (e.factor > 0.001 || e.display === 'wire' || e.display === 'hidden') return true;
    return false;
  };

  const model: HeadModel = {
    root,
    head,
    swing,
    alt,
    rotor,
    parts,
    anchors: A,
    pose,
    update(state, dt, view, registry) {
      const held = view.cutaway || away(registry);
      const yawT = held ? 0 : clamp(state.yaw, -180, 180);
      const swingT = held ? 0 : clamp(state.tailSwing, 0, TAIL.swingDeg + 20);
      if (held) {
        pose.yaw = damp(pose.yaw, yawT, 9, dt);
        pose.swing = damp(pose.swing, swingT, 9, dt);
      } else {
        pose.yaw = yawT;
        pose.swing = swingT;
      }
      head.rotation.y = pose.yaw * DEG;
      // the tail swings about the inclined hinge: a turn of -φ about the axis takes the boom towards +Z
      swing.quaternion.copy(q.setFromAxisAngle(axis, -pose.swing * DEG));
      const angle = view.cutaway ? Math.round(state.rotorAngle / park) * park : state.rotorAngle;
      rotor.spin.rotation.x = angle;
      alt.update(angle, view.cutaway, registry);
      const blur = held ? 0 : clamp(state.rotorBlur, 0, 1);
      const shown = !registry || registry.get(opts.partId ?? 'rotor')?.display === 'solid';
      rotor.blur.visible = blur > 0.02 && shown;
      rotor.blurMaterial.opacity = 0.55 * blur;
    },
    register(reg) {
      for (const id of TURBINE_IDS) reg.add(id, parts[id], new THREE.Vector3(...EXPLODE[id]));
    },
  };
  return model;
}
