import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { PARTS } from '../data/parts';
import { partIds } from '../part-ids';
import { DIAMETER_REF } from '../sim/machine';
import {
  BLADE,
  CRADLE,
  HEAD,
  HUB,
  HUB_DISC,
  M12,
  MAST,
  NACELLE,
  ROTOR_DISC,
  ROTOR_RODS,
  STACK,
  STATOR,
  STATOR_RODS,
  TAIL,
  YAW,
} from '../three/dims';
import {
  EDU_NOTE,
  FILL,
  balloon,
  box,
  caption,
  dimH,
  dimV,
  gapDim,
  grid,
  heading,
  marksLegend,
  poly,
  rot,
  tube2d,
  thin,
  med,
} from './draw';
import { DEG, dim, k, lab, labN, labOf, cat } from './geom';
import { PIVOT, X, Y, bladePlanform, bladeProfileSide, tailShapes, type V3 } from './head';

const NUMBER = 'PL-01';
const TITLE = l('Plan d’ensemble de la machine', 'General arrangement of the machine');

/** The eight parts of the `turbine` world, in the order of the item numbers of this sheet. */
const ITEMS = partIds('turbine');

const partOf = (id: string) => PARTS.find((p) => p.id === id)!;

const xy = (p: V3): Pt => [p[0], p[1]];

// ------------------------------------------------------------------------------------------------ side view

