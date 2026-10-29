// Shared types of the wind turbine simulation. The engine (engine.ts) writes `PiggottState` every frame; the 3D scene,
// the strip and the simulation panel only read it. Units are written in the field comments: SI everywhere (W, V, A,
// m/s, N, N·m) except rotor speed in rpm and angles in degrees where a human reads them.

export type PresetId = 'calm-valley' | 'hamlet' | 'windy-plateau';
export type ScenarioId =
  | 'wind-sweep'
  | 'gusts'
  | 'storm'
  | 'storm-fixed-tail'
  | 'battery-full'
  | 'runaway'
  | 'brake-switch'
  | 'thin-cable'
  | 'low-mast'
  | 'few-turns'
  | 'stator-24v';

export type AlarmKey =
  'lowBattery' | 'batteryFull' | 'overcharge' | 'overspeed' | 'runaway' | 'brakeOn' | 'furling' | 'overload';

/** Everything the user can edit live (all through `PiggottSim.set`). Ranges are in presets.ts (`RANGES`). */
export interface PiggottParams {
  // ---- kit time controls (required by LabSim)
  /** Visual slow motion of the fast dynamics (rotor, gusts, yaw): 1, 0.2, 0.05, 0.02. */
  slowMo: number;
  /** Simulated seconds per real second for the slow quantities (battery, clock, weather, energy): 1, 60, 600, 3600. */
  timeScale: number;
  running: boolean;
  /** Which preset the values come from; becomes 'custom' as soon as the user edits something. */
  preset: PresetId | 'custom';

  // ---- site and wind
  /** Mean wind speed of the site at 10 m above open ground (the usual weather-station figure), m/s. */
  meanWind: number;
  /** Weibull shape factor k of the yearly distribution (2 = Rayleigh). */
  weibullK: number;
  /** The hour-to-hour mean wind wanders around the site mean with the Weibull distribution (off = a steady mean). */
  weather: boolean;
  /** Gustiness multiplier: 1 = the turbulence the site gives, 0 = a perfectly steady wind. */
  gusts: number;
  /** Mast height (hub height), m. */
  mastHeight: number;
  /** Height of the trees and buildings near the mast, m (0 = open field). */
  obstacleHeight: number;
  /** Altitude of the site, m (air density). */
  altitude: number;

  // ---- machine
  /** Rotor diameter, m (1.0 to 4.2, K3). The alternator, tail, inertia are scaled with it (docs/physics.md §1.8). */
  diameter: number;
  /** Turns per coil of the stator, referred to the 1.2 m alternator (76 = the 12 V machine of the video, K7). */
  turns: number;
  /** Tail weight relative to the weight that makes this machine furl at 10 m/s (1 = the design, K12). */
  tailWeight: number;
  /** Tail locked in place (no furling): the storm comparison. */
  fixedTail: boolean;

  // ---- electrical
  /** Cable length from the turbine to the battery, one way, m. */
  cableLength: number;
  /** Cable cross-section of each conductor, mm². */
  cableSection: number;
  /** Battery connected to the rectifier (off = the rotor runs away, K22). */
  batteryConnected: boolean;
  /** Brake switch closed: the alternator is short-circuited (never the battery, K22). */
  brake: boolean;
  /** Dump load connected: holds the battery at 14 V (K22). */
  dumpLoad: boolean;
  /** Battery capacity, Ah. */
  batteryAh: number;
  /** Constant power drawn by the house, W (cut off below 11.5 V, K22). */
  loadPower: number;
}

/** Cycle-averaged results of the steady-state solver: what the machine does in a given steady wind (see `operatingPoint`). */
export interface OperatingPoint {
  /** Wind speed at the hub, m/s, and the part normal to the rotor (v·cos yaw). */
  wind: number;
  windNormal: number;
  /** Rotor speed, rad/s and rpm. */
  omega: number;
  rpm: number;
  /** Yaw of the rotor axis away from the wind, rad. */
  yaw: number;
  /** Tip speed ratio (normal wind), power and thrust coefficients. */
  lambda: number;
  cp: number;
  ct: number;
  /** Power of the wind through the full disc, W (½ρAv³, not reduced by the yaw). */
  windPower: number;
  /** Aerodynamic power of the rotor, W. */
  rotorPower: number;
  /** Rotor thrust, N. */
  thrust: number;
  /** Bearing friction, W. */
  frictionLoss: number;
  /** Mechanical power into the alternator (air gap), W. */
  airGapPower: number;
  /** Alternator copper loss, rectifier diodes, cable (round trip), W. */
  copperLoss: number;
  diodeLoss: number;
  cableLoss: number;
  /** Open-circuit EMF between phases (rms), V, and the rectified open-circuit voltage 1.35·E, V. */
  emf: number;
  openCircuitVolts: number;
  /** Rectified current out of the alternator, A. */
  dcCurrent: number;
  /** Voltage at the battery terminals, V. */
  busVoltage: number;
  /** Power delivered to the battery bus (battery + dump + house), W. */
  busPower: number;
  /** Net power into the battery cells, W (negative = discharging), and its current, A. */
  batteryPower: number;
  batteryCurrent: number;
  dumpPower: number;
  loadPower: number;
}

/** The state handed to the 3D scene, the strip and the panel every frame (flat, read only). */
export interface PiggottState {
  // ---- clock (slow clock: advances by dt × timeScale)
  /** Simulated seconds since the start of the run. */
  simTime: number;
  /** Whole days elapsed, and the hour of the simulated day, 0..24 (the run starts at 08:00). */
  day: number;
  hour: number;

