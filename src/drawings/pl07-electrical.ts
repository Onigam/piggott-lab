import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { MODEL } from '../data/figures';
import { PARTS } from '../data/parts';
import { nEn, nFr } from '../data/units';
import { BATTERY_HIGH_VOLTS, BATTERY_LOW_VOLTS, CURRENT_LIMIT, DUMP_MAX_CURRENT } from '../sim/machine';
import { presetParams } from '../sim/presets';
import { EDU_NOTE, PAPER, PHASE, balloon, box, grid, heading, marksLegend, note } from './draw';
import { cat, labN } from './geom';

const NUMBER = 'PL-07';
const TITLE = l('Schéma électrique', 'Electrical schematic');

const ITEMS = [
  'cable-run',
  'brake-switch',
  'rectifier',
  'fuse',
  'battery-bank',
  'dump-load',
  'house',
  'charge-controller',
];
const n = (id: string) => ITEMS.indexOf(id) + 1;

const RED = COLORS.dcPos;
const BLACK = COLORS.dcNeg;

// ------------------------------------------------------------------------------------------------ symbols (paper space)

type P = View;
const line = (p: P, a: Pt, b: Pt, color: string = BLACK, w: number = W.medium) => p.line(a, b, { w, color });

/** A horizontal wire with half-circle hops at the given x (it crosses a wire without touching it). */
function hwire(p: P, x0: number, x1: number, y: number, color: string, hops: number[] = []): void {
  let x = x0;
  for (const h of [...hops].sort((a, b) => a - b)) {
    line(p, [x, y], [h - 1.6, y], color);
    p.arc([h, y], 1.6, 180, 0, { w: W.medium, color });
    x = h + 1.6;
  }
  line(p, [x, y], [x1, y], color);
}

/** Diode between y0 (anode side) and y1 (cathode side) at x: the triangle points to the cathode. */
function diode(p: P, x: number, y0: number, y1: number, color: string): void {
  const up = y1 < y0;
  const m = (y0 + y1) / 2;
  const h = 2.4;
  const dir = up ? -1 : 1;
  line(p, [x, y0], [x, m - dir * h], color);
  p.polyline(
    [
      [x - 1.9, m - dir * h],
      [x + 1.9, m - dir * h],
      [x, m + dir * h],
    ],
    { closed: true, w: W.medium, color, fill: color },
  );
  line(p, [x - 2.2, m + dir * h], [x + 2.2, m + dir * h], color, W.thick);
  line(p, [x, m + dir * h], [x, y1], color);
}

function fuse(p: P, x: number, y: number, color: string): void {
  line(p, [x - 7, y], [x - 4, y], color);
  p.rect([x - 4, y - 1.8], [x + 4, y + 1.8], { w: W.medium, color, fill: PAPER });
  line(p, [x - 4, y], [x + 4, y], color, W.thin);
  line(p, [x + 4, y], [x + 7, y], color);
}

function battery(p: P, x: number, y: number): void {
  line(p, [x, y - 14], [x, y - 6]);
  for (let i = 0; i < 3; i++) {
    const yy = y - 6 + i * 6;
    line(p, [x - 5, yy], [x + 5, yy], BLACK, W.thin * 1.6);
    line(p, [x - 2.6, yy + 3], [x + 2.6, yy + 3], BLACK, W.thick * 1.7);
  }
  line(p, [x, y + 9], [x, y + 14]);
}

function resistor(p: P, x: number, y: number): void {
  line(p, [x, y - 10], [x, y - 5]);
  p.rect([x - 2, y - 5], [x + 2, y + 5], { w: W.medium, color: BLACK, fill: PAPER });
  line(p, [x, y + 5], [x, y + 10]);
}

