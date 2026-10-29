import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { FIG } from '../data/figures';
import { nEn, nFr } from '../data/units';
import {
  BENCH_RPM,
  BENCH_VOLTS_LL,
  COIL_COUNT,
  MAGNETS_PER_DISC,
  MEAN_TURN_LENGTH,
  POLE_PAIRS,
  R_PHASE_REF,
  TURNS_REF,
  WIRE_DIAMETER_REF,
} from '../sim/machine';
import { coilOutline } from '../three/alternator/parts';
import { COIL_PHASE, CRADLE, MAGNET, STATOR, STATOR_RODS } from '../three/dims';
import { EDU_NOTE, FILL, PHASE, box, grid, heading, marksLegend, poly, rot, med, note } from './draw';
import { DEG, cat, dim, k, lab, labOf } from './geom';

const cat0 = (a: string, b: L, c: L): L => cat(a, b, c);
const NUMBER = 'PL-05';
const TITLE = l('Bobinage du stator et couplage en étoile', 'Stator winding and star wiring');

type Phase = 'A' | 'B' | 'C';
const phaseOf = (i: number): Phase => COIL_PHASE[i]!;
const colourOf = (i: number): string => PHASE[phaseOf(i)];

/** Point at radius r and angle ψ (clockwise from up, seen from the rotor side) in a y-up view. */
const polar = (r: number, psi: number): Pt => [r * Math.sin(psi * DEG), r * Math.cos(psi * DEG)];
/** A point of coil k in its own frame (t tangential, r radial) to the face view. */
const onCoil = (t: number, r: number, psi: number): Pt => rot([t, r], -psi);

// ------------------------------------------------------------------------------------------------ A: the face of the stator

function faceView(v: View): void {
  const R = k(STATOR.outer) / 2;
  const mc = k(MAGNET.centreRadius);
  const hl = k(MAGNET.length) / 2;
  const hw = k(MAGNET.width) / 2;
  v.circle([0, 0], R, { w: W.thick, fill: FILL.resin });
  v.circle([0, 0], k(STATOR.holeRadius), { w: W.medium, fill: COLORS.paper });
  const outline = coilOutline();
  for (let i = 0; i < COIL_COUNT; i++) {
    const psi = i * 60;
    const col = colourOf(i);
    poly(
      v,
      outline.map(([t, r]) => onCoil(k(t), k(r), psi)),
      { w: W.medium, color: col, fill: FILL.copper, hatch: 'copper' },
    );
    poly(
      v,
      [
        [-hl, mc - hw],
        [hl, mc - hw],
        [hl, mc + hw],
        [-hl, mc + hw],
      ].map(([t, r]) => onCoil(t!, r!, psi)),
      { w: W.thin, color: col, fill: FILL.resin },
    );
    const [cx, cy] = onCoil(0, mc, psi);
    v.text([cx, cy], String(i + 1), { size: 3, weight: 'bold', anchor: 'middle', baseline: 'middle', color: col });
    const [px, py] = polar(R + 17, psi);
    v.text([px, py], phaseOf(i), { size: 3, weight: 'bold', anchor: 'middle', baseline: 'middle', color: col });
  }
  // the three rods and the hole of the cable
  for (const a of STATOR_RODS.anglesDeg)
    v.circle(polar(k(STATOR_RODS.circleRadius), a), k(STATOR_RODS.diameter) / 2, med(FILL.steel));
  v.circle(polar(k(CRADLE.cableHoleRadius), CRADLE.cableHoleDeg), k(CRADLE.cableHole) / 2, {
    w: W.thin,
    dash: 'hidden',
    color: INK_2,
  });
  // series links on the rim: half a hoop for each phase (coil n and n + 3), each at its own radius
  const hoop: Record<Phase, number> = { A: 3, C: 6, B: 9 };
  for (const ph of ['A', 'C', 'B'] as const) {
    const first = COIL_PHASE.indexOf(ph);
    v.arc([0, 0], R + hoop[ph], 90 - first * 60, 90 - first * 60 - 180, { w: W.medium, color: PHASE[ph] });
  }
  // neutral (inner ends of coils 1 to 3) and the three outputs (inner ends of 4 to 6) on the rear face: dashed
  const rn = k(STATOR.coilInner) - 3;
  v.arc([0, 0], rn, 90, 90 - 120, { w: W.medium, color: COLORS.ink, dash: 'hidden' });
  for (let i = 3; i < 6; i++) {
    const rr = k(CRADLE.cableHoleRadius) - 2 + (i - 3) * 3;
    const a0 = i * 60;
    const pts: Pt[] = [polar(k(STATOR.coilInner), a0), polar(rr, a0)];
    for (let s = 1; s <= 6; s++) pts.push(polar(rr, a0 + ((CRADLE.cableHoleDeg - a0) * s) / 6));
    v.polyline(pts, { w: W.medium, color: colourOf(i), dash: 'hidden' });
  }
  // the axes: outside the disc, and a small cross at the hub (no line through the coil numbers)
  for (const s of [-1, 1]) {
    v.center([0, s * (R + 2)], [0, s * (R + 22)], 0);
    v.center([s * (R + 2), 0], [s * (R + 22), 0], 0);
  }
  v.center([-12, 0], [12, 0], 0);
  v.center([0, -12], [0, 12], 0);
}

