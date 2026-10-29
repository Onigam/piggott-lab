import { CU_RHO } from '@onigam/lab-kit/sim/electric';

// The machine of the video: constants in ONE place. Every constant is tagged
//   reported   stated in a source (K-number of docs/research.md §2, S-number of §1),
//   derived    computed from reported figures (the computation is written next to it),
//   estimate   the sources are silent: a guess with its reasoning, never used to hide a result,
//   calibrated an estimate that was chosen so that the model retrieves a reported figure (docs/physics.md §3).
// SI units everywhere (m, kg, s, V, A, Ω, H, rad/s) unless the name says otherwise.

// ---------------------------------------------------------------- air

/** Air density, kg/m³. reported: S3 (research §2 header). Adjusted with the altitude in `airDensity`. */
export const RHO_SEA = 1.23;
/** Scale height of the atmosphere used to correct the density with the altitude, m. estimate (isothermal atmosphere). */
export const ATMOSPHERE_SCALE_HEIGHT = 8500;
export const G = 9.81;

// ---------------------------------------------------------------- rotor

/** Rotor diameter of the machine of the video, m. reported: K1. */
export const DIAMETER_REF = 1.2;
/** Diameters of the Tripalium family, m (the diameter slider spans them). reported: K3. */
export const DIAMETER_MIN = 1.0;
export const DIAMETER_MAX = 4.2;
/** Number of blades. reported: K4. */
export const BLADE_COUNT = 3;
/** Design tip speed ratio of the blades. reported: K16 (S4 p. 9: "around 7"). */
export const LAMBDA_OPT = 7;
/**
 * Peak power coefficient of the blades. estimate inside the band reported by K15 ("25-35 %", S4 p. 9); 0.30 is the value
 * research §5 suggests, and K17's rule of thumb (0.15·D²·v³) corresponds to 0.31.
 */
export const CP_MAX = 0.3;
/**
 * Tip speed ratio at which the power coefficient falls back to zero (the unloaded rotor runs away). estimate: S4 p. 9 only
 * says that an unloaded rotor "runs away at a much higher speed". 10.75 is 1.54 × the design value, inside the usual
 * 1.4-1.6 of fixed-pitch three-blade rotors; with the peak fixed at 7 it gives the stall-regulated shoulder of such rotors,
 * Cp(4)/Cp_max = 0.63 and Cp(3)/Cp_max = 0.42. It is the most influential number nobody published: docs/physics.md §5
 * shows how the results move with it (10 → 12).
 */
export const LAMBDA_RUNAWAY = 10.75;
/**
 * Torque coefficient of the stalled rotor at standstill (T = ½ρA·R·v²·Cq). estimate: S4 says the twisted, tapered blades
 * "start up better from rest"; the sources give no starting torque.
 */
export const CQ_START = 0.04;
/** Tip speed ratio at which the starting-torque term of the blades has faded out. estimate. */
export const LAMBDA_START_FADE = 3;
/** Thrust coefficient of a lightly loaded rotor and at the Betz optimum 8/9. estimate (actuator disc theory), see rotor.ts. */
export const CT_STALLED = 0.35;
export const CT_FULL = 8 / 9;
export const LAMBDA_CT = 4;

/**
 * Moment of inertia of the rotating assembly (3 wooden blades + one steel disc with magnets + hub) at D = 1.2 m,
 * kg·m². estimate: 3 × 0.35 kg of timber at a radius of gyration ≈ 0.28 m (blade stations of S4 p. 43 give ≈ 0.8 L per
 * blade), one disc 230 × 6 mm of steel (K6) with 8 magnets of 46 × 30 × 10 mm, resin and the trailer hub (rounded up
 * from about 0.11). Not in any source; scales with D⁵.
 */
export const INERTIA_REF = 0.13;
/** Bearing friction torque, N·m, and its viscous part, N·m·s/rad, at D = 1.2 m. estimate (trailer hub bearings, S4 p. 44). */
export const FRICTION_STATIC_REF = 0.05;
export const FRICTION_VISCOUS_REF = 0.0005;
/** Tip speed above which the blades are noisy and erode (200 mph), m/s. reported: S4 p. 9. */
export const TIP_SPEED_LIMIT = 89;

// ---------------------------------------------------------------- alternator (axial flux, 3 phases, star)

/** Magnets per rotor disc, alternating N/S. reported: K6. */
export const MAGNETS_PER_DISC = 8;
/** Pole pairs (electrical cycles per turn). derived: 8 alternating poles. */
export const POLE_PAIRS = MAGNETS_PER_DISC / 2;
/** Coils in the stator, coils per phase (3 phases, "series star": coil n and n+3 in series). reported: K7, S4 p. 46. */
export const COIL_COUNT = 6;
export const COILS_PER_PHASE = 2;
/** Turns per coil and wire diameter of the machine of the video. reported: K7. */
export const TURNS_REF = 76;
export const WIRE_DIAMETER_REF = 1.4e-3;
/** Bench test: 1.9 V rms between phases at 1 turn per second. reported: K10 (S3 step 27). */
export const BENCH_RPM = 60;
export const BENCH_VOLTS_LL = 1.9;
/**
 * EMF constant, V·s/rad (line-to-line rms per rad/s). derived from K10: 1.9 V / (2π rad/s) = 0.3024. The only number the
 * electromagnetic part is calibrated on; the air gap, the flux and the turns are inside it.
 */