/** Side view from the +Z side: wind towards +X. Model mm, origin on the yaw axis at the height of the axle. */
function sideView(v: View): void {
  const mr = k(MAST.pipeOuter) / 2;
  const yawR = k(YAW.pipeOuter) / 2;
  const stubR = k(YAW.stubOuter) / 2;
  const collarR = k(YAW.collarOuter) / 2;
  const bottom = -360;

  // --- mast, cap, stub, collar, yaw pipe (behind everything)
  v.rect([-mr, Y.capBottom], [mr, bottom], thin(FILL.steel));
  // break of the mast
  v.polyline(
    [
      [-mr - 6, bottom + 18],
      [mr + 6, bottom + 8],
    ],
    { w: W.thin },
  );
  v.rect([-mr, Y.capTop], [mr, Y.capBottom], med(FILL.steel));
  v.rect([-stubR, Y.collarBottom], [stubR, Y.capTop], thin(FILL.steel));
  v.rect([-collarR, Y.collarBottom], [collarR, Y.washerBottom], med(FILL.steel));
  v.rect([-collarR + 2.5, Y.washerBottom], [collarR - 2.5, Y.pipeBottom], thin('#e0c46a'));
  v.rect([-yawR, Y.pipeBottom], [yawR, Y.beamBottom], med(FILL.steel));
  v.center([0, 90], [0, bottom + 40], 12);

  // --- cable down the pipe (dashed copper line)
  v.polyline(
    [
      [X.cradleBack + 12, 20],
      [X.cradleBack + 40, Y.beamTop + 5.5],
      [-4, Y.beamTop + 5.5],
      [0, Y.beamBottom - 2],
      [0, bottom + 60],
    ],
    { w: W.medium, color: COLORS.copper, dash: 'hidden' },
  );

  // --- angle iron: horizontal leg on top, vertical leg hanging towards the viewer
  v.rect([X.beam0, Y.beamTop], [X.beam1, Y.beamBottom - k(NACELLE.leg - NACELLE.thickness)], med(FILL.steel));
  v.line([X.beam0, Y.beamBottom], [X.beam1, Y.beamBottom], { w: W.thin });

  // --- tail: plate, inner pipe, sleeve, boom, T-bar, vane (swing 0 = on its stop)
  const t = tailShapes(0);
  const ri = k(TAIL.boomOuter) / 2;
  const ro = k(TAIL.sleeveOuter) / 2;
  const yPlate = (Y.beamTop + Y.beamBottom) / 2;
  v.rect([X.beam1, yPlate + 3], [PIVOT[0] + ri, yPlate - 3], med(FILL.steel));
  poly(v, tube2d(xy(t.innerPipe[0]!), xy(t.innerPipe[1]!), ri), med(FILL.steel));
  poly(v, tube2d(xy(t.sleeve[0]!), xy(t.sleeve[1]!), ro), med(FILL.steel));
  poly(v, tube2d(xy(t.boomStart), xy(t.boomEnd), ri), med(FILL.steel));
  poly(v, t.bar.map(xy), med(FILL.steel));
  poly(v, t.vane.map(xy), { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  v.center([PIVOT[0], PIVOT[1] - 100], [PIVOT[0] + 40, PIVOT[1] + 100], 0);

  // --- alternator and rotor stack
  const rodY = k(STATOR_RODS.circleRadius);
  // hub barrel, housing flange, cradle, stator rod
  v.rect([X.statorBack, k(HUB.barrelDiameter) / 2], [X.housingFront, -k(HUB.barrelDiameter) / 2], thin(FILL.steel));
  v.rect([X.statorBack, rodY + 6], [hx(STACK.statorRodBack), rodY - 6], thin(FILL.steel));
  v.rect(
    [X.housingFront, k(CRADLE.housingDiameter) / 2],
    [X.cradleFront, -k(CRADLE.housingDiameter) / 2],
    med(FILL.steel),
  );
  v.rect([X.cradleFront, k(CRADLE.diameter) / 2], [X.cradleBack, -k(CRADLE.diameter) / 2], med(FILL.steel));
  v.rect([X.statorFront, k(STATOR.outer) / 2], [X.statorBack, -k(STATOR.outer) / 2], med(FILL.resin));
  v.rect(
    [X.discFront, k(ROTOR_DISC.castingDiameter) / 2],
    [X.magnetFace, -k(ROTOR_DISC.castingDiameter) / 2],
    med(FILL.resin),
  );
  v.rect([X.discFront, k(ROTOR_DISC.diameter) / 2], [X.magnetBack, -k(ROTOR_DISC.diameter) / 2], thin(FILL.steel));
  v.rect([X.plateFront, k(HUB.plateDiameter) / 2], [X.discFront, -k(HUB.plateDiameter) / 2], med(FILL.steel));
  // rods and nuts between the hub plate and the plywood disc, axle nut
  const rr = k(ROTOR_RODS.diameter) / 2;
  const y45 = rodY * Math.SQRT1_2;
  for (const s of [1, -1]) v.rect([X.rodFront, s * y45 + rr], [X.plateFront, s * y45 - rr], thin(FILL.steel));
  v.rect(
    [X.axleFront, k(HUB.nutAcrossFlats) / 2],
    [X.axleFront + k(HUB.nutThickness), -k(HUB.nutAcrossFlats) / 2],
    thin(FILL.steel),
  );

  // --- plywood disc, blade roots, plywood triangle, blades
  const ply = k(HUB_DISC.thickness);
  const prof = bladeProfileSide();
  const x0 = X.bladeOrigin;
  const blade = (sy: number): void => {
    const pts: Pt[] = [
      ...prof.front.map(([x, r]): Pt => [x0 + x, sy * r]),
      ...[...prof.back].reverse().map(([x, r]): Pt => [x0 + x, sy * r]),
    ];
    poly(v, pts, { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  };
  blade(-0.5);
  v.rect([x0 - ply, k(HUB_DISC.diameter) / 2], [x0, -k(HUB_DISC.diameter) / 2], {
    w: W.medium,
    fill: FILL.wood,
    hatch: 'wood',
  });
  const triR = k(HUB_DISC.triangleRadius);
  const xt0 = X.bladeFront;
  v.rect([xt0, triR], [xt0 + k(HUB_DISC.triangleThickness), -triR / 2], {
    w: W.medium,
    fill: FILL.wood,
    hatch: 'wood',
  });
  blade(1);

  // --- axes
  v.center([X.rodFront - 40, 0], [X.cradleBack + 20, 0], 0);
  // wind
  v.text([X.bladeFront - 20, 640], l('VENT →', 'WIND →'), { size: 2.2, weight: 'bold', anchor: 'end', color: INK_2 });
}

const hx = (xAlt: number): number => X.stator + k(xAlt);

// ------------------------------------------------------------------------------------------------ front view

/** Front view from the wind side (+Z to the right): the rotor with its three blades, the tail edge-on behind, the mast under it. */
function frontView(v: View): void {
  const off = k(HEAD.offset);
  const R = k(BLADE.length);
  const mr = k(MAST.pipeOuter) / 2;
  const bottom = -360;
  const t = tailShapes(0);
  // behind: vane and T-bar seen at a grazing angle (z, y), the mast and the cap
  poly(
    v,
    t.vane.map((p): Pt => [p[2], p[1]]),
    { w: W.medium, fill: FILL.wood, hatch: 'wood' },
  );
  poly(
    v,
    t.bar.map((p): Pt => [p[2], p[1]]),
    med(FILL.steel),
  );
  v.rect([-mr, Y.capBottom], [mr, bottom], thin(FILL.steel));
  v.polyline(
    [
      [-mr - 6, bottom + 18],
      [mr + 6, bottom + 8],
    ],
    { w: W.thin },
  );
  v.rect([-mr, Y.capTop], [mr, Y.capBottom], med(FILL.steel));
  v.rect([-k(YAW.collarOuter) / 2, Y.collarBottom], [k(YAW.collarOuter) / 2, Y.washerBottom], med(FILL.steel));
  v.rect([-k(YAW.stubOuter) / 2, Y.collarBottom], [k(YAW.stubOuter) / 2, Y.capTop], thin(FILL.steel));
  v.center([0, 160], [0, bottom + 40], 12);

  // stator disc and magnet casting behind the blades
  v.circle([off, 0], k(STATOR.outer) / 2, med(FILL.resin));
  v.circle([off, 0], k(ROTOR_DISC.castingDiameter) / 2, thin(FILL.resin));
  // swept circle
  v.circle([off, 0], R, { w: W.thin, dash: 'phantom', color: INK_2 });

  // three blades, 120° apart, the leading edge on the clockwise side
  const plan = bladePlanform();
  for (let i = 0; i < BLADE.count; i++) {
    const psi = i * 120;
    const pts: Pt[] = [...plan.lead, ...[...plan.trail].reverse()].map(([tt, r]): Pt => {
      const [z, y] = rot([tt, r], -psi);
      return [off + z, y];
    });
    poly(v, pts, { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  }
  // plywood triangle in front of the roots, with the four rods
  const tri = [0, 120, 240].map((a): Pt => {
    const [z, y] = rot([0, k(HUB_DISC.triangleRadius)], -a);
    return [off + z, y];
  });
  poly(v, tri, { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  for (const a of ROTOR_RODS.anglesDeg) {
    const [z, y] = rot([0, k(ROTOR_DISC.boltCircleDiameter) / 2], -a);
    v.circle([off + z, y], k(M12.diameter) / 2 + 2, thin());
  }
  // sense of rotation seen from the wind side: clockwise
  const cw = v.arc([off, 0], R * 0.8, 72, 38, { w: W.medium, color: COLORS.copper });
  cw.setAttribute('marker-end', 'url(#arrow)');
  v.text(
    [off + R * 0.8 * Math.cos(55 * DEG) + 22, R * 0.8 * Math.sin(55 * DEG)],
    l('sens de rotation', 'direction of rotation'),
    {
      size: 2,
      color: COLORS.copper,
      baseline: 'middle',
    },
  );
  // axes: rotor axis and yaw axis
  v.center([off, -R - 40], [off, R + 40], 0);
  v.center([-90, 0], [off + R + 40, 0], 0);
}

// ------------------------------------------------------------------------------------------------ the sheet

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Vue de côté et vue de face · échelle 1:10 · la machine de 1,2 m de la vidéo',
      'Side and front views · scale 1:10 · the video’s 1.2 m machine',
    ),
    number: NUMBER,
    scale: '1:10',
  });
  const sc = 0.1;
  const p = d.paper();

  // ------------------------------------------------------------------ side view
  const ox = 98;
  const oy = 92;
  const sv = d.view(ox, oy, sc);
  sideView(sv);
  // dimensions of the side view
  const t = tailShapes(0);
  const boomL = dim('TAIL', 'boomLength');
  const mastR = k(MAST.pipeOuter) / 2;
  dimH(sv, [X.beam0, Y.beamTop], [X.beam1, Y.beamTop], 34, labOf(dim('NACELLE', 'length')), 2.2);
  dimH(sv, [X.stator, 130], [0, 130], 160, labN(Math.abs(X.stator), 0, 'E'), 2.2);
  sv.dim(xy(t.boomStart), xy(t.boomEnd), -12 * 1, { dir: 'aligned', label: labOf(boomL), size: 2.2 });
  const vx0 = t.vane[0]![0];
  const vx1 = t.vane[1]![0];
  dimH(sv, [vx0, -150], [vx1, -150], -200, labN(k(TAIL.vaneLength), 0, 'D'), 2.2);
  dimV(sv, [vx1, t.vane[0]![1]], [vx1, t.vane[3]![1]], vx1 + 40, labN(k(TAIL.vaneHeight), 0, 'D'), 2.2);
  dimH(sv, [X.bladeFront, -300], [vx1, -300], -470, labN(vx1 - X.bladeFront, 0, 'E'), 2.2);
  sv.leader([mastR, Y.capTop - 70], 12, 4, cat('mât Ø', lab(k(MAST.pipeOuter), 'R')), { size: 2.1 });

  // ------------------------------------------------------------------ front view
  const fox = 322;
  const fv = d.view(fox, oy, sc);
  frontView(fv);
  const off = k(HEAD.offset);
  const R = k(BLADE.length);
  dimH(fv, [off - R, 0], [off + R, 0], -R - 70, cat('Ø', labN(DIAMETER_REF * 1000, 0, 'R')), 2.4);
  p.text(
    fv.map([off, -R - 70 - 0]).map((q, i) => (i === 0 ? q : q + 11)) as Pt,
    l('cercle balayé : 1,131 m²†', 'swept circle: 1.131 m²†'),
    { size: 2, color: INK_2, anchor: 'middle' },
  );
  // the offset between the yaw axis and the rotor axis
  const [ax0, ay] = fv.map([0, -105]);
  const [ax1] = fv.map([off, -105]);
  p.line([ax0, ay - 8], [ax0, ay + 4], { w: W.thin });
  p.line([ax1, ay - 8], [ax1, ay + 4], { w: W.thin });
  gapDim(p, ax0, ax1, ay, labOf(dim('HEAD', 'offset')), 'right');

  // ------------------------------------------------------------------ captions
  caption(d, ox + 20, 178, l('VUE DE CÔTÉ · côté +Z', 'SIDE VIEW · +Z side'), '1:10');
  caption(d, fox + 4, 178, l('VUE DE FACE · côté du vent', 'FRONT VIEW · wind side'), '1:10');

  // ------------------------------------------------------------------ balloons (item numbers = rows of the list)
  const n = (id: string) => ITEMS.indexOf(id) + 1;
  const bx = (xm: number) => ox + xm * sc;
  balloon(sv, [X.bladeOrigin - 26, 330], 64, 52, n('rotor'));
  balloon(sv, [X.stator, -132], 66, 128, n('alternator'));
  balloon(sv, [-60, Y.beamBottom - 30], bx(-60) + 12, 128, n('nacelle-frame'));
  balloon(sv, [0, Y.collarBottom + 8], bx(0) - 8, 128, n('yaw-bearing'));
  balloon(sv, [0, -240], bx(0) - 22, 128, n('wire-loop'));
  balloon(sv, [PIVOT[0] + 18, PIVOT[1] + 60], bx(PIVOT[0]) + 4, 66, n('tail-hinge'));
  balloon(sv, [330, Y.beamTop + 12], bx(330), 72, n('tail-boom'));
  balloon(sv, [(vx0 + vx1) / 2 + 90, 100], bx((vx0 + vx1) / 2 + 90), 56, n('tail-vane'));
  balloon(fv, [off + 0, 420], fox + 52, 36, n('rotor'));
  balloon(fv, [t.vane[1]![2] - 8, -120], fox + 52, 112, n('tail-vane'));
  sv.text([-44, -300], l('axe de lacet', 'yaw axis'), { size: 1.9, color: INK_2, rotate: 90, anchor: 'middle' });

  // ------------------------------------------------------------------ parts list, marks, notes
  const xl = 14;
  heading(d, xl, 196, l('REPÈRES · pièces du monde « machine »', 'ITEMS · parts of the “machine” world'), { size: 2 });
  grid(
    d,
    xl,
    201,
    [
      { label: l('Rep.', 'Item'), w: 9, align: 'middle' },
      { label: l('Désignation', 'Part'), w: 70 },
      { label: l('Qté', 'Qty'), w: 8, align: 'middle' },
    ],
    ITEMS.map((id, i) => [{ t: String(i + 1), bold: true }, partOf(id).name, { t: String(partOf(id).qty ?? 1) }]),
    { size: 1.85, pad: 0.7, lineH: 2.9 },
  );
  marksLegend(d, 112, 201, 62);
  box(
    d,
    180,
    201,
    226,
    l('LIRE LE PLAN', 'READING'),
    [
      {
        bullet: '1',
        t: l(
          'Le vent souffle vers la droite. La machine est montrée au repos, queue sur sa butée, rotor face au vent ; le repliement est détaillé sur PL-03, la coupe de l’alternateur sur PL-04.',
          'The wind blows to the right. The machine is drawn at rest, tail on its stop, rotor facing the wind; furling is detailed on PL-03, the alternator section on PL-04.',
        ),
      },
      {
        bullet: '2',
        t: l(
          'Cotes : celles du modèle 3D, lui-même fait d’après les plans publiés et le wiki. La vue de face est vue du côté du vent : le rotor tourne dans le sens des aiguilles d’une montre.',
          'Dimensions: those of the 3D model, itself built from the published plans and the wiki. The front view is seen from the wind side: the rotor turns clockwise.',
        ),
      },
      { bullet: '3', t: EDU_NOTE },
    ],
    { size: 1.8 },
  );
  return d;
}

export const generalArrangement: DrawingSheet = {
  id: 'general-arrangement',
  number: NUMBER,
  group: 'machine',
  title: TITLE,
  description: l(
    'Vue de côté et vue de face de la machine de 1,2 m à l’échelle 1:10, à partir des cotes du modèle 3D. On y lit le rotor de 1,2 m, le décalage de 41 mm entre l’axe de l’alternateur et l’axe de lacet, le cadre en cornière, le pivot sur le mât et la queue sur sa charnière inclinée. Les repères renvoient à la liste des pièces ; les cotes marquées * sont des estimations de la maquette.',
    'Side and front views of the 1.2 m machine at 1:10, from the dimensions of the 3D model. They show the 1.2 m rotor, the 41 mm offset between the alternator axis and the yaw axis, the angle-iron frame, the pivot on the mast and the tail on its inclined hinge. Items refer to the parts list; dimensions marked * are estimates of the model.',
  ),
  scene: 'turbine',
  parts: ITEMS,
  render,
};

export type { L };
