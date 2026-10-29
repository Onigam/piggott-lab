// Installation guide of the whole site (wave 2, data role): 12 steps in the `site` world, in the order of the plans' wiring and of the
// raising of the machine. Every id of `site` is installed in exactly one step (a test checks it): obstacles, tower base, tower and guys,
// cable run, brake switch, rectifier, fuse, controller and dump load, battery bank, the machine itself (`wind-turbine`), house. The last step,
// the first check, installs nothing.
//
// Who says what. The VIDEO shows no site at all (only the machine and a test mast); it gives the siting advice (00:51: few obstacles,
// prevailing winds, an open landscape) and what the machine can feed (01:06). Everything else comes from Hugh Piggott's plans (2003: the
// tower, the guys, the wiring, the batteries, the regulation), from Tripalium's logbooks (the lifting rope that broke, the wire that was
// pinched) and from Service-public (the French rule: no formality under 12 m of mast in general, a building permit from 12 m, a set-back of
// half the height with 3 m at least; the page was verified on 14 September 2026: say "check with the mairie"). The mast height, the
// foundation, the anchors, the fuse rating and the battery size are NOT given by any source: the texts say so, and publish no dimension.
// The label says 200 W (nominal, wind speed not given); the model finds about 60 W at 12 m/s: step 12 says so.
// Safety is first: hinged base, guys, never stand under the machine, brake switch closed before touching it (docs/research.md §7).
//
// Each step text stays within 80 words in both languages. DURATIONS ARE ROUGH ESTIMATES (« ≈ 4 h (est.) »); no torque is given.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'siting',
    scene: 'site',
    title: l('Choisir le site et regarder les obstacles', 'Choose the site and look at the obstacles'),
    text: l(
      'Le vent décide de tout. La vidéo conseille de placer l’éolienne là où il y a peu d’obstacles, de chercher les vents dominants et un paysage bien dégagé. Un arbre ou un toit en amont fait perdre de la vitesse et de la régularité. Dans un lieu très dégagé, 6 m de mât peuvent suffire ; sinon visez 12 ou 18 m (plans). Mesurez aussi la distance jusqu’aux batteries.',
      'The wind decides everything. The video advises placing the turbine where there are few obstacles, looking for the prevailing winds and a well-open landscape. A tree or a roof upwind costs speed and steadiness. In a very open place a 6 m mast may do; otherwise aim for 12 or 18 m (plans). Also measure the distance to the batteries.',
    ),
    parts: ['obstacles'],
    tools: [
      l('Carnet, boussole', 'Notebook, compass'),
      l('Décamètre', 'Long tape'),
      l('Un œil sur les arbres penchés', 'An eye on leaning trees'),
    ],
    tip: l(
      'Les arbres penchés et l’herbe couchée dessinent le vent dominant : regardez-les avant de choisir.',
      'Leaning trees and flattened grass show the prevailing wind: look at them before choosing.',
    ),
    warning: l(
      'France : sous 12 m de mât, en général aucune formalité (déclaration préalable en secteur protégé) ; à partir de 12 m, permis de construire. Retrait de la limite voisine : la moitié de la hauteur, 3 m au moins. Demandez à la mairie : les règles locales (PLU) et celles des autres pays diffèrent.',
      'France: under 12 m of mast, generally no formality (a prior declaration in a protected area); from 12 m, a building permit. Set-back from the neighbour’s boundary: half the height, 3 m at least. Ask the mairie (town hall): local rules (PLU) and those of other countries differ.',
    ),
    duration: '≈ 4 h (est.)',
  },
  {
    id: 'base',
    scene: 'site',
    title: l('Faire le pied de mât articulé', 'Make the hinged mast base'),
    text: l(
      'Le pied du mât est articulé : on monte la machine au sol, mât couché, puis on le relève ; l’entretien se fait aussi au sol. Faites l’articulation en cornière d’acier sur une fondation solide : aucune source n’en donne les dimensions, calculez-la selon le sol. Laissez sortir les fils par le bas sans les plier, pour pouvoir vérifier qu’ils ne se tordent pas.',
      'The foot of the mast is hinged: the machine is assembled on the ground, mast lying down, then raised; maintenance is also done on the ground. Make the hinge from steel angle on a solid foundation: no source gives its dimensions, work it out for the ground. Let the wires leave at the bottom without kinking, so that you can check they are not twisting.',
    ),
    parts: ['tower-base'],
    tools: [l('Poste à souder', 'Welder'), l('Pelle, béton', 'Shovel, concrete'), l('Niveau', 'Level')],
    warning: l(
      'Ne comptez jamais sur une articulation que vous n’avez pas essayée à vide : Tripalium a vu une corde de levage casser et une éolienne tomber d’environ 2 m avec son mât.',
      'Never rely on a hinge you have not tried with no load: Tripalium has seen a lifting rope break and a turbine fall about 2 m with its mast.',
    ),
    duration: '≈ 6 h (est.)',
  },
  {
    id: 'mast',
    scene: 'site',
    title: l('Assembler le mât et poser les haubans', 'Assemble the mast and fit the guys'),
    text: l(
      'Le mât est un tuyau d’eau en acier de 60 mm (2 pouces) ; son haut, un tube plus fin, s’enfile dans le tube pivot de la nacelle. Posez des haubans tous les 4 m environ : ceux du haut portent l’essentiel, les autres raidissent. Passez-les dans des demi-tubes soudés sur le mât, à l’écart du bout des pales, mais pas trop bas, sur des ancrages sûrs.',
      'The mast is a 60 mm (2 in) steel water pipe; its top, a slimmer tube, slides into the nacelle’s pivot tube. Fit guys about every 4 m: the top ones carry most of the load, the others stiffen. Pass them through half-pipes welded on the mast, clear of the blade tips but not too low, on sound anchors.',
    ),
    parts: ['tower', 'guy-wires'],
    tools: [
      l('Câble d’acier, serre-câbles', 'Wire rope, rope clamps'),
      l('Piquets ou ancrages', 'Stakes or anchors'),
      l('Niveau', 'Level'),
    ],
    tip: l(
      'Le câble d’acier galvanisé dure de cinq à dix ans ; le fil de clôture est bon marché mais peut claquer (plans).',
      'Galvanised wire rope lasts five to ten years; fence wire is cheap but can snap (plans).',
    ),
    duration: '≈ 8 h (est.)',
  },
  {
    id: 'cable',
    scene: 'site',
    title: l('Tirer le câble vers le local technique', 'Run the cable to the technical room'),
    text: lf(
      'Trois fils partent du mât jusqu’au local technique, où se trouvent les batteries. En 12 V le courant est fort, et la perte croît comme son carré : pour 500 W, 6 mm² sur 30 m perdent 38 % de la puissance (plans), 25 mm² seulement 13 %. Souple dans le mât, il est protégé par un conduit ou armé au sol. Dans la simulation, 2,5 mm² sur 40 m brûlent ≈ {thinLoss} % à 8 m/s (résultat du modèle).',
      'Three wires go from the mast to the technical room, where the batteries are. At 12 V the current is large, and the loss grows as its square: for 500 W, 6 mm² over 30 m loses 38% of the power (plans), 25 mm² only 13%. Flexible in the mast, it is protected by conduit or armoured on the ground. In the simulation, 2.5 mm² over 40 m burns ≈ {thinLoss}% at 8 m/s (model result).',
    ),
    parts: ['cable-run', 'technical-room'],
    tools: [
      l('Câble souple et câble armé', 'Flexible and armoured cable'),
      l('Conduit', 'Conduit'),
      l('Pince à sertir', 'Crimping tool'),
    ],
    tip: l(
      'Préférez un gros câble à un long câble : rapprochez les batteries du mât si vous le pouvez.',
      'Prefer a thick cable to a long one: bring the batteries closer to the mast if you can.',
    ),
    duration: '≈ 4 h (est.)',
  },
  {
    id: 'brake',
    scene: 'shed',
    title: l('Poser l’interrupteur de freinage', 'Fit the brake switch'),
    text: l(
      'Au pied du mât, près des batteries, les trois fils arrivent d’abord à l’interrupteur de freinage : un interrupteur à deux pôles, de 20 A en 12 V continu. Fermé, il met l’alternateur en court-circuit et le rotor ne tourne plus que très lentement. Ne court-circuitez jamais la batterie : le fusible sauterait. Fermez-le avant de monter, de descendre ou de toucher la machine.',
      'At the foot of the mast, near the batteries, the three wires reach the brake switch first: a two-pole switch rated 20 A at 12 V DC. Closed, it short-circuits the alternator and the rotor only turns very slowly. Never short-circuit the battery: the fuse would blow. Close it before climbing, lowering or touching the machine.',
    ),
    parts: ['brake-switch'],
    tools: [
      l('Interrupteur bipolaire 20 A', '20 A two-pole switch'),
      l('Boîtier étanche', 'Weatherproof box'),
      l('Multimètre', 'Multimeter'),
    ],
    warning: l(
      'Ce n’est pas un verrou : n’approchez pas d’une machine qui tourne, même freinée, et jamais en tempête.',
      'It is not a lock: do not approach a machine that is turning, even braked, and never in a storm.',
    ),
    duration: '≈ 1 h (est.)',
  },
  {
    id: 'rectifier',
    scene: 'shed',
    title: l('Brancher le redresseur', 'Connect the rectifier'),
    text: l(
      'Après l’interrupteur, les trois fils arrivent au redresseur : n’importe quel fil alternatif sur n’importe quelle borne alternative (les plans prennent deux ponts de diodes pour avoir assez de bornes). Les deux bornes négatives vont au moins de la batterie ; les positives iront à son plus, par le fusible. Fixez les ponts sur un dissipateur, et abritez-les de l’eau : une bouteille en plastique fait un abri de pluie.',
      'After the switch, the three wires reach the rectifier: any AC wire on any AC terminal (the plans use two diode bridges to have enough terminals). The two negative terminals go to the battery’s minus; the positives will go to its plus, through the fuse. Bolt the bridges to a heatsink, and shelter them from water: a plastic bottle makes a rain shield.',
    ),
    parts: ['rectifier'],
    tools: [
      l('Ponts de diodes, dissipateur', 'Diode bridges, heatsink'),
      l('Cosses serties', 'Crimped lugs'),
      l('Multimètre', 'Multimeter'),
    ],
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'fuse',
    scene: 'shed',
    title: l('Mettre le fusible', 'Fit the fuse'),
    text: l(
      'Tout circuit qui part d’une batterie porte un fusible ou un disjoncteur : c’est une règle de sécurité, pas une option. Mettez celui de l’éolienne sur le fil positif entre le redresseur et la batterie, et un autre, séparé, pour la maison. Le calibre n’est pas donné par les plans : il doit protéger le câble. Sertissez les cosses : jamais de pinces crocodiles.',
      'Every circuit that leaves a battery has a fuse or a circuit breaker: a safety rule, not an option. Fit the turbine’s on the positive wire between the rectifier and the battery, and another, separate one for the house. The rating is not given by the plans: it must protect the cable. Crimp the lugs: never crocodile clips.',
    ),
    parts: ['fuse'],
    tools: [
      l('Porte-fusible ou disjoncteur', 'Fuse holder or circuit breaker'),
      l('Pince à sertir', 'Crimping tool'),
      l('Fusibles de rechange', 'Spare fuses'),
    ],
    warning: l(
      'Un court-circuit de batterie sans fusible chauffe le câble jusqu’à l’incendie.',
      'A battery short circuit without a fuse heats the cable up to the point of fire.',
    ),
    duration: '≈ 1 h (est.)',
  },
  {
    id: 'controller',
    scene: 'shed',
    title: l('Installer le régulateur et le délesteur', 'Install the controller and the dump load'),
    text: l(
      'Une batterie au plomb ne doit pas tomber sous 11,5 V ni être chargée au-dessus de 14 V. Un régulateur surveille la tension : au-dessus de 14 V il envoie le surplus au délesteur, une résistance bien ventilée ; sous 11,5 V il débranche la maison. Les plans décrivent un petit circuit à deux relais de 16 A, ou l’on achète un régulateur du commerce.',
      'A lead-acid battery must not fall below 11.5 V nor be charged above 14 V. A controller watches the voltage: above 14 V it sends the surplus to the dump load, a well-ventilated resistor; below 11.5 V it disconnects the house. The plans describe a small circuit with two 16 A relays, or you can buy a commercial controller.',
    ),
    parts: ['charge-controller', 'dump-load'],
    tools: [
      l('Régulateur et relais', 'Controller and relays'),
      l('Résistance de puissance, dissipateur', 'Power resistor, heatsink'),
      l('Voltmètre', 'Voltmeter'),
    ],
    warning: l(
      'Le délesteur devient brûlant : éloignez-le de tout ce qui brûle et laissez-le respirer.',
      'The dump load gets scalding: keep it away from anything flammable and let it breathe.',
    ),
    duration: '≈ 3 h (est.)',
  },
  {
    id: 'battery',
    scene: 'shed',
    title: l('Brancher la batterie', 'Connect the battery'),
    text: l(
      'Reliez la batterie 12 V en dernier dans le coffret, interrupteur de freinage fermé. Sertissez des cosses propres et ne posez rien de métallique sur les bornes : les étincelles brûlent, et le gaz d’une batterie au plomb peut exploser. Ventilez le local. Gardez la batterie chargée : en cas de panne de l’éolienne, rechargez-la sous deux semaines. La vidéo ne montre aucune batterie : sa capacité n’est donnée par aucune source.',
      'Connect the 12 V battery last in the cabinet, brake switch closed. Crimp clean lugs and put nothing metallic on the terminals: sparks burn, and the gas of a lead-acid battery can explode. Ventilate the room. Keep the battery charged: if the turbine breaks down, recharge it within two weeks. The video shows no battery: no source gives its capacity.',
    ),
    parts: ['battery-bank'],
    tools: [
      l('Batterie 12 V au plomb', '12 V lead-acid battery'),
      l('Cosses serties', 'Crimped lugs'),
      l('Lunettes et gants', 'Goggles and gloves'),
    ],
    warning: l(
      'Acide et hydrogène : lunettes et gants, aucun outil sur les bornes, et prudence en soulevant la batterie (plans).',
      'Acid and hydrogen: goggles and gloves, no tool across the terminals, and care when lifting the battery (plans).',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'raise',
    scene: 'site',
    title: l('Monter la machine et lever le mât', 'Fit the machine and raise the mast'),
    text: l(
      'Sur le mât couché, enfilez d’abord les fils, puis le tube pivot sur le haut du mât. Fermez l’interrupteur de freinage. Tendez les haubans de côté, puis levez le mât à plusieurs, par temps calme, avec une corde ou un câble neuf et sûr. Une fois dressé, serrez tous les haubans. Ne laissez personne sous la machine, ni à la portée d’une chute.',
      'On the mast lying down, feed the wires first, then slide the pivot tube onto the mast top. Close the brake switch. Tension the side guys, then raise the mast with several people, in calm weather, with a new, sound rope or cable. Once upright, tighten all the guys. Let no one stand under the machine, nor within reach of a fall.',
    ),
    parts: ['wind-turbine'],
    tools: [
      l('Corde ou câble de levage neufs', 'New lifting rope or cable'),
      l('Casque', 'Hard hat'),
      l('Plusieurs personnes', 'Several people'),
    ],
    warning: l(
      'Tripalium a vu une corde de levage casser : l’éolienne et son mât sont tombés d’environ 2 m. Casque, haubans, jamais sous la machine.',
      'Tripalium has seen a lifting rope break: the turbine and its mast fell about 2 m. Hard hat, guys, never under the machine.',
    ),
    duration: '≈ 4 h (est.)',
  },
  {
    id: 'house',
    scene: 'site',
    title: l('Raccorder la maison', 'Connect the house'),
    text: lf(
      'Raccordez les charges de la maison à la batterie, chacune avec son fusible : la vidéo vise un peu d’éclairage ou la recharge d’un ordinateur. Partez de ce que vous consommez. Dix watts en continu font {houseKwh} kWh par an (dérivé) ; le modèle en tire ≈ {hamletKwh} kWh dans le hameau (résultat du modèle), mais pas quand il le faut, d’où la batterie. Sous 11,5 V, la maison doit être débranchée.',
      'Connect the house loads to the battery, each with its own fuse: the video aims at some lighting or charging a computer. Start from what you use. Ten watts continuously make {houseKwh} kWh a year (derived); the model draws ≈ {hamletKwh} kWh in the hamlet (model result), but not when it is needed, hence the battery. Below 11.5 V, the house must be disconnected.',
    ),
    parts: ['house'],
    tools: [
      l('Câble et fusibles', 'Cable and fuses'),
      l('Appareils sobres en 12 V', 'Frugal 12 V appliances'),
      l('Voltmètre', 'Voltmeter'),
    ],
    tip: l(
      'Des lampes qui faiblissent annoncent une batterie basse ; des lampes très vives, trop de vent pour la batterie (plans).',
      'Dimming lamps mean a low battery; very bright lamps mean too much wind for the battery (plans).',
    ),
    duration: '≈ 3 h (est.)',
  },
  {
    id: 'check',
    scene: 'site',
    title: l('Premier contrôle', 'First check'),
    text: lf(
      'Rouvrez l’interrupteur de freinage par vent modéré : le rotor doit repartir et la tension monter. Vérifiez la polarité, le fusible, aucun fil tordu au pied du mât. La charge ne commence qu’à ≈ {cutIn} m/s dans le modèle ; il donne ≈ {w12} W à 12 m/s, et la queue se replie vers 10 m/s. N’attendez pas les 200 W de l’étiquette (nominal, vent non précisé).',
      'Open the brake switch again in a moderate wind: the rotor must restart and the voltage rise. Check the polarity, the fuse, no twisted wire at the foot of the mast. Charging only starts at ≈ {cutIn} m/s in the model; it gives ≈ {w12} W at 12 m/s, and the tail folds near 10 m/s. Do not expect the 200 W of the label (nominal, wind speed not given).',
    ),
    parts: [],
    tools: [l('Multimètre', 'Multimeter'), l('Carnet de bord', 'Logbook')],
    tip: l(
      'Notez la tension de charge par vent donné : c’est votre référence pour repérer une panne.',
      'Note the charging voltage in a given wind: it is your reference for spotting a fault.',
    ),
    warning: l(
      'Gardez l’interrupteur à portée de main, ne vous approchez pas du mât en tempête et fermez-le avant toute intervention.',
      'Keep the switch within reach, do not approach the mast in a storm and close it before any intervention.',
    ),
    duration: '≈ 2 h (est.)',
  },
];
