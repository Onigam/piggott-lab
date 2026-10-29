import * as THREE from 'three';
import { MAT, PartRegistry, clamp, group, mesh } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { PiggottState } from '../../sim/types';
import { DEVICES, SHED } from '../dims';
import { FlowDots, paperFloor, tubeGeometry } from '../common';
import { mergeStatic } from '../merge';
import { hotspots, workshopScene, type HotspotDef } from '../world';
import { BOARD_Z, animateShed, buildShed, type Shed, type ShedPartId } from './room';

// The "shed" world: the technical room, at the size of the room (a garden shed, estimate), open on the front and on the left.
// The brake switch, the rectifier, the fuse, the charge controller and the dump load are fixed on a plywood board on the back
// wall, in the order the current goes through them; the 12 V battery stands on the floor in front of it. The cable of the mast
// comes in from the left, the supply to the house leaves on the right. The lever, the lamps, the glowing element and the bar of
// the charge follow the simulation, and "Flows" draws the current in the cable, through the devices and out to the house.
// Built with the same `buildShed()` as the shed of the site, so that the two never differ.

const HOTSPOTS: HotspotDef[] = [
  { id: 'brake-switch', fr: 'Interrupteur de freinage', en: 'Brake switch' },
  { id: 'rectifier', fr: 'Redresseur', en: 'Rectifier' },
  { id: 'fuse', fr: 'Fusible', en: 'Fuse' },
  { id: 'charge-controller', fr: 'Régulateur de charge', en: 'Charge controller' },
  { id: 'dump-load', fr: 'Délesteur', en: 'Dump load' },
  { id: 'battery-bank', fr: 'Batterie', en: 'Battery' },
];

/** Explode offsets, shed frame, metres: the devices come off the board towards the viewer, alternately near and far. */
export const EXPLODE: Record<ShedPartId, [number, number, number]> = {
  'brake-switch': [0, 0.45, 0.95],
  rectifier: [0, 0.2, 0.6],
  fuse: [0, 0.45, 0.95],
  'charge-controller': [0, 0.2, 0.6],
  'dump-load': [0, 0.45, 0.95],
  'battery-bank': [0, 0.6, 0.8],
};

const IDS = Object.keys(EXPLODE) as ShedPartId[];
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface ShedScene extends SceneModule<PiggottState> {
  shed: Shed;
  /** The current dots (tests). */
  flows: FlowDots;
}

export function createShedScene(): ShedScene {
  const scene = workshopScene({
    name: 'shed',
    fog: [10, 26],
    key: [2.6, 4.4, 3.8],
    target: [0, 0.9, -0.3],
    shadowHalf: 3.2,
    shadowFar: 16,
  });
  scene.add(paperFloor(14, 8, -0.0405));

  const shed = buildShed();
  const frame = group('shed-frame');
  frame.add(shed.scenery);
  for (const id of IDS) frame.add(shed.parts[id]);
  scene.add(frame);

  // ---- where the mast's cable arrives and where the house's supply leaves (scenery, unregistered): a post outside the open
  // left side, the cable up the post and along the board to the switch; a conduit out of the controller to the right
  const stubs = group('stubs');
  const cableMat = MAT.cableBlack();
  const post = [-1.75, -0.2] as const;
  const cableRoute = [
    V(post[0] - 0.9, 0.03, post[1] + 0.9),
    V(post[0], 0.03, post[1]),
    V(post[0], DEVICES.brakeSwitch.y, post[1]),
    V(-1.3, DEVICES.brakeSwitch.y, BOARD_Z + 0.25),
    V(shed.cableIn.x - 0.2, shed.cableIn.y, shed.cableIn.z + 0.03),
    shed.cableIn.clone(),
  ];
  const cableCurve = new THREE.CatmullRomCurve3(cableRoute, false, 'centripetal', 0.2);
  stubs.add(mesh(tubeGeometry(cableCurve.getPoints(60), SHED.cableRadius, 60, 6), cableMat));
  stubs.add(
    mesh(new THREE.BoxGeometry(0.09, DEVICES.brakeSwitch.y + 0.1, 0.09), MAT.woodDark(), [post[0], 0.83, post[1]]),
  );
  const out = shed.houseOut;
  const supply = [out.clone(), V(1.2, out.y - 0.1, -0.7), V(1.55, 1.2, -0.7), V(1.55, 0.03, -0.7), V(2.6, 0.03, -0.7)];
  const supplyCurve = new THREE.CatmullRomCurve3(supply, false, 'centripetal', 0.2);
  stubs.add(mesh(tubeGeometry(supplyCurve.getPoints(50), 0.008, 50, 5), MAT.cableRed()));
  mergeStatic(stubs, { name: 'stubs' });
  scene.add(stubs);

  // ---- "Flux": dots of current along the cable, through the devices to the battery, in the dump load and out to the house
  const flows = new FlowDots(160, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  const pMain = flows.addPath([...cableCurve.getPoints(40), ...shed.pathMain], 90);
  const pDump = flows.addPath(shed.pathDump, 6);
  const pHouse = flows.addPath(supplyCurve.getPoints(30), 30);
  scene.add(flows.object);

  // ---- registration
  const registry = new PartRegistry();
  for (const id of IDS) registry.add(id, shed.parts[id], new THREE.Vector3(...EXPLODE[id]));

  // ---- labels: the dot over each device, on three levels so that the names (read to the right of the dot) never overlap, and
  // the two on the right pulled a little to the left so that their names stay inside the picture on a narrow screen
  const level = [2.0, 1.82, 1.64];
  const at: Record<ShedPartId, [number, number]> = {
    'brake-switch': [DEVICES.brakeSwitch.x - 0.05, level[0]!],
    rectifier: [DEVICES.rectifier.x - 0.05, level[1]!],
    fuse: [DEVICES.fuse.x - 0.04, level[2]!],
    'charge-controller': [DEVICES.controller.x - 0.18, level[1]!],
    'dump-load': [DEVICES.dumpLoad.x - 0.3, level[0]!],
    'battery-bank': [DEVICES.battery.x - 0.15, 0.42],
  };
  for (const id of IDS) {
    const a = shed.anchors[id];
    const z = id === 'battery-bank' ? DEVICES.battery.z + DEVICES.battery.d / 2 : BOARD_Z + 0.1;
    a.position.set(at[id][0], at[id][1], z);
  }

  const mod: ShedScene = {
    id: 'shed',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, shed.anchors),
    shed,
    flows,
    home: { position: V(-0.9, 1.5, 4.3), target: V(0, 1.0, -0.5) },
    minDistance: 0.15,
    maxDistance: 14,
    homePadding: 1.0,
    update(state, dt, view) {
      animateShed(shed, state);
      // current dots: speed proportional to the current (A) in each branch
      flows.object.visible = view.schematic;
      if (view.schematic) {
        const amps = state.brake ? 0 : state.dcCurrent;
        flows.advance(pMain, 0.3 * clamp(amps, 0, 40), dt);
        flows.advance(pDump, 0.3 * clamp(state.dumpPower / 14, 0, 40), dt);
        flows.advance(pHouse, state.lvdOpen ? 0 : 0.3 * clamp(state.loadPower / 13, 0, 40), dt);
        flows.place();
      }
    },
  };
  return mod;
}
