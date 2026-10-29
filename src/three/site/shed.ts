import * as THREE from 'three';
import { MAT, emissive, group, mesh } from '@onigam/lab-kit/three';
import { DEVICES, SHED } from '../dims';
import { tubeGeometry } from '../common';
import { dynamic, mergeStatic } from '../merge';

// The battery shed, cut open at the front and on the left, and the devices on its board: brake switch, rectifier, fuse, charge
// controller, dump load, battery bank. Frame of the shed: origin on the floor at the middle of the slab, +X to the right, +Z
// towards the open front (the viewer). Every device is one group (a registered part of the site) that also carries the short
// wire that arrives at it; the lever, the LEDs, the glowing element and the charge bar are the only things that move.

const D = DEVICES;
/** Front face of the board. */
export const BOARD_Z = -SHED.depth / 2 + 0.04 + 0.02;

export type ShedPartId = 'brake-switch' | 'rectifier' | 'fuse' | 'charge-controller' | 'dump-load' | 'battery-bank';

export interface Shed {
  /** The slab, the walls and the board (scenery, unregistered). */
  scenery: THREE.Group;
  parts: Record<ShedPartId, THREE.Group>;
  /** What the state drives. */
  lever: THREE.Object3D;
  ledCharging: THREE.MeshStandardMaterial;
  ledFull: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
  segments: THREE.MeshStandardMaterial[];
  /** Points of the current path, in the frame of the shed: from the switch to the battery, and the two branches. */
  pathMain: THREE.Vector3[];
  pathDump: THREE.Vector3[];
  /** Where the cable of the mast arrives, and where the supply to the house leaves. */
  cableIn: THREE.Vector3;
  houseOut: THREE.Vector3;
  anchors: Record<ShedPartId, THREE.Object3D>;
}

const wire = (pts: THREE.Vector3[], mat: THREE.Material, r = 0.004) => mesh(tubeGeometry(pts, r, 24, 5), mat);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const zc = (d: number) => BOARD_Z + d / 2;

