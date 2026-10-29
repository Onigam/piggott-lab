// The six lessons of the lab (docs/research.md §4, docs/lessons.md): why the wind speed counts so much, Betz and the blades,
// from rotation to volts, the cut-in and the battery, surviving the storm, siting and sizing. Each opens a world, a part and a
// preset (and offers a scenario) of the simulation, ends with two or three quiz questions, and quotes only numbers that come
// from a source, from the dimensions, or from the model, said as such (lessons-fig.ts explains the four kinds).
//
// Shape (lessons.test.ts pins it): 3 or 4 paragraphs of at most 85 words and 4 sentences, sentences of at most 36 words; every
// term is defined once, in bold, in the first lesson that needs it (power, cube, swept area, shear, hub, turbulence in 1;
// Betz limit, power coefficient, tip speed ratio, rpm, stall in 2; induction, phases, turns, rectifier in 3; cut-in, dump
// load in 4; thrust, offset, inclined hinge, furling, brake switch in 5; kilowatt-hour, capacity factor in 6); a quiz
// question has three or four choices of about the same length, a wrong one for each misconception the explanation names.
//
// The honest points, said plainly: the power IN THE WIND goes as a cube but this machine's battery power is nearly linear in the
// wind once the alternator holds the rotor in the stall (lessons 1 and 2, docs/physics.md §7.2); the label says 200 W (nominal,
// the wind speed is not given) and the model, not tuned to it, finds about 60 W at 12 m/s (lesson 6, §7.1, §7.3, §7.4).
// Sources are named in words (the video, the wiki, the plans, Tripalium, Service-public), never by research code.