// ------------------------------------------------------------------------------------------------ B: the star

/** A coil symbol (four humps) between two points of paper space, in the group's local frame along +x. */
function inductor(g: View, len: number, colour: string): void {
  const n = 4;
  const hump = (len - 6) / n;
  g.line([0, 0], [3, 0], { w: W.medium, color: colour });
  for (let i = 0; i < n; i++) g.arc([3 + hump * (i + 0.5), 0], hump / 2, 0, 180, { w: W.medium, color: colour });
  g.line([len - 3, 0], [len, 0], { w: W.medium, color: colour });
}

function starView(d: Drawing, cx: number, cy: number): void {
  const p = d.paper();
  const arm = 44;
  p.circle([cx, cy], 1.6, { w: W.thin, fill: COLORS.ink });
  p.text([cx + 3, cy + 4], 'N', { size: 2.6, weight: 'bold' });
  // phases at 90° (up), 210° and 330° (clockwise from up): A, B, C
  const dirs: [Phase, number][] = [
    ['A', 0],
    ['B', 240],
    ['C', 120],
  ];
  for (const [ph, psi] of dirs) {
    const first = COIL_PHASE.indexOf(ph);
    const ang = 90 - psi;
    const g = p.group([cx, cy], ang, 1);
    // the arm: coil n from the star point, then coil n + 3, then the terminal
    g.line([0, 0], [6, 0], { w: W.medium, color: PHASE[ph] });
    g.group([6, 0], 0).line([0, 0], [0, 0]);
    const c1 = g.group([6, 0], 0);
    inductor(c1, 18, PHASE[ph]);
    c1.line([18, 0], [24, 0], { w: W.medium, color: PHASE[ph] });
    const c2 = g.group([24, 0], 0);
    inductor(c2, 18, PHASE[ph]);
    c2.line([18, 0], [arm - 24, 0], { w: W.medium, color: PHASE[ph] });
    const [tx, ty] = rot([arm + 2, 0], ang);
    p.circle([cx + tx, cy - ty], 1.6, { w: W.thin, fill: COLORS.paper, color: PHASE[ph] });
    // labels: the coil numbers, the phase letter at the terminal
    for (const [i, off] of [
      [first, 15],
      [first + 3, 33],
    ] as const) {
      const [lx, ly] = rot([off, 6.5], ang);
      p.text([cx + lx, cy - ly], String(i + 1), {
        size: 2.2,
        anchor: 'middle',
        baseline: 'middle',
        color: PHASE[ph],
        weight: 'bold',
      });
    }
    const [bx, by] = rot([arm + 7, 0], ang);
    p.text([cx + bx, cy - by], ph, {
      size: 3.2,
      weight: 'bold',
      anchor: 'middle',
      baseline: 'middle',
      color: PHASE[ph],
    });
  }
}

