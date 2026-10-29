import {
  COLORS,
  Drawing,
  INK_2,
  W,
  type DrawingSheet,
  type Pt,
  type Stroke,
  type View,
} from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { MODEL } from '../data/figures';
import { nEn, nFr } from '../data/units';
import { FURLING_SPEED, TAIL_SWING_DEG, YAW_FURLED_DEG, YAW_STOP_DEG } from '../sim/machine';
import { BLADE, CRADLE, HEAD, MAST, NACELLE, STATOR, TAIL, YAW } from '../three/dims';
import {
  EDU_NOTE,
  FILL,
  arrow,
  box,
  dimH,
  dimV,
  grid,
  heading,
  marksLegend,
  poly,
  thick,
  tube2d,
  med,
  thin,
} from './draw';
import { DEG, dim, k, labN, labOf } from './geom';
import { AXIS, PIVOT, X, tailPose, tailShapes, type V3 } from './head';

const NUMBER = 'PL-03';
const TITLE = l('Repliement : géométrie de la queue', 'Furling: the tail geometry');

/** Head frame (x, y, z) to the wind frame after a yaw of `yaw` degrees about the vertical axis, then to the plan (x, −z) of a model view. */
const plan = ([x, , z]: V3, yaw: number): Pt => {
  const c = Math.cos(yaw * DEG);
  const s = Math.sin(yaw * DEG);
  return [x * c + z * s, -(-x * s + z * c)];
};
const flat = ([x, , z]: V3): Pt => [x, -z];

/** The head in the wind frame after a yaw, drawn in full: alternator, angle iron, boom, vane, yaw pipe. */
function drawPose(v: View, yaw: number, swing: number, s: Stroke): void {
  const P = (x: number, z: number) => plan([x, 0, z], yaw);
  const off = k(HEAD.offset);
  const rect = (x0: number, x1: number, z0: number, z1: number): Pt[] => [P(x0, z0), P(x1, z0), P(x1, z1), P(x0, z1)];
  const R = k(BLADE.length);
  // the swept rotor, edge-on: a long thin rotor sheet, and the blades' roots
  poly(v, rect(X.bladeFront, X.bladeOrigin, off - R, off + R), { ...s, dash: 'phantom', fill: 'none', w: W.thin });
  poly(v, rect(X.bladeFront, X.bladeOrigin, off - 100, off + 100), s);
  poly(v, rect(X.statorFront, X.statorBack, off - k(STATOR.outer) / 2, off + k(STATOR.outer) / 2), s);
  poly(v, rect(X.beam0, X.beam1, k(HEAD.beamZ0), k(HEAD.beamZ0 + NACELLE.leg)), s);
  const t = tailShapes(swing);
  const q = (a: V3): Pt => plan(a, yaw);
  poly(v, tube2d(q(t.boomStart), q(t.boomEnd), k(TAIL.boomOuter) / 2), s);
  v.line(q(t.vane[0]!), q(t.vane[1]!), { w: W.thick, color: s.color });
  v.circle(P(0, 0), k(YAW.pipeOuter) / 2 + 6, { ...s, w: W.thin, fill: FILL.steel });
}

/** A pose in the background: the rotor's centre line and the tail only, with a label at the end of the rotor. */
function drawGhost(v: View, yaw: number, swing: number, color: string, label: L): void {
  const off = k(HEAD.offset);
  const R = k(BLADE.length);
  const q = (a: V3): Pt => plan(a, yaw);
  const t = tailShapes(swing);
  const rotorEnd = plan([X.bladeFront, 0, off - R], yaw);
  v.line(plan([X.bladeFront, 0, off + R], yaw), rotorEnd, { w: W.thin, color, dash: 'center' });
  v.line(q(t.boomStart), q(t.boomEnd), { w: W.medium, color });
  v.line(q(t.vane[0]!), q(t.vane[1]!), { w: W.medium, color });
  v.text([rotorEnd[0] - 6, rotorEnd[1] + 6], label, { size: 2, color, anchor: 'end', mono: true, halo: true });
}

