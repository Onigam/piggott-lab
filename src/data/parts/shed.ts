// Parts of the `shed` world (ids frozen in src/part-ids.ts): the technical room, in the order the current goes through it.
// Same conventions as ./site.ts (three-paragraph maintenance, sources named in words, model results and estimates tagged, the
// label says 200 W and the model finds about 60 W at 12 m/s). The sheets come from Hugh Piggott's plans (wiring, batteries),
// Tripalium's notes and the model; the video shows no technical room.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const SHED_PARTS: PartInfo[] = [
  {
    id: 'brake-switch',
    scene: 'shed',
    category: 'electrical',
    name: l('Interrupteur de freinage', 'Brake switch'),
    short: l(
      'Court-circuite l’alternateur pour l’arrêter, jamais la batterie.',
      'Short-circuits the alternator to stop it, never the battery.',
    ),
    description: lf(
      'L’interrupteur de freinage est un interrupteur à deux pôles, de 20 A en 12 V continu, placé entre les trois fils de la machine et le redresseur. Fermé, il met l’alternateur en court-circuit : les bobines s’opposent à la rotation et le rotor ne tourne plus que très lentement (≈ {brakeRpm} tr/min à 8 m/s dans le modèle). Il ne faut jamais court-circuiter la batterie : le fusible sauterait. Ce n’est ni un verrou ni une assurance en pleine tempête : on ne s’approche pas d’une machine qui tourne.',
      'The brake switch is a two-pole switch, rated 20 A at 12 V DC, placed between the machine’s three wires and the rectifier. Closed, it short-circuits the alternator: the coils oppose the rotation and the rotor only turns very slowly (≈ {brakeRpm} rpm at 8 m/s in the model). The battery must never be short-circuited: the fuse would blow. It is neither a lock nor a guarantee in a full storm: do not approach a machine that is turning.',
    ),
    material: l('Interrupteur bipolaire sous boîtier étanche', 'Two-pole switch in a weatherproof box'),
    specs: [
      sp('Calibre', 'Rating', l('2 pôles, 20 A en 12 V continu (plans)', '2 poles, 20 A at 12 V DC (plans)')),
      sp(
        'Effet fermé',
        'Effect when closed',
        l(
          'alternateur en court-circuit, couple régulier et très raide (plans)',
          'alternator shorted, smooth and very stiff torque (plans)',
        ),
      ),
      sp('Rotor freiné à 8 m/s', 'Braked rotor at 8 m/s', tf('model', '≈ {brakeRpm} tr/min', '≈ {brakeRpm} rpm')),
      sp(
        'À ne jamais court-circuiter',
        'Never short-circuit',
        l('la batterie (le fusible saute)', 'the battery (the fuse blows)'),
      ),
      sp('Alarme du labo', 'Lab alarm', l('plus de 20 A : surintensité', 'above 20 A: overcurrent')),
    ],
    maintenance: maint(
      {
        failure:
          'Des contacts oxydés ou collés par l’humidité, un interrupteur trop petit qui chauffe, ou un frein oublié fermé : la machine ne charge plus et la batterie se vide.',
        check:
          'Par vent modéré, fermez-le : le rotor doit ralentir nettement ; rouvrez-le : la charge doit reprendre. La manette doit être franche, sans point dur.',
        care: 'Mettez-le dans une boîte sèche et manœuvrez-le de temps en temps : des contacts qui ne bougent jamais s’oxydent.',
      },
      {
        failure:
          'Oxidised contacts or contacts stuck by damp, a switch too small that heats up, or a brake left closed: the machine no longer charges and the battery runs down.',
        check:
          'In a moderate wind, close it: the rotor must slow clearly; open it: charging must resume. The lever must be crisp, with no tight spot.',
        care: 'Keep it in a dry box and work it from time to time: contacts that never move oxidise.',
      },
    ),
    tip: l(
      'Fermez-le avant de monter, de descendre ou de toucher la machine, et gardez en tête que tension et courant restent présents tant que le rotor tourne, même lentement.',
      'Close it before climbing, lowering or touching the machine, and remember that voltage and current stay present as long as the rotor turns, even slowly.',
    ),
    design: l(
      'Un alternateur en court-circuit freine tout seul : il n’y a rien de mécanique à user, ni frein à disque ni sangle. Les plans lui donnent un interrupteur ordinaire, que le modèle du labo reproduit.',
      'A short-circuited alternator brakes itself: there is nothing mechanical to wear, no disc brake and no strap. The plans give it an ordinary switch, which the lab’s model reproduces.',
    ),
    qty: 1,
  },
  {
    id: 'rectifier',
    scene: 'shed',
    category: 'electrical',
    name: l('Redresseur', 'Rectifier'),
    short: l(
      'Transforme le courant alternatif des trois fils en courant continu pour la batterie.',
      'Turns the alternating current of the three wires into direct current for the battery.',
    ),
    description: lf(
      'La machine produit un courant alternatif triphasé, que la batterie ne sait pas recevoir. Le redresseur, un pont de diodes, ne laisse passer le courant que dans un sens : la tension continue vaut environ 1,4 fois la tension alternative, moins 1,5 V perdus dans les diodes (plans). C’est pourquoi la machine, qui ne donne que 1,9 V alternatifs à un tour par seconde, ne charge qu’au-delà de ≈ {cutInRpm} tr/min dans le modèle. Dans les plans, deux ponts de diodes côte à côte offrent assez de bornes pour trois fils ; le wiki préfère un redresseur triphasé dans un boîtier étanche sur la machine.',
      'The machine makes three-phase alternating current, which the battery cannot take. The rectifier, a diode bridge, lets the current through one way only: the DC voltage is about 1.4 times the AC voltage, minus 1.5 V lost in the diodes (plans). That is why the machine, which gives only 1.9 V AC at one turn per second, charges only beyond ≈ {cutInRpm} rpm in the model. In the plans two diode bridges side by side offer enough terminals for three wires; the wiki prefers a three-phase rectifier in a sealed box on the machine.',
    ),
    material: l('Ponts de diodes sur dissipateur en aluminium', 'Diode bridges on an aluminium heatsink'),
    specs: [
      sp(
        'Montage des plans',
        'The plans’ layout',
        l('deux ponts monophasés, au pied du mât', 'two single-phase bridges, at the foot of the mast'),
      ),
      sp('Chute de tension', 'Voltage drop', l('≈ 1,5 V au total (plans)', '≈ 1.5 V in total (plans)')),
      sp('Tension continue', 'DC voltage', l('≈ 1,4 × alternative − 1,5 V (plans)', '≈ 1.4 × AC − 1.5 V (plans)')),
      sp('Début de la charge', 'Charging starts', tf('model', '≈ {cutInRpm} tr/min', '≈ {cutInRpm} rpm')),
      sp('Perte dans les diodes à 12 m/s', 'Diode loss at 12 m/s', tf('model', '≈ {diode12} W')),
    ],
    maintenance: maint(
      {
        failure:
          'Un pont qui chauffe faute de dissipateur, ou des connexions qui prennent l’humidité et se corrodent (les plans conseillent une bouteille en plastique comme abri de pluie). Une diode claquée fait baisser la charge.',
        check:
          'Avec un multimètre, comparez la tension continue de sortie et la tension alternative d’entrée : la sortie vaut ≈ 1,4 fois l’entrée moins 1,5 V (plans).',
        care: 'Fixez les ponts sur une cornière d’aluminium, abritez-les de l’eau et resserrez les cosses chaque année.',
      },
      {
        failure:
          'A bridge that overheats for lack of a heatsink, or connections that take damp and corrode (the plans suggest a plastic bottle as a rain shield). A blown diode lowers the charge.',
        check:
          'With a multimeter, compare the DC output voltage with the AC input voltage: the output is ≈ 1.4 times the input minus 1.5 V (plans).',
        care: 'Bolt the bridges to an aluminium angle, shelter them from water and re-tighten the lugs every year.',
      },
    ),
    tip: l(
      'Un fil alternatif se branche sur n’importe quelle borne alternative (les deux bornes en diagonale) ; la borne positive du pont est à angle droit des autres.',
      'An AC wire goes on any AC terminal (the two diagonal ones); the bridge’s positive terminal is at right angles to the others.',
    ),
    design: l(
      'Un pont de diodes n’a ni pièce mobile ni réglage, et il laisse l’alternateur « se débrouiller » : plus le rotor tourne vite, plus la tension monte, jusqu’à dépasser la batterie. Le prix à payer est cette chute de 1,5 V, qui retarde le début de la charge.',
      'A diode bridge has no moving part and no adjustment, and it lets the alternator “fend for itself”: the faster the rotor turns, the higher the voltage rises, until it passes the battery’s. The price is that 1.5 V drop, which delays the start of charging.',
    ),
  },
  {
    id: 'fuse',
    scene: 'shed',
    category: 'electrical',
    name: l('Fusible', 'Fuse'),
    short: l(
      'Protège le câble et la batterie en cas de court-circuit.',
      'Protects the cable and the battery in a short circuit.',
    ),
    description: l(
      'Dans les plans, tout circuit qui part d’une batterie porte un fusible ou un disjoncteur : c’est une règle de sécurité, pas une option. Celui de l’éolienne est sur le fil positif, entre les redresseurs et la batterie ; la maison a le sien, et un circuit de fil mince, comme celui du voltmètre, un fusible plus petit. Une batterie de 12 V peut débiter un courant énorme dans un court-circuit : sans fusible, le câble chauffe jusqu’à l’incendie.',
      'In the plans every circuit that leaves a battery has a fuse or a circuit breaker: it is a safety rule, not an option. The turbine’s sits on the positive wire, between the rectifiers and the battery; the house has its own, and a thin-wire circuit, like the voltmeter’s, a smaller fuse. A 12 V battery can deliver an enormous current in a short circuit: without a fuse the cable heats up to the point of fire.',
    ),
    material: l('Fusible ou disjoncteur, cosses serties', 'Fuse or circuit breaker, crimped lugs'),
    specs: [
      sp(
        'Position',
        'Position',
        l(
          'fil +, entre les redresseurs et la batterie (plans)',
          '+ wire, between the rectifiers and the battery (plans)',
        ),
      ),
      sp(
        'Circuits protégés',
        'Protected circuits',
        l('un pour l’éolienne, un pour les charges (plans)', 'one for the turbine, one for the loads (plans)'),
      ),
      sp(
        'Calibre',
        'Rating',
        l(
          'non donné par les plans : sous ce que le câble supporte',
          'not given by the plans: below what the cable can carry',
        ),
      ),
      sp('Courant normal à 12 m/s', 'Normal current at 12 m/s', tf('model', '≈ {amps12} A')),
      sp(
        'Connexions',
        'Connections',
        l('cosses serties, jamais de pinces crocodiles (plans)', 'crimped lugs, never crocodile clips (plans)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un fusible qui saute sans raison apparente (calibre trop juste, connexion qui chauffe), ou, pire, remplacé par un fil de cuivre ou un modèle plus fort.',
        check:
          'Regardez s’il est noirci et vérifiez qu’il porte le calibre prévu ; une connexion qui chauffe laisse une trace brune.',
        care: 'Gardez des fusibles de rechange du bon calibre, et ne remplacez jamais un fusible par plus fort que le câble ne le permet.',
      },
      {
        failure:
          'A fuse that blows for no apparent reason (rating too tight, a connection that heats), or, worse, replaced by a copper wire or a stronger one.',
        check:
          'Look whether it is blackened and check it carries the intended rating; a connection that heats leaves a brown mark.',
        care: 'Keep spare fuses of the right rating, and never swap a fuse for a stronger one than the cable allows.',
      },
    ),
    tip: l(
      'Quand il saute, cherchez pourquoi avant de le changer : les plans le citent comme ce qui arrive si l’on court-circuite la batterie avec l’interrupteur de freinage.',
      'When it blows, find out why before replacing it: the plans cite it as what happens if you short-circuit the battery with the brake switch.',
    ),
    design: l(
      'Le fusible est la seule protection qui ne dépend de personne : il coupe même si l’on est loin, endormi ou distrait. C’est pourquoi les plans le placent sur chaque circuit.',
      'The fuse is the only protection that depends on nobody: it cuts even if you are far away, asleep or distracted. That is why the plans put one on every circuit.',
    ),
    qty: 1,
  },
  {
    id: 'charge-controller',
    scene: 'shed',
    category: 'electrical',
    name: l('Régulateur de charge', 'Charge controller'),
    short: l(
      'Surveille la tension : envoie le surplus au délesteur à 14 V et coupe la maison sous 11,5 V.',
      'Watches the voltage: sends the surplus to the dump load at 14 V and cuts the house off below 11.5 V.',
    ),
    description: l(
      'Une batterie au plomb s’abîme si on la décharge trop ou si on la charge trop fort. Les plans fixent les repères : sous 11,5 V elle est trop déchargée, au-dessus de 14 V le courant de charge est trop fort. Un régulateur automatique s’en charge : un « délesteur » qui envoie l’excédent dans une charge de dérivation, et une coupure basse tension qui débranche la maison. Les plans décrivent un petit circuit à deux relais de 16 A ; le wiki rappelle qu’un régulateur est nécessaire entre l’éolienne et la batterie.',
      'A lead-acid battery is damaged if it is discharged too deeply or charged too hard. The plans set the marks: below 11.5 V it is too deeply discharged, above 14 V the charging current is too high. An automatic controller handles this: a “dump” that sends the surplus into a diversion load, and a low-voltage disconnect that cuts the house off. The plans describe a small circuit with two 16 A relays; the wiki reminds that a controller is needed between the turbine and the battery.',
    ),
    material: l(
      'Circuit électronique et relais 12 V, boîtier abrité',
      'Electronic circuit and 12 V relays, sheltered box',
    ),
    specs: [
      sp('Charge trop forte', 'Charging too hard', l('au-dessus de 14 V (plans)', 'above 14 V (plans)')),
      sp('Décharge trop profonde', 'Discharge too deep', l('sous 11,5 V (plans)', 'below 11.5 V (plans)')),
      sp('Relais du circuit des plans', 'Relays of the plans’ circuit', l('12 V, 16 A', '12 V, 16 A')),
      sp('Reconnexion de la maison', 'House reconnection', tf('assumed', '12,5 V', '12.5 V')),
      sp('Courant maximal du délesteur', 'Dump load’s largest current', tf('assumed', '16 A')),
    ],
    maintenance: maint(
      {
        failure:
          'Un relais collé ou grillé : le régulateur ne délestera plus, la tension monte et la batterie surchauffe. Un seuil mal réglé coupe la maison trop tôt ou trop tard.',
        check:
          'Par vent fort, batterie pleine, la tension doit rester vers 14 V et le délesteur chauffer. Les plans conseillent aussi de lire le voltmètre : sous 11,5 V on consomme trop, au-dessus de 14 V on gaspille.',
        care: 'Abritez le boîtier, reprenez les connexions chaque année, et vérifiez les seuils avec un voltmètre de confiance.',
      },
      {
        failure:
          'A stuck or burnt relay: the controller no longer dumps, the voltage climbs and the battery overheats. A badly set threshold cuts the house off too early or too late.',
        check:
          'In a strong wind with a full battery, the voltage must stay near 14 V and the dump load must warm up. The plans also advise reading the voltmeter: below 11.5 V you use too much, above 14 V you waste.',
        care: 'Shelter the box, re-check the connections every year, and verify the thresholds with a trustworthy voltmeter.',
      },
    ),
    tip: l(
      'Les plans donnent un repère simple sans voltmètre : des lampes qui faiblissent signalent une batterie basse, des lampes très vives trop de vent pour la batterie.',
      'The plans give a simple clue without a voltmeter: dimming lights mean a low battery, very bright lights mean too much wind for the battery.',
    ),
    design: l(
      'Une éolienne ne choisit pas quand le vent souffle. Le régulateur découple la production de la consommation : ce que la batterie ne peut pas prendre, il le brûle plutôt que de l’abîmer.',
      'A wind turbine does not choose when the wind blows. The controller decouples production from consumption: what the battery cannot take, it burns rather than ruin it.',
    ),
    qty: 1,
  },
  {
    id: 'dump-load',
    scene: 'shed',
    category: 'electrical',
    name: l('Délesteur', 'Dump load'),
    short: l(
      'Résistance qui absorbe l’excédent quand la batterie est pleine.',
      'Resistor that soaks up the surplus when the battery is full.',
    ),
    description: l(
      'Quand la batterie est pleine et que le vent souffle encore, l’énergie doit aller quelque part, sinon la tension monte et la batterie souffre. Le délesteur est une charge, une résistance en général, que le régulateur branche à 14 V : elle transforme le surplus en chaleur, pour tenir la tension. Les plans y voient aussi une occasion : plus d’électricité à consommer en temps venteux, par exemple pour charger les batteries de voisins. Une éolienne sans délesteur a besoin que quelqu’un consomme.',
      'When the battery is full and the wind still blows, the energy has to go somewhere, or the voltage climbs and the battery suffers. The dump load is a load, usually a resistor, that the controller connects at 14 V: it turns the surplus into heat to hold the voltage. The plans see an opportunity in it too: more electricity to use in windy weather, for example to charge neighbours’ batteries. A turbine without a dump load needs someone to consume.',
    ),
    material: l('Résistances de puissance sur dissipateur', 'Power resistors on a heatsink'),
    specs: [
      sp('Rôle', 'Role', l('tenir la batterie à 14 V (plans)', 'hold the battery at 14 V (plans)')),
      sp(
        'Courant maximal dans le modèle',
        'Largest current in the model',
        tf('assumed', '16 A, comme le relais des plans', '16 A, like the plans’ relay'),
      ),
      sp(
        'Puissance à dissiper',
        'Power to dissipate',
        tf('derived', '≈ {dumpW} W (14 V × 16 A)', '≈ {dumpW} W (14 V × 16 A)'),
      ),
      sp(
        'Sans délesteur',
        'Without a dump load',
        l('la tension dépasse 14 V, alarme de surcharge', 'the voltage exceeds 14 V, overcharge alarm'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une résistance qui chauffe sans dissipateur ni aération, un fil qui s’échauffe, un relais qui reste collé en position branchée et vide la batterie.',
        check:
          'Quand le régulateur délestera, la résistance doit chauffer franchement, et la tension rester vers 14 V ; ne la touchez pas : elle est brûlante.',
        care: 'Dégagez-la de tout ce qui brûle, laissez-la respirer et dépoussiérez-la chaque année.',
      },
      {
        failure:
          'A resistor that overheats with no heatsink or ventilation, a wire that warms up, a relay that stays stuck in the connected position and empties the battery.',
        check:
          'When the controller dumps, the resistor must warm up clearly and the voltage stay near 14 V; do not touch it: it is scalding.',
        care: 'Clear it of anything flammable, let it breathe and dust it once a year.',
      },
    ),
    tip: l(
      'Chauffer de l’eau avec le surplus est une bonne idée de principe, mais le délesteur doit être dimensionné pour le courant maximal, pas pour la moyenne.',
      'Heating water with the surplus is a good idea in principle, but the dump load must be sized for the largest current, not for the average.',
    ),
    design: l(
      'Brûler l’excédent est inélégant mais sûr : pas de pièce mobile, rien à régler. C’est aussi ce qui rend la machine tolérante, qu’une batterie soit pleine ou qu’une maison soit absente.',
      'Burning the surplus is inelegant but safe: no moving part, nothing to adjust. It is also what makes the machine forgiving, whether a battery is full or a house is empty.',
    ),
    qty: 1,
  },
  {
    id: 'battery-bank',
    scene: 'shed',
    category: 'electrical',
    name: l('Batteries', 'Battery bank'),
    short: l(
      'Réserve d’énergie en 12 V au plomb : à garder chargée, sans décharge profonde.',
      '12 V lead-acid reserve: keep it charged, never deeply discharged.',
    ),
    description: l(
      'La batterie est la réserve qui comble les temps sans vent : elle reçoit le courant redressé et alimente la maison. Les plans la veulent toujours chargée : une batterie trop déchargée ou laissée longtemps vide se sulfate et devient inutilisable ; en cas de panne de l’éolienne, rechargez-la depuis une autre source sous deux semaines. La charge la plus saine est un petit courant pendant longtemps. La vidéo ne montre aucune batterie : le labo en dessine une, de 12 V.',
      'The battery is the reserve that bridges windless spells: it receives the rectified current and feeds the house. The plans want it kept charged: a battery too deeply discharged or left empty for long sulphates and becomes useless; if the turbine breaks down, recharge it from another source within two weeks. The healthiest charge is a small current for a long time. The video shows no battery: the lab draws a 12 V one.',
    ),
    material: l('Batterie au plomb 12 V', '12 V lead-acid battery'),
    specs: [
      sp('Tension nominale', 'Nominal voltage', '12 V'),
      sp(
        'Limites de tension',
        'Voltage limits',
        l(
          '11,5 V (trop déchargée) à 14 V (charge trop forte) (plans)',
          '11.5 V (too deeply discharged) to 14 V (charging too hard) (plans)',
        ),
      ),
      sp(
        'Capacité du labo',
        'Lab capacity',
        tf('assumed', '100 Ah par défaut, réglable', '100 Ah by default, adjustable'),
      ),
      sp(
        'Recharge après une panne',
        'Recharge after a failure',
        l('sous 2 semaines (plans)', 'within 2 weeks (plans)'),
      ),
      sp('Consommation de la maison', 'House load', tf('assumed', '{house} W par défaut', '{house} W by default')),
    ],
    maintenance: maint(
      {
        failure:
          'Une décharge trop profonde ou trop longue (sulfatation), une charge trop forte qui chauffe, des cosses qui s’oxydent ; une batterie au plomb ouverte dégage de l’hydrogène, qui peut exploser.',
        check:
          'Mesurez la tension au repos : sous 11,5 V, on consomme trop ; au-dessus de 14 V en charge, on gaspille. Cosses propres, boîtier sans gonflement.',
        care: 'Ventilez le local, ne posez jamais d’outil métallique sur les bornes, utilisez des cosses serties (pas de pinces crocodiles) et rechargez vite après une panne.',
      },
      {
        failure:
          'Too deep or too long a discharge (sulphation), a charge too hard that heats, lugs that oxidise; an open lead-acid battery gives off hydrogen, which can explode.',
        check:
          'Measure the resting voltage: below 11.5 V you use too much; above 14 V while charging you waste. Clean lugs, no swelling of the case.',
        care: 'Ventilate the room, never lay a metal tool across the terminals, use crimped lugs (no crocodile clips) and recharge quickly after a breakdown.',
      },
    ),
    tip: l(
      'Aucun objet métallique sur les bornes : une clé qui les relie fait de grosses étincelles et des brûlures, préviennent les plans.',
      'No metal object across the terminals: a spanner that joins them makes big sparks and burns, the plans warn.',
    ),
    design: l(
      'La batterie découple le vent de la consommation, mais elle impose ses limites : 11,5 V et 14 V encadrent tout le réglage. À petite échelle, c’est elle qui fixe aussi le choix de 12 V pour l’alternateur de la vidéo.',
      'The battery decouples the wind from consumption, but it imposes its limits: 11.5 V and 14 V frame the whole regulation. At small scale it also sets the choice of 12 V for the video’s alternator.',
    ),
    qty: 1,
  },
];