export const KE_LL_REF = BENCH_VOLTS_LL / ((BENCH_RPM * 2 * Math.PI) / 60);

// Stator geometry, S4 p. 46 (small machine supplement), reported:
/** Outer diameter of the cast stator, m. */
export const STATOR_OUTER = 0.264;
/** Hole in each coil = the footprint of a magnet (46 × 30 mm, K6), m. */
export const COIL_HOLE_LENGTH = 0.046;
export const COIL_HOLE_WIDTH = 0.03;
/** Outline of a coil as dimensioned on the stator drawing (3½ in × 2½ in), m. */
export const COIL_OUTLINE_LENGTH = 0.086;
export const COIL_OUTLINE_WIDTH = 0.07;
/** Thickness of the winding former (the axial thickness of a coil), m. */
export const COIL_FORMER = 0.011;

/** Radial build of the winding around the hole, m. derived: (outline − hole) / 2 = 20 mm on both sides. */
export const COIL_BUILD = (COIL_OUTLINE_LENGTH - COIL_HOLE_LENGTH) / 2;
/**
 * Mean length of a turn, m. derived from the stator drawing: the mid-build path round the 46 × 30 mm hole, with the
 * corners rounded on the mid-build radius: 2·(46 + 30) mm + 2π·(build/2) = 214.8 mm. Research §2 check 4 brackets it at
 * 0.19-0.24 m; the reported 1.5 kg of wire (K7) would need 0.24 m, so the geometry may be a little short.
 */
export const MEAN_TURN_LENGTH = 2 * (COIL_HOLE_LENGTH + COIL_HOLE_WIDTH) + 2 * Math.PI * (COIL_BUILD / 2);
/** Copper resistivity at 20 °C, Ω·m. reported: kit constant (0.0175 Ω·mm²/m), the one of K21. */
export const COPPER_RHO = CU_RHO * 1e-6;
/** Copper density, kg/m³ (used for the wire mass check of K7). */
export const COPPER_DENSITY = 8960;
/** Cross-section of the 1.4 mm wire, m². */
export const WIRE_AREA_REF = (Math.PI * WIRE_DIAMETER_REF ** 2) / 4;
/** Resistance of one phase at 20 °C, Ω. derived: 2 coils × 76 turns × 0.2148 m of 1.4 mm copper = 0.371 Ω. */
export const R_PHASE_REF = (COILS_PER_PHASE * TURNS_REF * MEAN_TURN_LENGTH * COPPER_RHO) / WIRE_AREA_REF;
/** Mass of the stator winding, kg. derived (check against the reported "about 1.5 kg", K7). */
export const WIRE_MASS_REF = COIL_COUNT * TURNS_REF * MEAN_TURN_LENGTH * WIRE_AREA_REF * COPPER_DENSITY;
/**
 * Synchronous inductance of one phase, H. estimate: an air-cored coil of 76 turns, a magnetic circuit of about 33 mm of
 * non-magnetic gap (two 10 mm magnets, two ~1 mm air gaps (K11), an 11 mm stator), two coils in series:
 * L ≈ 2·μ0·N²·A/g ≈ 1 mH. It only matters at high speed (ωL = 0.13 Ω at 300 rpm against R = 0.37 Ω).
 */
export const L_PHASE_REF = 1.0e-3;

// Rectifier
/** Total voltage drop of the two diodes in the conducting path of the three-phase bridge, V. reported: S4 p. 36 ("around 1.5 volts"). */
export const RECTIFIER_DROP = 1.5;
/** Rectified voltage of a three-phase bridge per volt rms between phases: 3√2/π. S4 rounds it to 1.4 (peak of a sine). */
export const BRIDGE_FACTOR = (3 * Math.SQRT2) / Math.PI;
/** Rating of the brake switch and of the rectifier circuit, A. reported: S4 p. 48 (2-pole 20 A switch). */
export const CURRENT_LIMIT = 20;

// Scaling with the rotor diameter (s = D / 1.2): research §5.8, K3, K18
/**
 * The alternator of the other sizes is designed as the maker does: same battery voltage, same cut-in wind speed, same
 * relative copper loss. EMF constant ∝ s, phase resistance and inductance ∝ 1/s² (more coils, grouped in parallel).
 * estimate: a design rule, checked on the single point K18 (the 2.4 m machine has 3.5 V at 60 rpm in S4 p. 36, 1.84 times
 * the 1.9 V of the 1.2 m one).
 */
export const KE_EXPONENT = 1;
export const R_EXPONENT = -2;

