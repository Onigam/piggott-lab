import { getLang, registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels,
// guides) live in the kit; add here only what is specific to this lab. Every number written in a text comes from
// docs/research.md (K-numbers) or is derived in docs/physics.md; the figures the model computes are shown live, not written.

const LAB = {
  tagline: ['Explorer · Comprendre · Construire', 'Explore · Understand · Build'],
  sceneDevice: ['Dispositif', 'Device'],
  plansIntro: [
    'Planches A3 générées à partir des cotes du modèle 3D.',
    'A3 sheets generated from the 3D model dimensions.',
  ],
  lessonsIntro: ['Leçons courtes liées à la 3D.', 'Short lessons tied to the 3D view.'],
  groupDevice: ['Dispositif', 'Device'],
  disclaimer: [
    'Reconstitution pédagogique indépendante. Ce n’est pas un plan officiel.',
    'Independent educational reconstruction. It is not an official drawing.',
  ],

  // ---- simulation panel: presets, scenarios, actions
  simTitle: ['Simulation', 'Simulation'],
  preset: ['Préréglage', 'Preset'],
  presetCalmValley: ['Vallée calme : 3,5 m/s', 'Calm valley: 3.5 m/s'],
  presetHamlet: ['Hameau : 5 m/s', 'Hamlet: 5 m/s'],
  presetWindyPlateau: ['Plateau venteux : 7 m/s', 'Windy plateau: 7 m/s'],
  custom: ['Personnalisé', 'Custom'],
  reset: ['Recommencer', 'Start over'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioWindSweep: ['Balayage du vent, de 1 à 20 m/s', 'Wind sweep, 1 to 20 m/s'],
  scenarioGusts: ['Rafales', 'Gusts'],
  scenarioStorm: ['Tempête : la queue se replie', 'Storm: the tail folds'],
  scenarioStormFixedTail: ['Tempête, queue bloquée', 'Storm, tail locked'],
  scenarioBatteryFull: ['Batterie pleine : le délesteur', 'Full battery: the dump load'],
  scenarioRunaway: ['Batterie débranchée : emballement', 'Battery disconnected: runaway'],
  scenarioBrakeSwitch: ['Interrupteur de freinage', 'Brake switch'],
  scenarioThinCable: ['Câble trop fin et trop long', 'Cable too thin and too long'],
  scenarioLowMast: ['Mât trop bas : turbulence', 'Mast too low: turbulence'],
  scenarioFewTurns: ['Trop peu de spires', 'Too few turns'],
  scenarioStator24v: ['Stator 24 V sur batterie 12 V', '24 V stator on a 12 V battery'],
  scenarioHint: [
    'Chaque scénario règle le site et la machine. Réglez la vitesse du temps en bas de l’écran (×60, ×600, ×3600) pour voir les heures défiler, et le ralenti de la barre d’outils pour suivre une rafale.',
    'Each scenario sets the site and the machine. Set the time speed at the bottom of the screen (×60, ×600, ×3600) to watch the hours go by, and the slow motion of the toolbar to follow a gust.',
  ],

  // ---- status line
  statusStill: ['Pas assez de vent pour faire démarrer le rotor.', 'Not enough wind to start the rotor.'],
  statusBelowCutIn: [
    'Le rotor tourne mais ne charge pas : la tension redressée n’atteint pas celle de la batterie (K20).',
    'The rotor turns but does not charge: the rectified voltage does not reach the battery’s (K20).',
  ],
  statusCharging: ['Le rotor charge la batterie.', 'The rotor is charging the battery.'],
  statusFurling: [
    'La queue s’est repliée : le rotor se met de biais au vent, la poussée et la puissance plafonnent (K12).',
    'The tail has folded: the rotor turns edge-on to the wind, the thrust and the power level off (K12).',
  ],
  statusRunaway: [
    'La batterie est débranchée : plus rien ne freine le rotor, il s’emballe et la tension à vide monte avec sa vitesse (K22). Fermez l’interrupteur de freinage.',
    'The battery is disconnected: nothing holds the rotor back, it runs away and the open-circuit voltage rises with its speed (K22). Close the brake switch.',
  ],
  statusOverspeed: [
    'Bouts de pale trop rapides : bruit et usure rapide du bord des pales. Fermez l’interrupteur de freinage.',
    'Blade tips too fast: noise and rapid wear of the blade edges. Close the brake switch.',
  ],
  statusOverload: [
    'Plus de 20 A, le calibre de l’interrupteur de freinage : l’alternateur et les diodes chauffent.',
    'More than 20 A, the rating of the brake switch: the alternator and the diodes overheat.',
  ],
  statusBrake: [
    'Interrupteur de freinage fermé : l’alternateur est en court-circuit et ne tourne que lentement ; la batterie n’est pas court-circuitée (K22).',
    'Brake switch closed: the alternator is short-circuited and turns only slowly; the battery is not short-circuited (K22).',
  ],
  statusFull: [
    'Batterie pleine : elle ne prend plus le courant, le délesteur absorbe l’excédent pour tenir 14 V (K22).',
    'Battery full: it cannot take the current any more, the dump load absorbs the surplus to hold 14 V (K22).',
  ],
  statusOvercharge: [
    'Plus de 14 V : la charge est trop forte pour la batterie (K22). Branchez le délesteur ou utilisez l’énergie.',
    'Above 14 V: the charge is too hard for the battery (K22). Connect the dump load or use the energy.',
  ],
  statusLow: [
    'Batterie trop déchargée (moins de 11,5 V) : la coupure basse tension a débranché la maison (K22).',
    'Battery too deeply discharged (below 11.5 V): the low-voltage disconnect has cut the house off (K22).',
  ],

  // ---- readouts
  liveWind: ['Vent au moyeu', 'Wind at the hub'],
  liveWindMean: ['Vent moyen', 'Mean wind'],
  liveRpm: ['Rotor', 'Rotor'],
  liveLambda: ['Vit. spéc. λ', 'Tip ratio λ'],
  liveCp: ['Cp du rotor', 'Rotor Cp'],
  liveWindPower: ['Puiss. du vent', 'Wind power'],
  liveRotorPower: ['Puiss. rotor', 'Rotor power'],
  liveBatteryPower: ['Vers batterie', 'To battery'],
  liveBatteryCurrent: ['Courant batt.', 'Battery current'],
  liveBatteryVolts: ['Tension batt.', 'Battery volts'],
  liveSoc: ['État de charge', 'Charge level'],
  liveCableLoss: ['Perte câble', 'Cable loss'],
  liveCopperLoss: ['Perte cuivre', 'Copper loss'],
  liveYaw: ['Écart au vent', 'Yaw error'],
  liveThrust: ['Poussée rotor', 'Rotor thrust'],
  liveOpenVolts: ['Tension à vide', 'Open voltage'],
  liveDump: ['Délesteur', 'Dump load'],
  liveHouse: ['Maison', 'House'],
  liveFurlOnset: ['Début du repli', 'Furling starts'],
  liveCutIn: ['Charge dès', 'Charges from'],

  // ---- power chain
  chainTitle: ['Du rotor à la batterie', 'From rotor to battery'],
  chainHint: [
    'Où va la puissance du rotor : roulements, cuivre de l’alternateur, diodes du redresseur, câble (aller-retour), batterie.',
    'Where the rotor power goes: bearings, alternator copper, rectifier diodes, cable (round trip), battery.',
  ],
  chainBattery: ['Batterie', 'Battery'],
  chainBearings: ['Roulements', 'Bearings'],
  chainCopper: ['Cuivre', 'Copper'],
  chainDiodes: ['Diodes', 'Diodes'],
  chainCable: ['Câble', 'Cable'],
  chainRotorOfWind: ['Rotor / vent', 'Rotor / wind'],
  chainBatteryOfRotor: ['Batterie / rotor', 'Battery / rotor'],

  // ---- controls
  secSite: ['Site et vent', 'Site and wind'],
  secMachine: ['Machine', 'Machine'],
  secElectric: ['Électricité', 'Electrics'],
  meanWind: ['Vent moyen du site à 10 m', 'Site mean wind at 10 m'],
  windHint: [
    'Le vent du site est celui d’une station météo à 10 m. La hauteur du mât, les arbres et l’altitude le transforment en vent au moyeu.',
    'The site wind is that of a weather station at 10 m. The mast height, the trees and the altitude turn it into the wind at the hub.',
  ],
  weibullK: ['Forme de la distribution, k', 'Distribution shape, k'],
  weibullHint: [
    'k = 2 : distribution de Rayleigh. Plus k est petit, plus le vent est irrégulier.',
    'k = 2: the Rayleigh distribution. The smaller k, the more irregular the wind.',
  ],
  gusts: ['Rafales, × le site', 'Gustiness, × the site'],
  weather: ['Météo variable d’heure en heure', 'Weather varying hour to hour'],
  mastHeight: ['Hauteur du mât', 'Mast height'],
  obstacleHeight: ['Arbres et obstacles', 'Trees and obstacles'],
  obstacleHint: [
    'Un mât doit dépasser la turbulence : plus il est haut, mieux c’est (K24). Dans le sillage des arbres le vent est plus faible et plus agité.',
    'A mast must clear the turbulence: the higher the better (K24). In the wake of the trees the wind is weaker and more turbulent.',
  ],
  altitude: ['Altitude', 'Altitude'],
  diameter: ['Diamètre du rotor', 'Rotor diameter'],
  diameterHint: [
    'De 1,0 à 4,2 m, la famille des stages Tripalium (K3). L’alternateur et la queue suivent le diamètre comme le ferait le constructeur.',
    'From 1.0 to 4.2 m, the Tripalium family (K3). The alternator and the tail follow the diameter as the maker would.',
  ],
  turns: ['Spires par bobine', 'Turns per coil'],
  turnsHint: [
    '76 spires de fil de 1,4 mm : l’alternateur 12 V de la vidéo (K7). Plus de spires, plus de volts à basse vitesse mais un rotor plus freiné ; moins de spires, il ne charge qu’avec plus de vent mais donne plus à vitesse élevée (K9).',
    '76 turns of 1.4 mm wire: the 12 V alternator of the video (K7). More turns, more volts at low speed but a rotor held back harder; fewer turns, it charges only in more wind but gives more at high speed (K9).',
  ],
  tailWeight: ['Poids de la queue, × la valeur de calcul', 'Tail weight, × the design value'],
  tailHint: [
    '1 : la queue qui commence à s’effacer vers 10 m/s (K12). Plus lourde, elle s’efface plus tard.',
    '1: the tail that starts to fold at about 10 m/s (K12). Heavier, it folds later.',
  ],
  fixedTail: ['Queue bloquée, sans effacement', 'Tail locked, no furling'],
  cableSection: ['Section du câble', 'Cable section'],
  cableLength: ['Longueur du câble, à l’aller', 'Cable length, one way'],
  cableHint: [
    'Perte I²R sur l’aller-retour : 38 % de la puissance produite à 12 V pour 500 W, 6 mm², 30 m (K21).',
    'I²R loss over the round trip: 38 % of the power generated at 12 V for 500 W, 6 mm², 30 m (K21).',
  ],
  batteryConnected: ['Batterie branchée', 'Battery connected'],
  brake: ['Interrupteur de freinage fermé', 'Brake switch closed'],
  brakeHint: [
    'Il court-circuite l’alternateur, jamais la batterie (K22).',
    'It short-circuits the alternator, never the battery (K22).',
  ],
  dumpLoad: ['Délesteur à 14 V', 'Dump load at 14 V'],
  batteryAh: ['Capacité de la batterie', 'Battery capacity'],
  loadPower: ['Consommation de la maison', 'House load'],
  loadHint: [
    'La maison est coupée sous 11,5 V, la batterie ne doit pas descendre plus bas (K22).',
    'The house is cut off below 11.5 V, the battery must not go lower (K22).',
  ],

  // ---- charts
  chartPower: ['Courbe de puissance', 'Power curve'],
  chartPowerHint: [
    'Vent fixe, batterie à mi-charge. La puissance annoncée de 200 W (K2) ne dit pas pour quel vent : le modèle trace ce que la machine donne, sans l’ajuster à ce chiffre (K19).',
    'Steady wind, battery half charged. The rated 200 W (K2) does not say at what wind: the model plots what the machine gives, without fitting it to that figure (K19).',
  ],
  seriesWindPower: ['Puissance du vent', 'Wind power'],
  seriesBetz: ['Limite de Betz (59 %)', 'Betz limit (59 %)'],
  seriesRotor: ['Rotor', 'Rotor'],
  seriesBattery: ['Batterie', 'Battery'],
  seriesRated: ['Annoncée (K2)', 'Rated (K2)'],
  chartCp: ['Coefficient de puissance du rotor', 'Rotor power coefficient'],
  chartCpHint: [
    'Cp en fonction de λ, la vitesse du bout des pales sur celle du vent. Le pic est à λ = 7 (K16), sous la limite de Betz (K15). Le point montre où l’alternateur maintient le rotor.',
    'Cp against λ, the blade tip speed over the wind speed. The peak is at λ = 7 (K16), under the Betz limit (K15). The dot shows where the alternator holds the rotor.',
  ],
  seriesCp: ['Cp du rotor', 'Rotor Cp'],
  seriesBetzCp: ['Limite de Betz', 'Betz limit'],
  chartLive: ['En direct', 'Live'],
  chartLiveWind: ['Vent au moyeu', 'Wind at the hub'],
  chartLiveRpm: ['Vitesse du rotor', 'Rotor speed'],
  chartLivePower: ['Puissance', 'Power'],
  chartLiveHint: [
    'La dernière minute. Le rotor met quelques secondes à suivre une rafale : son inertie est une estimation.',
    'The last minute. The rotor takes a few seconds to follow a gust: its inertia is an estimate.',
  ],
  chartWeibull: ['Le vent de l’année et l’énergie produite', 'The year’s wind and the energy produced'],
  chartWeibullHint: [
    'Part des heures de l’année et part de l’énergie, par tranche de 1 m/s de vent au moyeu. On passe la plupart du temps dans le vent faible, on récolte l’énergie plus haut.',
    'Share of the hours of the year and share of the energy, per 1 m/s band of hub wind. Most of the time is spent in light winds, the energy is harvested higher up.',
  ],
  seriesHours: ['Heures de l’année', 'Hours of the year'],
  seriesEnergy: ['Énergie produite', 'Energy produced'],
  yearlyTitle: ['Production sur l’année', 'Production over the year'],
  yearlyEnergy: ['Énergie', 'Energy'],
  yearlyMean: ['Puiss. moyenne', 'Mean power'],
  yearlyCf: ['Fact. charge', 'Load factor'],
  yearlySpecific: ['Par m² rotor', 'Per m² rotor'],
  yearlyHubWind: ['Vent au moyeu', 'Hub wind'],
  yearlyHint: [
    'Courbe de puissance intégrée sur la distribution de Weibull du site. Repère : 100 à 300 kWh par m² et par an pour des hélices dans des conditions voisines (K25). Le facteur de charge se compte sur les 200 W annoncés (K2), mis à l’échelle de la surface balayée.',
    'The power curve integrated over the site’s Weibull distribution. Benchmark: 100 to 300 kWh per m² per year for propellers in similar conditions (K25). The capacity factor is counted on the rated 200 W (K2), scaled with the swept area.',
  ],
  computing: ['Calcul des courbes…', 'Computing the curves…'],

  // ---- units
  unitRpm: ['tr/min', 'rpm'],
  unitKwhYear: ['kWh/an', 'kWh/yr'],
  unitKwhM2Year: ['kWh/m²/an', 'kWh/m²/yr'],
  clockDay: ['Jour', 'Day'],

  // ---- bottom strip
  stripWind: ['Vent', 'Wind'],
  stripRpm: ['Rotor', 'Rotor'],
  stripPower: ['Puissance', 'Power'],
  stripBattery: ['Batterie', 'Battery'],
  alarm_lowBattery: ['Batterie déchargée', 'Battery low'],
  alarm_batteryFull: ['Batterie pleine', 'Battery full'],
  alarm_overcharge: ['Surcharge (plus de 14 V)', 'Overcharge (above 14 V)'],
  alarm_overspeed: ['Survitesse', 'Overspeed'],
  alarm_runaway: ['Emballement', 'Runaway'],
  alarm_brakeOn: ['Frein fermé', 'Brake on'],
  alarm_furling: ['Queue repliée', 'Tail folded'],
  alarm_overload: ['Surintensité (plus de 20 A)', 'Overcurrent (above 20 A)'],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB);

/** The dictionary itself, for the parity test (src/panels/strings.test.ts). */
export const LAB_STRINGS: Record<string, readonly [string, string]> = LAB;

export type UiKey = keyof typeof LAB | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}

/** Number with the decimal separator of the interface language (7,5 in French, 7.5 in English). */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.round(Math.abs(value) * 10 ** digits) === 0) value = 0; // no "-0,0" for tiny negatives
  return value.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
