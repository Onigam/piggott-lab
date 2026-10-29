import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clamp, group, mesh, MAT, PartRegistry, rng } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import { DUMP_MAX_CURRENT, DIAMETER_REF } from '../../sim/machine';
import type { PiggottState } from '../../sim/types';
import { HEAD_Y, HOUSE, MAST, OBSTACLES, SHED, WINDSOCK, mastRadius } from '../dims';
import { DEG, FlowDots } from '../common';
import { mergeStatic } from '../merge';
import { anchor, hotspots, type HotspotDef } from '../world';
import { createHead, type HeadModel } from '../turbine/model';
import { buildHouse, type House } from './house';
import { minWidthMaterial, pickAlong, type Segments } from './pipes';
import { buildShed, type Shed } from './shed';
import { createSky } from './sky';

// The "site" world: the field at true scale. X = where the wind blows to (it comes from the west and keeps that direction), Y up,
// Z south, origin on the ground at the foot of the mast. The mast height, the height of the trees and the rotor diameter come from
// the state and are redrawn live; the machine on the mast is ONE part (`wind-turbine`), the same pieces as the `turbine` world at
// a coarser level of detail, scaled by diameter / 1.2 m. Cable run, shed (open on the front and on the left), house, wind sock.

const HOTSPOTS: HotspotDef[] = [
  { id: 'wind-turbine', fr: 'Éolienne', en: 'Wind turbine', goto: 'turbine' },
  { id: 'tower', fr: 'Mât', en: 'Tower' },
  { id: 'cable-run', fr: 'Câble vers les batteries', en: 'Cable run', minor: true },
  { id: 'battery-bank', fr: 'Batterie', en: 'Battery' },
  { id: 'house', fr: 'Maison', en: 'House' },
  { id: 'obstacles', fr: 'Arbres et obstacles', en: 'Trees and obstacles', minor: true },
  { id: 'guy-wires', fr: 'Haubans', en: 'Guy wires', minor: true },
  { id: 'tower-base', fr: 'Pied de mât articulé', en: 'Hinged base', minor: true },
  { id: 'brake-switch', fr: 'Interrupteur de freinage', en: 'Brake switch', minor: true },
  { id: 'rectifier', fr: 'Redresseur', en: 'Rectifier', minor: true },
  { id: 'fuse', fr: 'Fusible', en: 'Fuse', minor: true },
  { id: 'charge-controller', fr: 'Régulateur de charge', en: 'Charge controller', minor: true },
  { id: 'dump-load', fr: 'Délesteur', en: 'Dump load', minor: true },
];

/** Explode offsets, site frame, metres (every part rises by its own amount; the small devices come forward). */
export const EXPLODE: Record<string, [number, number, number]> = {
  'wind-turbine': [0, 8, 0],
  tower: [0, 4, 0],
  'guy-wires': [0, 2, 0],
  'tower-base': [0, 0.6, 0],
  'cable-run': [0, 1.2, 0],
  'brake-switch': [0, 0.55, 0.9],
  rectifier: [0, 0.4, 0.9],
  fuse: [0, 0.25, 0.9],
  'charge-controller': [0, 0.45, 0.9],
  'dump-load': [0, 0.6, 0.9],
  'battery-bank': [0, 0.5, 1.0],
  house: [0, 2.5, 0],
  obstacles: [0, 3, 0],
};

const SHED_ID = ['brake-switch', 'rectifier', 'fuse', 'charge-controller', 'dump-load', 'battery-bank'] as const;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const shedAt = new THREE.Vector3(SHED.x, 0, SHED.z);
const houseAt = new THREE.Vector3(HOUSE.x, 0, HOUSE.z);

/** Public handles for the tests. */
export interface SiteScene extends SceneModule<PiggottState> {
  head: HeadModel;
  shed: Shed;
  house: House;
  /** The current dots and the wind sock (tests). */
  flows: FlowDots;
  sock: THREE.Object3D;
  /** Mast and tree geometry as currently drawn. */
  readonly drawn: { mastTop: number; guyLevels: number; trees: number; hub: number; scale: number };
}

