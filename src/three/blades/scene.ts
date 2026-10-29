import * as THREE from 'three';
import { MAT, PartRegistry, group, mesh } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { PiggottState } from '../../sim/types';
import { BLADE } from '../dims';
import { paperFloor } from '../common';
import { mergeStatic } from '../merge';
import { anchor, hotspots, workshopScene, type HotspotDef } from '../world';
import { sectionOutline } from './geometry';
import { createRotorModel, type RotorModel } from './rotor';

// The "blades" world: the carving of the blades. The rotor lies flat on a balancing post (front up, the plywood disc on the post), a timber blank with the
// station lines is drawn on the bench beside it and the six station templates lie in a row. Metres, Y up, the paper floor at
// y = 0; the rotor frame is turned so that its x' axis (towards the wind side) points up.

const POST = { radius: 0.07, height: 0.35 };
const BLANK_AT: [number, number, number] = [-1.05, 0, 0.3];
const TEMPLATES_AT: [number, number, number] = [0, 0, 0.85];

const HOTSPOTS: HotspotDef[] = [
  { id: 'blade', fr: 'Pale', en: 'Blade' },
  { id: 'hub-disc', fr: 'Disque de moyeu', en: 'Hub disc', minor: true },
  { id: 'blade-blank', fr: 'Plateau de bois', en: 'Timber blank' },
  { id: 'station-templates', fr: 'Gabarits', en: 'Station templates' },
  { id: 'blade#windward', fr: 'Face au vent (intrados)', en: 'Windward face', minor: true },
  { id: 'blade#leeward', fr: 'Dos de pale (extrados)', en: 'Leeward face', minor: true },
  { id: 'blade#root', fr: 'Pied de pale', en: 'Blade root', minor: true },
  { id: 'blade#tip', fr: 'Bout de pale', en: 'Blade tip', minor: true },
];

/** The timber blank of one blade, lying on the floor, with the pencil lines of the plans: stations, taper, the 60° cuts of the root. */
function buildBlank(): THREE.Group {
  const g = group('blade-blank');
  const t = BLADE.rootThickness;
  const w = BLADE.rootWidth;
  g.add(mesh(new THREE.BoxGeometry(BLADE.blankLength, t, w), MAT.woodLight(), [BLADE.blankLength / 2, t / 2, 0]));
  const line = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = mesh(new THREE.BoxGeometry(len, 0.0006, 0.0016), MAT.printBlack(), [
      (x0 + x1) / 2,
      t + 0.0002,
      (z0 + z1) / 2,
    ]);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    m.castShadow = false;
    g.add(m);
  };
  const half = w / 2;
  // stations: a line across the plank every 100 mm from the hub centre
  for (const r of BLADE.stationRadius) line(r, -half, r, half);
  // trailing edge (taper): the leading edge is the straight edge of the plank, z = +half
  const te = BLADE.stationRadius.map((r, i) => [r, half - BLADE.stationWidth[i]] as const);
  for (let i = 1; i < te.length - 1; i++) line(te[i][0], te[i][1], te[i + 1][0], te[i + 1][1]);
  line(te[0][0], te[0][1], te[1][0], te[1][1]);
  // the 60° cuts of the root meet at the centre of the hub (x = 0)
  const apex = half / Math.tan(((BLADE.rootAngleDeg / 2) * Math.PI) / 180);
  line(0, 0, apex, half);
  line(0, 0, apex, -half);
  mergeStatic(g, { name: 'blank' });
  return g;
}

/**
 * Six plywood templates standing on edge in a row, each a plate with the section of its station cut out (flat windward face at the
 * bottom of the hole, curved back above it); the number of small holes above the cut-out is the station number. They face the
 * viewer (+Z). The plate is a little taller than the cut-out so that it can be laid on the blank.
 */
function buildTemplates(): THREE.Group {
  const g = group('station-templates');
  const t = BLADE.templateThickness;
  const gap = 0.025;
  const plates = BLADE.stationRadius.map((_, i) => {
    const pts = sectionOutline(i).filter(
      (p, k, a) => k === 0 || Math.hypot(p[0] - a[k - 1][0], p[1] - a[k - 1][1]) > 1e-6,
    );
    const length = Math.max(...pts.map((p) => p[0]));
    return { i, pts, length, width: length + 0.05 };
  });
  const total = plates.reduce((a, p) => a + p.width, 0) + gap * (plates.length - 1);
  const height = TEMPLATE_HEIGHT;
  let x = -total / 2;
  for (const p of plates) {
    const plate = new THREE.Shape();
    plate.moveTo(0, 0);
    plate.lineTo(p.width, 0);
    plate.lineTo(p.width, height);
    plate.lineTo(0, height);
    plate.closePath();
    // the cut-out: the section, wound the other way round, its flat face 0.02 m above the lower edge of the plate
    const hole = new THREE.Path();
    const base = 0.02;
    const pts = [...p.pts].reverse();
    pts.forEach(([c, h], k) => (k === 0 ? hole.moveTo(0.025 + c, base + h) : hole.lineTo(0.025 + c, base + h)));
    hole.closePath();
    plate.holes.push(hole);
    for (let n = 0; n <= p.i; n++) {
      const dot = new THREE.Path();
      dot.absarc(0.014 + n * 0.012, height - 0.014, 0.0034, 0, Math.PI * 2, true);
      plate.holes.push(dot);
    }
    const geo = new THREE.ExtrudeGeometry(plate, { depth: t, bevelEnabled: false, curveSegments: 10 });
    const plateMesh = mesh(geo, MAT.wood(), [x, 0, 0]);
    plateMesh.rotation.x = -0.35; // leaning back on the rail, facing the viewer
    g.add(plateMesh);
    x += p.width + gap;
  }
  mergeStatic(g, { name: 'templates' });
  return g;
}