// ------------------------------------------------------------------------------------------------ D: magnets and coils developed

/** The rotor's magnets and the stator's coils unrolled over 360°: 8 poles of 45° above 6 coils of 60°. */
function developed(d: Drawing, x0: number, y0: number, w: number): void {
  const p = d.paper();
  const sx = w / 360;
  const hMag = 10;
  const hCoil = 10;
  const mcR = k(MAGNET.centreRadius);
  const magW = ((k(MAGNET.length) / mcR) * 180) / Math.PI;
  const coilW = ((k(STATOR.coilOutlineLength) / mcR) * 180) / Math.PI;
  p.text([x0 + w + 26, y0 + hMag / 2], l('aimants du rotor', 'rotor magnets'), { size: 2, baseline: 'middle' });
  p.text([x0 + w + 26, y0 + hMag + 7 + hCoil / 2], l('bobines du stator', 'stator coils'), {
    size: 2,
    baseline: 'middle',
  });
  p.line([x0, y0 - 1], [x0 + w, y0 - 1], { w: W.thin, color: INK_2 });
  for (let i = 0; i < MAGNETS_PER_DISC; i++) {
    const c = i * (360 / MAGNETS_PER_DISC);
    const north = i % 2 === 0;
    p.rect([x0 + (c - magW / 2) * sx, y0], [x0 + (c + magW / 2) * sx, y0 + hMag], {
      w: W.medium,
      fill: north ? FILL.north : FILL.south,
    });
    p.text([x0 + c * sx, y0 + hMag / 2], north ? 'N' : 'S', {
      size: 2.2,
      anchor: 'middle',
      baseline: 'middle',
      weight: 'bold',
    });
  }
  const yc = y0 + hMag + 7;
  for (let i = 0; i < COIL_COUNT; i++) {
    const c = i * (360 / COIL_COUNT);
    p.rect([x0 + (c - coilW / 2) * sx, yc], [x0 + (c + coilW / 2) * sx, yc + hCoil], {
      w: W.medium,
      color: colourOf(i),
      fill: FILL.copper,
    });
    p.text([x0 + c * sx, yc + hCoil / 2], `${i + 1} · ${phaseOf(i)}`, {
      size: 2.2,
      anchor: 'middle',
      baseline: 'middle',
      weight: 'bold',
      color: colourOf(i),
    });
    // electrical angle of the coil: 4 pole pairs turn the field 4 times per mechanical turn
    const el = (c * POLE_PAIRS) % 360;
    p.text([x0 + c * sx, yc + hCoil + 4.5], `${nFr(el, 0)}°`, {
      size: 2,
      anchor: 'middle',
      mono: true,
      color: colourOf(i),
    });
  }
  p.text([x0 + w + 26, yc + hCoil + 4.5], l('angle électrique', 'electrical angle'), { size: 1.9, color: INK_2 });
  // the scale
  for (const a of [0, 90, 180, 270, 360]) {
    p.line([x0 + a * sx, y0 - 3], [x0 + a * sx, y0 - 1], { w: W.thin });
    p.text([x0 + a * sx, y0 - 4.5], `${a}°`, { size: 1.9, anchor: 'middle', mono: true, color: INK_2 });
  }
}

