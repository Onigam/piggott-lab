// Parts of the `alternator` world (ids frozen in src/part-ids.ts, 10 of them): the axial-flux alternator in section and exploded.
// Conventions: see site.ts. Sources named in the text: the video (02:17–03:20 rotor and stator, 03:49–04:24 nacelle parts,
// 04:44–05:06 moulds) and the Low-tech Lab wiki (steps 8–26, the tutorial of the same machine), which PREVAILS over Hugh Piggott's plans
// (2003, an older revision) wherever they differ (lead's decision): the lab reconstructs the video's machine.
//
// KINEMATICS (research K6 was wrong; the lead corrected it, wiki steps 8, 9, 15, 16, 17-26): ONE magnet rotor of 8 magnets (the 2.4 m
// machine of the plans has two rotors and 24 magnets: a fact stated in the sheets). FIXED: the nacelle's angle iron with the cradle (a steel
// disc 140 × 8 mm, 12 mm holes) welded at its end; the car hub's stub axle (« fusée », not a hollow shaft) screwed on the cradle; the
// stator, a resin casting of the six coils with THREE slotted M12 × 70 mm rods cast in, nutted on the cradle (the nuts set the air gap,
// about 1 mm). ROTATING: the hub bell on its bearings on the stub axle; the 230 × 6 mm rotor disc bolted to the bell by FOUR M12 × 140 mm
// rods and 16 nuts; the blades and the 9 mm plywood hub disc on the same rods. Id partition (agreed with the 3D role): `studs` = the
// three stator rods, `bearing-hub` = hub bell + bearings + the four long rods, `shaft` = the stub axle with its cradle.
// The 2003 plans' variant (a hollow shaft with the stator cast onto it) is mentioned in one line, in `shaft` and `stator`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const ALTERNATOR_PARTS: PartInfo[] = [
  {
    id: 'magnet-rotor',
    scene: 'alternator',
    category: 'mechanical',
    name: l('Disque à aimants (rotor)', 'Magnet rotor'),
    short: l(
      'Disque d’acier coulé dans la résine avec ses huit aimants : la partie tournante de l’alternateur.',
      'Steel disc cast in resin with its eight magnets: the alternator’s turning part.',
    ),
    description: l(
      'Le rotor est un disque d’acier de 230 × 6 mm, coulé dans la résine avec ses huit aimants : l’acier canalise le champ d’un aimant à l’autre. Il est boulonné à la cloche du moyeu à roulements par quatre tiges filetées de 12 mm, et tourne devant la face du stator, à environ 1 mm. La coulée se fait dans un moule, sous le poids de masses d’acier : les aimants attirent le couvercle et chassent l’excédent de résine. La petite machine n’a qu’un rotor ; deux rotors face à face, avec 24 aimants en tout, sont ceux de la grande machine de 2,4 m des plans.',
      'The rotor is a 230 × 6 mm steel disc cast in resin with its eight magnets: the steel carries the field from one magnet to the next. It is bolted to the bell of the bearing hub by four 12 mm threaded rods, and turns in front of the stator face, about 1 mm away. The casting is done in a mould, under steel weights: the magnets pull the lid down and squeeze out the excess resin. The small machine has a single rotor; two rotors facing each other, with 24 magnets in all, belong to the large 2.4 m machine of the plans.',
    ),
    material: l(
      'Acier (pas d’aluminium ni d’inox), résine polyester, fibre de verre',
      'Steel (not aluminium or stainless), polyester resin, fibreglass',
    ),
    specs: [
      sp('Disque d’acier', 'Steel disc', '230 mm × 6 mm'),
      sp(
        'Fixation sur la cloche',
        'Fixing on the bell',
        l('4 tiges de 12 mm sur un cercle de 100 mm', '4 rods of 12 mm on a 100 mm circle'),
      ),
      sp('Diamètre de la coulée', 'Casting diameter', '240 mm'),
      sp('Aimants', 'Magnets', l('8, pôles alternés', '8, alternating poles')),
      sp(
        'Grande machine (2,4 m)',
        'Large machine (2.4 m)',
        l('2 rotors de 12 aimants (plans)', '2 rotors of 12 magnets (plans)'),
      ),
      sp('Vitesse à 10 m/s', 'Speed at 10 m/s', tf('model', '≈ {rpm10} tr/min', '≈ {rpm10} rpm')),
    ],
    maintenance: maint(
      {
        failure:
          'La résine se fissure ou s’écaille : l’eau atteint les aimants, qui rouillent, et l’acier du disque. Les écrous des tiges se desserrent et le disque prend du jeu sur la cloche, ou frotte le stator si l’entrefer a bougé.',
        check:
          'Machine descendue, regardez la résine à la lampe (fissures, éclats, bords de l’acier sans résine), puis faites tourner le rotor : le disque ne doit pas « voiler » (osciller de côté) en tournant.',
        care: 'Resserrez les écrous au frein-filet, réparez la résine, repeignez l’acier visible ; ne remettez jamais un disque fissuré en service.',
      },
      {
        failure:
          'The resin cracks or chips: water reaches the magnets, which rust, and the steel of the disc. The rod nuts loosen and the disc works loose on the bell, or rubs the stator if the air gap has moved.',
        check:
          'With the machine lowered, inspect the resin with a torch (cracks, chips, steel edges with no resin), then turn the rotor: the disc must not “wobble” (sway sideways) as it turns.',
        care: 'Retighten the nuts with thread-lock, repair the resin, repaint exposed steel; never put a cracked disc back into service.',
      },
    ),
    tip: l(
      'Acier, pas d’aluminium ni d’inox : seul l’acier canalise le champ des aimants, et un acier galvanisé est préférable, dit le wiki. Ne laissez jamais le disque se plaquer sur de l’acier à la main : il colle avec une force qui écrase les doigts.',
      'Steel, not aluminium or stainless: only steel carries the magnets’ field, and galvanised steel is preferable, says the wiki. Never let the disc snap onto steel by hand: it sticks with a force that crushes fingers.',
    ),
    video: ['02:19', '02:25'],
    design: l(
      'L’acier épais du disque sert de culasse : il referme le champ des aimants. Les aimants sont noyés dans la résine pour être tenus et protégés de la corrosion. Le disque tourne avec la cloche du moyeu : il n’y a ni balais ni contact, seulement un champ qui traverse l’entrefer.',
      'The disc’s thick steel acts as a yoke: it closes the magnets’ field. The magnets are embedded in resin to be held and protected from corrosion. The disc turns with the hub bell: there are no brushes and no contact, only a field that crosses the air gap.',
    ),
    qty: 1,
  },
  {
    id: 'magnets',
    scene: 'alternator',
    category: 'electrical',
    name: l('Aimants néodyme', 'Neodymium magnets'),
    short: l(
      'Huit aimants, pôles alternés : très puissants et fragiles.',
      'Eight magnets, alternating poles: very strong and brittle.',
    ),
    description: l(
      'Le rotor porte huit aimants néodyme de 46 × 30 × 10 mm, collés à une position précise par un gabarit, un pôle nord puis un pôle sud, en alternance : c’est cette alternance qui crée un courant alternatif. Ils sont très puissants et fragiles : ils se plaquent l’un à l’autre ou sur l’acier avec une grande force. Gardez-les loin des cartes magnétiques, des montres et, de manière générale, de tout stimulateur cardiaque. La grande machine des plans, celle de 2,4 m, en compte 24, douze sur chacun de ses deux rotors.',
      'The rotor carries eight neodymium magnets of 46 × 30 × 10 mm, glued in a precise position with a jig, one north pole then one south pole, in alternation: it is this alternation that makes alternating current. They are very strong and brittle: they snap onto each other or onto steel with great force. Keep them away from magnetic cards, watches and, in general, any pacemaker. The plans’ large machine, the 2.4 m one, has 24, twelve on each of its two rotors.',
    ),
    material: l('Néodyme-fer-bore (NdFeB), qualité N40', 'Neodymium-iron-boron (NdFeB), grade N40'),
    specs: [
      sp('Dimensions', 'Dimensions', '46 × 30 × 10 mm'),
      sp('Nombre', 'Number', '8'),
      sp('Qualité', 'Grade', l('N40 (wiki)', 'N40 (wiki)')),
      sp('Disposition', 'Layout', l('pôles alternés N, S, N, S…', 'alternating poles N, S, N, S…')),
      sp('Rapport aimants / bobines', 'Magnets to coils', '4 : 3'),
      sp('Grande machine (2,4 m)', 'Large machine (2.4 m)', l('24 aimants (plans)', '24 magnets (plans)')),
    ],
    maintenance: maint(
      {
        failure:
          'Un aimant qui s’écaille, qui se décolle ou qui rouille après une fissure de la résine ; un aimant posé à l’envers qui annule son voisin.',
        check:
          'Pour contrôler la polarité, tenez un aimant au-dessus de celui qui vient d’être posé : il doit être repoussé ; vérifiez ensuite tout le cercle avec un aimant dans le poing : on doit sentir alternativement attraction et répulsion (plans).',
        care: 'Rangez les aimants sur une étagère jusqu’au montage, retirez cartes et montres de vos poches, et coulez-les sans attendre dans la résine qui les protège.',
      },
      {
        failure:
          'A magnet that chips, comes loose or rusts after a crack in the resin; a magnet laid upside down that cancels its neighbour.',
        check:
          'To check polarity, hold a magnet above the one just laid: it must be repelled; then check the whole circle with a magnet in your fist: you must feel attraction and repulsion in turn (plans).',
        care: 'Store the magnets on a shelf until fitting, take cards and watches out of your pockets, and cast them in the protecting resin without delay.',
      },
    ),
    tip: l(
      'Tenez chaque aimant à deux mains et faites-le glisser sur le côté : le plus grand risque est le doigt pincé entre deux aimants, disent les plans.',
      'Hold each magnet in both hands and slide it sideways: the biggest risk is a finger pinched between two magnets, say the plans.',
    ),
    video: ['02:25', '02:35'],
    design: l(
      'Huit aimants face à six bobines, un rapport de 4 pour 3 : c’est ce rapport qui donne trois phases décalées et un couple régulier, sans vibration. Les aimants de 46 × 30 mm donnent aussi la taille du trou des bobines.',
      'Eight magnets against six coils, a ratio of 4 to 3: this ratio gives three staggered phases and a smooth torque, without vibration. The 46 × 30 mm magnets also set the size of the coils’ hole.',
    ),
    qty: 8,
  },
  {
    id: 'stator',
    scene: 'alternator',
    category: 'electrical',
    name: l('Stator coulé en résine', 'Resin-cast stator'),
    short: l(
      'Les six bobines noyées dans la résine, avec leurs trois tiges : la partie fixe de l’alternateur.',
      'The six coils embedded in resin, with their three rods: the fixed part of the alternator.',
    ),
    description: lf(
      'Le stator est un disque de résine polyester armé de fibre de verre et de talc, de 264 mm de diamètre, qui noie les six bobines et le bout fendu de trois tiges de 12 mm. Il se visse sur le berceau de la nacelle par ces tiges : il reste donc fixe, avec le cadre. Il ne contient pas de fer : pas de point dur au démarrage, mais pas de culasse non plus (le champ se referme dans le disque d’acier du rotor). Le talc aide à évacuer la chaleur du cuivre : le modèle trouve ≈ {copper12} W de pertes dans le cuivre à 12 m/s. Variante des plans de 2003 : le stator y est moulé directement sur un arbre creux.',
      'The stator is a disc of polyester resin reinforced with fibreglass and talc, 264 mm across, which embeds the six coils and the slotted ends of three 12 mm rods. It is screwed onto the nacelle’s cradle by those rods: it therefore stays fixed, with the frame. It contains no iron: no sticking point at start-up, but no yoke either (the field closes in the rotor’s steel disc). The talc helps carry off the copper’s heat: the model finds ≈ {copper12} W of copper loss at 12 m/s. Variant of the 2003 plans: there, the stator is cast directly onto a hollow shaft.',
    ),
    material: l(
      'Résine polyester, fibre de verre, talc, cuivre émaillé',
      'Polyester resin, fibreglass, talc, enamelled copper',
    ),
    specs: [
      sp('Diamètre', 'Diameter', '264 mm'),
      sp('Bobines', 'Coils', '6'),
      sp(
        'Fixation',
        'Fixing',
        l(
          '3 tiges de 12 mm noyées, vissées sur le berceau (wiki)',
          '3 rods of 12 mm embedded, screwed onto the cradle (wiki)',
        ),
      ),
      sp(
        'Câble de sortie',
        'Output cable',
        l('3 conducteurs souples de 2,5 mm², 60 cm (wiki)', '3 flexible cores of 2.5 mm², 60 cm (wiki)'),
      ),
      sp('Moule', 'Mould', l('contreplaqué de 10 mm en quatre pièces (wiki)', '10 mm plywood in four pieces (wiki)')),
      sp('Pertes dans le cuivre à 12 m/s', 'Copper loss at 12 m/s', tf('model', '≈ {copper12} W', '≈ {copper12} W')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure laisse entrer l’eau : le cuivre se corrode. Une surchauffe prolongée (plus de 20 A dans le modèle) brûle le vernis des fils, et le stator frotte si l’entrefer a bougé.',
        check:
          'Regardez la résine à la lampe et sentez l’odeur au sortir d’un fort coup de vent : une odeur de brûlé est un avertissement. Les marques de frottement sur les aimants montrent un entrefer trop petit.',
        care: 'Réparez les fissures à la résine, gardez le stator propre et ne remettez en service qu’après un essai à un tour par seconde.',
      },
      {
        failure:
          'A crack lets water in: the copper corrodes. A long overheating (above 20 A in the model) burns the wire varnish, and the stator rubs if the air gap has moved.',
        check:
          'Look at the resin with a torch and smell it after a strong gust: a burnt smell is a warning. Rub marks on the magnets show an air gap that is too small.',
        care: 'Repair cracks with resin, keep the stator clean and only put it back into service after a test at one turn per second.',
      },
    ),
    tip: l(
      'Vissez les trois tiges sur le berceau et réglez bien leur parallélisme avant de couler : c’est d’elles que dépendra l’entrefer (wiki). Portez un masque : les vapeurs de styrène sont toxiques.',
      'Screw the three rods onto the cradle and set their parallelism carefully before casting: the air gap will depend on them (wiki). Wear a mask: styrene fumes are toxic.',
    ),
    video: ['02:44', '02:51'],
    design: l(
      'Noyer les bobines dans la résine les tient, les protège de l’humidité et évacue leur chaleur grâce au talc. Le stator n’a pas de fer : c’est un choix qui coûte un peu de puissance, mais qui supprime tout couple d’accrochage.',
      'Embedding the coils in resin holds them, protects them from damp and carries off their heat thanks to the talc. The stator has no iron: a choice that costs a little power, but removes all cogging torque.',
    ),
    qty: 1,
  },
  {
    id: 'coils',
    scene: 'alternator',
    category: 'electrical',
    name: l('Bobines', 'Coils'),
    short: l(
      'Six bobines de 76 spires de fil de cuivre émaillé de 1,4 mm.',
      'Six coils of 76 turns of 1.4 mm enamelled copper wire.',
    ),
    description: lf(
      'Les six bobines sont enroulées sur un gabarit dont l’ouverture, 46 × 30 mm, est celle des aimants : chaque bobine entoure le flux d’un aimant à la fois. Le nombre de spires fixe la tension : la vidéo choisit 76 spires pour du 12 V, et dit que pour plus de tension il faudrait plus de tours. Un fil plus fin et plus de tours donnent plus de volts à basse vitesse mais retiennent davantage le rotor : dans le modèle, un stator de 30 spires ferait ≈ {turn30W12} W à 12 m/s si la queue ne se repliait pas, mais ne chargerait qu’à partir de {turn30Cut} m/s.',
      'The six coils are wound on a former whose opening, 46 × 30 mm, is that of the magnets: each coil surrounds the flux of one magnet at a time. The number of turns sets the voltage: the video picks 76 turns for 12 V, and says that more voltage would need more turns. A thinner wire and more turns give more volts at low speed but hold the rotor back harder: in the model, a 30-turn stator would make ≈ {turn30W12} W at 12 m/s if the tail did not fold, but would only charge from {turn30Cut} m/s.',
    ),
    material: l('Fil de cuivre émaillé de 1,4 mm, ruban isolant', '1.4 mm enamelled copper wire, insulating tape'),
    specs: [
      sp('Bobines', 'Coils', '6'),
      sp('Spires par bobine', 'Turns per coil', '76'),
      sp('Fil', 'Wire', l('cuivre émaillé de 1,4 mm', '1.4 mm enamelled copper')),
      sp('Cuivre au total', 'Copper in all', l('≈ 1,5 kg (wiki)', '≈ 1.5 kg (wiki)')),
      sp('Gabarit', 'Former', l('ouverture 46 × 30 mm, épaisseur 11 mm', 'opening 46 × 30 mm, 11 mm thick')),
      sp(
        'Résistance d’une phase',
        'Resistance of one phase',
        tf('derived', '≈ {rph} Ω (deux bobines en série)', '≈ {rph} Ω (two coils in series)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un vernis qui chauffe et se fendille, un fil qui casse à la sortie de la bobine, deux bobines enroulées dans des sens opposés qui s’annulent.',
        check:
          'Avant la coulée, mesurez la résistance de chaque phase : les trois doivent être égales. Après, un essai à un tour par seconde doit donner ≈ 1,9 V (wiki).',
        care: 'Laissez 30 cm de fil de chaque côté de la bobine, maintenez-la par du ruban avant de la retirer du gabarit et n’abîmez jamais l’émail.',
      },
      {
        failure:
          'A varnish that overheats and crazes, a wire that breaks at the coil outlet, two coils wound in opposite directions that cancel.',
        check:
          'Before casting, measure the resistance of each phase: all three must be equal. After, a test at one turn per second must give ≈ 1.9 V (wiki).',
        care: 'Leave 30 cm of wire on each side of the coil, hold it with tape before taking it off the former and never scratch the enamel.',
      },
    ),
    tip: l(
      'Tous les tours doivent tourner dans le même sens, de la première à la dernière bobine : une seule bobine à l’envers fait chuter la tension.',
      'All turns must run in the same direction, from the first coil to the last: a single coil the wrong way round makes the voltage drop.',
    ),
    video: ['02:51', '03:08', '03:15'],
    design: lf(
      'Soixante-seize spires, c’est le compromis de la vidéo : une charge qui commence dès {cutIn} m/s environ dans le modèle, mais un rotor retenu en décrochage. Le choix de la bobine est celui de l’alternateur : plus de spires, charge plus tôt ; moins de spires, plus de puissance dans un vent fort (modèle, à ne pas lire comme un conseil).',
      'Seventy-six turns is the video’s compromise: charging that starts from about {cutIn} m/s in the model, but a rotor held in the stall. The coil is the alternator’s choice: more turns, charging sooner; fewer turns, more power in a strong wind (model, not to be read as advice).',
    ),
    qty: 6,
  },
  {
    id: 'star-wiring',
    scene: 'alternator',
    category: 'electrical',
    name: l('Couplage étoile', 'Star wiring'),
    short: l(
      'Les six bobines reliées en trois phases, trois sorties et un point neutre.',
      'The six coils joined into three phases, three outputs and a neutral point.',
    ),
    description: lf(
      'Les six bobines sont numérotées de 1 à 6, tous les tours dans le même sens. Les entrées 1, 2 et 3 sont réunies : c’est le point neutre de l’étoile. La sortie 1 se relie à l’entrée 4, la 2 à la 5 et la 3 à la 6, et les sorties 4, 5 et 6 deviennent les trois phases. Chaque phase compte donc deux bobines en série, et le courant qui en sort alterne à {hz60} Hz (dérivé) à un tour par seconde (fréquence = tours par minute × nombre de pôles / 120).',
      'The six coils are numbered 1 to 6, every turn in the same direction. Inputs 1, 2 and 3 are joined: this is the star’s neutral point. Output 1 connects to input 4, 2 to 5 and 3 to 6, and outputs 4, 5 and 6 become the three phases. Each phase thus has two coils in series, and the current it gives alternates at {hz60} Hz (derived) at one turn per second (frequency = revolutions per minute × number of poles / 120).',
    ),
    material: l('Soudures étain, gaine thermorétractable', 'Tin solder, heat-shrink sleeving'),
    specs: [
      sp('Couplage', 'Wiring', l('étoile, deux bobines en série par phase', 'star, two coils in series per phase')),
      sp('Phases', 'Phases', '3'),
      sp('Écart entre bobines', 'Coil spacing', '60°'),
      sp('Fréquence à 1 tour par seconde', 'Frequency at 1 turn per second', tf('derived', '{hz60} Hz', '{hz60} Hz')),
      sp(
        'Tension à 1 tour par seconde',
        'Voltage at 1 turn per second',
        l('≈ 1,9 V entre phases (wiki)', '≈ 1.9 V between phases (wiki)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une soudure froide ou un émail mal gratté qui donne un mauvais contact, deux soudures qui se touchent, une bobine à l’envers.',
        check:
          'Avant coulée, essayez en tournant les aimants à la main : les trois paires de fils doivent donner la même tension alternative. Après, vérifiez que chaque fil de sortie est bien isolé des autres.',
        care: 'Grattez 3 cm d’émail, torsadez, soudez, protégez par une gaine, et isolez soigneusement les trois fils pour qu’ils ne se touchent pas (wiki).',
      },
      {
        failure:
          'A cold solder joint or badly stripped enamel that gives a poor contact, two joints that touch, a coil the wrong way round.',
        check:
          'Before casting, try it by turning the magnets by hand: the three pairs of wires must give the same AC voltage. After, check that each output wire is well insulated from the others.',
        care: 'Strip 3 cm of enamel, twist, solder, protect with sleeving, and insulate the three wires carefully so that they cannot touch (wiki).',
      },
    ),
    tip: l(
      'Numérotez les bobines avant de les poser, et gardez le schéma à portée de main : un fil mal relié se voit mal une fois la résine coulée.',
      'Number the coils before laying them, and keep the diagram at hand: a wrongly connected wire is hard to see once the resin is cast.',
    ),
    design: l(
      'Trois phases décalées donnent un couple lissé : l’alternateur ne vibre pas, comme il le ferait en monophasé, disent les plans. Le redresseur transforme ensuite ces trois phases en courant continu.',
      'Three staggered phases give a smoothed torque: the alternator does not vibrate, as it would in single phase, say the plans. The rectifier then turns the three phases into direct current.',
    ),
    qty: 1,
  },
  {
    id: 'shaft',
    scene: 'alternator',
    category: 'mechanical',
    name: l('Fusée et berceau', 'Stub axle and cradle'),
    short: l(
      'La fusée du moyeu, vissée sur le berceau de la nacelle : la partie fixe sur laquelle tout tourne.',
      'The hub’s stub axle, screwed onto the nacelle’s cradle: the fixed part on which everything turns.',
    ),
    description: l(
      'La fusée est la partie fixe d’un moyeu de voiture, séparée de la cloche qui tourne : elle ne tourne jamais. Elle est vissée sur le berceau, un disque d’acier de 140 × 8 mm percé de trous de 12 mm, soudé au bout du cadre de la nacelle. Le moyeu à roulements tourne sur elle, et le stator se visse sur le même berceau. Le berceau sert aussi de gabarit pour couler le stator. Variante des plans de 2003 : un arbre creux d’acier de 1 pouce (25,4 mm), sur lequel le stator est moulé.',
      'The stub axle is the fixed part of a car hub, separated from the rotating bell: it never turns. It is screwed onto the cradle, a 140 × 8 mm steel disc drilled with 12 mm holes, welded to the end of the nacelle frame. The bearing hub turns on it, and the stator is screwed onto the same cradle. The cradle also serves as a jig for casting the stator. Variant of the 2003 plans: a 1 in (25.4 mm) hollow steel shaft, onto which the stator is cast.',
    ),
    material: l('Acier : fusée de moyeu, berceau soudé', 'Steel: hub stub axle, welded cradle'),
    specs: [
      sp(
        'Fusée',
        'Stub axle',
        l(
          'la partie fixe d’un moyeu de voiture, avec ses écrous et ses roulements (wiki)',
          'the fixed part of a car hub, with its nuts and bearings (wiki)',
        ),
      ),
      sp(
        'Berceau',
        'Cradle',
        l('disque d’acier de 140 × 8 mm, trous de 12 mm (wiki)', '140 × 8 mm steel disc, 12 mm holes (wiki)'),
      ),
      sp(
        'Fixation',
        'Fixing',
        l(
          'fusée vissée sur le berceau, berceau soudé au cadre (wiki)',
          'stub axle screwed onto the cradle, cradle welded to the frame (wiki)',
        ),
      ),
      sp(
        'Variante des plans de 2003',
        'Variant of the 2003 plans',
        l('arbre creux Ø 25,4 mm, 300 mm (plans)', 'hollow shaft 25.4 mm across, 300 mm long (plans)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Des vis de fusée qui se desserrent, un cordon du berceau qui se fissure sous les vibrations : le moyeu prend du jeu et le rotor frotte le stator.',
        check:
          'Machine descendue, secouez le moyeu : aucun jeu entre la fusée et le berceau ; regardez les cordons à la lampe.',
        care: 'Resserrez les vis au frein-filet et reprenez toute soudure suspecte à chaque descente.',
      },
      {
        failure:
          'Stub-axle screws that loosen, a cradle weld that cracks under vibration: the hub works loose and the rotor rubs the stator.',
        check:
          'With the machine lowered, shake the hub: no play between the stub axle and the cradle; inspect the welds with a torch.',
        care: 'Retighten the screws with thread-lock and redo any suspect weld at every lowering.',
      },
    ),
    tip: l(
      'Soudez le berceau par étapes, en alternant les côtés : la chaleur le déforme et le gauchit (wiki), et le stator ne serait plus parallèle au rotor.',
      'Weld the cradle in stages, alternating sides: the heat distorts it (wiki), and the stator would no longer be parallel to the rotor.',
    ),
    video: ['04:14', '04:18'],
    design: l(
      'Une fusée fixe fait tourner le moyeu sur des roulements tout faits, et laisse tout ce qui est électrique, stator et câble, immobile : pas de contact glissant. Ce qui tourne tourne autour d’elle.',
      'A fixed stub axle lets the hub turn on ready-made bearings, and keeps everything electrical, stator and cable, still: no sliding contact. What turns, turns around it.',
    ),
    qty: 1,
  },
  {
    id: 'bearing-hub',
    scene: 'alternator',
    category: 'mechanical',
    name: l('Moyeu à roulements', 'Bearing hub'),
    short: l(
      'Moyeu de voiture récupéré : sa cloche tourne sur la fusée et porte le rotor et les pales.',
      'A salvaged car hub: its bell turns on the stub axle and carries the rotor and the blades.',
    ),
    description: l(
      'Le moyeu est un moyeu de roue arrière de voiture (Golf, Corsa, Polo, Ibiza, dit le wiki), récupéré pour ses roulements : sa cloche tourne sur eux, sur la fusée fixe. On la meule jusqu’à sa plaque plate pour que le disque à aimants s’y appuie bien. Quatre longues tiges filetées de 12 mm et de 140 mm, avec seize écrous, fixent ce disque à la cloche, puis reçoivent le rotor des pales : le labo les dessine avec le moyeu. Les roulements se règlent en serrant leur écrou, puis en le desserrant d’un quart de tour.',
      'The hub is a car rear hub (Golf, Corsa, Polo, Ibiza, says the wiki), salvaged for its bearings: its bell turns on them, on the fixed stub axle. It is ground down to its flat plate so that the magnet disc seats well on it. Four long 12 mm threaded rods 140 mm long, with sixteen nuts, fix that disc to the bell, then take the blade rotor: the lab draws them with the hub. The bearings are adjusted by tightening their nut, then loosening it a quarter turn.',
    ),
    material: l('Acier, roulements à rouleaux graissés', 'Steel, greased roller bearings'),
    specs: [
      sp(
        'Cloche',
        'Bell',
        l(
          'meulée jusqu’à sa plaque plate, avec ses plots d’appui (wiki)',
          'ground down to its flat plate, with its bearing pads (wiki)',
        ),
      ),
      sp(
        'Tiges du rotor et des pales',
        'Rotor and blade rods',
        l('4 tiges de 12 mm × 140 mm, 16 écrous (wiki)', '4 rods of 12 mm × 140 mm, 16 nuts (wiki)'),
      ),
      sp(
        'Cercle des trous',
        'Hole circle',
        l('100 mm, comme les trous du disque (wiki)', '100 mm, like the disc’s holes (wiki)'),
      ),
      sp(
        'Réglage des roulements',
        'Bearing adjustment',
        l(
          'serrer l’écrou, puis le desserrer d’un quart de tour (wiki)',
          'tighten the nut, then loosen it a quarter turn (wiki)',
        ),
      ),
      sp('Frottement du modèle', 'Model friction', tf('assumed', '0,05 N·m', '0.05 N·m')),
    ],
    maintenance: maint(
      {
        failure:
          'Un roulement usé ou mal graissé : jeu, bruit, démarrage difficile. Tripalium a eu une génératrice qui démarrait mal à cause de la qualité de la graisse, et une machine descendue pour rattraper le jeu du moyeu.',
        check:
          'Machine arrêtée, faites tourner le rotor à la main : il doit tourner librement ; secouez-le dans le sens axial et radial : aucun jeu, aucun grincement. Les écrous des tiges ne doivent pas avoir bougé.',
        care: 'Nettoyez, vérifiez et regraissez légèrement les roulements, puis réglez-les au quart de tour ; resserrez les écrous des tiges au frein-filet.',
      },
      {
        failure:
          'A worn or poorly greased bearing: play, noise, hard starting. Tripalium had a generator that started badly because of the grease quality, and a machine lowered to take up hub play.',
        check:
          'With the machine stopped, turn the rotor by hand: it must turn freely; shake it axially and radially: no play, no grinding. The rod nuts must not have moved.',
        care: 'Clean, check and lightly regrease the bearings, then adjust them to the quarter turn; retighten the rod nuts with thread-lock.',
      },
    ),
    tip: l(
      'Jetez le joint d’étanchéité arrière du moyeu : il fait trop de frottement et n’est pas nécessaire, disent les plans.',
      'Throw away the hub’s rear seal: it causes too much friction and is not needed, say the plans.',
    ),
    video: ['04:03'],
    design: l(
      'Un moyeu de voiture est un roulement tout fait, bon marché, conçu pour porter une roue : il suffit de lui donner un autre disque. Dans le modèle, le frottement est petit (une hypothèse) : à bas régime il ne retient presque rien.',
      'A car hub is a ready-made, cheap bearing designed to carry a wheel: it only needs a different disc. In the model the friction is small (an assumption): at low speed it holds back almost nothing.',
    ),
    qty: 1,
  },
  {
    id: 'studs',
    scene: 'alternator',
    category: 'mechanical',
    name: l('Tiges du stator', 'Stator rods'),
    short: l(
      'Trois tiges de 12 mm noyées dans le stator : leurs écrous le tiennent et règlent l’entrefer.',
      'Three 12 mm rods embedded in the stator: their nuts hold it and set the air gap.',
    ),
    description: l(
      'Trois tiges filetées de 12 mm et de 70 mm, fendues en croix sur 10 mm à un bout, tiennent le stator sur le berceau. Elles sont vissées sur le berceau, bien parallèles, pendant la coulée : leur bout fendu reste noyé dans la résine, et la vidéo les montre à ce moment. Ensuite, le stator se visse sur le berceau et leurs écrous le font avancer ou reculer : c’est avec eux qu’on règle l’entrefer, à environ 1 mm. Les quatre longues tiges du rotor sont dessinées avec le moyeu.',
      'Three 12 mm threaded rods 70 mm long, slotted in a cross over 10 mm at one end, hold the stator on the cradle. They are screwed onto the cradle, well parallel, during the casting: their slotted end stays embedded in the resin, and the video shows them at that moment. Then the stator is screwed onto the cradle and their nuts move it forward or back: that is how the air gap is set, at about 1 mm. The four long rotor rods are drawn with the hub.',
    ),
    material: l('Acier, tige filetée de 12 mm, écrous', '12 mm threaded steel rod, nuts'),
    specs: [
      sp('Tiges', 'Rods', l('3 tiges de 12 mm × 70 mm (wiki)', '3 rods of 12 mm × 70 mm (wiki)')),
      sp(
        'Bout noyé dans la résine',
        'End embedded in the resin',
        l('fendu en croix sur 10 mm (wiki)', 'slotted in a cross over 10 mm (wiki)'),
      ),
      sp('Entrefer', 'Air gap', l('réglé aux écrous du stator (wiki)', 'set at the stator nuts (wiki)')),
      sp('Serrage', 'Tightening', l('frein-filet sur les écrous (plans)', 'thread-lock on the nuts (plans)')),
    ],
    maintenance: maint(
      {
        failure:
          'Un écrou qui se desserre sous les vibrations : le stator prend du jeu, l’entrefer varie, le rotor frotte.',
        check:
          'Machine descendue, regardez si les écrous ont bougé (traits de peinture) et faites tourner le rotor en observant l’espace entre les aimants et le stator.',
        care: 'Resserrez les écrous au frein-filet et remplacez ceux dont le filet est abîmé.',
      },
      {
        failure: 'A nut that loosens under vibration: the stator works loose, the air gap varies, the rotor rubs.',
        check:
          'With the machine lowered, see whether the nuts have moved (paint marks) and turn the rotor while watching the gap between the magnets and the stator.',
        care: 'Retighten the nuts with thread-lock and replace any whose thread is damaged.',
      },
    ),
    tip: l(
      'Serrez les trois écrous ensemble, par petits tours, pour que le stator reste parallèle au disque à aimants.',
      'Tighten the three nuts together, in small turns, so that the stator stays parallel to the magnet disc.',
    ),
    video: ['03:59'],
    design: l(
      'Trois tiges noyées dans la résine tiennent le stator comme un trépied, et leurs écrous règlent la distance aux aimants sans usinage : c’est ce qui permet à un atelier de village de monter un alternateur précis.',
      'Three rods embedded in the resin hold the stator like a tripod, and their nuts set the distance to the magnets without machining: that is what lets a village workshop assemble an accurate alternator.',
    ),
    qty: 3,
  },
  {
    id: 'air-gap',
    scene: 'alternator',
    category: 'electrical',
    name: l('Entrefer', 'Air gap'),
    short: l(
      'L’espace d’environ 1 mm entre les aimants et le stator : celui qui règle la tension.',
      'The gap of about 1 mm between the magnets and the stator: the one that sets the voltage.',
    ),
    description: lf(
      'L’entrefer est l’espace libre entre les aimants et la face du stator : environ 1 mm sur cette machine, d’après le wiki, réglé avec les écrous du stator. Plus il est petit, plus le champ traverse les bobines et plus la tension monte ; mais il faut laisser de la marge pour les imprévus et pour l’usure du roulement, car la fiabilité passe avant la performance, disent les plans. Un test à un tour par seconde doit donner ≈ {benchVolts} V : sinon, contrôlez l’entrefer.',
      'The air gap is the free space between the magnets and the stator face: about 1 mm on this machine, says the wiki, set with the stator nuts. The smaller it is, the more field crosses the coils and the higher the voltage; but margin must be left for mishaps and for bearing wear, because reliability comes before performance, say the plans. A test at one turn per second must give ≈ {benchVolts} V: if not, check the air gap.',
    ),
    material: l('Aucune : c’est un espace (dessiné comme une jauge)', 'None: it is a space (drawn as a gauge)'),
    specs: [
      sp('Petite machine', 'Small machine', l('≈ 1 mm (wiki)', '≈ 1 mm (wiki)')),
      sp(
        'Grande machine (2,4 m)',
        'Large machine (2.4 m)',
        l('≈ 3 mm de chaque côté du stator (plans)', '≈ 3 mm on each side of the stator (plans)'),
      ),
      sp(
        'Réglage',
        'Adjustment',
        l('écrous des trois tiges du stator (wiki)', 'nuts of the stator’s three rods (wiki)'),
      ),
      sp(
        'Test de contrôle',
        'Check test',
        l('≈ 1,9 V entre phases à 1 tour par seconde (wiki)', '≈ 1.9 V between phases at 1 turn per second (wiki)'),
      ),
      sp(
        'Dans le modèle',
        'In the model',
        tf(
          'derived',
          'compris dans la constante de tension ≈ {kePerRpm} V par tr/min',
          'included in the voltage constant ≈ {kePerRpm} V per rpm',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un entrefer qui varie (écrous du stator desserrés, roulement usé) : tension plus faible, ou aimants qui frottent le stator et cassent la résine.',
        check:
          'Machine arrêtée, tournez le rotor à la main : aucun frottement, et un espace régulier tout le tour. Contrôlez la tension à un tour par seconde.',
        care: 'Réglez-le à froid, serrez les écrous au frein-filet, puis recontrôlez après quelques semaines.',
      },
      {
        failure:
          'An air gap that varies (loose stator nuts, worn bearing): lower voltage, or magnets that rub the stator and break the resin.',
        check:
          'With the machine stopped, turn the rotor by hand: no rubbing, and an even gap all round. Check the voltage at one turn per second.',
        care: 'Set it cold, tighten the nuts with thread-lock, then re-check after a few weeks.',
      },
    ),
    tip: l(
      'Rapprocher les aimants améliore le champ, mais laissez de la marge : un entrefer trop juste fait frotter les aimants au premier coup de roulement.',
      'Bringing the magnets closer improves the field, but leave a margin: a gap that is too tight makes the magnets rub at the first bearing play.',
    ),
    design: l(
      'Un entrefer de l’ordre du millimètre est un compromis : plus étroit, plus de tension ; plus large, plus de tolérance de montage. Sans fer dans le stator, le champ traverse de l’air sur toute l’épaisseur des bobines.',
      'An air gap of around a millimetre is a compromise: narrower, more voltage; wider, more assembly tolerance. With no iron in the stator, the field crosses air over the whole thickness of the coils.',
    ),
  },
  {
    id: 'moulds',
    scene: 'alternator',
    category: 'structure',
    name: l('Moules (rotor, stator)', 'Moulds (rotor, stator)'),
    short: l(
      'Moules en contreplaqué où l’on coule le stator et le disque à aimants en résine.',
      'Plywood moulds in which the stator and the magnet disc are cast in resin.',
    ),
    description: l(
      'Les moules sont des outils d’atelier : l’un pour le stator, l’autre pour le rotor, qui reçoivent la résine, la fibre de verre et le talc. Celui du stator, en contreplaqué de 10 mm, a quatre pièces (base, bordure, îlot central, couvercle) et trois pions d’alignement ; celui du rotor, en contreplaqué de 16 mm, a un couvercle percé pour laisser passer les écrous. Cirez-les avant chaque coulée. La résine dégage des vapeurs de styrène toxiques : portez un masque, gants et lunettes, et ventilez.',
      'The moulds are workshop tools: one for the stator, one for the rotor, which receive the resin, the fibreglass and the talc. The stator mould, in 10 mm plywood, has four pieces (base, border, central island, lid) and three alignment pins; the rotor mould, in 16 mm plywood, has a lid with holes to let the nuts pass. Wax them before each casting. The resin gives off toxic styrene fumes: wear a mask, gloves and goggles, and ventilate.',
    ),
    material: l('Contreplaqué de 10 et 16 mm, cire de démoulage', '10 and 16 mm plywood, release wax'),
    specs: [
      sp(
        'Moule du stator',
        'Stator mould',
        l('contreplaqué de 10 mm, quatre pièces, trois pions (wiki)', '10 mm plywood, four pieces, three pins (wiki)'),
      ),
      sp(
        'Moule du rotor',
        'Rotor mould',
        l(
          'contreplaqué de 16 mm (base et bordure), couvercle plus fin (wiki)',
          '16 mm plywood (base and border), thinner lid (wiki)',
        ),
      ),
      sp('Démoulage', 'Release', l('cire, éventuellement un agent PVA (plans)', 'wax, possibly a PVA agent (plans)')),
      sp(
        'Résine',
        'Resin',
        l('polyester de coulée, avec fibre de verre et talc', 'polyester casting resin, with fibreglass and talc'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une coulée qui colle au moule, des bulles d’air, une fuite de résine sous le moule : la pièce est perdue. Le catalyseur de la résine est dangereux : mal dosé, il fait surchauffer la résine ; mélangé directement au cobalt, il explose (plans).',
        check:
          'Faites une répétition à blanc avant de mélanger la résine : tout doit se poser sans forcer, et le moule doit être de niveau.',
        care: 'Polissez et cirez le moule plusieurs fois avant la première coulée, suivez le conseil de votre fournisseur de résine, et rangez le catalyseur à l’obscurité et au frais.',
      },
      {
        failure:
          'A casting that sticks to the mould, air bubbles, resin leaking under the mould: the piece is lost. The resin’s catalyst is hazardous: wrongly dosed it makes the resin overheat; mixed directly with the cobalt it explodes (plans).',
        check:
          'Do a dry run before mixing the resin: everything must go in without forcing, and the mould must be level.',
        care: 'Polish and wax the mould several times before the first casting, follow your resin supplier’s advice, and store the catalyst in the dark and cool.',
      },
    ),
    tip: l(
      'Le moule est le plus important de l’atelier : prenez le temps de le faire droit et propre. Une coulée n’a pas de seconde chance.',
      'The mould is the most important thing in the workshop: take the time to make it straight and clean. A casting gets no second chance.',
    ),
    video: ['04:44', '04:56', '05:02'],
    design: l(
      'Couler en résine permet de fabriquer, sans machine-outil, des pièces précises : le moule fixe la forme, la résine tient les aimants et les bobines à leur place, protégés de l’eau.',
      'Casting in resin makes it possible to build accurate parts without a machine tool: the mould fixes the shape, the resin holds the magnets and coils in place, protected from water.',
    ),
  },
];