  // ---- wind
  /** Wind speed at the hub right now (mean × gusts), m/s. */
  wind: number;
  /** Hour-to-hour mean wind at the hub (site mean × height × trees × weather), m/s. */
  windMean: number;
  /** Turbulence intensity applied (σ / mean). */
  turbulence: number;
  /** Air density, kg/m³. */
  airDensity: number;

  // ---- rotor (fast clock: slowed by slowMo)
  /** Rotor speed, rpm and rad/s. */
  rpm: number;
  omega: number;
  /** Speed of the blade tips, m/s, and tip speed ratio (normal wind). */
  tipSpeed: number;
  lambda: number;
  /** Power coefficient and thrust coefficient at this tip speed ratio. */
  cp: number;
  ct: number;
  /** Power of the wind through the full disc, W, and aerodynamic power of the rotor, W. */
  windPower: number;
  rotorPower: number;
  /** Thrust on the rotor, N. */
  thrust: number;

  // ---- for the 3D view
  /** Visual rotor angle, rad in 0..2π, increasing with time. Its speed is capped at 2.5 turns per real second. */
  rotorAngle: number;
  /** 0..1: how much the rotor must be drawn as a blur disc (fast rotations look like they run backwards on screen). */
  rotorBlur: number;
  /** Yaw of the rotor axis away from the wind, degrees (0 = facing the wind; the tail stop holds it at about 5). */
  yaw: number;
  /** Swing of the tail about its inclined hinge, degrees, 0 on its stop to 95 fully folded (K13). */
  tailSwing: number;
  /** 0..1: how far the machine is furled (0 on the stop, 1 fully folded). */
  furled: number;

  // ---- alternator, rectifier, battery
  /** EMF between phases (rms), V, and the rectified open-circuit voltage, V. */
  emf: number;
  openCircuitVolts: number;
  /** Electrical frequency, Hz. */
  frequency: number;
  /** Rectified current out of the alternator, A. */
  dcCurrent: number;
  /** Voltage at the battery terminals (the bridge output when the battery is off), V. */
  busVoltage: number;
  /** Power delivered by the turbine to the battery bus, W (0 with the brake closed). */
  busPower: number;
  /** Net current into the battery, A (negative = discharging), and net power into the cells, W. */
  batteryCurrent: number;
  batteryPower: number;
  /** State of charge, 0..1. */
  soc: number;
  /** Power sent to the dump load, and drawn by the house, W. */
  dumpPower: number;
  loadPower: number;
  /** Losses along the chain, W: bearing friction, alternator copper, rectifier diodes, cable (round trip). */
  frictionLoss: number;
  copperLoss: number;
  diodeLoss: number;
  cableLoss: number;
  /** Efficiencies of the stages, 0..1: bearings, alternator copper, diodes, cable; rotor power over wind power; bus over rotor. */
  etaMech: number;
  etaAlternator: number;
  etaRectifier: number;
  etaCable: number;
  etaRotor: number;
  etaChain: number;
  /** Rotor speed at which the bridge starts to charge the battery, rpm. */
  cutInRpm: number;

  // ---- switches and flags
  brake: boolean;
  batteryConnected: boolean;
  /** The dump load is taking current. */
  dumpActive: boolean;
  /** The low-voltage disconnect has cut the house off. */
  lvdOpen: boolean;
  /** No path for the power (battery off, brake open) and the rotor is above the speed it charges at: it runs away. */
  runaway: boolean;
  /** Blade tips faster than 89 m/s (200 mph, S4). */
  overspeed: boolean;
  /** Rectified current above the 20 A of the brake switch and rectifier (S4). */
  overload: boolean;
  /** The battery is below 11.5 V under load or the house has been cut off (K22). */
  lowBattery: boolean;
  /** The battery cannot take the charge any more: the dump load is working, or it is at 100 % (K22). */
  batteryFull: boolean;
  /** The bus is above 14 V: the charge is too hard (K22). */
  overcharge: boolean;

  // ---- energy counters (slow clock, Wh)
  energyWind: number;
  energyRotor: number;
  energyBus: number;
  energyDump: number;
  energyLoad: number;
  /** Energy delivered to the bus since 00:00 of the simulated day, Wh. */
  energyToday: number;

  alarms: AlarmKey[];
}

/** The last minute of the live quantities, sampled every 0.25 s of fast time (for the time-series charts). */
export interface Scope {
  /** Fast-clock seconds. */
  t: number[];
  wind: number[];
  rpm: number[];
  rotorPower: number[];
  busPower: number[];
}

/** Slow history sampled every 5 simulated minutes (the last 48 h). */
export interface History {
  /** Simulated hours since the start. */
  hours: number[];
  /** State of charge, %. */
  soc: number[];
  /** Wind at the hub (hour-to-hour mean), m/s. */
  wind: number[];
  /** Power delivered to the bus, W (mean over gusts). */
  power: number[];
}

/** Energy balance of the fast clock, J: rotor + stored kinetic energy lost = friction + copper + diodes + cable + bus. */
export interface Ledger {
  rotor: number;
  friction: number;
  copper: number;
  diode: number;
  cable: number;
  /** Energy delivered at the bus (V·I), including what goes to the dump and the house. */
  bus: number;
}