const TEMPLATE_HEIGHT = 0.13;

export interface BladesScene extends SceneModule<PiggottState> {
  model: RotorModel;
}

export function createBladesScene(): BladesScene {
  const scene = workshopScene({
    name: 'blades',
    fog: [5, 14],
    key: [2.4, 4.2, 3.2],
    target: [-0.05, 0, 0],
    shadowHalf: 2.0,
    shadowFar: 11,
  });
  scene.add(paperFloor(14, 8, -0.0005));

  // balancing post: the rotor stands on it by its hub (unregistered: scenery of the bench)
  const post = group('post');
  post.add(
    mesh(new THREE.CylinderGeometry(POST.radius, POST.radius * 1.15, POST.height, 32), MAT.woodDark(), [
      0,
      POST.height / 2,
      0,
    ]),
  );
  post.add(mesh(new THREE.BoxGeometry(0.42, 0.03, 0.42), MAT.woodDark(), [0, 0.015, 0]));
  mergeStatic(post, { name: 'post' });
  scene.add(post);

  const registry = new PartRegistry();
  const model = createRotorModel('full');
  // x' (front) points up; the roots rest on the post
  model.root.rotation.z = -Math.PI / 2;
  model.root.position.y = POST.height;
  model.blur.visible = false;
  scene.add(model.root);

  const blank = buildBlank();
  blank.rotation.y = Math.PI / 2; // lies along the table, root end towards the viewer
  blank.position.set(...BLANK_AT);
  const templates = buildTemplates();
  templates.position.set(...TEMPLATES_AT);
  // a low rail behind the templates holds them upright (scenery)
  const rail = mesh(new THREE.BoxGeometry(1.05, 0.02, 0.03), MAT.woodDark(), [
    TEMPLATES_AT[0],
    0.01,
    TEMPLATES_AT[2] - 0.015,
  ]);
  scene.add(blank, templates, rail);

  registry.add('blade-blank', blank, new THREE.Vector3(0, 0.3, 0));
  registry.add('station-templates', templates, new THREE.Vector3(0, 0.3, 0));
  // the offsets are in the rotor frame: -x' is up. The plywood disc lifts off the roots, the blades off the post.
  // the plywood disc lifts 0.1 m off the post, the blades 0.3 m, and the plywood triangle goes 0.55 m up: order kept
  registry.add('blade', model.blades, new THREE.Vector3(-0.3, 0, 0));
  registry.add('hub-disc', model.hub, new THREE.Vector3(-0.1, 0, 0), (f) => {
    model.triangle.position.x = -0.45 * f;
  });

  // labels follow the parts: anchors in the rotor frame (x' up-ish, y along blade 0, z across it)
  const A: Record<string, THREE.Object3D> = {
    blade: anchor(model.blades, -0.07, 0.34, 0.02),
    'hub-disc': anchor(model.triangle, -0.07, 0.0, 0.0),
    'blade-blank': anchor(blank, 0.33, BLADE.rootThickness + 0.01, 0.0),
    'station-templates': anchor(templates, -0.46, TEMPLATE_HEIGHT + 0.025, 0.0),
    'blade#windward': anchor(model.blades, -0.07, 0.47, -0.02),
    'blade#leeward': anchor(model.blades, -0.02, 0.27, -0.12),
    'blade#root': anchor(model.blades, -0.067, 0.09, 0.0),
    'blade#tip': anchor(model.blades, -0.062, 0.6, 0.0),
  };

  const mod: BladesScene = {
    id: 'blades',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, A),
    model,
    home: { position: new THREE.Vector3(-1.383, 1.156, 2.312), target: new THREE.Vector3(-0.25, 0.1, 0.35) },
    minDistance: 0.12,
    maxDistance: 9,
    homePadding: 0.8,
    update() {
      // nothing moves in the carving workshop
    },
  };
  return mod;
}
