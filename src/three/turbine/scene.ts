import * as THREE from 'three';
import { MAT, PartRegistry, group, mesh } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { PiggottState } from '../../sim/types';
import { HEAD_Y, YAW } from '../dims';
import { paperFloor } from '../common';
import { mergeStatic } from '../merge';
import { hotspots, workshopScene, type HotspotDef } from '../world';
import { createHead, type HeadModel } from './model';
import { MAST_BLOCK } from './frame';

// The "turbine" world: the whole machine on its mast top at workshop scale (the 1.2 m machine of the video), the mast piece
// planted in a wooden block on the bench. The head yaws about the mast axis and the tail swings about its inclined hinge, as
// the simulation says; the rotor turns with `rotorAngle` and shows a blur disc when it is fast. The section tool cuts the
// alternator in its axial plane (the head then stands still, facing the wind).

const HOTSPOTS: HotspotDef[] = [
  { id: 'rotor', fr: 'Rotor (pales et moyeu)', en: 'Rotor', goto: 'blades' },
  { id: 'alternator', fr: 'Alternateur', en: 'Alternator', goto: 'alternator' },
  { id: 'nacelle-frame', fr: 'Cadre de nacelle', en: 'Nacelle frame', minor: true },
  { id: 'yaw-bearing', fr: 'Pivot d’orientation', en: 'Yaw bearing' },
  { id: 'tail-vane', fr: 'Safran', en: 'Tail vane' },
  { id: 'tail-hinge', fr: 'Charnière inclinée', en: 'Tail hinge', minor: true },
  { id: 'tail-boom', fr: 'Bras de queue', en: 'Tail boom', minor: true },
  { id: 'wire-loop', fr: 'Câble dans le mât', en: 'Cable in the mast', minor: true },
];

/** Level of the bench floor: the foot of the mast piece is sunk 50 mm in a 150 mm block. */
export const FLOOR_Y = HEAD_Y.capTop - YAW.capThickness - YAW.mastPiece - (MAST_BLOCK.height - MAST_BLOCK.sunk);

export interface TurbineScene extends SceneModule<PiggottState> {
  model: HeadModel;
}

export function createTurbineScene(): TurbineScene {
  const scene = workshopScene({
    name: 'turbine',
    fog: [5, 14],
    key: [2.2, 3.4, 3.0],
    target: [0.3, -0.3, 0.05],
    shadowHalf: 1.7,
    shadowFar: 10,
  });
  scene.add(paperFloor(14, 8, FLOOR_Y - 0.0005));

  const registry = new PartRegistry();
  const model = createHead({ detail: 'full', mastPiece: true });
  scene.add(model.root);
  model.register(registry);

  // the wooden block that holds the foot of the mast piece (scenery, unregistered)
  const block = group('block');
  block.add(
    mesh(new THREE.BoxGeometry(MAST_BLOCK.size, MAST_BLOCK.height, MAST_BLOCK.size), MAT.woodDark(), [
      0,
      FLOOR_Y + MAST_BLOCK.height / 2,
      0,
    ]),
  );
  mergeStatic(block, { name: 'block' });
  scene.add(block);

  const mod: TurbineScene = {
    id: 'turbine',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, model.anchors),
    model,
    home: { position: new THREE.Vector3(-1.05, 0.655, 1.975), target: new THREE.Vector3(0.3, -0.2, 0.05) },
    minDistance: 0.1,
    maxDistance: 8,
    homePadding: 1.3,
    update(state, dt, view) {
      model.update(state, dt, view, registry);
    },
  };
  return mod;
}