function lamp(p: P, x: number, y: number): void {
  line(p, [x, y - 8], [x, y - 3.2]);
  p.circle([x, y], 3.2, { w: W.medium, color: BLACK, fill: PAPER });
  line(p, [x - 2.3, y - 2.3], [x + 2.3, y + 2.3], BLACK, W.thin);
  line(p, [x - 2.3, y + 2.3], [x + 2.3, y - 2.3], BLACK, W.thin);
  line(p, [x, y + 3.2], [x, y + 8]);
}

/** A switch between (x, y0) and (x, y1), drawn open: a lever from the upper contact. */
function contact(p: P, x: number, y0: number, y1: number, color: string = BLACK): void {
  const m = (y0 + y1) / 2;
  line(p, [x, y0], [x, m - 2.5], color);
  line(p, [x, m - 2.5], [x + 2.6, m + 2.8], color);
  p.circle([x, m + 3.2], 0.6, { w: W.thin, color, fill: color });
  line(p, [x, m + 2.5], [x, y1], color);
}

// ------------------------------------------------------------------------------------------------ the sheet

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'De l’alternateur à la batterie : phases, frein, redresseur, fusible, régulateur · sans échelle',
      'From the alternator to the battery: phases, brake, rectifier, fuse, controller · not to scale',
    ),
    number: NUMBER,
    scale: '—',
  });
  const p = d.paper();
  heading(d, 14, 13, l('LA MACHINE', 'THE MACHINE'), { size: 2.2 });
  heading(d, 122, 13, l('LA CABANE DES BATTERIES · le montage des plans', 'THE BATTERY SHED · the plans’ layout'), {
    size: 2.2,
  });
  heading(d, 66, 13, l('CÂBLE', 'CABLE'), { size: 2.2 });
  for (const x of [62, 118]) p.line([x, 18], [x, 112], { w: W.thin, dash: 'center', color: INK_2 });

  // ---- alternator and the three phases
  const yP: Record<'A' | 'B' | 'C', number> = { A: 62, B: 72, C: 82 };
  p.circle([32, 72], 14, { w: W.thick, fill: PAPER });
  p.text([32, 69], 'G', { size: 4.2, weight: 'bold', anchor: 'middle', baseline: 'middle' });
  p.text([32, 77], '3~', { size: 2.6, anchor: 'middle', baseline: 'middle' });
  p.text([32, 51], l('alternateur triphasé', 'three-phase alternator'), { size: 2, anchor: 'middle' });
  p.text([32, 55], l('(au sommet du mât)', '(on top of the mast)'), { size: 1.7, anchor: 'middle', color: INK_2 });
  p.text([32, 92], l('étoile, 6 × 76 tours', 'star, 6 × 76 turns'), { size: 1.9, anchor: 'middle', color: INK_2 });
  const xr = 160; // legs of the rectifier
  const legX: Record<'A' | 'B' | 'C', number> = { A: xr, B: xr + 12, C: xr + 24 };
  // phase wires: from the alternator, through the cable run and the brake, to their leg
  hwire(p, 45, legX.A, yP.A, PHASE.A);
  hwire(p, 45, legX.B, yP.B, PHASE.B, [legX.A]);
  hwire(p, 45, legX.C, yP.C, PHASE.C, [legX.A, legX.B]);
  for (const ph of ['A', 'B', 'C'] as const)
    p.text([54, yP[ph] - 1.8], ph, { size: 2, weight: 'bold', color: PHASE[ph] });

  // ---- the cable run: a break in the three wires and its label
  for (const x of [78, 86])
    p.polyline(
      [
        [x - 1.5, 56],
        [x + 1.5, 88],
      ],
      { w: W.thin, color: INK_2 },
    );
  p.rect([76, 54], [88, 90], { w: 0, fill: PAPER });
  for (const ph of ['A', 'B', 'C'] as const) {
    p.line([68, yP[ph]], [76, yP[ph]], { w: W.medium, color: PHASE[ph] });
    p.line([88, yP[ph]], [96, yP[ph]], { w: W.medium, color: PHASE[ph] });
  }
  p.polyline(
    [
      [68, 52],
      [68, 50],
      [112, 50],
      [112, 52],
    ],
    { w: W.thin, color: INK_2 },
  );
  p.text([90, 47.5], l('câble de liaison', 'link cable'), { size: 2, anchor: 'middle', weight: 'bold' });
  const cfg = presetParams('hamlet');
  p.text(
    [90, 96],
    cat(
      labN(cfg.cableLength, 0, 'E', '≈ ', ' m'),
      l(' à l’aller · 3 fils ', ' one way · 3 wires '),
      labN(cfg.cableSection, 0, 'E', '', ' mm²'),
    ),
    { size: 1.9, anchor: 'middle' },
  );
  p.text([90, 100], l('(hypothèses du modèle)', '(model assumptions)'), { size: 1.7, anchor: 'middle', color: INK_2 });

  // ---- the brake switch: two contacts that join A to B and B to C
  const xb = 124;
  for (const [a, b, x] of [
    ['A', 'B', xb],
    ['B', 'C', xb + 9],
  ] as const) {
    p.circle([x, yP[a]], 0.7, { w: W.thin, color: PHASE[a], fill: PHASE[a] });
    p.circle([x, yP[b]], 0.7, { w: W.thin, color: PHASE[b], fill: PHASE[b] });
    contact(p, x, yP[a], yP[b], COLORS.red);
  }
  p.text([xb + 4.5, 96], l('frein', 'brake'), { size: 2, anchor: 'middle', color: COLORS.red, weight: 'bold' });
  p.text([xb + 4.5, 100], l('2 pôles : fermé = court-circuit', '2 poles: closed = short circuit'), {
    size: 1.7,
    anchor: 'middle',
    color: COLORS.red,
  });

  // ---- the rectifier: three legs of two diodes between the + and − rails
  const yPlus = 46;
  const yMinus = 98;
  p.rect([xr - 10, yPlus - 6], [xr + 34, yMinus + 4], { w: W.thin, color: INK_2, dash: 'hidden', fill: 'none' });
  for (const ph of ['A', 'B', 'C'] as const) {
    const x = legX[ph];
    const yn = yP[ph];
    diode(p, x, yn, yPlus, BLACK);
    diode(p, x, yMinus, yn, BLACK);
    p.circle([x, yn], 0.7, { w: W.thin, color: PHASE[ph], fill: PHASE[ph] });
  }
  p.text([xr + 12, yMinus + 8], l('redresseur (pont de diodes)', 'rectifier (diode bridge)'), {
    size: 2,
    anchor: 'middle',
    weight: 'bold',
  });
  // the rails
  hwire(p, legX.A, 400, yPlus, RED);
  hwire(p, legX.A, 400, yMinus, BLACK);
  p.text([192, yPlus - 2], '+', { size: 3, weight: 'bold', color: RED });
  p.text([192, yMinus + 5], '−', { size: 3, weight: 'bold' });

  // ---- fuse on the + wire, battery, dump load, house
  fuse(p, 212, yPlus, RED);
  const branch = (x: number, from: number, to: number) => {
    p.circle([x, yPlus], 0.7, { w: W.thin, color: RED, fill: RED });
    p.circle([x, yMinus], 0.7, { w: W.thin, color: BLACK, fill: BLACK });
    line(p, [x, yPlus], [x, from], RED);
    line(p, [x, to], [x, yMinus], BLACK);
  };
  // battery
  const xBat = 238;
  branch(xBat, yPlus + 20 - 14 + 6, yMinus - 20 + 14 - 6);
  battery(p, xBat, 72);
  p.text([xBat + 8, 72], l('12 V', '12 V'), { size: 2.2, weight: 'bold', baseline: 'middle' });
  // dump load: a contact of the controller, then the resistor
  const xDump = 290;
  branch(xDump, 52, 98);
  contact(p, xDump, 52, 64, BLACK);
  resistor(p, xDump, 80);
  // house: fuse, the low-voltage contact, the lamp
  const xHouse = 334;
  branch(xHouse, 51, 98);
  p.rect([xHouse - 1.6, 51], [xHouse + 1.6, 58], { w: W.medium, color: BLACK, fill: PAPER });
  contact(p, xHouse, 58, 70, BLACK);
  lamp(p, xHouse, 84);
  // controller: a box between the rails, with its sense lines and the two dashed command lines
  const xc0 = 360;
  const xc1 = 396;
  p.rect([xc0, 58], [xc1, 88], { w: W.medium, fill: PAPER });
  p.text([(xc0 + xc1) / 2, 69], l('régulateur', 'controller'), { size: 2, anchor: 'middle', weight: 'bold' });
  p.text([(xc0 + xc1) / 2, 76], l('14 V · 11,5 V', '14 V · 11.5 V'), { size: 1.9, anchor: 'middle', mono: true });
  line(p, [xc0 + 6, yPlus], [xc0 + 6, 58], RED);
  line(p, [xc0 + 6, 88], [xc0 + 6, yMinus], BLACK);
  p.line([xc0, 66], [xDump + 2, 58], { w: W.medium, color: INK_2, dash: 'hidden' });
  p.line([xc0, 80], [xHouse + 2.6, 64.4], { w: W.medium, color: INK_2, dash: 'hidden' });
  p.text([xDump + 5, 56.5], l('à 14 V', 'at 14 V'), { size: 1.8, color: INK_2 });
  p.text([xHouse + 5, 62], l('sous 11,5 V', 'below 11.5 V'), { size: 1.8, color: INK_2 });
  p.text([xDump - 3, 94], l('délesteur', 'dump load'), { size: 2, anchor: 'middle' });
  p.text([xHouse - 3, 94], l('maison', 'house'), { size: 2, anchor: 'middle' });
  p.text([xBat, 94], l('batterie', 'battery'), { size: 2, anchor: 'middle' });
  p.text([212, 40], l('fusible, fil +', 'fuse, + wire'), { size: 1.9, anchor: 'middle' });
  p.text([xHouse - 14, 50.2], l('fusible', 'fuse'), { size: 1.7, anchor: 'end', color: INK_2 });

  // ---- balloons
  const bl = (id: string, at: Pt, bx: number, by: number) => balloon(p, at, bx, by, n(id));
  bl('cable-run', [72, 62], 72, 32);
  bl('brake-switch', [xb + 4, 70], xb + 4, 32);
  bl('rectifier', [legX.C + 8, 60], legX.C + 12, 32);
  bl('fuse', [212, yPlus], 212, 32);
  bl('battery-bank', [xBat - 5, 66], xBat - 14, 32);
  bl('dump-load', [xDump + 2, 80], xDump + 14, 108);
  bl('house', [xHouse + 3, 84], xHouse + 14, 108);
  bl('charge-controller', [xc1 - 6, 84], xc1 - 6, 108);

  // ---- lower band: the warning, the cable losses, the model's figures, the parts list
  const y2 = 118;
  box(
    d,
    14,
    y2,
    100,
    l(
      'LE FREIN COURT-CIRCUITE L’ALTERNATEUR, JAMAIS LA BATTERIE',
      'THE BRAKE SHORTS THE ALTERNATOR, NEVER THE BATTERY',
    ),
    [
      l(
        `Fermé, l’interrupteur de freinage joint les trois fils de la machine : les bobines s’opposent à la rotation et le rotor ne tourne plus que très lentement (≈ ${nFr(MODEL.brakeRpm)} tr/min à 8 m/s, résultat du modèle). Ce n’est ni un verrou ni une garantie en pleine tempête : on ne s’approche pas d’une machine qui tourne. Court-circuiter la batterie ferait sauter le fusible : danger.`,
        `Closed, the brake switch joins the machine’s three wires: the coils oppose the rotation and the rotor only turns very slowly (≈ ${nEn(MODEL.brakeRpm)} rpm at 8 m/s, model result). It is neither a lock nor a guarantee in a full storm: do not approach a machine that is turning. Short-circuiting the battery would blow the fuse: danger.`,
      ),
      l(
        'Tout circuit qui part d’une batterie porte un fusible. Une batterie au plomb dégage de l’hydrogène : ni flamme ni étincelle.',
        'Every circuit that leaves a battery carries a fuse. A lead-acid battery gives off hydrogen: no flame, no spark.',
      ),
    ],
    { size: 1.85, border: COLORS.red },
  );
  heading(
    d,
    122,
    y2,
    l('PERTES DANS LE CÂBLE · 500 W, 6 mm², 30 m (plans)', 'CABLE LOSSES · 500 W, 6 mm², 30 m (plans)'),
    { size: 2.1 },
  );
  const gh = grid(
    d,
    122,
    y2 + 5,
    [
      { label: l('Tension du système', 'System voltage'), w: 48 },
      { label: l('Part de la puissance perdue', 'Share of the power lost'), w: 60, align: 'end', mono: true },
    ],
    [
      [l('12 V (le montage de la vidéo)', '12 V (the video’s layout)'), l('38 %', '38%')],
      ['24 V', l('13 %', '13%')],
      ['48 V', l('4 %', '4%')],
    ],
    { size: 1.9, pad: 0.7, lineH: 3 },
  );
  note(
    d,
    122,
    y2 + 5 + gh + 2,
    108,
    l(
      'Moitié de la puissance : moitié du pourcentage. En 12 V le courant est grand : le câble doit être gros.',
      'Half the power: half the percentage. At 12 V the current is large: the cable must be thick.',
    ),
    { size: 1.8, color: INK_2 },
  );
  heading(d, 122, y2 + 36, l('CE QUE DONNE LE MODÈLE (résultat du modèle)', 'WHAT THE MODEL GIVES (model result)'), {
    size: 2.1,
  });
  const modelRows: [L, L][] = [
    [
      l('Courant redressé à 12 m/s', 'Rectified current at 12 m/s'),
      l(`≈ ${nFr(MODEL.amps12, 0)} A`, `≈ ${nEn(MODEL.amps12, 0)} A`),
    ],
    [
      l('Câble par défaut (10 mm², 15 m), à 8 m/s', 'Default cable (10 mm², 15 m), at 8 m/s'),
      l(`≈ ${nFr(MODEL.defaultLoss, 0)} % perdu`, `≈ ${nEn(MODEL.defaultLoss, 0)}% lost`),
    ],
    [
      l('Câble fin (2,5 mm², 40 m), à 8 m/s', 'Thin cable (2.5 mm², 40 m), at 8 m/s'),
      l(`≈ ${nFr(MODEL.thinLoss, 0)} % perdu`, `≈ ${nEn(MODEL.thinLoss, 0)}% lost`),
    ],
  ];
  grid(
    d,
    122,
    y2 + 41,
    [
      { label: l('Situation', 'Situation'), w: 72 },
      { label: l('Résultat', 'Result'), w: 36, align: 'end', mono: true },
    ],
    modelRows,
    { size: 1.85, pad: 0.7, lineH: 2.9 },
  );

  // the limits of the battery and of the circuit
  heading(d, 240, y2, l('LIMITES (plans)', 'LIMITS (plans)'), { size: 2.1 });
  grid(
    d,
    240,
    y2 + 5,
    [
      { label: l('Grandeur', 'Quantity'), w: 100 },
      { label: l('Valeur', 'Value'), w: 40, align: 'end', mono: true },
    ],
    [
      [
        l('Batterie trop déchargée', 'Battery too deeply discharged'),
        l(`< ${nFr(BATTERY_LOW_VOLTS, 1)} V`, `< ${nEn(BATTERY_LOW_VOLTS, 1)} V`),
      ],
      [
        l('Charge trop forte', 'Charging too hard'),
        l(`> ${nFr(BATTERY_HIGH_VOLTS, 0)} V`, `> ${nEn(BATTERY_HIGH_VOLTS, 0)} V`),
      ],
      [
        l('Interrupteur de freinage', 'Brake switch'),
        l(`2 · ${nFr(CURRENT_LIMIT, 0)} A`, `2 · ${nEn(CURRENT_LIMIT, 0)} A`),
      ],
      [
        l('Relais du régulateur', 'Controller relays'),
        l(`12 V · ${nFr(DUMP_MAX_CURRENT, 0)} A`, `12 V · ${nEn(DUMP_MAX_CURRENT, 0)} A`),
      ],
      [l('Fils de la machine (wiki)', 'Machine wires (wiki)'), l('3 × 2,5 mm²', '3 × 2.5 mm²')],
    ],
    { size: 1.85, pad: 0.7, lineH: 2.9 },
  );

  // parts list
  heading(d, 14, 183, l('REPÈRES · pièces du monde « site »', 'ITEMS · parts of the “site” world'), { size: 2.1 });
  grid(
    d,
    14,
    188,
    [
      { label: l('Rep.', 'Item'), w: 9, align: 'middle' },
      { label: l('Désignation', 'Part'), w: 70 },
      { label: l('Rôle', 'Role'), w: 120 },
    ],
    ITEMS.map((id, i) => {
      const part = PARTS.find((x) => x.id === id)!;
      return [{ t: String(i + 1), bold: true }, part.name, part.short];
    }),
    { size: 1.75, pad: 0.55, lineH: 2.7 },
  );

  // legend and notes (right of the parts list)
  marksLegend(d, 218, 188, 70, [
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: RED }),
      text: l('+ de la batterie', 'battery +'),
    },
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: BLACK }),
      text: l('− de la batterie', 'battery −'),
    },
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: PHASE.A }),
      text: l('phase A (brun)', 'phase A (brown)'),
    },
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: PHASE.B }),
      text: l('phase B (bleu)', 'phase B (blue)'),
    },
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: PHASE.C }),
      text: l('phase C (violet)', 'phase C (violet)'),
    },
    {
      sym: (q, x, y) => q.line([x, y], [x + 8, y], { w: W.medium, color: INK_2, dash: 'hidden' }),
      text: l('commande du régulateur', 'controller command'),
    },
  ]);
  box(
    d,
    296,
    188,
    110,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          'Le redresseur est dessiné en pont triphasé, comme le modèle ; les plans en donnent deux ponts monophasés au pied du mât.',
          'The rectifier is drawn as a three-phase bridge, like the model; the plans give two single-phase bridges at the foot of the mast.',
        ),
      },
      { bullet: '2', t: EDU_NOTE },
    ],
    { size: 1.7 },
  );
  return d;
}

export const electricalSchematic: DrawingSheet = {
  id: 'electrical-schematic',
  number: NUMBER,
  group: 'site',
  title: TITLE,
  description: l(
    'Le courant alternatif triphasé de l’alternateur descend dans le mât par un câble de trois fils, passe par l’interrupteur de freinage, puis par le redresseur qui le rend continu pour la batterie. Un fusible protège le fil positif ; le régulateur envoie l’excédent au délesteur à 14 V et coupe la maison sous 11,5 V. Le frein court-circuite l’alternateur, jamais la batterie.',
    'The alternator’s three-phase AC current goes down the mast in a three-wire cable, passes the brake switch, then the rectifier that makes it direct current for the battery. A fuse protects the positive wire; the controller sends the surplus to the dump load at 14 V and cuts the house off below 11.5 V. The brake shorts the alternator, never the battery.',
  ),
  scene: 'site',
  parts: ['cable-run', 'brake-switch', 'rectifier', 'fuse', 'charge-controller', 'dump-load', 'battery-bank', 'house'],
  render,
};
