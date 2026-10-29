import * as THREE from 'three';
import { MAT, PartRegistry, group, mesh } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { PiggottState } from '../../sim/types';
import { CRADLE, STACK } from '../dims';
import { paperFloor } from '../common';
import { mergeStatic } from '../merge';
import { hotspots, workshopScene, type HotspotDef } from '../world';
import { AXIS_HEIGHT, createAlternatorModel, type AlternatorModel } from './model';

// The "alternator" world: the axial-flux alternator on a workbench, axle horizontal, front (blades) on the left. Section
// (the plane through the axis, the discs stop where it cuts a magnet) and explode (every part slides off along its own
// insertion path) are made for this world. The cradle sits in a wooden holder; the two moulds of the resin work lie beside it.

const HOTSPOTS: HotspotDef[] = [
  { id: 'magnet-rotor', fr: 'Disque à aimants', en: 'Magnet rotor' },
  { id: 'stator', fr: 'Stator coulé', en: 'Cast stator' },
  { id: 'bearing-hub', fr: 'Moyeu à roulements', en: 'Bearing hub' },
  { id: 'shaft', fr: 'Fusée et berceau', en: 'Stub axle and cradle', minor: true },
  { id: 'coils', fr: 'Bobines', en: 'Coils', minor: true },
  { id: 'magnets', fr: 'Aimants néodyme', en: 'Neodymium magnets', minor: true },
  { id: 'studs', fr: 'Tiges du stator', en: 'Stator rods', minor: true },
  { id: 'star-wiring', fr: 'Couplage étoile', en: 'Star wiring', minor: true },
  { id: 'air-gap', fr: 'Entrefer (≈ 1 mm)', en: 'Air gap (≈ 1 mm)', minor: true },
  { id: 'moulds', fr: 'Moules', en: 'Moulds', minor: true },
];

export interface AlternatorScene extends SceneModule<PiggottState> {
  model: AlternatorModel;
  /** The cradle that carries the shaft (scenery, unregistered). */
  stand: THREE.Group;
}

export function createAlternatorScene(): AlternatorScene {
  const scene = workshopScene({
    name: 'alternator',
    fog: [3, 8],
    key: [1.1, 2.1, 1.7],
    target: [0.05, -0.2, 0.2],
    shadowHalf: 0.95,
    shadowFar: 7,
  });
  const floor = paperFloor(10, 8, -AXIS_HEIGHT - 0.0005);
  scene.add(floor);

  const registry = new PartRegistry();
  const model = createAlternatorModel({ moulds: { floorY: -AXIS_HEIGHT } });
  scene.add(model.root);
  model.register(registry);

  // wooden holder under the cradle: a post and two boards that hug the disc of the cradle below the housing flange
  const stand = group('stand');
  const wood = MAT.woodDark();
  const cx = (STACK.cradleFront + STACK.cradleBack) / 2;
  stand.add(mesh(new THREE.BoxGeometry(0.16, 0.03, 0.2), wood, [cx, -AXIS_HEIGHT + 0.015, 0]));
  const top = -0.1;
  stand.add(
    mesh(new THREE.BoxGeometry(0.05, top + AXIS_HEIGHT - 0.03, 0.08), wood, [cx, (top - AXIS_HEIGHT + 0.03) / 2, 0]),
  );
  for (const s of [-1, 1]) {
    const board = mesh(new THREE.BoxGeometry(0.0092, 0.06, 0.1), wood, [
      cx + s * (CRADLE.thickness / 2 + 0.0046),
      top + 0.025,
      0,
    ]);
    stand.add(board);
  }
  mergeStatic(stand, { name: 'stand' });
  scene.add(stand);

  const mod: AlternatorScene = {
    id: 'alternator',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, model.anchors),
    model,
    stand,
    home: { position: new THREE.Vector3(-0.409, 0.456, 0.638), target: new THREE.Vector3(-0.04, -0.06, 0) },
    minDistance: 0.06,
    maxDistance: 5,
    homePadding: 1.0,
    update(state, _dt, view) {
      model.update(state.rotorAngle, view.cutaway, registry);
    },
  };
  return mod;
}
