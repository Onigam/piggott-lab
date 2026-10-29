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
import { PARTS } from '../data/parts';
import { COIL_COUNT, MAGNETS_PER_DISC, TURNS_REF, WIRE_DIAMETER_REF } from '../sim/machine';
import {
  AIR_GAP,
  CRADLE,
  HUB,
  M12,
  MAGNET,
  ROTOR_DISC,
  ROTOR_RODS,
  SHAFT,
  STACK,
  STATOR,
  STATOR_RODS,
} from '../three/dims';
import { EDU_NOTE, FILL, balloon, box, dimH, grid, heading, marksLegend, note, poly } from './draw';
import { cat, dim, k, lab, labN, labOf } from './geom';

const NUMBER = 'PL-04';
const TITLE = l('Alternateur en coupe', 'The alternator in section');

/** Turning parts are drawn with a blue outline, fixed parts in black. */
const TURN = COLORS.acN;
const stroke = (turn: boolean, fill: string = FILL.steel, hatch?: Stroke['hatch'], w: number = W.medium): Stroke => ({
  w,
  color: turn ? TURN : COLORS.ink,
  fill,
  hatch,
});

/** Items of the parts list, in the order of the balloons: id, turning or fixed. */
const ITEMS: { id: string; turns: boolean }[] = [
  { id: 'magnet-rotor', turns: true },
  { id: 'magnets', turns: true },
  { id: 'bearing-hub', turns: true },
  { id: 'shaft', turns: false },
  { id: 'stator', turns: false },
  { id: 'coils', turns: false },
  { id: 'studs', turns: false },
  { id: 'air-gap', turns: false },
];
const n = (id: string) => ITEMS.findIndex((x) => x.id === id) + 1;

/** Axial positions of the stack, mm (alternator frame, front = negative). */
const S = {
  half: k(STACK.statorHalf),
  magnetFace: k(STACK.magnetFace),
  magnetBack: k(STACK.magnetBack),
  discFront: k(STACK.discFront),
  plateFront: k(STACK.plateFront),
  axleFront: k(STACK.axleFront),
  barrelBack: k(STACK.barrelBack),
  housingFront: k(STACK.housingFront),
  cradleFront: k(STACK.cradleFront),
  cradleBack: k(STACK.cradleBack),
  rodFront: k(STACK.rodFront),
  bladeFront: k(STACK.bladeFront),
  bladeOrigin: k(STACK.bladeOrigin),
  statorRodBack: k(STACK.statorRodBack),
};

/** Draw a shape `[x, r]` of the upper half of a body of revolution cut by the plane (a half section, the axis at the bottom). */
function both(v: View, pts: Pt[], s: Stroke): void {
  poly(v, pts, s);
}
const band = (x0: number, x1: number, r0: number, r1: number): Pt[] => [
  [x0, r0],
  [x1, r0],
  [x1, r1],
  [x0, r1],
];