/** Value noise for the colour of the meadow. */
function meadow(): THREE.Mesh {
  const size = 360;
  const g = new THREE.PlaneGeometry(size, size, 90, 90);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Color(0x9aa86a);
  const b = new THREE.Color(0xb5b27c);
  const c = new THREE.Color(0x86945a);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const n =
      0.5 +
      0.25 * Math.sin(x * 0.09) * Math.sin(z * 0.07) +
      0.15 * Math.sin(x * 0.31 + z * 0.23) +
      0.1 * Math.sin(z * 0.53);
    tmp.copy(n > 0.55 ? b : a).lerp(c, clamp(0.7 - n, 0, 0.7));
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  m.name = 'ground';
  return m;
}

export function createSiteScene(): SiteScene {
  const scene = new THREE.Scene();
  scene.name = 'site';
  const registry = new PartRegistry();
  const sky = createSky(scene);
  sky.focusShadow(V(8, 3, 6), 46);
  scene.add(meadow());

  // ---- the machine on the mast
  const head = createHead({ detail: 'site', caps: false, partId: 'wind-turbine' });
  const turbine = head.root;
  turbine.name = 'wind-turbine';
  scene.add(turbine);

  // ---- mast and hinged base
  const mastLine = minWidthMaterial(MAT.zinc());
  const mastMesh = new THREE.Mesh(new THREE.BufferGeometry(), mastLine.material);
  mastMesh.castShadow = true;
  const tower = group('tower');
  tower.add(mastMesh);
  let mastSegs: Segments = [[V(0, 0, 0), V(0, 1, 0)]];
  let mastRadiusNow = 0.03;
  pickAlong(
    mastMesh,
    () => mastSegs,
    () => mastRadiusNow,
  );
  scene.add(tower);

  const base = group('tower-base');
  const pad = MAST.padSize;
  base.add(
    mesh(new THREE.BoxGeometry(pad, MAST.padHeight, pad), MAT.concrete(), [0, MAST.padAbove - MAST.padHeight / 2, 0]),
  );
  for (const s of [-1, 1]) {
    base.add(
      mesh(new THREE.BoxGeometry(0.14, MAST.lugHeight, 0.02), MAT.steelBlack(), [
        0,
        MAST.padAbove + MAST.lugHeight / 2,
        s * 0.055,
      ]),
    );
  }
  const pin = mesh(new THREE.CylinderGeometry(MAST.pinDiameter / 2, MAST.pinDiameter / 2, 0.16, 12), MAT.steel(), [
    0,
    MAST.padAbove + 0.11,
    0,
  ]);
  pin.rotation.x = Math.PI / 2;
  base.add(pin);
  base.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.09), MAT.steelBlack(), [0, MAST.padAbove + 0.11, 0]));
  mergeStatic(base, { name: 'base' });
  scene.add(base);

  // ---- guy wires: four per level every 4 m, anchors on the ground (rebuilt when the mast or the rotor changes)
  const guyLine = minWidthMaterial(MAT.steel());
  const guyMesh = new THREE.Mesh(new THREE.BufferGeometry(), guyLine.material);
  guyMesh.castShadow = false;
  const peg = new THREE.Mesh(new THREE.BufferGeometry(), MAT.concrete());
  peg.castShadow = true;
  const guys = group('guy-wires');
  guys.add(guyMesh, peg);
  let guySegs: Segments = [];
  pickAlong(
    guyMesh,
    () => guySegs,
    () => MAST.guyDiameter / 2,
  );
  scene.add(guys);

  // ---- cable run: mast foot, along the ground, up a post, to the switch of the shed
  const sx = SHED.x;
  const sz = SHED.z;
  const shed = buildShed();
  const shedFrame = group('shed-frame');
  shedFrame.position.copy(shedAt);
  shedFrame.add(shed.scenery);
  const cableIn = shed.cableIn.clone().add(shedAt);
  const route = [
    V(0.2, 0.3, 0),
    V(0.7, 0.03, 0),
    V(3.7, 0.03, 0),
    V(3.7, 0.03, sz - 0.8),
    V(3.7, 1.5, sz - 0.8),
    V(cableIn.x - 0.25, cableIn.y, cableIn.z + 0.04),
    cableIn,
  ];
  const cableLine = minWidthMaterial(MAT.cableBlack(), 1.6);
  const cableCurve = new THREE.CatmullRomCurve3(route, false, 'centripetal', 0.2);
  const cableMesh = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 160, SHED.cableRadius, 6, false),
    cableLine.material,
  );
  cableLine.uniforms.uPipeRadius.value = SHED.cableRadius;
  cableMesh.castShadow = false;
  const cable = group('cable-run');
  cable.add(cableMesh, mesh(new THREE.BoxGeometry(0.09, 1.55, 0.09), MAT.woodDark(), [3.7, 0.78, sz - 0.8]));
  const cableSegs: Segments = route.slice(1).map((p, i) => [route[i], p]);
  pickAlong(
    cableMesh,
    () => cableSegs,
    () => SHED.cableRadius,
  );
  scene.add(cable);

  // ---- shed, devices
  for (const id of SHED_ID) shedFrame.add(shed.parts[id]);
  scene.add(shedFrame);

  // ---- house and its supply from the controller
  const out = shed.houseOut.clone().add(shedAt);
  const supplyWorld = [
    out,
    V(sx + 1.2, out.y - 0.1, sz - 0.7),
    V(sx + 1.55, 1.2, sz - 0.7),
    V(sx + 1.55, 0.03, sz - 0.7),
    V(HOUSE.x - HOUSE.length / 2 - 1, 0.03, sz - 0.7),
    V(HOUSE.x - HOUSE.length / 2 - 1, 0.03, HOUSE.z),
    V(HOUSE.x - HOUSE.length / 2 + 0.05, 1.6, HOUSE.z),
  ];
  const house = buildHouse(supplyWorld.map((p) => p.clone().sub(houseAt)));
  house.group.position.copy(houseAt);
  scene.add(house.group);

  // ---- trees and hedges (instanced), upwind of the mast
  const rand = rng(OBSTACLES.seed);
  const spots = Array.from({ length: OBSTACLES.count }, () => {
    const r = OBSTACLES.minRadius + (OBSTACLES.maxRadius - OBSTACLES.minRadius) * Math.sqrt(rand());
    const a = (160 + 130 * rand()) * DEG;
    return { x: r * Math.cos(a), z: r * Math.sin(a), k: 0.7 + 0.4 * rand(), spin: rand() * 6.28 };
  });
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1.25, 1, 6).translate(0, 0.5, 0),
    MAT.woodDark(),
    spots.length,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x587a3c, roughness: 0.95, flatShading: true }),
    spots.length,
  );
  for (const m of [trunks, crowns]) {
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
  }
  const obstacles = group('obstacles');
  obstacles.add(trunks, crowns);
  scene.add(obstacles);
  // the tree that carries the label: the one nearest to a place in view of the home camera (north-west of the mast)
  const labelTree = spots.reduce(
    (best, t, i) => (Math.hypot(t.x + 9, t.z + 5) < Math.hypot(spots[best].x + 9, spots[best].z + 5) ? i : best),
    0,
  );
  const mat4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const placeTrees = (h: number) => {
    const n = h > 0.2 ? spots.length : 0;
    spots.slice(0, n).forEach((t, i) => {
      const ht = h * t.k;
      const trunkH = ht * OBSTACLES.trunkShare;
      const tr = Math.max(0.035, 0.022 * ht);
      quat.setFromEuler(euler.set(0, t.spin, 0));
      mat4.compose(V(t.x, 0, t.z), quat, V(tr, trunkH + 0.3 * ht, tr));
      trunks.setMatrixAt(i, mat4);
      mat4.compose(V(t.x, trunkH + 0.28 * ht, t.z), quat, V(0.26 * ht, 0.38 * ht, 0.26 * ht));
      crowns.setMatrixAt(i, mat4);
    });
    trunks.count = crowns.count = n;
    trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
    // the bounds follow the instances (framing a part, the section of the registry)
    for (const m of [trunks, crowns]) {
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
    const t = spots[labelTree];
    trees.position.set(t.x, h * t.k * 1.02, t.z);
  };
  const trees = new THREE.Object3D();
  scene.add(trees);

  // ---- wind sock: a pole and a cone that points downwind (+X) and rises with the wind
  const sock = group('windsock');
  sock.position.set(WINDSOCK.x, 0, WINDSOCK.z);
  sock.add(
    mesh(new THREE.CylinderGeometry(0.03, 0.04, WINDSOCK.poleHeight, 8), MAT.zinc(), [0, WINDSOCK.poleHeight / 2, 0]),
  );
  const sockPivot = new THREE.Group();
  sockPivot.position.y = WINDSOCK.poleHeight;
  const cone = new THREE.CylinderGeometry(WINDSOCK.mouth / 2, WINDSOCK.mouth / 5, WINDSOCK.length, 12, 5, true);
  cone.rotateZ(-Math.PI / 2).translate(WINDSOCK.length / 2, 0, 0);
  const colours = new Float32Array(cone.attributes.position.count * 3);
  const orange = new THREE.Color(0xe8661c);
  const white = new THREE.Color(0xf2efe6);
  for (let i = 0; i < cone.attributes.position.count; i++) {
    const band = Math.floor((cone.attributes.position.getX(i) / WINDSOCK.length) * 4.999);
    (band % 2 ? white : orange).toArray(colours, i * 3);
  }
  cone.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const coneMesh = new THREE.Mesh(
    cone,
    new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  coneMesh.castShadow = true;
  sockPivot.add(coneMesh);
  sock.add(sockPivot);
  scene.add(sock);

  // ---- "Flux": dots of current along the cable and the wiring, in the dump load and towards the house
  const mainPts = [...cableCurve.getPoints(80), ...shed.pathMain.map((p) => p.clone().add(shedAt))];
  const dots = new FlowDots(160, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  const pMain = dots.addPath(mainPts, 90);
  const pDump = dots.addPath(
    shed.pathDump.map((p) => p.clone().add(shedAt)),
    6,
  );
  const pHouse = dots.addPath(supplyWorld, 40);
  scene.add(dots.object);

  // ---- registration (the parts are placed: the registry reads their rest position)
  const parts: Record<string, THREE.Object3D> = {
    'wind-turbine': turbine,
    tower,
    'guy-wires': guys,
    'tower-base': base,
    'cable-run': cable,
    house: house.group,
    obstacles,
  };
  for (const id of SHED_ID) parts[id] = shed.parts[id];
  for (const [id, o] of Object.entries(parts)) registry.add(id, o, new THREE.Vector3(...EXPLODE[id]));

  // ---- anchors of the labels
  const A: Record<string, THREE.Object3D> = {
    'wind-turbine': anchor(turbine, -0.3, 0.7, 0.04),
    tower: anchor(scene, 0.3, 6, 0),
    'cable-run': anchor(cable, 3.7, 0.15, 4),
    house: house.anchor,
    obstacles: trees,
    'guy-wires': anchor(guys, 3, 5, 3),
    'tower-base': anchor(base, 0.5, 0.45, 0.5),
  };
  for (const id of SHED_ID) A[id] = shed.anchors[id];

  const drawn = { mastTop: 0, guyLevels: 0, trees: -1, hub: 0, scale: 0 };
  const rebuild = (hub: number, s: number) => {
    drawn.hub = hub;
    drawn.scale = s;
    const r = mastRadius(DIAMETER_REF) * s;
    const top = hub + (HEAD_Y.capTop - 0.006) * s;
    const bottom = MAST.padAbove + 0.11;
    drawn.mastTop = top;
    mastRadiusNow = r;
    mastLine.uniforms.uPipeRadius.value = r;
    mastMesh.geometry.dispose();
    mastMesh.geometry = new THREE.CylinderGeometry(r, r, top - bottom, 12, 1).translate(0, (top + bottom) / 2, 0);
    mastSegs = [[V(0, bottom, 0), V(0, top, 0)]];
    A.tower.position.set(r + 0.3, (top + bottom) * 0.5, 0);
    // guys: a level every 4 m from the ground, and the top level just under the cap
    const levels: number[] = [];
    for (let h = MAST.guySpacing; h < top - 1.5; h += MAST.guySpacing) levels.push(h);
    levels.push(top - 0.35);
    drawn.guyLevels = levels.length;
    guySegs = [];
    const geos: THREE.BufferGeometry[] = [];
    const pegs: THREE.BufferGeometry[] = [];
    for (const h of levels) {
      for (const az of MAST.guyAzimuthsDeg) {
        const rho = Math.max(2, MAST.guyAnchorRatio * h);
        const end = V(rho * Math.cos(az * DEG), 0.12, rho * Math.sin(az * DEG));
        const start = V(Math.cos(az * DEG) * r, h, Math.sin(az * DEG) * r);
        guySegs.push([start, end]);
        const len = start.distanceTo(end);
        const w = new THREE.CylinderGeometry(MAST.guyDiameter / 2, MAST.guyDiameter / 2, len, 5, 1);
        w.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), end.clone().sub(start).normalize()));
        w.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
        geos.push(w);
        pegs.push(new THREE.BoxGeometry(0.4, 0.26, 0.4).translate(end.x, 0.0, end.z));
      }
    }
    const merge = (list: THREE.BufferGeometry[]) => {
      const out = mergeGeometries(list)!;
      list.forEach((g) => g.dispose());
      return out;
    };
    guyMesh.geometry.dispose();
    guyMesh.geometry = merge(geos);
    peg.geometry.dispose();
    peg.geometry = merge(pegs);
    guyLine.uniforms.uPipeRadius.value = MAST.guyDiameter / 2;
    A['guy-wires'].position.copy(guySegs[Math.min(guySegs.length - 1, 4)][1]).add(V(0, 2, 0));
  };

  const hl: Record<string, THREE.Color> = {
    red: new THREE.Color(0xff3b30),
    amber: new THREE.Color(0xf5a623),
    green: new THREE.Color(0x39d353),
  };
  const mat1 = new THREE.Color();
  const mod: SiteScene = {
    id: 'site',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, A),
    head,
    shed,
    house,
    flows: dots,
    sock: sockPivot,
    drawn,
    home: { position: new THREE.Vector3(-21, 13, 31), target: new THREE.Vector3(5, 5.5, 3.5) },
    minDistance: 1.5,
    maxDistance: 400,
    update(state, dt, view) {
      const hub = clamp(state.mastHeight, 3, 24);
      const s = clamp(state.diameter, 0.5, 5) / DIAMETER_REF;
      if (hub !== drawn.hub || s !== drawn.scale) rebuild(hub, s);
      if (state.obstacleHeight !== drawn.trees) {
        drawn.trees = state.obstacleHeight;
        placeTrees(clamp(state.obstacleHeight, 0, 20));
      }
      sky.update(state.hour, view.time);

      // the machine rides the top of the mast: its rest position follows the height, the explode lifts it from there
      const wt = registry.get('wind-turbine')!;
      wt.base.set(0, hub, 0);
      turbine.position.copy(wt.base).addScaledVector(wt.explode, wt.factor);
      turbine.scale.setScalar(s);
      head.update(state, dt, view, registry);

      // wind sock: hangs in a calm, flies level above about 6 m/s, flutters a little
      const k = clamp(state.windMean / 6, 0.12, 1);
      sockPivot.rotation.z = -(1 - k) * 1.35 + 0.04 * Math.sin(view.time * 3.1) * k;
      sockPivot.rotation.y = 0.05 * Math.sin(view.time * 2.3 + 1) * k;

      // switch, LEDs, dump load, charge bar, windows
      shed.lever.rotation.x = state.brake ? 0.55 : -0.5;
      shed.ledCharging.emissiveIntensity = state.busPower > 0.5 && !state.brake ? 1.8 : 0.08;
      shed.ledFull.emissiveIntensity = state.batteryFull || state.dumpActive ? 1.8 : 0.08;
      shed.glow.emissiveIntensity = state.dumpActive
        ? 0.4 + 1.8 * clamp(state.dumpPower / (DUMP_MAX_CURRENT * 14), 0, 1)
        : 0;
      const lit = Math.round(clamp(state.soc, 0, 1) * 10);
      const colour = state.soc < 0.2 ? hl.red : state.soc < 0.5 ? hl.amber : hl.green;
      shed.segments.forEach((m, i) => {
        m.emissive.copy(mat1.copy(colour));
        m.color.copy(colour).multiplyScalar(0.35);
        m.emissiveIntensity = i < lit ? 1.7 : 0.03;
      });
      const on = state.loadPower > 0.5 && !state.lvdOpen;
      house.panes.emissiveIntensity = on ? 0.9 + 0.9 * clamp(state.loadPower / 150, 0, 1) : 0;

      // current dots: speed proportional to the current (A) in each branch
      const show = view.schematic;
      dots.object.visible = show;
      if (show) {
        const amps = state.brake ? 0 : state.dcCurrent;
        dots.advance(pMain, 0.3 * clamp(amps, 0, 40), dt);
        dots.advance(pDump, 0.3 * clamp(state.dumpPower / 14, 0, 40), dt);
        dots.advance(pHouse, state.lvdOpen ? 0 : 0.3 * clamp(state.loadPower / 13, 0, 40), dt);
        dots.place();
      }
    },
  };
  rebuild(12, 1);
  placeTrees(5);
  drawn.trees = 5;
  return mod;
}