// ------------------------------------------------------------------------------------------------ the sheet

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Six bobines de 76 tours, trois phases, étoile · huit aimants face à six bobines · 1:2 et 1:1',
      'Six coils of 76 turns, three phases, star · eight magnets facing six coils · 1:2 and 1:1',
    ),
    number: NUMBER,
    scale: '1:2 · 1:1',
  });
  const p = d.paper();

  // ---- A: face of the stator
  heading(d, 14, 13, l('A · LE STATOR VU DU ROTOR · 1:2', 'A · THE STATOR SEEN FROM THE ROTOR · 1:2'), { size: 2.2 });
  const va = d.view(86, 93, 0.5);
  faceView(va);
  p.text([86, 175], cat0('Ø', labOf(dim('STATOR', 'outer')), l(', 6 bobines à 60°', ', 6 coils at 60°')), {
    size: 2.1,
    anchor: 'middle',
    mono: false,
  });
  note(
    d,
    14,
    179,
    150,
    l(
      'Trait plein : face vue. Pointillé : fils de la face arrière (point neutre et trois sorties). Les liaisons sont dessinées pour être lisibles ; les vraies sont noyées dans la résine.',
      'Solid: visible face. Dashed: wires on the rear face (neutral point and three outputs). The links are drawn to be legible; the real ones are cast in the resin.',
    ),
    { size: 1.8, color: INK_2 },
  );

  // ---- C: one coil
  heading(d, 168, 13, l('B · UNE BOBINE · 1:1', 'B · ONE COIL · 1:1'), { size: 2.2 });
  const vc = d.view(216, 71, 1);
  const hl = k(STATOR.coilHoleLength) / 2;
  const hw = k(STATOR.coilHoleWidth) / 2;
  const ow = k(STATOR.coilOutlineLength) / 2;
  const oh = k(STATOR.coilOutlineWidth) / 2;
  vc.roundRect([-ow, oh], [ow, -oh], 6, { w: W.medium, fill: FILL.copper, hatch: 'copper' });
  vc.rect([-hl, hw], [hl, -hw], { w: W.medium, fill: FILL.resin });
  vc.text([0, 0], l('trou = aimant', 'hole = magnet'), { size: 2, anchor: 'middle', baseline: 'middle' });
  vc.dim([-ow, oh], [ow, oh], -8, { dir: 'h', label: labOf(dim('STATOR', 'coilOutlineLength')), size: 2.1 });
  vc.dim([-hl, -hw], [hl, -hw], 5, { dir: 'h', label: labOf(dim('STATOR', 'coilHoleLength')), size: 2.1 });
  vc.dim([ow, oh], [ow, -oh], 8, { dir: 'v', label: labOf(dim('STATOR', 'coilOutlineWidth')), size: 2.1 });
  vc.dim([hl, hw], [hl, -hw], 16, { dir: 'v', label: labOf(dim('STATOR', 'coilHoleWidth')), size: 2.1 });
  p.text([216, 112], l('épaisseur du bobinage : 11', 'winding thickness: 11'), { size: 2, anchor: 'middle' });

  // ---- the numbers of the winding
  const rows: [L, L][] = [
    [l('Tours par bobine', 'Turns per coil'), l(`${nFr(TURNS_REF)}`, `${nEn(TURNS_REF)}`)],
    [l('Fil de cuivre émaillé', 'Enamelled copper wire'), lab(WIRE_DIAMETER_REF * 1000, 'R', 'Ø', ' mm')],
    [l('Bobines par phase, en série', 'Coils per phase, in series'), l('2', '2')],
    [
      l('Longueur de fil par tour', 'Wire length per turn'),
      l(`${nFr(MEAN_TURN_LENGTH * 1000, 0)} mm†`, `${nEn(MEAN_TURN_LENGTH * 1000, 0)} mm†`),
    ],
    [
      l('Résistance d’une phase', 'Resistance of one phase'),
      l(`${nFr(R_PHASE_REF, 2)} Ω†`, `${nEn(R_PHASE_REF, 2)} Ω†`),
    ],
    [
      l(`Tension à ${nFr(BENCH_RPM / 60)} tour par seconde`, `Voltage at ${nEn(BENCH_RPM / 60)} turn per second`),
      l(`≈ ${nFr(BENCH_VOLTS_LL, 1)} V entre phases`, `≈ ${nEn(BENCH_VOLTS_LL, 1)} V between phases`),
    ],
    [l('Fréquence à ce régime', 'Frequency at that speed'), l(`${nFr(FIG.hz60[0])} Hz†`, `${nEn(FIG.hz60[0])} Hz†`)],
  ];
  grid(
    d,
    168,
    120,
    [
      { label: l('Bobinage', 'Winding'), w: 66 },
      { label: l('Valeur', 'Value'), w: 56, mono: true },
    ],
    rows,
    { size: 1.85, pad: 0.7, lineH: 2.9 },
  );

  // ---- star wiring
  heading(d, 296, 13, l('C · COUPLAGE EN ÉTOILE', 'C · STAR WIRING'), { size: 2.2 });
  starView(d, 350, 74);
  p.text(
    [350, 112],
    l(
      'chaque phase : deux bobines en série ; les trois autres bouts, au câble',
      'each phase: two coils in series; the three other ends go to the cable',
    ),
    { size: 1.8, anchor: 'middle', color: INK_2 },
  );

  // ---- D: development
  heading(
    d,
    14,
    192,
    l(
      'D · HUIT AIMANTS, SIX BOBINES · le tour déroulé (angle mécanique)',
      'D · EIGHT MAGNETS, SIX COILS · one turn unrolled (mechanical angle)',
    ),
    { size: 2.2 },
  );
  developed(d, 52, 206, 300);
  note(
    d,
    14,
    242,
    330,
    l(
      'Quatre paires de pôles : 60° mécaniques valent 240° électriques. Les bobines 1 et 4, à 180°, sont à 720° électriques : en phase (A), donc en série. 3 bobines pour 4 aimants.',
      'Four pole pairs: 60° mechanical is 240° electrical. Coils 1 and 4, 180° apart, are 720° electrical apart: in phase (A), hence in series. 3 coils for 4 magnets.',
    ),
    { size: 1.85 },
  );

  // ---- notes and legend
  const ny = box(
    d,
    296,
    124,
    110,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          'Toutes les bobines sont bobinées dans le même sens (wiki). Les bouts intérieurs de 1, 2, 3 vont au point neutre ; les bouts extérieurs de 1, 2, 3 se relient à ceux de 4, 5, 6 ; les bouts intérieurs de 4, 5, 6 sont les trois sorties.',
          'All the coils are wound the same way (wiki). The inner ends of 1, 2, 3 go to the neutral point; the outer ends of 1, 2, 3 join those of 4, 5, 6; the inner ends of 4, 5, 6 are the three outputs.',
        ),
      },
      {
        bullet: '2',
        t: l(
          'Phases A, B, C : couleurs de ce plan, pas celles des gaines du modèle 3D.',
          'Phases A, B, C: colours of this drawing, not those of the 3D model’s sleeves.',
        ),
      },
      { bullet: '3', t: EDU_NOTE },
    ],
    { size: 1.75 },
  );
  marksLegend(d, 296, ny + 3, 110);
  return d;
}

export const statorWinding: DrawingSheet = {
  id: 'stator-winding',
  number: NUMBER,
  group: 'alternator',
  title: TITLE,
  description: l(
    'Le stator porte six bobines de 76 tours de fil de cuivre de 1,4 mm, espacées de 60° et coulées dans la résine. Elles sont câblées en étoile : deux bobines opposées en série forment chaque phase, et les trois phases se rejoignent au point neutre. Huit aimants passent devant six bobines : trois bobines pour quatre aimants, ce qui donne un courant triphasé.',
    'The stator carries six coils of 76 turns of 1.4 mm copper wire, spaced 60° apart and cast in resin. They are wired in a star: two opposite coils in series make each phase, and the three phases meet at the neutral point. Eight magnets pass in front of six coils: three coils for four magnets, which gives a three-phase current.',
  ),
  scene: 'alternator',
  parts: ['stator', 'coils', 'star-wiring', 'magnets'],
  render,
};