function section(v: View): void {
  const rs = k(SHAFT.diameter) / 2;
  const bore = k(HUB.boreRadius);
  const plateR = k(HUB.plateDiameter) / 2;
  const barrelR = k(HUB.barrelDiameter) / 2;
  const mc = k(MAGNET.centreRadius);
  const mhw = k(MAGNET.width) / 2;
  const rodR = k(STATOR_RODS.circleRadius);
  const rd = k(STATOR_RODS.diameter) / 2;

  // --- fixed: stub axle, housing flange, cradle (with its hole for the stator rod)
  both(v, band(S.axleFront, S.cradleFront, 0, rs), stroke(false, FILL.steel, 'steel'));
  both(v, band(S.housingFront, S.cradleFront, 0, k(CRADLE.housingDiameter) / 2), stroke(false, FILL.steel, 'steel'));
  const cr = k(CRADLE.diameter) / 2;
  const hole = k(M12.clearanceHole) / 2;
  poly(v, band(S.cradleFront, S.cradleBack, 0, rodR - hole), stroke(false, FILL.steel, 'steel'));
  poly(v, band(S.cradleFront, S.cradleBack, rodR + hole, cr), stroke(false, FILL.steel, 'steel'));

  // --- fixed: stator (resin, copper coils at the cut), its rod with nuts
  const sh = S.half;
  const coil0 = k(STATOR.coilInner);
  const coil1 = k(STATOR.coilOuter);
  both(v, band(-sh, sh, k(STATOR.holeRadius), k(STATOR.outer) / 2), stroke(false, FILL.resin, 'plastic'));
  for (const [r0, r1] of [
    [coil0, mc - mhw],
    [mc + mhw, coil1],
  ] as const)
    both(v, band(-sh, sh, r0, r1), stroke(false, FILL.copper, 'copper', W.thin));
  // rod with its washer and nuts (cut at the top, ψ = 0)
  const rodTop = (x0: number, x1: number, st: Stroke) => poly(v, band(x0, x1, rodR - rd, rodR + rd), st);
  rodTop(-sh, S.statorRodBack, stroke(false, FILL.steel, 'steel', W.thin));
  const nutH = k(M12.nutAcrossFlats) / 2;
  const nutT = k(M12.nutThickness);
  const wsT = k(M12.washerThickness);
  const nut = (x0: number, w: number = nutT) =>
    poly(v, band(x0, x0 + w, rodR - nutH, rodR + nutH), stroke(false, FILL.steel, 'steel', W.thin));
  nut(sh, wsT);
  nut(sh + wsT);
  nut(S.cradleFront - nutT);
  nut(S.cradleBack, wsT);
  nut(S.cradleBack + wsT);

  // --- turning: hub bell (plate and barrel), bearings, castle nut (fixed)
  both(
    v,
    [
      [S.plateFront, bore],
      [S.plateFront, plateR],
      [S.discFront, plateR],
      [S.discFront, barrelR],
      [S.barrelBack, barrelR],
      [S.barrelBack, bore],
    ],
    stroke(true, FILL.steel, 'steel'),
  );
  const bw = k(HUB.bearingWidth);
  for (const bx of [S.axleFront + k(HUB.nutThickness), S.barrelBack - 2.5 - bw]) {
    both(v, band(bx, bx + bw, rs + 2.6, bore - 3), stroke(true, COLORS.paper, undefined, W.thin));
    both(v, band(bx, bx + bw, bore - 3, bore), stroke(true, '#d9dde3', undefined, W.thin));
    both(v, band(bx, bx + bw, rs, rs + 2.6), stroke(false, '#d9dde3', undefined, W.thin));
  }
  both(
    v,
    band(S.axleFront, S.axleFront + k(HUB.nutThickness), rs, k(HUB.nutAcrossFlats) / 2),
    stroke(false, FILL.steel, 'steel'),
  );

  // --- turning: magnet rotor (steel disc, resin casting with its lip), the magnets (north at the top, north at the bottom: 0 and 180°)
  const dr = k(ROTOR_DISC.diameter) / 2;
  const cast = k(ROTOR_DISC.castingDiameter) / 2;
  both(v, band(S.discFront, S.magnetBack, k(ROTOR_DISC.centreHole) / 2, dr), stroke(true, FILL.steel, 'steel'));
  both(v, band(S.discFront, S.magnetFace, dr, cast), stroke(true, FILL.resin, 'plastic'));
  const ri = k(ROTOR_DISC.resinInnerRadius);
  both(v, band(S.magnetBack, S.magnetFace, ri, mc - mhw), stroke(true, FILL.resin, 'plastic'));
  both(v, band(S.magnetBack, S.magnetFace, mc + mhw, dr), stroke(true, FILL.resin, 'plastic'));
  both(v, band(S.magnetBack, S.magnetFace, mc - mhw, mc + mhw), stroke(true, FILL.north));
  v.text([(S.magnetBack + S.magnetFace) / 2, mc], 'N', {
    size: 2.1,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'middle',
  });

  // --- turning: the long rods behind the cut plane (ψ = 225° and 315°), their nuts, the blade assembly in phantom lines
  const ry = rodR * Math.SQRT1_2;
  const rr = k(ROTOR_RODS.diameter) / 2;
  for (const sgn of [1]) {
    v.rect([S.rodFront, sgn * ry + rr], [S.magnetFace, sgn * ry - rr], { w: W.thin, color: TURN, fill: FILL.steel });
    for (const x0 of [
      S.magnetFace - nutT,
      S.plateFront - wsT - nutT,
      S.bladeFront - wsT - nutT,
      S.bladeFront - wsT - 2 * nutT,
    ])
      v.rect([x0, sgn * ry + nutH], [x0 + nutT, sgn * ry - nutH], { w: W.thin, color: TURN, fill: FILL.steel });
  }
  v.rect([S.bladeFront, k(0.1)], [S.bladeOrigin, 0], { w: W.thin, color: INK_2, dash: 'phantom', fill: 'none' });
  v.text(
    [(S.bladeFront + S.bladeOrigin) / 2, k(0.1) + 6],
    l('pales et contreplaqué (PL-02)', 'blades and plywood (PL-02)'),
    { size: 1.9, anchor: 'middle', color: INK_2 },
  );

  // --- axis, the plane of the cut
  v.center([S.rodFront - 12, 0], [S.cradleBack + 40, 0], 0);
}

