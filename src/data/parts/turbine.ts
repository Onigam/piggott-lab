// Parts of the `turbine` world (ids frozen in src/part-ids.ts): the machine on top of the mast. `rotor` opens the `blades`
// world and `alternator` the `alternator` world: they are short sheets that say what they contain. Conventions: see site.ts.
// The video shows the frame, the tail and the test (03:49–04:33, 06:16–06:41, 07:11); the figures of the frame and of the tail
// come from the Low-tech Lab wiki (the tutorial of the same machine) and from Hugh Piggott's plans (2003, small machine
// pages 43-48). Where the wiki and the plans differ (tail boom 700 or 500 mm, vane about 0.1 m² or 18 × 12 in), both are given.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const TURBINE_PARTS: PartInfo[] = [
  {
    id: 'rotor',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Rotor (pales et moyeu)', 'Rotor (blades and hub)'),
    short: l(
      'Trois pales et leur moyeu en contreplaqué. Détail dans la vue des pales.',
      'Three blades and their plywood hub. Detail in the blades view.',
    ),
    description: lf(
      'Le rotor, ce sont les **trois pales** serrées entre des disques de contreplaqué : il capte le vent et entraîne directement l’alternateur, sans réducteur. Les plans le dessinent pour tourner à environ sept fois la vitesse du vent au bout des pales (la « vitesse spécifique »). Mais l’alternateur le freine : dans le modèle il tourne à ≈ {rpm10} tr/min dans 10 m/s de vent, soit une vitesse spécifique de {lambda10} au lieu de 7, et ses pales décrochent (Cp ≈ {cp10} au lieu de 0,30). Ouvrez la vue des pales pour voir comment elles sont taillées.',
      'The rotor is the **three blades** clamped between plywood discs: it catches the wind and drives the alternator directly, with no gearbox. The plans design it to turn at about seven times the wind speed at the blade tips (the “tip speed ratio”). But the alternator holds it back: in the model it turns at ≈ {rpm10} rpm in a 10 m/s wind, a tip speed ratio of {lambda10} instead of 7, and its blades stall (Cp ≈ {cp10} instead of 0.30). Open the blades view to see how they are shaped.',
    ),
    material: l('Bois tendre (pales), contreplaqué (moyeu)', 'Softwood (blades), plywood (hub)'),
    specs: [
      sp('Diamètre', 'Diameter', '1,20 m'),
      sp('Pales', 'Blades', '3'),
      sp('Surface balayée', 'Swept area', tf('derived', '{area} m²')),
      sp('Vitesse spécifique visée', 'Design tip speed ratio', l('≈ 7 (plans)', '≈ 7 (plans)')),
      sp(
        'Vitesse à 3 m/s, vitesse spécifique 7',
        'Speed at 3 m/s, tip speed ratio 7',
        tf('derived', '{rpm3} tr/min', '{rpm3} rpm'),
      ),
      sp(
        'Vitesse limite en bout de pale',
        'Blade-tip speed limit',
        l('≈ 89 m/s, soit 200 mph (plans)', '≈ 89 m/s, i.e. 200 mph (plans)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un balourd (pales de masses différentes), une pale en avance sur les autres, un écrou desserré sur les goujons : la machine vibre et se fatigue.',
        check:
          'Approchez une chaise du bout d’une pale et faites passer les autres devant : elles doivent suivre la même trace à 10 mm près (plans). Un rotor équilibré ne se met pas toujours dans la même position quand on le lâche.',
        care: 'Équilibrez à l’atelier, à l’abri du vent (plans), serrez les écrous avec du frein-filet et repeignez les pales avant qu’elles ne se fendent.',
      },
      {
        failure:
          'An imbalance (blades of different weights), a blade ahead of the others, a loose nut on the studs: the machine vibrates and tires.',
        check:
          'Put a chair near one blade tip and swing the others past it: they must follow the same track within 10 mm (plans). A balanced rotor does not always settle at the same position when you let go.',
        care: 'Balance in the workshop, out of the wind (plans), tighten the nuts with thread-lock and repaint the blades before they split.',
      },
    ),
    tip: l(
      'Ne faites tourner le rotor qu’une fois équilibré et serré : un morceau de bois de 600 mm qui part à pleine vitesse fait des dégâts.',
      'Only let the rotor turn once it is balanced and tightened: a 600 mm piece of wood leaving at full speed does damage.',
    ),
    video: ['02:17'],
    design: l(
      'Peu de pales étroites tournant vite font le même travail que beaucoup de pales larges tournant lentement, disent les plans : plus de pales démarrent mieux, mais freinent dès que la vitesse monte. Trois est le bon compromis.',
      'A few slender blades turning fast do the same job as many wide ones turning slowly, say the plans: more blades start better, but drag as soon as the speed rises. Three is the sensible compromise.',
    ),
    qty: 1,
  },
  {
    id: 'alternator',
    scene: 'turbine',
    category: 'electrical',
    name: l('Alternateur', 'Alternator'),
    short: l(
      'Disque d’aimants devant des bobines : transforme la rotation en courant. Détail dans la vue de l’alternateur.',
      'Magnet disc facing coils: turns rotation into current. Detail in the alternator view.',
    ),
    description: lf(
      'L’alternateur est à flux axial et à entraînement direct : des **aimants néodyme** sur un disque d’acier tournent devant un **stator** de bobines noyées dans la résine, fixe sur la nacelle. Il n’y a pas de fer dans le stator, donc pas de point dur : la machine démarre dans un vent très faible (plans). À un tour par seconde, il donne environ {benchVolts} V alternatifs entre phases (essai du wiki). Ouvrez la vue de l’alternateur pour voir les aimants, les bobines, la fusée et le moyeu.',
      'The alternator is axial-flux and direct-drive: **neodymium magnets** on a steel disc turn in front of a **stator** of coils cast in resin, fixed on the nacelle. There is no iron in the stator, hence no sticking point: the machine starts in a very light wind (plans). At one turn per second it gives about {benchVolts} V AC between phases (the wiki’s test). Open the alternator view to see the magnets, the coils, the stub axle and the hub.',
    ),
    material: l(
      'Acier, aimants néodyme, cuivre émaillé, résine polyester',
      'Steel, neodymium magnets, enamelled copper, polyester resin',
    ),
    specs: [
      sp('Aimants', 'Magnets', l('8, 46 × 30 × 10 mm', '8, 46 × 30 × 10 mm')),
      sp('Bobines', 'Coils', l('6 × 76 spires de fil de 1,4 mm', '6 × 76 turns of 1.4 mm wire')),
      sp('Couplage', 'Wiring', l('étoile, trois phases', 'star, three phases')),
      sp(
        'Tension à 1 tour par seconde',
        'Voltage at 1 turn per second',
        l('≈ 1,9 V entre phases (wiki)', '≈ 1.9 V between phases (wiki)'),
      ),
      sp('Entrefer', 'Air gap', l('≈ 1 mm (wiki)', '≈ 1 mm (wiki)')),
      sp(
        'Rendement du modèle à 12 m/s',
        'Model efficiency at 12 m/s',
        tf(
          'model',
          '≈ {etaAlt12} % de la puissance mécanique arrive au redresseur',
          '≈ {etaAlt12}% of the mechanical power reaches the rectifier',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un roulement qui s’use, le disque à aimants qui frotte le stator si l’entrefer a bougé, de l’eau qui entre par une fissure de la résine : les aimants rouillent et les bobines se détériorent.',
        check:
          'Machine arrêtée, tournez le rotor à la main : il doit tourner librement et sans frottement. Un essai à un tour par seconde doit redonner ≈ 1,9 V entre phases ; si ce n’est pas le cas, contrôlez l’entrefer (wiki).',
        care: 'Surveillez les coulées de résine (fissures, éclats) et le jeu du moyeu, et regraissez les roulements pendant la descente annuelle.',
      },
      {
        failure:
          'A bearing that wears, the magnet disc rubbing the stator if the air gap has moved, water entering through a crack in the resin: the magnets rust and the coils deteriorate.',
        check:
          'With the machine stopped, turn the rotor by hand: it must turn freely with no rubbing. A test at one turn per second must again give ≈ 1.9 V between phases; if not, check the air gap (wiki).',
        care: 'Watch the resin castings (cracks, chips) and the hub play, and regrease the bearings during the yearly lowering.',
      },
    ),
    tip: l(
      'Quand les aimants sont en place, ne laissez jamais le disque s’approcher de l’acier à la main : il se plaque avec une grande force et écrase les doigts.',
      'Once the magnets are in, never let the disc approach steel by hand: it snaps on with great force and crushes fingers.',
    ),
    video: ['02:17', '02:19', '02:44'],
    design: lf(
      'Pas d’engrenage, pas de fer dans le stator, donc très peu de couple de démarrage : c’est ce qui permet de produire dans un vent faible. En vent plus fort l’alternateur retient les pales, ce qui rend la machine silencieuse et épargne les pales, disent les plans. Le modèle du labo le retrouve : à 10 m/s la machine donne ≈ {w10} W au lieu de ≈ 200 W annoncés (résultat du modèle ; on ne sait pas pour quel vent l’étiquette annonce 200 W).',
      'No gears, no iron in the stator, hence very little starting torque: that is what lets it produce in a light wind. In a stronger wind the alternator holds the blades back, which keeps the machine quiet and spares the blades, say the plans. The lab’s model finds the same: at 10 m/s the machine gives ≈ {w10} W instead of the ≈ 200 W of the label (model result; the wind speed of the 200 W rating is not known).',
    ),
    qty: 1,
  },
  {
    id: 'nacelle-frame',
    scene: 'turbine',
    category: 'structure',
    name: l('Cadre de nacelle', 'Nacelle frame'),
    short: l(
      'Cornière d’acier soudée qui porte le berceau de l’alternateur et les deux pivots.',
      'Welded steel angle that carries the alternator’s cradle and the two pivots.',
    ),
    description: l(
      'La nacelle est la partie en acier qui fixe la génératrice, la queue, et permet à l’éolienne de pivoter sur le mât : la vidéo la montre en soudant le tube pivot sur une cornière. Le wiki prend une cornière de 50 × 50 × 6 mm sur 206 mm, un tube pivot (le pivot de la machine) et un tube de charnière de queue, soudés d’équerre et bien centrés. Au bout de la cornière est soudé le berceau, un disque d’acier de 140 × 8 mm percé de trous de 12 mm : la fusée du moyeu et le stator s’y vissent.',
      'The nacelle is the steel part that holds the generator and the tail, and lets the turbine swivel on the mast: the video shows it as the pivot tube is welded onto an angle iron. The wiki takes a 50 × 50 × 6 mm angle iron 206 mm long, a pivot tube (the machine’s pivot) and a tail-hinge tube, welded square and well centred. At the end of the angle the cradle is welded, a 140 × 8 mm steel disc drilled with 12 mm holes: the hub’s stub axle and the stator are screwed onto it.',
    ),
    material: l('Acier doux soudé : cornière 50 × 50 × 6 mm', 'Welded mild steel: 50 × 50 × 6 mm angle iron'),
    specs: [
      sp('Cornière', 'Angle iron', l('50 × 50 × 6 mm, 206 mm de long', '50 × 50 × 6 mm, 206 mm long')),
      sp('Tube pivot de la machine', 'Machine pivot tube', l('Ø 42,2 mm × 100 mm (wiki)', 'Ø 42.2 mm × 100 mm (wiki)')),
      sp('Tube de charnière de queue', 'Tail-hinge tube', l('Ø 33,4 mm × 150 mm (wiki)', 'Ø 33.4 mm × 150 mm (wiki)')),
      sp(
        'Berceau de l’alternateur',
        'Alternator cradle',
        l(
          'disque d’acier de 140 × 8 mm, soudé au bout de la cornière (wiki)',
          '140 × 8 mm steel disc, welded to the end of the angle (wiki)',
        ),
      ),
      sp(
        'Soudure',
        'Welding',
        l('par étapes, pour limiter la déformation (wiki)', 'in stages, to limit distortion (wiki)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une soudure qui se fissure sous les vibrations : les plans insistent sur la qualité des soudures de la charnière de queue, qui portent de lourdes charges.',
        check:
          'Machine arrêtée et descendue, inspectez les cordons à la lampe : une fissure fine ou un trait de rouille à son pied est le signe d’une soudure fatiguée.',
        care: 'Reprenez toute soudure suspecte avant la remontée, et protégez l’acier de la rouille (peinture).',
      },
      {
        failure:
          'A weld that cracks under vibration: the plans insist on the quality of the tail-hinge welds, which carry heavy loads.',
        check:
          'With the machine stopped and lowered, inspect the beads with a torch: a hairline crack or a rust line at its foot means a tired weld.',
        care: 'Redo any suspect weld before raising again, and protect the steel from rust (paint).',
      },
    ),
    tip: l(
      'Soudez par étapes, en alternant les côtés, et vérifiez l’équerrage entre deux cordons : le wiki prévient que la chaleur déforme la pièce.',
      'Weld in stages, alternating sides, and check squareness between beads: the wiki warns that the heat distorts the piece.',
    ),
    video: ['03:49', '04:24'],
    design: l(
      'Un cadre en cornière, soudé d’équerre, est ce qu’un atelier de village sait faire : il aligne le moyeu, le pivot et la charnière sans usinage. Tout l’alignement tient à la précision de ces soudures.',
      'An angle-iron frame, welded square, is what a village workshop can make: it aligns the hub, the pivot and the hinge without machining. All the alignment depends on the accuracy of these welds.',
    ),
    qty: 1,
  },
  {
    id: 'yaw-bearing',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Pivot d’orientation', 'Yaw bearing'),
    short: l(
      'Deux tubes emboîtés : la machine tourne sur le mât pour se mettre face au vent.',
      'Two nested tubes: the machine swivels on the mast to face the wind.',
    ),
    description: lf(
      'Le pivot est un tube de 42,2 mm qui s’enfile sur le tube de 33,4 mm du haut du mât : la machine tourne dessus, avec un peu de graisse. Ce système rudimentaire marche très bien, disent les plans. Le rotor n’est pas centré sur l’axe : l’axe de l’alternateur est décalé de {offset} mm. La poussée du vent, qui s’exerce à cette distance de l’axe, cherche en permanence à tourner la machine hors du vent : c’est le moteur du repli.',
      'The pivot is a 42.2 mm tube that slides over the 33.4 mm tube at the top of the mast: the machine turns on it, with a little grease. This rudimentary system works very well, say the plans. The rotor is not centred on the axis: the alternator’s axis is offset by {offset} mm. The wind thrust, acting at that distance from the axis, constantly tries to turn the machine out of the wind: it is the engine of the furling.',
    ),
    material: l('Tubes d’acier emboîtés, graisse', 'Nested steel tubes, grease'),
    specs: [
      sp(
        'Tube extérieur / tube du mât',
        'Outer tube / mast tube',
        l('Ø 42,2 mm sur Ø 33,4 mm', 'Ø 42.2 mm over Ø 33.4 mm'),
      ),
      sp('Décalage de l’alternateur', 'Alternator offset', l('41 mm (1 5/8 pouce)', '41 mm (1 5/8 in)')),
      sp('Décalage de la grande machine (2,4 m)', 'Offset of the large machine (2.4 m)', '125 mm'),
      sp(
        'Passage des fils',
        'Wire path',
        tf('estimate', 'à l’intérieur du tube pivot et du mât', 'inside the pivot tube and the mast'),
      ),
      sp(
        'Poussée à 25 m/s, queue repliée',
        'Thrust at 25 m/s, tail folded',
        tf(
          'model',
          '≈ {thrust25} N, contre ≈ {thrustFixed25} N si la queue est bloquée',
          '≈ {thrust25} N, against ≈ {thrustFixed25} N if the tail is locked',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le tube grippe faute de graisse ou rouille sur son tube de mât : la machine ne suit plus le vent, ou tourne trop tard.',
        check:
          'Descendue au sol, la machine doit tourner sans effort autour du tube : un à-coup ou un bruit de frottement signale un grippage.',
        care: 'Nettoyez et regraissez le tube, éventuellement avec une rondelle, à chaque descente de la machine.',
      },
      {
        failure:
          'The tube seizes for lack of grease or rusts on its mast tube: the machine no longer follows the wind, or turns too late.',
        check:
          'Lowered to the ground, the machine must turn without effort round the tube: a jerk or a rubbing noise means it is seizing.',
        care: 'Clean and regrease the tube, with a washer if wanted, at every lowering of the machine.',
      },
    ),
    tip: l(
      'La machine doit pouvoir tourner librement : vérifiez que les fils, la boucle de câble et le haut du mât ne la coincent pas.',
      'The machine must turn freely: check that the wires, the cable loop and the top of the mast do not jam it.',
    ),
    video: ['04:29'],
    design: l(
      'Le décalage est volontaire : sans lui, la poussée serait centrée sur l’axe et la machine ne se replierait jamais. C’est la distance entre l’axe du pivot et l’axe de l’alternateur, 41 mm sur cette machine, qui transforme la poussée du vent en couple de repli.',
      'The offset is deliberate: without it the thrust would be centred on the axis and the machine would never fold. It is the distance between the pivot axis and the alternator axis, 41 mm on this machine, that turns the wind thrust into a folding moment.',
    ),
    qty: 1,
  },
  {
    id: 'tail-hinge',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Charnière inclinée', 'Inclined tail hinge'),
    short: l(
      'Charnière de la queue, inclinée : la queue monte quand elle s’écarte et son poids la ramène.',
      'The tail’s hinge, tilted: the tail rises as it swings out and its weight brings it back.',
    ),
    description: lf(
      'La queue tourne autour d’un axe incliné de 20° par rapport à la verticale et de 55° par rapport à l’axe du rotor, vu de dessus. Quand la poussée du vent devient trop forte, la queue s’écarte en montant : le rotor se met de biais et la poussée retombe. Le poids de la queue la ramène vers sa position basse. Un ressort vibrerait, rouillerait et casserait, disent les plans : l’inclinaison suffit. La queue peut s’ouvrir d’environ 95°.',
      'The tail turns about an axis tilted 20° from the vertical and 55° to the rotor axis, seen from above. When the wind thrust becomes too strong, the tail swings out and up: the rotor turns edge-on and the thrust drops. The weight of the tail brings it back to its low position. A spring would vibrate, rust and break, say the plans: the tilt is enough. The tail can open by about 95°.',
    ),
    material: l('Tubes d’acier emboîtés et platine soudée à 20°', 'Nested steel tubes and a plate welded at 20°'),
    specs: [
      sp('Inclinaison de l’axe', 'Hinge tilt', l('20° par rapport à la verticale', '20° from the vertical')),
      sp('Angle dans le plan', 'Angle in plan', l('55° par rapport à l’axe du rotor', '55° to the rotor axis')),
      sp('Débattement de la queue', 'Tail swing', l('≈ 95°', '≈ 95°')),
      sp('Queue au repos', 'Tail at rest', l('≈ 80° du plan du rotor (plans)', '≈ 80° to the rotor plane (plans)')),
      sp(
        'Début du repli',
        'Furling starts',
        tf('calibrated', '10 m/s pour le poids de queue de référence', '10 m/s for the reference tail weight'),
      ),
      sp(
        'Poids de queue ×0,6 / ×1,8',
        'Tail weight ×0.6 / ×1.8',
        tf('model', 'repli dès {furlLight} / {furlHeavy} m/s', 'furling from {furlLight} / {furlHeavy} m/s'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une soudure de la platine qui se fissure (les plans insistent : la queue impose des charges critiques à cette pièce), une charnière qui grippe et ne se replie plus, ou une queue qui ne revient pas.',
        check:
          'Machine descendue, soulevez la queue à la main : elle doit monter sans point dur, puis retomber toute seule sur sa butée.',
        care: 'Graissez la charnière, vérifiez la butée et l’encoche qui limitent le débattement, et reprenez la soudure à la moindre fissure.',
      },
      {
        failure:
          'A plate weld that cracks (the plans insist: the tail puts critical loads on this part), a hinge that seizes and no longer folds, or a tail that does not come back.',
        check:
          'With the machine lowered, lift the tail by hand: it must rise with no tight spot, then fall back by itself onto its stop.',
        care: 'Grease the hinge, check the stop and the notch that limit the swing, and redo the weld at the slightest crack.',
      },
    ),
    tip: l(
      'La vitesse de repli se règle avec le poids de la queue : plus lourde, elle s’efface plus tard ; Tripalium a dû lester la queue d’une de ses machines qui se repliait vers 600 W.',
      'The furling speed is set by the weight of the tail: heavier, it folds later; Tripalium had to add weight to the tail of one of its machines that was furling at about 600 W.',
    ),
    video: ['06:16', '06:30'],
    design: lf(
      'L’inclinaison fait monter la queue quand elle s’écarte : son poids devient le ressort. Le modèle du labo règle une seule chose, le poids de la queue, pour que le repli commence à 10 m/s ; avec une queue bloquée, il trouve ≈ {thrustFixed25} N de poussée à 25 m/s, contre ≈ {thrust25} N queue repliée (résultats du modèle).',
      'The tilt makes the tail rise as it swings out: its weight becomes the spring. The lab’s model tunes one thing, the weight of the tail, so that furling starts at 10 m/s; with the tail locked it finds ≈ {thrustFixed25} N of thrust at 25 m/s, against ≈ {thrust25} N with the tail folded (model results).',
    ),
    qty: 1,
  },
  {
    id: 'tail-boom',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Bras de queue', 'Tail boom'),
    short: l(
      'Tube qui porte le safran loin derrière la machine.',
      'Tube that carries the vane far behind the machine.',
    ),
    description: l(
      'Le bras est un tube d’acier soudé sur la charnière, qui éloigne le safran du pivot : plus le bras est long, plus la queue a de levier pour s’opposer à la poussée. Il est coupé en gueule de loup à 110° pour s’ajuster sur la pièce extérieure de la charnière. Le wiki le fait de 700 mm, les plans de la petite machine de 500 mm (18 pouces) ; une cornière de 250 mm supporte le safran dans le wiki, une barre en T dans les plans.',
      'The boom is a steel tube welded onto the hinge, which keeps the vane away from the pivot: the longer the boom, the more leverage the tail has against the thrust. It is cut as a bird’s mouth at 110° to fit the hinge’s outer piece. The wiki makes it 700 mm long, the plans of the small machine 500 mm (18 in); a 250 mm angle supports the vane in the wiki, a T-bar in the plans.',
    ),
    material: l('Tube d’acier Ø 33,4 mm, paroi 3 mm', 'Steel tube Ø 33.4 mm, 3 mm wall'),
    specs: [
      sp('Tube', 'Tube', 'Ø 33,4 mm, paroi 3 mm'),
      sp('Longueur', 'Length', l('700 mm (wiki) ou 500 mm (plans)', '700 mm (wiki) or 500 mm (plans)')),
      sp('Coupe à la charnière', 'Cut at the hinge', l('gueule de loup à 110°', 'bird’s mouth at 110°')),
      sp(
        'Support du safran',
        'Vane support',
        l(
          'cornière 30 × 30 × 5 mm × 250 mm (wiki) ou barre en T (plans)',
          '30 × 30 × 5 mm × 250 mm angle (wiki) or T-bar (plans)',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une soudure fatiguée par les vibrations, un tube plié par une rafale, une tige du safran qui prend du jeu.',
        check:
          'Regardez la queue de côté et de dessus : le bras doit être droit et le safran bien d’aplomb ; secouez doucement le bras : aucun jeu à la charnière.',
        care: 'Resserrez les boulons du safran et reprenez les soudures à chaque visite.',
      },
      {
        failure: 'A weld tired by vibration, a tube bent by a gust, a vane support that works loose.',
        check:
          'Look at the tail from the side and from above: the boom must be straight and the vane upright; shake the boom gently: no play at the hinge.',
        care: 'Retighten the vane bolts and redo any weld at each visit.',
      },
    ),
    tip: l(
      'Montez d’abord le bras sur la charnière, réglez la butée de la queue, et seulement ensuite soudez le support du safran pour le mettre d’aplomb.',
      'Fit the boom to the hinge first, set the tail stop, and only then weld the vane support so that it stands upright.',
    ),
    video: ['06:16'],
    design: l(
      'Un long bras donne du levier à une petite queue : la même force de vent sur le safran retient mieux la machine. Deux longueurs sont publiées, 500 et 700 mm : la vitesse de repli se règle surtout par le poids de la queue, disent les plans.',
      'A long boom gives leverage to a small tail: the same wind force on the vane holds the machine better. Two lengths are published, 500 and 700 mm: the furling speed is set mainly by the weight of the tail, say the plans.',
    ),
    qty: 1,
  },
  {
    id: 'tail-vane',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Safran', 'Tail vane'),
    short: l(
      'Plaque de contreplaqué qui garde la machine face au vent.',
      'Plywood plate that keeps the machine facing the wind.',
    ),
    description: lf(
      'Le safran garde l’éolienne face au vent, comme la dérive d’une girouette, jusqu’à environ 10 m/s ; au-delà, il laisse la machine se mettre en drapeau pour protéger l’électricité (vidéo). C’est une plaque de contreplaqué de 6 mm : environ 0,1 m² dans le wiki (par exemple un triangle de 300 mm de haut sur 600 mm de base), 18 × 12 pouces dans les plans. Son poids règle la vitesse de repli : dans le modèle, une queue 0,6 fois plus lourde se replie dès {furlLight} m/s, une queue 1,8 fois plus lourde seulement à {furlHeavy} m/s.',
      'The vane keeps the turbine facing the wind, like a weathervane’s fin, up to about 10 m/s; beyond that, it lets the machine fold out of the wind to protect the electrics (video). It is a plywood plate 6 mm thick: about 0.1 m² in the wiki (for example a triangle 300 mm high with a 600 mm base), 18 × 12 in in the plans. Its weight sets the furling speed: in the model a tail 0.6 times as heavy folds from {furlLight} m/s, one 1.8 times as heavy only at {furlHeavy} m/s.',
    ),
    material: l('Contreplaqué extérieur de 6 mm, peint', '6 mm exterior plywood, painted'),
    specs: [
      sp('Épaisseur', 'Thickness', '6 mm'),
      sp('Surface', 'Area', l('≈ 0,1 m² (wiki) ; 18 × 12 pouces (plans)', '≈ 0.1 m² (wiki); 18 × 12 in (plans)')),
      sp('Fixation', 'Fixing', l('boulons sur la barre ou la cornière du bras', 'bolts to the boom’s bar or angle')),
      sp(
        'Garde la machine face au vent',
        'Keeps the machine facing the wind',
        l('jusqu’à ≈ 10 m/s (vidéo)', 'up to ≈ 10 m/s (video)'),
      ),
      sp(
        'Poids de queue de référence',
        'Reference tail weight',
        tf('calibrated', 'celui qui donne le début du repli à 10 m/s', 'the one that starts furling at 10 m/s'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le contreplaqué gonfle et se délamine à la pluie ; le safran tombe si ses boulons ou ses soudures lâchent (Tripalium en cite un tombé au bout d’environ quatre ans, soudure mal faite).',
        check:
          'Regardez les bords du contreplaqué (gonflement, fentes) et secouez doucement le safran : il ne doit pas jouer sur ses boulons.',
        care: 'Peignez le contreplaqué, bords compris, remplacez-le s’il gonfle et resserrez les boulons à chaque descente.',
      },
      {
        failure:
          'The plywood swells and delaminates in the rain; the vane falls if its bolts or welds give way (Tripalium cites one that fell after about four years, badly welded).',
        check: 'Look at the plywood edges (swelling, splits) and shake the vane gently: it must not play on its bolts.',
        care: 'Paint the plywood, edges included, replace it if it swells and retighten the bolts at every lowering.',
      },
    ),
    tip: l(
      'Réglez le poids de la queue sur le terrain : un safran trop léger se replie trop tôt, trop lourd il se replie trop tard, et la machine souffre.',
      'Set the tail weight in the field: a vane too light folds too early, too heavy it folds too late, and the machine suffers.',
    ),
    video: ['06:16', '06:30'],
    design: lf(
      'Le safran remplit deux rôles opposés avec une seule pièce : le vent le pousse pour tenir la machine face à lui, puis son poids et l’inclinaison de la charnière lui permettent de céder. En tempête, la machine à queue bloquée subirait ≈ {thrustFixed25} N de poussée à 25 m/s et ≈ {ampsFixed25} A dans le stator (résultats du modèle) : c’est le repli qui la sauve.',
      'The vane does two opposite jobs with a single part: the wind pushes it to hold the machine facing the wind, then its weight and the tilt of the hinge let it yield. In a storm, a machine with a locked tail would take ≈ {thrustFixed25} N of thrust at 25 m/s and ≈ {ampsFixed25} A in the stator (model results): the folding saves it.',
    ),
    qty: 1,
  },
  {
    id: 'wire-loop',
    scene: 'turbine',
    category: 'electrical',
    name: l('Boucle de câble', 'Cable loop'),
    short: l(
      'Les trois fils passent par le tube du mât : ne jamais les coincer ni les pincer.',
      'The three wires pass down the mast tube: never trap or pinch them.',
    ),
    description: l(
      'Le stator sort par un câble souple à trois conducteurs de 2,5 mm² sur 60 cm (wiki) : ses trois fils longent le cadre, passent dans le tube pivot, puis descendent dans le mât. Comme la machine tourne sur le mât pour suivre le vent, les fils tournent avec elle : le labo dessine à la sortie du pivot une boucle de câble souple (estimation) qui laisse la machine pivoter sans tirer ni pincer. Tripalium met en garde contre le fil coincé entre la nacelle et le haut du mât : il se tord, se dénude, puis se met en court-circuit.',
      'The stator leaves by a flexible three-core cable of 2.5 mm² over 60 cm (wiki): its three wires run along the frame, through the pivot tube, then down the mast. As the machine swivels on the mast to follow the wind, the wires turn with it: the lab draws a loop of flexible cable at the pivot outlet (estimate) that lets the machine pivot without pulling or pinching. Tripalium warns against the wire trapped between the nacelle and the top of the mast: it twists, strips, then short-circuits.',
    ),
    material: l('Câble souple à trois conducteurs de cuivre', 'Flexible three-core copper cable'),
    specs: [
      sp(
        'Câble de sortie du stator',
        'Stator output cable',
        l('3 conducteurs souples de 2,5 mm², 60 cm (wiki)', '3 flexible cores of 2.5 mm², 60 cm (wiki)'),
      ),
      sp(
        'Chemin des fils',
        'Path of the wires',
        tf(
          'estimate',
          'le long du cadre, dans le tube pivot, puis dans le mât',
          'along the frame, through the pivot tube, then down the mast',
        ),
      ),
      sp(
        'Dans la descente du mât',
        'In the mast drop',
        l('fils souples à un conducteur (plans)', 'flexible single-core wires (plans)'),
      ),
      sp(
        'Piège à éviter',
        'Trap to avoid',
        l('fil coincé entre nacelle et mât (Tripalium)', 'wire trapped between nacelle and mast (Tripalium)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un fil coincé ou tordu entre la nacelle et le haut du mât : isolant arraché, court-circuit, coupure de la charge (Tripalium).',
        check:
          'Machine descendue, tournez-la sur le mât et regardez la boucle : aucune traction, aucun pincement, pas de gaine marquée ; au pied du mât, les fils sortent sans pli.',
        care: 'Détordez les fils si besoin, vérifiez les cosses et la gaine à chaque descente.',
      },
      {
        failure:
          'A wire trapped or twisted between the nacelle and the top of the mast: stripped insulation, short circuit, loss of charging (Tripalium).',
        check:
          'With the machine lowered, turn it on the mast and watch the loop: no pull, no pinch, no marked sheath; at the foot of the mast the wires come out without a kink.',
        care: 'Untwist the wires if needed, check the lugs and the sheath at every lowering.',
      },
    ),
    tip: l(
      'Quand vous posez la machine sur le mât, enfilez d’abord les fils, puis seulement le tube pivot : un fil se pince très vite à cet endroit.',
      'When you set the machine on the mast, feed the wires first, only then slide on the pivot tube: a wire is very easily pinched at that spot.',
    ),
    design: l(
      'Les plans prévoient un câble souple, à brins fins, dans la descente du mât : un fil rigide casserait à force de mouvements et de torsions. Ils veulent aussi que la sortie du bas soit visible, pour voir une torsion.',
      'The plans call for a flexible, fine-stranded cable in the mast drop: a stiff wire would break under repeated movement and twisting. They also want the bottom outlet visible, so that a twist can be seen.',
    ),
    qty: 1,
  },
];