// ---------------------------------------------------------------- furling (tail on an inclined hinge)

/** Alternator offset from the yaw axis of the 1.2 m and of the 2.4 m machine, m. reported: K13. */
export const OFFSET_REF = 0.041;
export const OFFSET_24 = 0.125;
/** Power-law exponent of the offset with the diameter through the two reported points (0.041 m at 1.2, 0.125 m at 2.4). derived. */
export const OFFSET_EXPONENT = Math.log(OFFSET_24 / OFFSET_REF) / Math.log(2.4 / DIAMETER_REF);
/** Swing of the tail between its stop and the fully furled position, degrees. reported: K13 ("about 95°"). */
export const TAIL_SWING_DEG = 95;
/** Angle between the tail and the rotor plane at rest, degrees (tail stop). reported: K13 ("80° to the rotor plane"). */
export const TAIL_REST_DEG = 80;
/** Hinge axis inclination from the vertical, degrees. reported: K13. */
export const HINGE_TILT_DEG = 20;
/**
 * Yaw error of the machine while the tail rests on its stop, degrees: the vane needs a small angle of attack to carry the
 * thrust moment. estimate (S4 p. 31: the tail is set "at a slight angle to the side"; with a vane of 0.1-0.135 m² on a
 * 0.5-0.7 m boom and the thrust moment T·e, the balance gives 5-8°, independent of the wind speed).
 */
export const YAW_STOP_DEG = 5;
/** Yaw angle of the fully furled machine, degrees. derived: stop + the part of the 95° swing that turns the rotor (K13). */
export const YAW_FURLED_DEG = 85;
/** Time constant with which the machine follows its equilibrium yaw, s. estimate (a 1.2 m machine turns in about a second or two). */
export const YAW_TIME_CONSTANT = 1.5;
/**
 * Angle in the swing plane of the tail between the stop and the position where the weight torque of the tail is
 * highest (the hinge is inclined, so the weight pulls the tail back with a torque ∝ sin(u0 + fold)). estimate: S4 p. 31
 * states the principle (the thrust is held at a limit) but no geometry. With 55° the holding moment stays between -14 %
 * and +22 % of its value on the stop over the whole 80° of yaw, the behaviour of a tail that holds the thrust nearly
 * constant. It sets the shape of the power plateau after the furling, not its onset.
 */
export const TAIL_SWING_ORIGIN_DEG = 55;
/**
 * Arm of the effective tail weight about the yaw axis, m. estimate (a boom of 0.5-0.7 m, K13, with the weight spread
 * along it). Only the product weight × arm matters: the moment is what is calibrated.
 */
export const TAIL_ARM = 0.2;
/**
 * Effective tail weight of the 1.2 m machine, kg. calibrated: the value that makes the furling start at 10 m/s in the
 * steady-state model (K12), found by `calibrateTailMass` (tests check that it still does).
 */
export const TAIL_MASS_REF = 0.767;
/** Power-law exponent of the tail moment with the diameter: thrust ∝ D², offset ∝ D^OFFSET_EXPONENT. derived. */
export const TAIL_MOMENT_EXPONENT = 2 + OFFSET_EXPONENT;
/** Wind speed at which the furling of the machine of the video starts. reported: K12 ("about 10 m/s"). */
export const FURLING_SPEED = 10;

// ---------------------------------------------------------------- battery, regulation, house

/** Voltage limits of the 12 V battery, V. reported: K22 (S4 p. 37-42). */
export const BATTERY_LOW_VOLTS = 11.5;
export const BATTERY_HIGH_VOLTS = 14;
/** The low-voltage disconnect reconnects the loads above this voltage, V. estimate (hysteresis). */
export const LVD_RECONNECT_VOLTS = 12.5;
/** Largest current the dump load can take, A. estimate: the 12 V / 16 A relay of the controller in the parts list of S4 p. 41. */
export const DUMP_MAX_CURRENT = 16;
/** Capacity of the battery, Ah, and its internal resistance at 100 Ah, Ω. estimate: the sources do not size the battery. */
export const BATTERY_AH_DEFAULT = 100;
export const BATTERY_R_INT_100AH = 0.02;
/**
 * Extra resistance of a full lead-acid battery (the charging voltage rises as it fills), Ω at 100 Ah and SoC 1. estimate:
 * 1 Ω means a full battery takes about 1 A at 14 V, and a battery at 90 % about 5 A (K22 only gives the 14 V limit).
 */
export const BATTERY_R_FULL_100AH = 1.0;
/** Share of the charge current that is stored (Ah efficiency of a lead-acid battery). estimate. */
export const CHARGE_EFFICIENCY = 0.9;
/** State of charge a run starts with. estimate. */
export const SOC_START = 0.6;
/** State of charge used for the yearly yield and the power curves (a battery in the middle of its range). estimate. */
export const SOC_REFERENCE = 0.6;
/** Nominal power of the machine of the video, W. reported: K2 (the wind speed of the rating is not given, K19). */
export const NAMEPLATE_REF = 200;