/** Parts list: the main dimensions of each item (the marks follow the status of dims.ts). */
function specs(id: string): L {
  const m = (m_: number, st: 'R' | 'D' | 'E', pre = '') => lab(k(m_), st, pre);
  const c = (...parts: (string | L)[]) => cat(...parts);
  switch (id) {
    case 'magnet-rotor':
      return c(
        l('disque ', 'disc '),
        m(ROTOR_DISC.diameter, 'R', 'Ø'),
        ' × ',
        m(ROTOR_DISC.thickness, 'R'),
        l(', coulée ', ', casting '),
        m(ROTOR_DISC.castingDiameter, 'R', 'Ø'),
      );
    case 'magnets':
      return c(
        String(MAGNETS_PER_DISC),
        l(' blocs ', ' blocks '),
        m(MAGNET.length, 'R'),
        ' × ',
        m(MAGNET.width, 'R'),
        ' × ',
        m(MAGNET.thickness, 'R'),
        l(', pôles alternés', ', alternating poles'),
      );
    case 'bearing-hub':
      return c(
        l('plateau ', 'plate '),
        m(HUB.plateDiameter, 'E', 'Ø'),
        l(', fût ', ', barrel '),
        m(HUB.barrelDiameter, 'E', 'Ø'),
        l(', 2 roulements ; 4 tiges M12 × ', ', 2 bearings; 4 rods M12 × '),
        m(ROTOR_RODS.length, 'R'),
      );
    case 'shaft':
      return c(
        l('fusée ', 'stub axle '),
        m(SHAFT.diameter, 'E', 'Ø'),
        l(' ; berceau ', '; cradle '),
        m(CRADLE.diameter, 'R', 'Ø'),
        ' × ',
        m(CRADLE.thickness, 'R'),
      );
    case 'stator':
      return c(
        m(STATOR.outer, 'R', 'Ø'),
        ' × ',
        m(STATOR.thickness, 'R'),
        l(', résine coulée sur les tiges', ', resin cast on the rods'),
      );
    case 'coils':
      return c(
        String(COIL_COUNT),
        ' × ',
        String(TURNS_REF),
        l(' tours, fil ', ' turns, wire '),
        lab(WIRE_DIAMETER_REF * 1000, 'R', 'Ø'),
      );
    case 'studs':
      return c(l('3 tiges M12 × ', '3 rods M12 × '), m(STATOR_RODS.length, 'R'), l(', fendues', ', slotted'));
    default:
      return l('≈ 1 mm (cale d’épaisseur)', '≈ 1 mm (feeler gauge)');
  }
}