export function buildShed(): Shed {
  const scenery = group('shed');
  const timber = MAT.woodLight();
  scenery.add(
    mesh(new THREE.BoxGeometry(SHED.width + 0.3, 0.1, SHED.depth + 0.3), MAT.concrete(), [0, 0.05 - 0.04, 0]),
  );
  // The walls and the board that stand between the camera and the devices fade when the camera is on their outer side, whatever
  // the direction the guide or the visitor looks from: the electronics are always in view. Each has its own material.
  const fading = (
    geo: THREE.BufferGeometry,
    base: THREE.MeshStandardMaterial,
    pos: [number, number, number],
    outside: (local: THREE.Vector3) => boolean,
  ) => {
    const mat = base.clone();
    mat.transparent = true;
    const m = mesh(geo, mat, pos);
    const v = new THREE.Vector3();
    m.onBeforeRender = (_r, _s, camera) => {
      m.worldToLocal(v.copy(camera.position));
      const hide = outside(v);
      mat.opacity = hide ? 0.06 : 1;
      mat.depthWrite = !hide;
    };
    scenery.add(m);
  };
  // back wall (north): faded when the camera is behind it; right wall (east): faded when the camera is east of it
  fading(
    new THREE.BoxGeometry(SHED.width, SHED.wallHeight, 0.04),
    timber,
    [0, 0.06 + SHED.wallHeight / 2, -SHED.depth / 2 + 0.02],
    (v) => v.z < 0,
  );
  fading(
    new THREE.BoxGeometry(0.04, SHED.wallHeight, SHED.depth),
    timber,
    [SHED.width / 2 - 0.02, 0.06 + SHED.wallHeight / 2, 0],
    (v) => v.x > 0,
  );
  fading(
    new THREE.BoxGeometry(SHED.boardWidth, SHED.boardHeight, 0.02),
    MAT.osb(),
    [0.1, SHED.boardBottom + SHED.boardHeight / 2, BOARD_Z - 0.01],
    (v) => v.z < 0,
  );
  mergeStatic(scenery, { name: 'shed' });

  const red = MAT.cableRed();
  const black = MAT.cableBlack();
  const anchors = {} as Record<ShedPartId, THREE.Object3D>;
  const make = (id: ShedPartId) => {
    const g = group(id);
    const a = new THREE.Object3D();
    a.name = `anchor-${id}`;
    g.add(a);
    anchors[id] = a;
    return g;
  };

  // ---- brake switch: a 2-pole switch box with a red lever (down = the alternator is short-circuited)
  const sw = make('brake-switch');
  const bs = D.brakeSwitch;
  sw.add(mesh(new THREE.BoxGeometry(bs.w, bs.h, bs.d), MAT.enclosureGrey(), [bs.x, bs.y, zc(bs.d)]));
  sw.add(
    mesh(new THREE.BoxGeometry(bs.w * 0.7, bs.h * 0.18, 0.004), MAT.printBlack(), [
      bs.x,
      bs.y + bs.h * 0.25,
      BOARD_Z + bs.d + 0.002,
    ]),
  );
  const lever = new THREE.Object3D();
  lever.position.set(bs.x, bs.y - bs.h * 0.05, BOARD_Z + bs.d);
  lever.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), MAT.redPaint(), [0, 0.045, 0]));
  lever.add(mesh(new THREE.SphereGeometry(0.014, 12, 8), MAT.redPaint(), [0, 0.09, 0]));
  dynamic(lever);
  sw.add(lever);
  anchors['brake-switch'].position.set(bs.x, bs.y + bs.h / 2 + 0.03, zc(bs.d));

  // ---- rectifier: two bridges on a finned heatsink; its input wire comes from the switch
  const rc = make('rectifier');
  const r = D.rectifier;
  rc.add(mesh(new THREE.BoxGeometry(r.w, r.h, 0.012), MAT.aluDark(), [r.x, r.y, BOARD_Z + 0.006]));
  for (let i = 0; i < 9; i++) {
    rc.add(
      mesh(new THREE.BoxGeometry(0.004, r.h * 0.95, r.d - 0.012), MAT.alu(), [
        r.x - r.w / 2 + 0.012 + i * ((r.w - 0.024) / 8),
        r.y,
        BOARD_Z + 0.012 + (r.d - 0.012) / 2,
      ]),
    );
  }
  for (const s of [-1, 1])
    rc.add(
      mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), MAT.printBlack(), [
        r.x + s * 0.035,
        r.y + r.h * 0.2,
        BOARD_Z + r.d,
      ]),
    );
  rc.add(
    wire(
      [v(bs.x + bs.w / 2, bs.y, zc(0.03)), v((bs.x + r.x) / 2, bs.y - 0.03, zc(0.04)), v(r.x - r.w / 2, r.y, zc(0.03))],
      red,
    ),
  );
  anchors.rectifier.position.set(r.x, r.y + r.h / 2 + 0.03, zc(r.d));

  // ---- fuse
  const fu = make('fuse');
  const f = D.fuse;
  fu.add(mesh(new THREE.BoxGeometry(f.w, f.h, f.d), MAT.printBlack(), [f.x, f.y, zc(f.d)]));
  const cart = mesh(new THREE.CylinderGeometry(0.009, 0.009, f.w * 0.7, 10), MAT.warningYellow(), [
    f.x,
    f.y,
    BOARD_Z + f.d + 0.006,
  ]);
  cart.rotation.z = Math.PI / 2;
  fu.add(cart);
  fu.add(
    wire(
      [v(r.x + r.w / 2, r.y, zc(0.03)), v((r.x + f.x) / 2, r.y + 0.03, zc(0.04)), v(f.x - f.w / 2, f.y, zc(0.03))],
      red,
    ),
  );
  anchors.fuse.position.set(f.x, f.y + f.h / 2 + 0.03, zc(f.d));

  // ---- charge controller with two LEDs
  const cc = make('charge-controller');
  const c = D.controller;
  cc.add(mesh(new THREE.BoxGeometry(c.w, c.h, c.d), MAT.victronBlue(), [c.x, c.y, zc(c.d)]));
  cc.add(
    mesh(new THREE.BoxGeometry(c.w * 0.8, c.h * 0.3, 0.004), MAT.printBlack(), [
      c.x,
      c.y + c.h * 0.22,
      BOARD_Z + c.d + 0.002,
    ]),
  );
  for (let i = 0; i < 3; i++)
    cc.add(
      mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), MAT.printGrey(), [
        c.x - 0.06 + i * 0.06,
        c.y - c.h / 2 - 0.012,
        zc(0.03),
      ]),
    );
  const ledCharging = emissive(0x39d353, 0);
  const ledFull = emissive(0xff3b30, 0);
  for (const [m, dx] of [
    [ledCharging, -0.05],
    [ledFull, 0.05],
  ] as const) {
    const led = mesh(new THREE.SphereGeometry(0.007, 10, 8), m, [c.x + dx, c.y - c.h * 0.05, BOARD_Z + c.d + 0.004]);
    dynamic(led);
    cc.add(led);
  }
  cc.add(
    wire(
      [v(f.x + f.w / 2, f.y, zc(0.03)), v((f.x + c.x) / 2, f.y - 0.02, zc(0.04)), v(c.x - c.w / 2, c.y, zc(0.03))],
      red,
    ),
  );
  anchors['charge-controller'].position.set(c.x, c.y + c.h / 2 + 0.03, zc(c.d));

  // ---- dump load: a box with a grille, a heating element behind it that glows
  const dl = make('dump-load');
  const d = D.dumpLoad;
  dl.add(mesh(new THREE.BoxGeometry(d.w, d.h, d.d), MAT.steelBlack(), [d.x, d.y, zc(d.d)]));
  const glow = emissive(0xff7a1a, 0);
  for (let i = 0; i < 6; i++) {
    const rod = mesh(new THREE.CylinderGeometry(0.004, 0.004, d.w * 0.8, 6), glow, [
      d.x,
      d.y - d.h * 0.36 + i * ((d.h * 0.72) / 5),
      BOARD_Z + d.d + 0.006,
    ]);
    rod.rotation.z = Math.PI / 2;
    rod.castShadow = false;
    dynamic(rod);
    dl.add(rod);
  }
  for (let i = 0; i < 4; i++)
    dl.add(
      mesh(new THREE.BoxGeometry(0.004, d.h * 0.8, 0.012), MAT.steel(), [
        d.x - d.w * 0.33 + i * ((d.w * 0.66) / 3),
        d.y,
        BOARD_Z + d.d + 0.018,
      ]),
    );
  dl.add(
    wire(
      [v(c.x + c.w / 2, c.y, zc(0.03)), v((c.x + d.x) / 2, c.y - 0.02, zc(0.04)), v(d.x - d.w / 2, d.y, zc(0.03))],
      red,
    ),
  );
  anchors['dump-load'].position.set(d.x, d.y + d.h / 2 + 0.03, zc(d.d));

  // ---- battery: a 12 V 100 Ah block on the floor, its terminals, the LED bar of the charge on the board above it
  const bb = make('battery-bank');
  const b = D.battery;
  const by = 0.06 + b.h / 2;
  bb.add(mesh(new THREE.BoxGeometry(b.w, b.h, b.d), MAT.pvcDark(), [b.x, by, b.z]));
  bb.add(mesh(new THREE.BoxGeometry(b.w * 0.96, 0.012, b.d * 0.96), MAT.pvcGrey(), [b.x, by + b.h / 2 + 0.006, b.z]));
  const tp = v(b.x + b.w / 2 - 0.05, by + b.h / 2 + 0.03, b.z);
  const tn = v(b.x - b.w / 2 + 0.05, by + b.h / 2 + 0.03, b.z);
  bb.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), MAT.cableRed(), [tp.x, tp.y - 0.008, tp.z]));
  bb.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), MAT.cableBlack(), [tn.x, tn.y - 0.008, tn.z]));
  bb.add(wire([v(c.x, c.y - c.h / 2, zc(0.03)), v(c.x, 1.0, b.z - 0.1), v(tp.x + 0.1, 0.6, b.z), tp], red, 0.005));
  bb.add(
    wire(
      [v(c.x - 0.06, c.y - c.h / 2, zc(0.03)), v(c.x - 0.1, 1.0, b.z - 0.2), v(tn.x - 0.1, 0.6, b.z), tn],
      black,
      0.005,
    ),
  );
  const mo = D.monitor;
  bb.add(mesh(new THREE.BoxGeometry(mo.w, mo.h, mo.d), MAT.printBlack(), [mo.x, mo.y, BOARD_Z + mo.d / 2]));
  const segments: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 10; i++) {
    const m = emissive(0x39d353, 0);
    segments.push(m);
    const s = mesh(new THREE.BoxGeometry(mo.w / 10 - 0.006, mo.h * 0.6, 0.004), m, [
      mo.x - mo.w / 2 + (i + 0.5) * (mo.w / 10),
      mo.y,
      BOARD_Z + mo.d + 0.002,
    ]);
    s.castShadow = false;
    dynamic(s);
    bb.add(s);
  }
  anchors['battery-bank'].position.set(b.x, by + b.h / 2 + 0.06, b.z);

  const parts = {
    'brake-switch': sw,
    rectifier: rc,
    fuse: fu,
    'charge-controller': cc,
    'dump-load': dl,
    'battery-bank': bb,
  };
  for (const g of Object.values(parts)) mergeStatic(g, { name: g.name });

  const pathMain = [
    v(bs.x - bs.w / 2, bs.y, zc(0.03)),
    v(bs.x + bs.w / 2, bs.y, zc(0.03)),
    v(r.x - r.w / 2, r.y, zc(0.03)),
    v(r.x + r.w / 2, r.y, zc(0.03)),
    v(f.x - f.w / 2, f.y, zc(0.03)),
    v(f.x + f.w / 2, f.y, zc(0.03)),
    v(c.x - c.w / 2, c.y, zc(0.03)),
    v(c.x, c.y - c.h / 2, zc(0.03)),
    v(c.x, 1.0, b.z - 0.1),
    v(tp.x + 0.1, 0.6, b.z),
    tp,
  ];
  const pathDump = [v(c.x + c.w / 2, c.y, zc(0.03)), v(d.x - d.w / 2, d.y, zc(0.03)), v(d.x, d.y, zc(0.03))];
  return {
    scenery,
    parts,
    lever,
    ledCharging,
    ledFull,
    glow,
    segments,
    pathMain,
    pathDump,
    cableIn: v(bs.x - bs.w / 2, bs.y, zc(0.03)),
    houseOut: v(c.x + c.w / 2 - 0.02, c.y - c.h / 2, zc(0.03)),
    anchors,
  };
}