/** Path of the end of the boom as the tail folds, in the wind frame: yaw follows the swing as in the simulation. */
function boomPath(): Pt[] {
  const pts: Pt[] = [];
  for (let sw = 0; sw <= TAIL_SWING_DEG + 1e-9; sw += 5) {
    const yaw = YAW_STOP_DEG + ((YAW_FURLED_DEG - YAW_STOP_DEG) * sw) / TAIL_SWING_DEG;
    pts.push(plan(tailShapes(sw).vane[1]!, yaw));
  }
  return pts;
}

/** The swing of the tail for a yaw of the rotor: the simulation lets it follow the yaw linearly (engine.ts: tailSwing = 95° × folded). */
const swingOf = (yaw: number): number => (TAIL_SWING_DEG * (yaw - YAW_STOP_DEG)) / (YAW_FURLED_DEG - YAW_STOP_DEG);

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Vue en plan : lacet, décalage, charnière inclinée 20° / 55°, oscillation de la queue · 1:5, 1:2 et 1:10',
      'Plan view: yaw, offset, the 20° / 55° inclined hinge, the tail swing · 1:5, 1:2 and 1:10',
    ),
    number: NUMBER,
    scale: '1:2·1:5·1:10',
  });
  const p = d.paper();

  // ------------------------------------------------------------------ A: the geometry of the tail at rest, head frame, 1:5
  heading(
    d,
    14,
    13,
    l(
      'A · GÉOMÉTRIE AU REPOS · la tête de la machine en plan, queue sur sa butée · 1:5',
      'A · GEOMETRY AT REST · the head of the machine in plan, tail on its stop · 1:5',
    ),
    { size: 2.2 },
  );
  const vb = d.view(88, 64, 0.2);
  const off = k(HEAD.offset);
  const bar = (x0: number, x1: number, z0: number, z1: number, st: Stroke) =>
    poly(
      vb,
      [
        [x0, -z0],
        [x1, -z0],
        [x1, -z1],
        [x0, -z1],
      ],
      st,
    );
  bar(X.bladeFront, X.bladeOrigin, off - 130, off + 130, { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  bar(X.discFront, X.magnetFace, off - 120, off + 120, med(FILL.resin));
  bar(X.statorFront, X.statorBack, off - k(STATOR.outer) / 2, off + k(STATOR.outer) / 2, med(FILL.resin));
  bar(X.housingFront, X.cradleBack, off - k(CRADLE.diameter) / 2, off + k(CRADLE.diameter) / 2, med(FILL.steel));
  bar(X.beam0, X.beam1, k(HEAD.beamZ0), k(HEAD.beamZ0 + NACELLE.leg), med(FILL.steel));
  vb.circle([0, 0], k(YAW.pipeOuter) / 2, { w: W.thin, dash: 'hidden', color: INK_2 });
  vb.circle([0, 0], k(MAST.pipeOuter) / 2, { w: W.thin, dash: 'hidden', color: INK_2 });
  const t0 = tailShapes(0);
  const ri = k(TAIL.boomOuter) / 2;
  const ro = k(TAIL.sleeveOuter) / 2;
  poly(vb, tube2d(flat(t0.innerPipe[0]!), flat(t0.innerPipe[1]!), ri), med(FILL.steel));
  poly(vb, tube2d(flat(t0.sleeve[0]!), flat(t0.sleeve[1]!), ro), thin(FILL.steel));
  poly(vb, tube2d(flat(t0.boomStart), flat(t0.boomEnd), ri), med(FILL.steel));
  poly(vb, t0.vane.map(flat), { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  // axes: the axle, the yaw axis, the hinge axis in plan view
  vb.center([-330, off], [X.cradleBack + 20, off], 0);
  vb.center([-330, 0], [PIVOT[0] + 40, 0], 0);
  vb.center([0, 75], [0, -50], 0);
  const axPlan = flat(AXIS);
  const an = Math.hypot(axPlan[0], axPlan[1]);
  const pv: Pt = [PIVOT[0], -PIVOT[2]];
  vb.line(
    [pv[0] - (axPlan[0] / an) * 110, pv[1] - (axPlan[1] / an) * 110],
    [pv[0] + (axPlan[0] / an) * 150, pv[1] + (axPlan[1] / an) * 150],
    { w: W.thin, dash: 'center', color: COLORS.copper },
  );
  // angles: 55° of the hinge axis in plan view, 10° of the boom to the axle
  vb.line(pv, [pv[0] + 230, pv[1]], { w: W.thin, dash: 'center', color: INK_2 });
  vb.arc(pv, 95, 0, TAIL.planDeg, { w: W.thin, color: COLORS.copper });
  vb.text(
    [pv[0] + 95 * Math.cos((TAIL.planDeg / 2) * DEG) + 8, pv[1] + 95 * Math.sin((TAIL.planDeg / 2) * DEG)],
    labN(TAIL.planDeg, 0, 'R', '', '°'),
    { size: 2.2, mono: true, color: COLORS.copper, baseline: 'middle' },
  );
  vb.arc(pv, 200, 0, -(90 - TAIL.restDeg), { w: W.thin });
  vb.text([pv[0] + 208, pv[1] - 18], labN(90 - TAIL.restDeg, 0, 'R', '', '°'), {
    size: 2.2,
    mono: true,
    baseline: 'middle',
  });
  // dimensions
  dimV(vb, [-305, 0], [-305, off], -325, labOf(dim('HEAD', 'offset')), 2.4);
  dimH(vb, [X.beam0, 5], [X.beam1, 5], 55, labOf(dim('NACELLE', 'length')), 2.2);
  dimH(vb, [X.stator, off + 132], [0, off + 132], 160, labN(Math.abs(X.stator), 0, 'E'), 2.2);
  dimH(vb, [X.beam1, 5], [PIVOT[0], 5], 55, labN(k(TAIL.pivotBehind), 0, 'E'), 2.2);
  vb.dim(flat(t0.boomStart), flat(t0.boomEnd), 10, {
    dir: 'aligned',
    label: labOf(dim('TAIL', 'boomLength')),
    size: 2.2,
  });
  vb.text([X.bladeFront - 8, off + 150], l('rotor (coupé)', 'rotor (cut)'), {
    size: 1.9,
    color: INK_2,
    anchor: 'start',
  });
  vb.text([8, 85], l('axe de lacet', 'yaw axis'), { size: 1.9, color: INK_2, anchor: 'start' });
  vb.text([X.cradleBack + 4, -(off + 24)], l('axe de l’alternateur', 'alternator axis'), { size: 1.9, color: INK_2 });
  vb.leader([PIVOT[0] + 160, -62], 8, 18, l('queue : 80° du plan du rotor', 'tail: 80° from the rotor plane'), {
    size: 2,
  });

  // ------------------------------------------------------------------ B: the hinge in its own plane, 1:2
  heading(d, 316, 13, l('B · LA CHARNIÈRE · vue dans son plan · 1:2', 'B · THE HINGE · seen in its own plane · 1:2'), {
    size: 2.2,
  });
  const vc = d.view(346, 74, 0.5);
  const dPlan: Pt = [Math.cos(-TAIL.planDeg * DEG), Math.sin(-TAIL.planDeg * DEG)];
  const el = (q: V3): Pt => [(q[0] - PIVOT[0]) * dPlan[0] + (q[2] - PIVOT[2]) * dPlan[1], q[1] - PIVOT[1]];
  const along = (t: number): V3 => [PIVOT[0] + AXIS[0] * t, PIVOT[1] + AXIS[1] * t, PIVOT[2] + AXIS[2] * t];
  // the boom leaves the sleeve horizontally, seen foreshortened (cut)
  poly(
    vc,
    [
      [ro - 4, ri],
      [70, ri],
      [70, -ri],
      [ro - 4, -ri],
    ],
    med(FILL.steel),
  );
  vc.polyline(
    [
      [68, ri + 6],
      [76, -ri - 6],
    ],
    { w: W.thin },
  );
  vc.polyline(
    [
      [76, ri + 6],
      [84, -ri - 6],
    ],
    { w: W.thin },
  );
  poly(vc, tube2d(el(along(-75)), el(along(75)), ri), med(FILL.steel));
  poly(vc, tube2d(el(along(-65)), el(along(65)), ro), med(FILL.steel));
  poly(vc, tube2d(el(along(65)), el(along(65 + k(TAIL.capThickness))), ro), thick(FILL.steel));
  vc.line([-80, 0], [80, 0], { w: W.thin, dash: 'center', color: INK_2 });
  vc.line([0, -80], [0, 92], { w: W.thin, dash: 'center', color: INK_2 });
  vc.line(el(along(-92)), el(along(92)), { w: W.thin, dash: 'center', color: COLORS.copper });
  vc.arc([0, 0], 96, 90 - TAIL.tiltDeg, 90, { w: W.thin, color: COLORS.copper });
  vc.text([22, 98], labN(TAIL.tiltDeg, 0, 'R', '', '°'), { size: 2.2, mono: true, color: COLORS.copper });
  vc.text([-78, 8], l('horizontale', 'horizontal'), { size: 1.8, color: INK_2 });
  vc.text([-6, -82], l('verticale', 'vertical'), { size: 1.8, color: INK_2, anchor: 'end' });
  vc.leader(el(along(55)), -10, -8, l('tube fixe Ø33,4', 'fixed pipe Ø33.4'), { size: 1.9 });
  vc.leader(el(along(-48)), -10, 10, l('manchon Ø42,2', 'sleeve Ø42.2'), { size: 1.9 });
  vc.leader([52, -ri], 6, 22, l('bras de queue', 'tail boom'), { size: 1.9 });

  // ------------------------------------------------------------------ C: from rest to folded, in the wind, 1:10
  heading(
    d,
    14,
    112,
    l(
      'C · DU REPOS À LA QUEUE PLIÉE · en plan, dans le vent · 1:10',
      'C · FROM REST TO FOLDED · in plan, in the wind · 1:10',
    ),
    { size: 2.2 },
  );
  const va = d.view(84, 180, 0.1);
  drawGhost(va, MODEL.yaw12, swingOf(MODEL.yaw12), INK_2, l('12 m/s', '12 m/s'));
  drawGhost(va, MODEL.yaw16, swingOf(MODEL.yaw16), INK_2, l('16 m/s', '16 m/s'));
  drawGhost(va, MODEL.yaw25, swingOf(MODEL.yaw25), INK_2, l('25 m/s', '25 m/s'));
  drawPose(va, YAW_FURLED_DEG, TAIL_SWING_DEG, { w: W.medium, color: COLORS.copper, fill: FILL.copper });
  drawPose(va, YAW_STOP_DEG, 0, { w: W.medium, color: COLORS.ink, fill: FILL.steel });
  va.polyline(boomPath(), { w: W.thin, color: COLORS.copper, dash: [1.5, 1] });
  const topEnd = plan([X.bladeFront, 0, k(HEAD.offset) - k(BLADE.length)], YAW_STOP_DEG);
  va.text([topEnd[0] + 22, topEnd[1] + 6], l('≈ 10 m/s : queue sur sa butée', '≈ 10 m/s: tail on its stop'), {
    size: 2,
    weight: 'bold',
    anchor: 'start',
    halo: true,
  });
  const farEnd = plan([X.bladeFront, 0, k(HEAD.offset) + k(BLADE.length)], YAW_FURLED_DEG);
  va.text([farEnd[0] + 4, farEnd[1] - 12], l('limite : queue pliée à 95°', 'limit: tail folded at 95°'), {
    size: 2,
    weight: 'bold',
    color: COLORS.copper,
    anchor: 'start',
    halo: true,
  });
  va.leader(plan(tailShapes(0).vane[1]!, YAW_STOP_DEG), -4, -16, l('safran (de profil)', 'vane (edge-on)'), {
    size: 1.9,
  });
  arrow(p, [18, 124], [48, 124], INK_2, W.medium);
  p.text([18, 120], l('VENT', 'WIND'), { size: 2.2, weight: 'bold', color: INK_2 });

  // ------------------------------------------------------------------ D: table of the poses
  const gy = 120;
  heading(
    d,
    214,
    gy - 8,
    l('D · LE REPLIEMENT SELON LE MODÈLE (résultat du modèle)', 'D · FURLING ACCORDING TO THE MODEL (model result)'),
    { size: 2.2 },
  );
  const tableRows = [MODEL.yaw10, MODEL.yaw12, MODEL.yaw16, MODEL.yaw25].map((yaw, i) => [
    i === 0 ? labN(FURLING_SPEED, 0, 'R', '≈ ') : labN([0, 12, 16, 25][i]!, 0, 'R'),
    labN(yaw, 0, 'R', '', '°'),
    labN(swingOf(yaw), 0, 'R', '', '°'),
  ]);
  tableRows.push([
    l('limite géométrique', 'geometric limit'),
    labN(YAW_FURLED_DEG, 0, 'D', '', '°'),
    labN(TAIL_SWING_DEG, 0, 'R', '', '°'),
  ]);
  const gh = grid(
    d,
    214,
    gy,
    [
      { label: l('Vent au moyeu (m/s)', 'Hub wind (m/s)'), w: 56 },
      { label: l('Lacet ψ du rotor', 'Rotor yaw ψ'), w: 40, align: 'end', mono: true },
      { label: l('Oscillation φ de la queue', 'Tail swing φ'), w: 56, align: 'end', mono: true },
    ],
    tableRows,
    { size: 1.95, pad: 0.75, lineH: 3 },
  );
  const rise = Math.asin(tailPose(TAIL_SWING_DEG).boom[1]) / DEG;
  const ny = box(
    d,
    214,
    gy + gh + 6,
    192,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          `Le rotor pousse en arrière avec une force T, appliquée à ${nFr(k(HEAD.offset), 0)} mm de l’axe de lacet : le moment T × ${nFr(k(HEAD.offset), 0)} mm cherche à tourner la machine. La queue, que son poids et sa charnière retiennent sur sa butée, tient jusque vers ${nFr(FURLING_SPEED, 0)} m/s ; au-delà elle se relève.`,
          `The rotor pushes back with a force T, applied ${nEn(k(HEAD.offset), 0)} mm from the yaw axis: the moment T × ${nEn(k(HEAD.offset), 0)} mm tries to turn the machine. The tail, held on its stop by its weight and its hinge, holds up to about ${nEn(FURLING_SPEED, 0)} m/s; beyond that it lifts.`,
        ),
      },
      {
        bullet: '2',
        t: l(
          `La charnière est inclinée : en oscillant jusqu’à ${nFr(TAIL_SWING_DEG, 0)}°, la queue se relève de ${nFr(rise, 0)}°†, donc son poids la ramène quand le vent retombe. Le modèle fixe ce poids pour que le repliement commence à ${nFr(FURLING_SPEED, 0)} m/s (calibré).`,
          `The hinge is tilted: as it swings up to ${nEn(TAIL_SWING_DEG, 0)}°, the tail rises by ${nEn(rise, 0)}°†, so its weight brings it back when the wind drops. The model sets that weight so that furling starts at ${nEn(FURLING_SPEED, 0)} m/s (calibrated).`,
        ),
      },
      {
        bullet: '3',
        t: l(
          'Bras de 500 mm et safran de 18 × 12 po (0,135 m²) d’après les plans ; le wiki donne 700 mm et environ 0,1 m². Le tableau est un résultat du modèle, pas une mesure : la queue suit le lacet en proportion.',
          'A 500 mm boom and an 18 × 12 in vane (0.135 m²) from the plans; the wiki gives 700 mm and about 0.1 m². The table is a model result, not a measurement: the tail follows the yaw in proportion.',
        ),
      },
      { bullet: '4', t: EDU_NOTE },
    ],
    { size: 1.8 },
  );
  marksLegend(d, 214, ny + 3, 62);
  return d;
}

export const furlingGeometry: DrawingSheet = {
  id: 'furling-geometry',
  number: NUMBER,
  group: 'machine',
  title: TITLE,
  description: l(
    'Vue en plan de la tête de la machine : l’alternateur est décalé de 41 mm de l’axe de lacet, donc la poussée du vent tend à tourner la machine. La queue, sur une charnière inclinée de 20° et à 55° de l’arbre en plan, résiste jusqu’à environ 10 m/s, puis se relève, oscille jusqu’à 95° et ramène le rotor de côté. Les trois positions montrent la queue sur sa butée, à mi-course et repliée.',
    'Plan view of the machine’s head: the alternator sits 41 mm off the yaw axis, so the wind’s push tends to turn the machine. The tail, on a hinge tilted 20° and at 55° to the shaft in plan, holds up to about 10 m/s, then lifts, swings up to 95° and turns the rotor aside. The three positions show the tail on its stop, half-way and folded.',
  ),
  scene: 'turbine',
  parts: ['yaw-bearing', 'tail-hinge', 'tail-boom', 'tail-vane', 'nacelle-frame'],
  render,
};