/** Detail B at 2:1: the stack of the rotor and the stator at the edge of a magnet, with the 1 mm gap. */
function gapDetail(d: Drawing, ox: number, oy: number): void {
  const v = d.view(ox, oy, 2);
  const r0 = 70;
  const r1 = 94;
  const R = (r: number): number => r - 82;
  const clip = (a: number, b: number): [number, number] | null => {
    const lo = Math.max(a, r0);
    const hi = Math.min(b, r1);
    return hi > lo ? [lo, hi] : null;
  };
  const slab = (x0: number, x1: number, a: number, b: number, s: Stroke): void => {
    const c = clip(a, b);
    if (c) v.rect([x0, R(c[0])], [x1, R(c[1])], s);
  };
  const mc = k(MAGNET.centreRadius);
  const mhw = k(MAGNET.width) / 2;
  slab(S.discFront, S.magnetBack, 0, 200, stroke(true, FILL.steel, 'steel'));
  slab(S.magnetBack, S.magnetFace, k(ROTOR_DISC.resinInnerRadius), mc - mhw, stroke(true, FILL.resin, 'plastic'));
  slab(S.magnetBack, S.magnetFace, mc - mhw, mc + mhw, stroke(true, FILL.north));
  slab(-S.half, S.half, 0, 200, stroke(false, FILL.resin, 'plastic'));
  slab(-S.half, S.half, k(STATOR.coilInner), mc - mhw, stroke(false, FILL.copper, 'copper', W.thin));
  v.text([(S.magnetBack + S.magnetFace) / 2, R(88)], 'N', {
    size: 2.2,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'middle',
  });
  const yb = R(r0);
  const yt = R(r1);
  v.dim([S.discFront, yb], [S.magnetBack, yb], 5, { dir: 'h', label: labOf(dim('ROTOR_DISC', 'thickness')), size: 2 });
  v.dim([S.magnetBack, yb], [S.magnetFace, yb], 5, { dir: 'h', label: labOf(dim('MAGNET', 'thickness')), size: 2 });
  v.dim([-S.half, yb], [S.half, yb], 5, { dir: 'h', label: labOf(dim('STATOR', 'thickness')), size: 2 });
  // the gap: arrows from the outside, text above
  const p = d.paper();
  const [gx0, gy] = v.map([S.magnetFace, yt]);
  const [gx1] = v.map([-S.half, yt]);
  p.line([gx0 - 5, gy - 6], [gx0, gy - 6], { w: W.thin, color: INK_2 });
  p.line([gx1 + 5, gy - 6], [gx1, gy - 6], { w: W.thin, color: INK_2 });
  p.line([gx0, gy - 8], [gx0, gy], { w: W.thin, color: INK_2 });
  p.line([gx1, gy - 8], [gx1, gy], { w: W.thin, color: INK_2 });
  p.text([(gx0 + gx1) / 2, gy - 10], labN(k(AIR_GAP), 0, 'R', '≈ ', ' mm'), {
    size: 2.2,
    anchor: 'middle',
    mono: true,
    color: COLORS.red,
    weight: 'bold',
  });
}

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Coupe par l’axe : ce qui tourne (bleu) et ce qui reste fixe · échelle 1:1, détail 2:1',
      'Section through the axis: what turns (blue) and what stays fixed · scale 1:1, detail 2:1',
    ),
    number: NUMBER,
    scale: '1:1 · 2:1',
  });
  heading(
    d,
    14,
    13,
    l('COUPE A–A · demi-coupe par l’axe du stator', 'SECTION A–A · half section through the stator axis'),
    { size: 2.2 },
  );
  const ox = 166;
  const oy = 190;
  const v = d.view(ox, oy, 1);
  section(v);

  // dimensions: the lengths under the axis, the diameters on the right (a half section: the line stops at the axis)
  const top = k(STATOR.outer) / 2;
  dimH(v, [S.rodFront, 0], [S.magnetFace, 0], -14, labOf(dim('ROTOR_RODS', 'length')), 2.2);
  dimH(v, [S.rodFront, 0], [S.cradleBack, 0], -26, labN(Math.abs(S.rodFront) + S.cradleBack, 0, 'E'), 2.2);
  v.dim([S.cradleBack + 14, -6], [S.cradleBack + 14, top], 0, {
    dir: 'v',
    label: cat('Ø', labOf(dim('STATOR', 'outer'))),
    size: 2.2,
  });
  v.dim([S.cradleBack + 26, -6], [S.cradleBack + 26, k(CRADLE.diameter) / 2], 0, {
    dir: 'v',
    label: cat('Ø', labOf(dim('CRADLE', 'diameter'))),
    size: 2.2,
  });

  // balloons around the drawing, each with a short leader to the part it names
  const mc = k(MAGNET.centreRadius);
  balloon(v, [(S.plateFront + S.discFront) / 2, k(HUB.plateDiameter) / 2 - 6], 104, 131, n('bearing-hub'));
  balloon(v, [(S.discFront + S.magnetBack) / 2, k(ROTOR_DISC.diameter) / 2 - 8], 124, 78, n('magnet-rotor'));
  balloon(v, [(S.magnetBack + S.magnetFace) / 2, mc + 8], 140, 60, n('magnets'));
  balloon(v, [-6, k(STATOR.outer) / 2 - 7], 154, 46, n('air-gap'));
  balloon(v, [-3, k(STATOR.outer) / 2 - 2], 168, 42, n('stator'));
  balloon(v, [3, k(STATOR.coilOuter) - 6], 183, 52, n('coils'));
  balloon(v, [S.cradleFront + 4, k(CRADLE.diameter) / 2 - 3], 208, 98, n('shaft'));
  balloon(v, [S.cradleBack + 8, k(STATOR_RODS.circleRadius) + 2], 238, 118, n('studs'));
  v.leader(
    [S.rodFront + 10, k(STATOR_RODS.circleRadius) * Math.SQRT1_2 + 6],
    6,
    -22,
    l('tiges de rotor, 16 écrous', 'rotor rods, 16 nuts'),
    { size: 1.9 },
  );

  // parts list
  const rows = ITEMS.map((it, i) => {
    const part = PARTS.find((x) => x.id === it.id)!;
    return [
      { t: String(i + 1), bold: true },
      part.name,
      it.turns ? { t: l('tourne', 'turns'), color: TURN, bold: true } : l('fixe', 'fixed'),
      { t: String(part.qty ?? 1) },
      specs(it.id),
    ];
  });
  heading(d, 252, 13, l('REPÈRES · pièces du monde « alternateur »', 'ITEMS · parts of the “alternator” world'), {
    size: 2.2,
  });
  const gh = grid(
    d,
    252,
    18,
    [
      { label: l('Rep.', 'Item'), w: 9, align: 'middle' },
      { label: l('Désignation', 'Part'), w: 40 },
      { label: l('Mouvement', 'Motion'), w: 17 },
      { label: l('Qté', 'Qty'), w: 8, align: 'middle' },
      { label: l('Dimensions (mm)', 'Dimensions (mm)'), w: 80 },
    ],
    rows,
    { size: 1.8, pad: 0.7, lineH: 2.9 },
  );

  // detail B and notes
  box(
    d,
    14,
    224,
    216,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          'Les pales entraînent la cloche, qui tourne sur ses deux roulements autour de la fusée ; quatre tiges portent le disque à aimants. Fusée, écrou à créneaux, berceau, stator et ses trois tiges ne bougent pas : aucun contact, aucun balai, seulement un champ qui traverse l’entrefer.',
          'The blades drive the bell, which turns on its two bearings around the stub axle; four rods carry the magnet disc. Stub axle, castle nut, cradle, stator and its three rods do not move: no contact, no brushes, only a field that crosses the air gap.',
        ),
      },
      {
        bullet: '2',
        t: l(
          'Les écrous des trois tiges du stator, de part et d’autre du berceau, règlent l’entrefer d’environ 1 mm. Le plan coupe un aimant (pôle nord) ; les coupes du stator et du rotor sont dessinées comme dans le modèle 3D.',
          'The nuts of the three stator rods, on both sides of the cradle, set the air gap of about 1 mm. The plane cuts one magnet (north pole); the stator and rotor sections are drawn as in the 3D model.',
        ),
      },
      {
        bullet: '3',
        t: l(
          'Danger : les aimants au néodyme se collent entre eux et sur l’acier avec une force qui écrase les doigts, et gênent les stimulateurs cardiaques. Ne les approchez jamais à la main.',
          'Danger: neodymium magnets snap together and onto steel with a force that crushes fingers, and affect pacemakers. Never bring them together by hand.',
        ),
      },
      { bullet: '4', t: EDU_NOTE },
    ],
    { size: 1.8 },
  );
  const ly = marksLegend(d, 252, 18 + gh + 6, 76, [
    {
      sym: (q, x, y) => {
        q.line([x, y], [x + 8, y], { w: W.medium, color: TURN });
      },
      text: l('contour bleu : pièce qui tourne', 'blue outline: part that turns'),
    },
    {
      sym: (q, x, y) => {
        q.line([x, y], [x + 8, y], { w: W.medium });
      },
      text: l('contour noir : pièce fixe', 'black outline: fixed part'),
    },
  ]);
  heading(
    d,
    252,
    ly + 6,
    l('DÉTAIL B · l’entrefer, au bord d’un aimant · 2:1', 'DETAIL B · the air gap at the edge of a magnet · 2:1'),
    { size: 2.2 },
  );
  gapDetail(d, 304, ly + 58);
  note(
    d,
    252,
    ly + 100,
    150,
    l(
      'À gauche : le disque d’acier (6) et l’aimant (10), qui tournent ; à droite : le stator (11), fixe, avec le cuivre de la bobine en bas et la résine en haut.',
      'Left: the steel disc (6) and the magnet (10), which turn; right: the stator (11), fixed, with the coil’s copper below and resin above.',
    ),
    { size: 1.8, color: INK_2 },
  );
  return d;
}

export const alternatorSection: DrawingSheet = {
  id: 'alternator-section',
  number: NUMBER,
  group: 'alternator',
  title: TITLE,
  description: l(
    'Coupe de l’alternateur à axe horizontal, par l’axe du stator. La fusée et le berceau, fixés au cadre, portent le stator coulé dans la résine sur trois tiges ; la cloche du moyeu tourne sur ses deux roulements autour de la fusée et entraîne le disque à aimants par quatre longues tiges. Un entrefer d’environ 1 mm sépare les aimants du stator.',
    'Section of the horizontal-axis alternator, through the stator axis. The stub axle and cradle, fixed to the frame, carry the resin-cast stator on three rods; the hub bell turns on its two bearings around the stub axle and drives the magnet disc by four long rods. An air gap of about 1 mm separates the magnets from the stator.',
  ),
  scene: 'alternator',
  parts: ITEMS.map((x) => x.id),
  render,
};