import type { Lesson } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { chip, lx } from './lessons-fig';

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ 1. the wind
  {
    id: 'wind-cube',
    title: l('Pourquoi la vitesse du vent compte tant', 'Why wind speed counts so much'),
    summary: l(
      'Vent doublé, puissance du vent multipliée par huit. Mais la batterie de cette machine ne voit pas ce cube.',
      'Double the wind and the power in the wind is multiplied by eight. This machine’s battery does not see that cube.',
    ),
    body: [
      lx(
        'Le vent, c’est de l’air en mouvement. Sa **puissance** (l’énergie apportée chaque seconde, en watts) croît comme le **cube** de sa vitesse. Sur le disque que dessinent les pales, la **surface balayée** ({area} m² pour {diameter} m), le calcul donne {wind5} W à 5 m/s et {wind10} W à 10 m/s. Vent doublé, puissance ×8 : il passe deux fois plus d’air par seconde, et chaque kilo d’air porte quatre fois plus d’énergie.',
        'Wind is moving air. Its **power** (the energy it brings each second, in watts) grows as the **cube** of its speed. Across the disc the blades draw, the **swept area** ({area} m² for {diameter} m), the calculation gives {wind5} W at 5 m/s and {wind10} W at 10 m/s. Double the wind and the power is ×8: twice as much air passes each second, and each kilo of air carries four times the energy.',
      ),
      lx(
        'Près du sol, l’herbe, les arbres et les toits freinent l’air : le vent grandit avec la hauteur, c’est le **cisaillement**. Dans le modèle, parmi des arbres de 5 m, un vent de 5 m/s à 10 m donne {hub6} m/s au **moyeu**, le centre du rotor, sur un mât de 6 m. Sur 18 m, il donne {hub18} m/s, et le cube fait {mastRatio} fois plus de puissance du vent.',
        'Near the ground, grass, trees and roofs slow the air, so the wind grows with height: this is the **wind shear**. In the model, among 5 m trees, a wind of 5 m/s at 10 m gives {hub6} m/s at the **hub**, the centre of the rotor, on a 6 m mast. On 18 m it gives {hub18} m/s, and the cube makes that {mastRatio} times more power in the wind.',
      ),
      lx(
        'Les obstacles ne font pas que freiner le vent : ils le brassent. C’est la **turbulence**, ici la variation typique du vent autour de sa moyenne, en part de cette moyenne : {turb6} sur un mât de 6 m, {turb12} sur 12 m, toujours dans le modèle. Les plans de Hugh Piggott disent seulement qu’un mât doit dépasser la turbulence et que plus haut, c’est mieux : ces chiffres sont des hypothèses du labo.',
        'Obstacles do more than slow the wind: they stir it up. That is **turbulence**, here the typical swing of the wind around its average, as a share of that average: {turb6} on a 6 m mast, {turb12} on 12 m, again in the model. Hugh Piggott’s plans only say that a mast must clear the turbulence and that higher is better: these numbers are the lab’s assumptions.',
      ),
      lx(
        'Mais la batterie, dans le modèle, reçoit {w5} W à 5 m/s et {w10} W à 10 m/s : près de **quatre fois** plus, non huit. Une fois en charge, la puissance monte presque en ligne droite : l’alternateur freine le rotor loin de sa vitesse idéale (leçon 2). Ce qui croît comme un cube, c’est la puissance dans le vent, pas celle de la batterie. Lancez le scénario, un vent qui monte pendant cinq minutes, et suivez la puissance dans la barre du bas.',
        'But the battery, in the model, gets {w5} W at 5 m/s and {w10} W at 10 m/s: nearly **four times** more, not eight. Once it charges, the power rises almost in a straight line: the alternator holds the rotor far from its ideal speed (lesson 2). What grows as a cube is the power in the wind, not the battery’s. Run the scenario, a wind that rises over five minutes, and follow the power in the bottom bar.',
      ),
    ],
    figures: [
      chip('Puissance du vent à 10 m/s (calcul)', 'Power in the wind at 10 m/s (calculated)', '{wind10} W'),
      chip('Batterie à 10 m/s (modèle)', 'Battery at 10 m/s (model)', '{w10} W'),
      chip('Vent au moyeu, mât de 6 / 18 m (modèle)', 'Hub wind, 6 / 18 m mast (model)', '{hub6} / {hub18} m/s'),
    ],
    formula: 'P = ½ · ρ · S · v³',
    focus: { scene: 'site', part: 'tower', preset: 'hamlet', scenario: 'wind-sweep' },
    video: '00:45',
    quiz: [
      {
        q: l(
          'Le vent passe de 4 à 8 m/s. Par combien la puissance du vent est-elle multipliée ?',
          'The wind goes from 4 to 8 m/s. By how much is the power in the wind multiplied?',
        ),
        choices: [l('×2', '×2'), l('×4', '×4'), l('×8', '×8'), l('×16', '×16')],
        answer: 2,
        explain: l(
          '**×8** : la puissance du vent suit le cube de sa vitesse, et 2³ = 8. Il passe deux fois plus d’air par seconde, et chaque kilo d’air porte quatre fois plus d’énergie.',
          '**×8**: the power in the wind follows the cube of its speed, and 2³ = 8. Twice as much air passes each second, and each kilo of air carries four times the energy.',
        ),
      },
      {
        q: l(
          'Deux mâts, de 6 m et de 18 m, au milieu des mêmes arbres. Pourquoi le plus haut est-il bien meilleur ?',
          'Two masts, 6 m and 18 m, among the same trees. Why is the taller one so much better?',
        ),
        choices: [
          l(
            'Le vent y est plus fort et moins brassé, et la puissance suit son cube',
            'The wind is stronger and less stirred up, and its power follows the cube',
          ),
          l(
            'L’air y est plus dense, donc chaque mètre cube de vent porte plus d’énergie',
            'The air is denser there, so each cubic metre of wind carries more energy',
          ),
          l(
            'Le rotor y tourne plus vite parce que les roulements frottent moins en altitude',
            'The rotor spins faster there because the bearings rub less at altitude',
          ),
        ],
        answer: 0,
        explain: lx(
          'Le cisaillement donne plus de vent en haut, et la turbulence y est plus faible. Avec le cube, un petit gain de vitesse fait un grand gain de puissance : {mastRatio} fois dans le modèle pour ces deux mâts. L’air ne change presque pas de densité sur quelques mètres, et les roulements n’y sont pour rien.',
          'Shear gives more wind higher up, and the turbulence is lower. With the cube, a small gain in speed makes a big gain in power: {mastRatio} times in the model for these two masts. Air hardly changes density over a few metres, and the bearings have nothing to do with it.',
        ),
      },
      {
        q: lx(
          'Dans le modèle, la batterie reçoit {w5} W à 5 m/s. Combien environ à 10 m/s ?',
          'In the model, the battery gets {w5} W at 5 m/s. About how much at 10 m/s?',
        ),
        choices: [
          l('26 W (le double)', '26 W (double)'),
          lx('{w10} W (près de quatre fois)', '{w10} W (nearly four times)'),
          l('104 W (huit fois)', '104 W (eight times)'),
        ],
        answer: 1,
        explain: lx(
          '{w10} W. Le cube est celui du vent, pas celui de la batterie : l’alternateur tient le rotor en décrochage (leçon 2), et la puissance monte presque en ligne droite à partir de 3 m/s environ. Elle n’est pas proportionnelle au vent (26 W), ni au cube (104 W).',
          '{w10} W. The cube belongs to the wind, not to the battery: the alternator holds the rotor in the stall (lesson 2), and the power rises almost in a straight line from about 3 m/s. It is neither proportional to the wind (26 W) nor to its cube (104 W).',
        ),
      },
    ],
  },

  // ------------------------------------------------------------------------------------------------ 2. Betz and the blades
  {
    id: 'betz-blades',
    title: l('Betz et les pales : trois pales fines et rapides', 'Betz and the blades: three thin, fast blades'),
    summary: l(
      'Aucune éolienne ne prend plus de 59 % de l’énergie du vent. Celle-ci en prend bien moins, et l’alternateur y est pour beaucoup.',
      'No wind turbine takes more than 59 % of the wind’s energy. This one takes much less, and the alternator has a lot to do with it.',
    ),
    body: [
      l(
        'Pour prendre l’énergie du vent, il faut le ralentir ; mais s’il s’arrêtait derrière le rotor, l’air suivant devrait le contourner. Le meilleur compromis est la **limite de Betz** : jamais plus de 16/27, soit 0,593, de la puissance du vent. Des pales taillées à la main n’en récoltent que 0,25 à 0,35 : cette part est leur **coefficient de puissance**, Cp. Le modèle prend 0,30.',
        'To take the wind’s energy you must slow it down; but if it stopped behind the rotor, the next air would have to go around it. The best compromise is the **Betz limit**: never more than 16/27, or 0.593, of the wind’s power. Hand-carved blades harvest only 0.25 to 0.35 of it: that share is their **power coefficient**, Cp. The model takes 0.30.',
      ),
      lx(
        '**Regardez** la pale : large et épaisse au pied, étroite et mince au bout, et vrillée. Les plans la dessinent pour tourner vite : son bout doit aller environ 7 fois plus vite que le vent, c’est la **vitesse spécifique**, notée λ. Pour {diameter} m, cela fait {rpm3} tours par minute (**tr/min**) dans 3 m/s et {rpm10Design} dans 10 m/s, par le calcul.',
        '**Look at** the blade: wide and thick at the root, narrow and thin at the tip, and twisted. The plans draw it to spin fast: its tip should travel about 7 times faster than the wind, the **tip speed ratio**, written λ. For {diameter} m that is {rpm3} turns per minute (**rpm**) in 3 m/s and {rpm10Design} in 10 m/s, by calculation.',
      ),
      lx(
        'Mais le rotor n’atteint pas λ = 7 quand il charge : l’alternateur le freine. Dans le modèle, à 10 m/s, il tourne à {rpm10} tr/min, soit λ = {lambda10} au lieu de 7, et son Cp tombe à {cp10} au lieu de 0,30. Les pales sont alors en **décrochage** : l’air se décolle du dos de la pale, qui porte mal. Les plans le disent : l’alternateur tient les pales à basse vitesse et peut les faire décrocher.',
        'But the rotor does not reach λ = 7 once it charges: the alternator holds it back. In the model, at 10 m/s, it turns at {rpm10} rpm, which is λ = {lambda10} instead of 7, and its Cp falls to {cp10} instead of 0.30. The blades are then **stalled**: the air separates from the back of the blade, which no longer lifts well. The plans say as much: the alternator holds the blades at low speed and can make them stall.',
      ),
      l(
        'Lancez le scénario. À 20 s la batterie est débranchée : plus rien ne freine le rotor, qui passe d’environ 400 à plus de 1 000 tr/min en dix secondes. Dans la vraie vie, une batterie débranchée laisse le rotor s’emballer : on ferme d’abord l’interrupteur de freinage (leçon 5), qui le ramène sous 100 tr/min.',
        'Run the scenario. At 20 s the battery is disconnected: nothing holds the rotor back any more, and it goes from about 400 to over 1,000 rpm in ten seconds. In real life a disconnected battery lets the rotor run away: you close the brake switch first (lesson 5), which brings it back under 100 rpm.',
      ),
    ],
    figures: [
      chip('Limite de Betz', 'Betz limit', '0,593', '0.593'),
      chip('Cp du modèle : visé / à 10 m/s', 'Model Cp: design / at 10 m/s', '0,30 / {cp10}', '0.30 / {cp10}'),
      chip(
        'Vitesse spécifique : visée / à 10 m/s (modèle)',
        'Tip speed ratio: design / at 10 m/s (model)',
        '7 / {lambda10}',
      ),
    ],
    formula: 'Cp = P_rotor / (½ · ρ · S · v³) ≤ 16/27',
    focus: { scene: 'blades', part: 'blade', preset: 'hamlet', scenario: 'runaway' },
    video: '01:22',
    quiz: [
      {
        q: l('Que dit la limite de Betz ?', 'What does the Betz limit say?'),
        choices: [
          l(
            'Une éolienne peut tourner jusqu’à sept fois plus vite que le vent',
            'A turbine can spin up to seven times faster than the wind',
          ),
          l(
            'Un rotor ne récolte jamais plus de 59 % de la puissance du vent',
            'A rotor never takes more than 59 % of the wind’s power',
          ),
          l(
            'Une éolienne ne donne jamais plus que sa puissance annoncée',
            'A turbine never gives more than the power written on its label',
          ),
        ],
        answer: 1,
        explain: l(
          'C’est une limite de l’air, pas du bois ni de l’alternateur : au mieux 16/27, soit 59 %. Les pales de la vidéo en récoltent bien moins. Sept est la vitesse visée du bout des pales, et la puissance annoncée n’a rien à voir avec Betz.',
          'It is a limit of the air, not of the wood or the alternator: at best 16/27, or 59 %. The video’s blades harvest much less. Seven is the targeted speed of the blade tips, and the rated power has nothing to do with Betz.',
        ),
      },
      {
        q: lx(
          'Dans le modèle, à 10 m/s, le rotor tourne à {rpm10} tr/min au lieu des {rpm10Design} tr/min que donne le calcul pour λ = 7. Pourquoi ?',
          'In the model, at 10 m/s, the rotor turns at {rpm10} rpm instead of the {rpm10Design} rpm that the calculation gives for λ = 7. Why?',
        ),
        choices: [
          l(
            'Le vent est trop turbulent pour que les pales arrivent à le suivre',
            'The wind is too turbulent for the blades to be able to follow it',
          ),
          l(
            'Les pales sont trop épaisses au pied et freinent trop l’air qui passe',
            'The blades are too thick at the root and brake the air passing by',
          ),
          l(
            'L’alternateur freine le rotor et fait décrocher les pales',
            'The alternator holds the rotor back and stalls the blades',
          ),
        ],
        answer: 2,
        explain: lx(
          'Dès que la batterie se charge, le courant demande un couple qui tient le rotor lent. Les pales décrochent : Cp {cp10} au lieu de 0,30. Sans batterie, plus rien ne freine et le rotor s’emballe.',
          'As soon as the battery charges, the current asks for a torque that keeps the rotor slow. The blades stall: Cp {cp10} instead of 0.30. With no battery, nothing holds it back and the rotor runs away.',
        ),
      },
    ],
  },

  // ------------------------------------------------------------------------------------------------ 3. from rotation to volts
  {
    id: 'volts',
    title: l('De la rotation aux volts', 'From rotation to volts'),
    summary: l(
      'Huit aimants passent devant six bobines : à chaque passage, un courant naît. Le nombre de spires choisit la tension.',
      'Eight magnets pass six coils: each pass makes a current. The number of turns picks the voltage.',
    ),
    body: [
      lx(
        'Un aimant qui passe devant une bobine de fil de cuivre y fait naître une tension : c’est l’**induction**. Elle change de sens à chaque aimant, nord puis sud. L’alternateur de la vidéo a {magnets} aimants au néodyme sur un disque d’acier, face à 6 bobines noyées dans la résine : 4 aimants pour 3 bobines. Ce rapport donne trois courants décalés dans le temps, les trois **phases**.',
        'A magnet passing a coil of copper wire makes a voltage in it: this is **induction**. It changes direction at each magnet, north then south. The video’s alternator has {magnets} neodymium magnets on a steel disc, facing 6 coils cast in resin: 4 magnets for 3 coils. That ratio gives three currents shifted in time, the three **phases**.',
      ),
      lx(
        'La tension grandit avec la vitesse et avec le nombre de **spires**, les tours de fil de chaque bobine. La machine de la vidéo en compte {turns} par bobine, en fil de 1,4 mm, pour une batterie de 12 V. Au banc d’essai, un tour par seconde donne environ {benchVolts} V alternatifs entre deux phases, soit {kePerRpm} V par tr/min (calcul) : deux fois plus vite, deux fois plus de volts.',
        'Voltage grows with speed and with the number of **turns**, the loops of wire in each coil. The video’s machine has {turns} per coil, in 1.4 mm wire, for a 12 V battery. On the bench, one turn per second gives about {benchVolts} V of alternating voltage between two phases, that is {kePerRpm} V per rpm (calculated): twice as fast, twice the volts.',
      ),
      lx(
        'Une batterie veut du courant continu, qui ne change jamais de sens. Le **redresseur**, des diodes (des valves à sens unique), le fabrique : il donne {bridge} fois la tension alternative, moins 1,5 V perdus dans les diodes. Pour charger une batterie à {batt} V, il faut donc {needDc} V en sortie, soit {needAc} V alternatifs, soit environ {cutInRpm} tr/min : le calcul et le modèle s’accordent. En dessous, le rotor tourne sans rien donner.',
        'A battery wants direct current, which never changes direction. The **rectifier**, a set of diodes (one-way valves), makes it: it gives {bridge} times the alternating voltage, minus 1.5 V lost in the diodes. To charge a battery at {batt} V you therefore need {needDc} V at the output, so {needAc} V alternating, so about {cutInRpm} rpm: the calculation and the model agree. Below that, the rotor turns and gives nothing.',
      ),
      l(
        'Pourquoi pas plus de spires, pour charger dès les petits vents ? Le fil doit tenir dans le même espace : plus de spires, c’est un fil plus fin, donc plus de résistance, et un rotor plus freiné (leçon 2). Moitié moins de spires charge plus tard mais, dans le modèle, récolte plus d’énergie sur l’année : une observation, pas un conseil. Lancez le scénario : à 4 m/s, avec 38 spires, le rotor tourne librement sans rien charger.',
        'Why not more turns, to charge in light winds? The wire must fit in the same space: more turns means thinner wire, so more resistance, and a rotor held back harder (lesson 2). Half the turns charge later but, in the model, harvest more energy over the year: an observation, not advice. Run the scenario: at 4 m/s, with 38 turns, the rotor spins freely and charges nothing.',
      ),
    ],
    figures: [
      chip('Aimants / bobines', 'Magnets / coils', '{magnets} / 6'),
      chip('Spires par bobine', 'Turns per coil', '{turns}'),
      chip('Banc d’essai, un tour par seconde', 'Bench test, one turn per second', '{benchVolts} V'),
    ],
    focus: { scene: 'alternator', part: 'coils', preset: 'hamlet', scenario: 'few-turns' },
    video: '02:17',
    quiz: [
      {
        q: l(
          'Le même alternateur tourne deux fois plus vite. Que devient la tension entre phases ?',
          'The same alternator spins twice as fast. What happens to the voltage between phases?',
        ),
        choices: [
          l('Elle double', 'It doubles'),
          l('Elle est multipliée par quatre', 'It is multiplied by four'),
          l('Elle ne change pas, seul le courant augmente', 'It stays the same, only the current rises'),
        ],
        answer: 0,
        explain: l(
          'La tension est proportionnelle à la vitesse : environ 1,9 V à un tour par seconde, deux fois plus à deux tours par seconde. Ce qui change aussi, c’est la fréquence, le nombre d’alternances par seconde.',
          'The voltage is proportional to speed: about 1.9 V at one turn per second, twice that at two turns per second. The frequency also changes: the number of alternations per second.',
        ),
      },
      {
        q: l(
          'Même alternateur, mais bobiné avec 38 spires par bobine au lieu de 76, pour la même batterie 12 V. Que se passe-t-il ?',
          'Same alternator, but wound with 38 turns per coil instead of 76, for the same 12 V battery. What happens?',
        ),
        choices: [
          l(
            'Il charge plus tôt, dès les vents faibles, grâce à un fil plus gros et moins résistant',
            'It charges earlier, in light winds, thanks to thicker and less resistive wire',
          ),
          l(
            'Il charge de la même façon : seul le diamètre du fil compte pour la tension',
            'It charges the same way: only the wire’s diameter counts for the voltage',
          ),
          l(
            'Il ne charge qu’avec plus de vent : la tension par tour est divisée par deux',
            'It only charges in more wind: the voltage per turn is halved',
          ),
        ],
        answer: 2,
        explain: lx(
          'Avec moitié moins de spires, la tension à une vitesse donnée est divisée par deux : il faut tourner à peu près deux fois plus vite pour passer la tension de la batterie. Dans le modèle, la charge commence à {cut38} m/s au lieu de {cutIn} m/s.',
          'With half the turns, the voltage at a given speed is halved: the rotor must spin about twice as fast to pass the battery’s voltage. In the model, charging starts at {cut38} m/s instead of {cutIn} m/s.',
        ),
      },
    ],
  },

  // ------------------------------------------------------------------------------------------------ 4. cut-in and battery
  {
    id: 'battery',
    title: l('Le seuil de charge et la batterie', 'The cut-in and the battery'),
    summary: l(
      'Pourquoi rien n’arrive à la batterie sous 3 m/s environ, ce qu’une batterie 12 V supporte, et ce que le câble avale.',
      'Why nothing reaches the battery below about 3 m/s, what a 12 V battery can take, and what the cable swallows.',
    ),
    body: [
      lx(
        'Une batterie ne se laisse charger que par une tension plus haute que la sienne. Tant que le redresseur n’y arrive pas, le rotor tourne et rien ne passe : c’est le **seuil de charge**. Un calcul simple (leçon 3) donne environ 3 m/s ; en vent fixe, le modèle trouve le premier watt à {cutIn} m/s. Jusque-là les pales tournent près de leur vitesse idéale : c’est en chargeant que le rotor est freiné.',
        'A battery can only be charged by a voltage higher than its own. Until the rectifier gets there, the rotor turns and nothing passes: this is the **cut-in**. A simple calculation (lesson 3) gives about 3 m/s; in a steady wind the model finds the first watt at {cutIn} m/s. Up to there the blades run near their ideal speed: charging is what holds the rotor back.',
      ),
      l(
        'Une batterie au plomb de 12 V a ses limites : sous **11,5 V** elle est trop déchargée, au-dessus de **14 V** on la charge trop fort. Un régulateur surveille : à 14 V, le **délesteur**, une résistance qui transforme le surplus en chaleur, prend le courant en trop ; sous 11,5 V, la maison est débranchée. Lancez le scénario : une batterie pleine à 95 % refuse le courant, et le délesteur tient 14 V.',
        'A 12 V lead-acid battery has limits: below **11.5 V** it is too deeply discharged, above **14 V** it is charged too hard. A controller watches: at 14 V the **dump load**, a resistor that turns the surplus into heat, takes the extra current; below 11.5 V the house is cut off. Run the scenario: a battery that is 95 % full refuses the current, and the dump load holds 14 V.',
      ),
      lx(
        'Le câble du mât à la batterie chauffe : sa perte est sa résistance fois le **carré du courant**. À 12 V les courants sont forts : environ {amps500} A pour 500 W, par le calcul. Les plans montrent qu’un câble de 6 mm² sur 30 m perd **38 %** de la puissance produite, contre 13 % à 24 V. Dans le modèle, 2,5 mm² sur 40 m brûlent {thinLoss} % de la puissance à 8 m/s, le câble par défaut {defaultLoss} %.',
        'The cable from the mast to the battery heats up: its loss is its resistance times the **square of the current**. At 12 V the currents are large: about {amps500} A for 500 W, by calculation. The plans show that a 6 mm² cable over 30 m loses **38 %** of the power produced, against 13 % at 24 V. In the model, 2.5 mm² over 40 m burns {thinLoss} % of the power at 8 m/s, the default cable {defaultLoss} %.',
      ),
    ],
    figures: [
      chip('Seuil de charge, vent fixe (modèle)', 'Cut-in, steady wind (model)', '{cutIn} m/s'),
      chip('Limites de la batterie 12 V', '12 V battery limits', '{low} – {high} V'),
      chip('Perte du câble à 12 V (plans)', 'Cable loss at 12 V (plans)', '38 %'),
    ],
    formula: 'P = R · I²',
    focus: { scene: 'shed', part: 'battery-bank', preset: 'hamlet', scenario: 'battery-full' },
    quiz: [
      {
        q: l(
          'Le vent est à 2 m/s : le rotor tourne, mais la batterie ne reçoit rien. Pourquoi ?',
          'The wind is at 2 m/s: the rotor turns, but the battery gets nothing. Why?',
        ),
        choices: [
          l('Le délesteur prend déjà tout le courant produit', 'The dump load already takes all the current produced'),
          l(
            'La limite de 11,5 V coupe l’alternateur pour le protéger',
            'The 11.5 V limit cuts the alternator off to protect it',
          ),
          l(
            'La tension redressée n’atteint pas celle de la batterie',
            'The rectified voltage does not reach the battery’s',
          ),
        ],
        answer: 2,
        explain: l(
          'Le redresseur ne conduit que si sa tension dépasse celle de la batterie plus 1,5 V de diodes. Le délesteur n’intervient qu’à 14 V, et la limite de 11,5 V ne concerne que la maison, pas l’alternateur.',
          'The rectifier only conducts when its voltage exceeds the battery’s plus 1.5 V of diodes. The dump load only steps in at 14 V, and the 11.5 V limit concerns the house only, not the alternator.',
        ),
      },
      {
        q: l(
          'On passe de 12 V à 24 V pour la même puissance : le courant est divisé par deux. La perte dans le câble est…',
          'We go from 12 V to 24 V for the same power: the current is halved. The loss in the cable is…',
        ),
        choices: [
          l('divisée par deux', 'halved'),
          l('divisée par quatre', 'divided by four'),
          l('inchangée', 'unchanged'),
        ],
        answer: 1,
        explain: l(
          'La perte vaut R·I² : un courant deux fois plus faible donne une perte quatre fois plus faible en watts. Les plans l’illustrent : 38 % de perte à 12 V, 13 % à 24 V pour le même câble.',
          'The loss is R·I²: half the current gives a loss four times smaller in watts. The plans show it: 38 % loss at 12 V, 13 % at 24 V for the same cable.',
        ),
      },
      {
        q: l(
          'Batterie pleine, vent fort : que fait le régulateur du labo ?',
          'Battery full, strong wind: what does the lab’s controller do?',
        ),
        choices: [
          l(
            'Il envoie le surplus au délesteur, qui tient la tension à 14 V',
            'It sends the surplus to the dump load, which holds 14 V',
          ),
          l(
            'Il débranche la batterie pour la laisser souffler',
            'It disconnects the battery for a while, to give it a rest',
          ),
          l(
            'Il court-circuite la batterie pour la protéger de la surcharge',
            'It short-circuits the battery to protect it from overcharge',
          ),
        ],
        answer: 0,
        explain: l(
          'Le délesteur absorbe le surplus. Débrancher la batterie laisserait le rotor s’emballer (leçon 2), et on ne court-circuite jamais la batterie : seul l’alternateur se met en court-circuit (leçon 5).',
          'The dump load absorbs the surplus. Disconnecting the battery would let the rotor run away (lesson 2), and the battery is never short-circuited: only the alternator is (lesson 5).',
        ),
      },
    ],
  },

  // ------------------------------------------------------------------------------------------------ 5. the storm
  {
    id: 'storm',
    title: l('Survivre à la tempête', 'Surviving the storm'),
    summary: l(
      'Une queue sur une charnière inclinée met la machine de biais quand le vent forcit : la poussée et la puissance plafonnent.',
      'A tail on an inclined hinge turns the machine away when the wind rises: the thrust and the power level off.',
    ),
    body: [
      lx(
        'Le vent pousse sur le rotor : c’est la **poussée**, et si elle passait par l’axe du mât, rien ne tournerait. Ici l’axe de l’alternateur est **décalé** de {offset} mm du pivot, l’axe vertical autour duquel la machine tourne (125 mm sur la machine de 2,4 m). La poussée cherche donc à la tourner hors du vent. La **queue**, un safran de contreplaqué au bout d’un bras, la retient face au vent.',
        'The wind pushes on the rotor: this is the **thrust**, and if it passed through the mast’s axis, nothing would turn. Here the alternator’s axis is **offset** {offset} mm from the pivot, the vertical axis the machine turns around (125 mm on the 2.4 m machine). So the thrust tries to turn the machine out of the wind. The **tail**, a plywood vane at the end of an arm, holds it facing the wind.',
      ),
      lx(
        'La queue pivote sur une **charnière inclinée**, à {hinge}° de la verticale. Pour s’écarter, elle doit se soulever : son poids joue le rôle de ressort. Vers {furling} m/s, la poussée l’emporte, la queue cède et le rotor se met de biais : c’est le **repli**. Dans le modèle, le poids de la queue est calé sur ce chiffre de la vidéo, et l’écart au vent passe de {yaw12}° à 12 m/s à {yaw25}° à 25 m/s.',
        'The tail pivots on an **inclined hinge**, {hinge}° from the vertical. To swing out it must lift itself: its weight acts as a spring. At about {furling} m/s the thrust wins, the tail yields and the rotor turns edge-on: this is **furling**. In the model the tail’s weight is tuned to that figure from the video, and the angle to the wind goes from {yaw12}° at 12 m/s to {yaw25}° at 25 m/s.',
      ),
      lx(
        'Mis de biais, le rotor reçoit moins de vent : la poussée plafonne, et la puissance aussi, alors que le vent continue de forcir. À 25 m/s, le modèle donne {thrust25} N de poussée avec la queue repliée, contre {thrustFixed25} N si elle était bloquée : neuf fois plus. Les bouts de pale iraient alors à {tipFixed25} m/s, bien au-delà des {tipLimit} m/s où les plans placent la limite du bruit et de l’usure. Lancez le scénario pour la voir se replier.',
        'Turned edge-on, the rotor catches less wind: the thrust levels off, and so does the power, while the wind keeps rising. At 25 m/s the model gives {thrust25} N of thrust with the tail folded, against {thrustFixed25} N if it were locked: nine times more. The blade tips would then travel at {tipFixed25} m/s, well past the {tipLimit} m/s where the plans put the limit of noise and wear. Run the scenario to watch it fold.',
      ),
      lx(
        'L’**interrupteur de freinage** est autre chose : il met l’alternateur en court-circuit et, dans le modèle, le rotor ne tourne plus qu’à environ {brakeRpm} tr/min dans 8 m/s. Il sert à arrêter la machine avant d’y monter ou d’y toucher, pas à la défendre de la tempête : c’est le repli de la queue qui la protège. On ne court-circuite jamais la batterie, seulement l’alternateur.',
        'The **brake switch** is something else: it short-circuits the alternator and, in the model, the rotor then turns at only about {brakeRpm} rpm in 8 m/s. It is for stopping the machine before climbing to it or touching it, not for defending it from the storm: the tail’s furling does that. The battery is never short-circuited, only the alternator.',
      ),
    ],
    figures: [
      chip('Décalage de l’axe', 'Axis offset', '{offset} mm'),
      chip('Début du repli (vidéo)', 'Furling starts (video)', 'vers {furling} m/s', 'about {furling} m/s'),
      chip(
        'Poussée à 25 m/s : repliée / bloquée (modèle)',
        'Thrust at 25 m/s: folded / locked (model)',
        '{thrust25} / {thrustFixed25} N',
      ),
    ],
    focus: { scene: 'turbine', part: 'tail-hinge', preset: 'hamlet', scenario: 'storm' },
    video: '06:16',
    quiz: [
      {
        q: lx(
          'Pourquoi l’axe de l’alternateur est-il décalé de {offset} mm par rapport au pivot ?',
          'Why is the alternator’s axis offset by {offset} mm from the pivot?',
        ),
        choices: [
          l(
            'Pour que la poussée du vent tende à écarter la machine, que la queue retient',
            'So the wind’s thrust tends to turn the machine away, held back by the tail',
          ),
          l(
            'Pour équilibrer le poids de la queue sur le mât, comme le ferait un contrepoids',
            'To balance the weight of the tail on the mast, as a counterweight would',
          ),
          l(
            'Pour laisser un passage aux câbles dans le tube du mât, sans les pincer',
            'To leave a passage for the cables inside the mast tube without pinching them',
          ),
        ],
        answer: 0,
        explain: lx(
          'Le décalage donne à la poussée un bras de levier : elle cherche à tourner la machine hors du vent, et la queue la retient jusqu’à environ {furling} m/s. Ce n’est pas un contrepoids, et les câbles passent par la boucle de câble.',
          'The offset gives the thrust a lever arm: it tries to turn the machine out of the wind, and the tail holds it until about {furling} m/s. It is not a counterweight, and the cables go through the cable loop.',
        ),
      },
      {
        q: l(
          'On alourdit la queue. À quel vent la machine commence-t-elle à se replier ?',
          'The tail is made heavier. At what wind does the machine start to fold?',
        ),
        choices: [
          l('Plus tôt', 'Earlier'),
          l('Plus tard', 'Later'),
          l('Au même vent : la queue ne joue pas', 'At the same wind: the tail makes no difference'),
        ],
        answer: 1,
        explain: lx(
          'Une queue plus lourde retient mieux. Dans le modèle, la machine se replie à {furlLight} m/s avec 0,6 fois le poids de la queue et à {furlHeavy} m/s avec 1,8 fois ce poids (vers {furling} m/s pour la queue de la vidéo).',
          'A heavier tail holds better. In the model, the machine folds at {furlLight} m/s with 0.6 times the tail’s weight and at {furlHeavy} m/s with 1.8 times that weight (about {furling} m/s for the video’s tail).',
        ),
      },
    ],
  },

  // ------------------------------------------------------------------------------------------------ 6. siting and sizing
  {
    id: 'siting-sizing',
    title: l('Le site et la taille', 'Siting and sizing'),
    summary: l(
      'Le mât et les arbres décident de l’énergie de l’année, la taille du rotor de l’échelle. Et l’étiquette de 200 W ne dit pas tout.',
      'The mast and the trees decide the year’s energy, the rotor size decides the scale. And the 200 W label does not tell the whole story.',
    ),
    body: [
      l(
        'Une éolienne se place **loin des obstacles** et sur un mât haut : les plans parlent de 6 m en terrain très dégagé, souvent 12 ou 18 m, et de « plus haut, c’est mieux ». En France, un mât de moins de 12 m ne demande en général aucune formalité, un permis de construire dès 12 m : renseignez-vous à la mairie. Les arbres et les maisons laissent derrière eux un vent faible et brassé, que le mât doit dépasser.',
        'A turbine goes **away from obstacles** and on a tall mast: the plans speak of 6 m in very open ground, often 12 or 18 m, and of “the higher the better”. In France, a mast under 12 m generally needs no formality and a building permit is required from 12 m: ask the mairie (town hall). Trees and houses leave a weak, stirred-up wind behind them, which the mast must rise above.',
      ),
      lx(
        'Un **kilowattheure** (kWh) est l’énergie de 1 000 W pendant une heure. Dans la vallée calme du modèle (arbres de 8 m), la machine de {diameter} m donne {calmKwh6} kWh par an sur 6 m de mât, {calmKwh12} sur 12 m et {calmKwh18} sur 18 m. Au hameau elle donne {hamletKwh} kWh, soit {hamletKwhM2} kWh par m² de rotor, dans le repère générique de 100 à 300 que donne un fabricant pour des hélices.',
        'A **kilowatt-hour** (kWh) is the energy of 1,000 W for one hour. In the model’s calm valley (8 m trees), the {diameter} m machine gives {calmKwh6} kWh a year on a 6 m mast, {calmKwh12} on 12 m and {calmKwh18} on 18 m. At the hamlet it gives {hamletKwh} kWh, that is {hamletKwhM2} kWh per m² of rotor, inside the generic 100 to 300 that a maker quotes for propellers.',
      ),
      lx(
        'Tripalium, le réseau de formateurs, propose des rotors de 1,0 à 4,2 m. La puissance suit la surface balayée, donc le carré du diamètre. Dans le modèle, à 12 m/s, la batterie reçoit {size10} W avec 1,0 m, {w12} W avec 1,2 m, {size24} W avec 2,4 m et {size42} W avec 4,2 m. Ouvrez la section « Tailles » de la Simulation pour voir les sept courbes.',
        'Tripalium, the network of trainers, offers rotors from 1.0 to 4.2 m. Power follows the swept area, so the square of the diameter. In the model, at 12 m/s, the battery gets {size10} W with 1.0 m, {w12} W with 1.2 m, {size24} W with 2.4 m and {size42} W with 4.2 m. Open the “Sizes” section of the Simulation to see the seven curves.',
      ),
      lx(
        'Reste l’étiquette : 200 W pour 1,2 m, 2 000 W pour la plus grande taille, sans vent précisé. Le modèle en donne de 30 à 40 %. Et le **facteur de charge**, l’énergie d’une année rapportée à celle de la puissance annoncée tenue sans arrêt, n’est que de {hamletCf} % au hameau. Selon la forme du décrochage, que personne ne publie, le résultat varie du simple au double : le labo ne règle pas son modèle sur l’étiquette, il montre les deux.',
        'That leaves the label: 200 W for 1.2 m, 2,000 W for the largest size, with no wind speed given. The model gives 30 to 40 % of it. And the **capacity factor**, a year’s energy compared with that of the rated power held non-stop, is only {hamletCf} % at the hamlet. Depending on the shape of the stall, which nobody publishes, the result varies by a factor of two: the lab does not tune its model to the label, it shows both.',
      ),
    ],
    figures: [
      chip('Famille Tripalium', 'Tripalium family', '1,0 – 4,2 m', '1.0 – 4.2 m'),
      chip('Modèle, 1,2 m à 12 m/s', 'Model, 1.2 m at 12 m/s', '{w12} W'),
      chip('Étiquette (nominale), 1,2 m', 'Label (nominal), 1.2 m', '200 W'),
    ],
    formula: 'P ∝ D²',
    focus: { scene: 'site', part: 'obstacles', preset: 'hamlet', scenario: 'low-mast' },
    video: '01:03',
    quiz: [
      {
        q: l(
          'On passe d’un rotor de 1,2 m à un rotor de 2,4 m. Dans le modèle, la puissance à 12 m/s est environ…',
          'We go from a 1.2 m rotor to a 2.4 m rotor. In the model, the power at 12 m/s is about…',
        ),
        choices: [
          l('2 fois plus grande', '2 times greater'),
          l('4 fois plus grande', '4 times greater'),
          l('8 fois plus grande', '8 times greater'),
        ],
        answer: 1,
        explain: lx(
          'La puissance suit la surface balayée, donc le carré du diamètre : 2² = 4. Le modèle donne {w12} W, puis {size24} W. Le cube est celui du vent, pas celui du diamètre.',
          'Power follows the swept area, so the square of the diameter: 2² = 4. The model gives {w12} W, then {size24} W. The cube belongs to the wind, not to the diameter.',
        ),
      },
      {
        q: lx(
          'L’étiquette dit 200 W et le modèle trouve environ {w12} W à 12 m/s. Quelle lecture est la plus honnête ?',
          'The label says 200 W and the model finds about {w12} W at 12 m/s. Which reading is the most honest?',
        ),
        choices: [
          l(
            'L’étiquette est fausse, donc le modèle a forcément raison sur tout le reste',
            'The label is wrong, so the model must be right about everything else',
          ),
          l(
            'Le modèle est faux, et il suffirait de le régler pour qu’il donne 200 W',
            'The model is wrong, and tuning it would be enough to make it give 200 W',
          ),
          l(
            'L’étiquette n’a pas de vent précisé, le modèle n’est pas réglé dessus',
            'The label gives no wind speed, the model is not tuned to it',
          ),
        ],
        answer: 2,
        explain: lx(
          'Aucun des deux chiffres n’est établi : l’étiquette ne précise pas son vent, et le modèle repose sur ce que personne ne publie. Un calcul ajoute un doute : 200 W sous {high} V, c’est environ {amps200} A dans deux phases de {rph} Ω, soit environ {copper200} W de chaleur, presque autant que la sortie.',
          'Neither figure is established: the label gives no wind speed, and the model rests on what nobody publishes. A calculation adds a doubt: 200 W at {high} V is about {amps200} A through two phases of {rph} Ω, that is about {copper200} W of heat, nearly as much as the output.',
        ),
      },
      {
        q: l('Où installer la machine ?', 'Where should the machine go?'),
        choices: [
          l(
            'Sur un mât court près de la maison, pour raccourcir le câble et limiter les pertes',
            'On a short mast near the house, to shorten the cable and limit the losses',
          ),
          l(
            'Au pied des arbres, à l’abri des tempêtes et des grands vents',
            'At the foot of the trees, sheltered from storms and strong winds',
          ),
          l(
            'Sur un mât qui dépasse les obstacles, quitte à allonger le câble',
            'On a mast that rises above the obstacles, even if the cable gets longer',
          ),
        ],
        answer: 2,
        explain: lx(
          'Un mât court au milieu des arbres perd deux fois : dans le modèle, le vent au moyeu tombe de {hub12} à {hub6} m/s (mât de 12 m contre 6 m) et la turbulence double. Un câble plus long coûte peu s’il est assez gros : {defaultLoss} % de perte avec 10 mm² sur 15 m.',
          'A short mast among trees loses twice: in the model, the hub wind falls from {hub12} to {hub6} m/s (12 m mast against 6 m) and the turbulence doubles. A longer cable costs little if it is thick enough: {defaultLoss} % loss with 10 mm² over 15 m.',
        ),
      },
    ],
  },
];
