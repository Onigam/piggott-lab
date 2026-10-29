# Physics of the Piggott lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models the 1.2 m / 12 V
machine of the video (research §2, K1–K25) from the sources' figures only: a wind, a three-bladed rotor, an axial-flux
three-phase alternator with a diode bridge, a lead-acid battery with its regulation, a cable and a tail that folds the
machine out of the wind. The power curve, the cut-in, the furling plateau, the alternator's efficiency and the yearly yield
are **outcomes** of these equations, not curves drawn.

Words used for the status of a number: **reported** (stated in a source, K- or S-number of `docs/research.md`),
**derived** (computed from reported figures, the computation is written next to it), **estimate** (the sources are silent:
a guess with its reasoning, labelled so in `machine.ts`), **calibrated** (an estimate chosen so that the model retrieves a
reported figure). There is exactly one calibrated constant (§3). Nothing is hidden in an equation: every constant is named
and commented in `src/sim/machine.ts` (the machine) or next to the formula that uses it.

**The model was not tuned to print 200 W.** It prints about 63 W at its best. §7 gives the numbers, the reason, and how the
result moves with every assumption that could move it.

Files: `machine.ts` (the constants, one file), `physics.ts` (pure formulas of the sources), `wind.ts`, `rotor.ts`,
`alternator.ts`, `electrical.ts` (battery and bus), `furling.ts`, `config.ts` (the parameters turned into the numbers the
solvers need, scaling rules included), `steady.ts` (the steady-state solver), `calibration.ts` (the one fitted number),
`yield.ts` (power curve, Weibull yield), `presets.ts`, `types.ts`, `engine.ts` (`PiggottSim implements LabSim`). Tests next
to the code; `src/panels/model.ts` holds what the panel plots, as plain functions.

## 1. The model

All SI. ρ = 1.23 kg/m³ at sea level (S3), falling as exp(−altitude / 8 500 m) (estimate, isothermal atmosphere).

### 1.1 Wind (wind.ts)

- **Site wind**: the mean at 10 m above open ground (a weather-station figure), `U10`. Hub wind
  `U_hub = U10 · (h / 10)^α · (1 − 0.35·w)` with the shear exponent `α = 0.14 + 0.008·H_o` (H_o = height of the trees and
  buildings near the mast, m) and the wake share `w = exp(−max(0, h − H_o) / max(3, 0.7·H_o))` (1 when the hub sits at the tops of
  the obstacles, 0 over open ground). All four numbers are estimates: the sources only say "clear the turbulence" and "the
  higher the better" (K24).
- **Turbulence**: intensity `I = √(0.12² + (0.30·w)²) × gusts` (σ / mean at the hub; 0.12 over open ground is an estimate).
  The gust process `g(t)` has unit variance: two Ornstein-Uhlenbeck processes (correlation times 10 s for 75 % of the
  variance, 1.5 s for 25 %), drawn on a fixed 0.1 s grid from a seeded generator (mulberry32) and read by linear
  interpolation, so a run is identical at any frame rate. Instantaneous hub wind `v = U_now · (1 + I·g)`.
- **Weather** (the hour-to-hour mean `U_now`): a slow Gaussian process (4 h correlation, 10 min grid) mapped through the
  quantile function of the Weibull distribution, so its marginal distribution is exactly Weibull(k) with the site's
  mean, and it starts at the mean. It is what makes a battery fill and empty when the clock runs at ×3600. It can be switched off.
- **Weibull**: shape `k` (2 = Rayleigh, adjustable 1.2–3), scale `c = U_hub / Γ(1 + 1/k)`; density, distribution and quantile in
  `physics.ts`.

### 1.2 Rotor (rotor.ts)

The wind seen by the rotor is its normal part `v_n = v·cos ψ` (ψ = yaw of the rotor axis). With `λ = ω·R / v_n`:

```text
P_rotor = ½ρA · Cp(λ) · v_n³ = ½ρA · Cp(λ) · v³ · cos³ψ        T_aero = P_rotor / ω = ½ρA·R·v_n² · Cq(λ),   Cq = Cp/λ
T_thrust = ½ρA · Ct(λ) · v_n²
```

- **Cq(λ)** has a main term, `Cq = (Cp_max/λ_opt) · (λ/λ_opt)^(m−1) · (λ_r − λ)/(λ_r − λ_opt)` for λ < λ_r with
  `m = λ_opt/(λ_r − λ_opt)`, which gives **exactly** the peak `Cp_max` at `λ_opt` (the derivative vanishes there) and zero at the
  runaway tip speed ratio `λ_r`; plus a starting term `Cq_start·(1 − λ/3)²` for λ < 3 (stalled blades at standstill).
- `λ_opt = 7` (reported, K16), `Cp_max = 0.30` (estimate inside the 0.25–0.35 of K15; K17's rule of thumb is 0.31),
  `λ_r = 10.75` (estimate, §7.4), `Cq_start = 0.04` (estimate).
- **Ct(λ)** `= 0.35 + (8/9 − 0.35)·(1 − exp(−(λ/4)²))`: a stalled, slow rotor takes little thrust; a loaded one the Betz-optimum
  8/9 of the actuator disc (estimate for the shape). Ct is never below Cp.
- Resulting shape (that of a stall-regulated rotor, in no source): Cp(2) = 0.08, Cp(3) = 0.13, Cp(4) = 0.19, Cp(5) = 0.25, Cp(6) = 0.29,
  Cp(7) = 0.30, Cp(8) = 0.28, Cp(9) = 0.22, Cp(10) = 0.12, Cp(10.75) = 0.

### 1.3 Alternator and bridge (alternator.ts, config.ts)

Axial flux, 8 magnets per disc (4 pole pairs), 6 coils in star, two coils in series per phase ("series star", S4 p. 46).
Quasi-static (the periodic regime at every speed). With `E_ll = ke·ω` the EMF between phases (rms):

```text
V_oc = 1.35·E_ll                          rectified open-circuit voltage (3√2/π; S4 rounds it to 1.4)
I    = (V_oc − V_d − V_bus) / R_dc        V_d = 1.5 V: the two diodes in the path of a three-phase bridge (S4 p. 36)
R_dc = 2·R_ph + R_cable + (3/π)·p·ω·L_ph  two conducting phases + cable + commutation (overlap) of the diodes
P_ag = I · (V_oc − R_x·I)                 air-gap power (the mechanical power the alternator takes), R_x = (3/π)·p·ω·L_ph
T_elec = P_ag / ω
```

and the books close exactly: `P_ag = V_bus·I + 2R_ph·I² + V_d·I + R_cable·I²` (battery side, copper, diodes, cable). The
reactive drop `R_x·I` costs voltage but no heat. There is no iron, so no iron loss and no cogging.

- **`ke` is calibrated on one number only, K10**: 1.9 V between phases at 60 rpm, so `ke = 1.9 / (2π) = 0.3024 V·s/rad`
  (0.0317 V/rpm). The air gap (K11), the flux and the turns are inside it.
- **Phase resistance, derived from the stator drawing** (S4 p. 46): coil outline 86 × 70 mm round a hole of 46 × 30 mm (the
  magnet footprint, K6), 11 mm thick former, so a winding build of 20 mm; mean turn on the mid-build path with rounded corners
  `2·(46 + 30) + 2π·10 = 214.8 mm`. Two coils × 76 turns × 0.2148 m = 32.7 m of 1.4 mm copper (0.0175 Ω·mm²/m, 20 °C):
  **R_ph = 0.371 Ω**, inside the 0.3–0.4 Ω of research §2 check 4. Cross-check: that much wire (6 × 76 turns) weighs 1.35 kg against
  the "about 1.5 kg" of K7 (−10 %: the geometry may be a little short; 1.5 kg would give 0.24 m per turn and 0.41 Ω). The copper
  is taken at 20 °C: hot copper is 20–30 % worse (§8).
- **Synchronous inductance** `L_ph = 1.0 mH` (estimate: an air-cored coil of 76 turns over about 33 mm of non-magnetic gap, two
  coils in series). It only matters at high speed (ωL = 0.13 Ω at 300 rpm against R = 0.37 Ω); §7.4 tries 0.3 and 3 mH.
- **Turns** (K9): `ke ∝ N`; the wire gets thinner to fill the same winding window (`d = 1.4 mm · √(76/N)`), so `R_ph ∝ N²`
  and `L_ph ∝ N²`.
- **Rotor diameter** (research §5.8, K3, K18): power ∝ D² because the swept area is. The alternator is scaled as the maker
  does for the other sizes (an estimate, checked against one point: the 2.4 m machine reads 3.5 V at 60 rpm in S4 p. 36, 1.84
  times the 1.9 V of the small one): `ke ∝ D`, `R_ph, L_ph ∝ 1/D²` (more coils, grouped in parallel), so the cut-in wind, the voltage at
  a given wind and the copper loss as a share of the power are the same for every size. The offset `e` is the power law through the two reported points
  (41 mm at 1.2 m, 125 mm at 2.4 m, K13: `e ∝ D^1.61`), the inertia `J ∝ D⁵`, the friction torque `∝ D³` (with a viscous part `∝ D⁴`).
- **Rectifier**: the machine has two single-phase bridges (S4 p. 48); the model uses the equivalent three-phase bridge.

### 1.4 Battery, regulation, cable, house (electrical.ts)

- **Battery**: 12 V flooded lead-acid, 100 Ah by default (estimate: no source sizes the battery). Resting voltage against state of
  charge by a table (11.70 V empty, 12.25 V at 50 %, 12.85 V full: estimate); internal resistance `0.02 Ω × 100/Ah` plus a
  polarisation `1.0 Ω × 100/Ah × ((SoC − 0.7)/0.3)³` that makes a nearly full battery refuse the current (about 1 A at 14 V when
  full, about 5 A at 90 %: estimates, K22 only gives the limits). Charging efficiency 90 % (estimate).
- **Dump load** (shunt regulator): when the bus would exceed **14 V** (K22) it takes the surplus to hold 14 V, up to 16 A (the
  16 A relay of the controller in S4's parts list). If the dump is off or saturated the voltage rises above 14 V (overcharge alarm).
- **Low-voltage disconnect**: the house (a constant power, 10 W by default) is cut off below **11.5 V** (K22) and reconnected above
  12.5 V (estimate for the hysteresis).
- **Cable**: `R = ρ·2L/S`, the round trip of the three conductors that carry the AC to the rectifier at the battery, equivalent to
  a DC round trip (`kit cableResistance`). Loss `I²R`: reproduced by hand on the table of S4 p. 38 (K21): 37.8 % at 12 V, 13.2 % at 24 V,
  3.7 % at 48 V for 500 W, 6 mm², 30 m (the plans say 38, 13, 4 %).
- **Brake switch**: closes the DC output of the bridge on itself (S4 p. 48: a 2-pole switch), never the battery (K22). The
  diodes only conduct above 1.5 V in total, so the shorted alternator is easy to turn slowly and hard to turn fast (S4 p. 36). The
  battery is isolated and keeps feeding the house.
- **Battery disconnected**: no current, no electrical torque: the rotor runs away to `λ = λ_r` and the open-circuit voltage follows
  its speed (`openCircuitVolts` in the state).

### 1.5 Furling (furling.ts, calibration.ts)

The alternator is offset by `e` from the yaw axis (41 mm, K13), so the thrust pushes the machine out of the wind with the moment
`T·e`. The tail resists with the moment it can carry; beyond it, the tail lifts on its inclined hinge, the machine turns, and the
thrust falls (S4 p. 30–31). Quasi-static balance with the yaw ψ and the fold of the tail `φ = ψ − ψ_stop`:

```text
e · ½ρA · Ct(λ) · (v cos ψ)²  =  M_hold(φ)       for ψ > ψ_stop,    M_hold(φ) = M_0 · sin(u0 + φ) / sin(u0)
ψ = ψ_stop = 5° while the left-hand side is below M_0 (the tail rests on its stop)
```

`M_0 = m_tail · g · 0.2 m` is proportional to the tail weight: **`m_tail` is the one calibrated constant** (§3). `u0 = 55°` is an
estimate of the geometry of the inclined hinge (it only shapes the plateau); ψ is capped at 85° (fully furled, the tail swings 95°, K13);
`ψ_stop = 5°` (estimate). In the time-stepping engine the machine follows the equilibrium yaw with a time constant of 1.5 s (estimate). The
thrust is **held** near its value at the onset, so the power plateaus: 62.4 W at 16 m/s, 55.9 W at 25 m/s against 62.9 W at the best.
The yaw angle grows with the wind: 6° at 10 m/s, 25° at 12, 46° at 16, 57° at 20, 65° at 25, 73° at 35 m/s. A "fixed tail" option locks ψ at its stop.

### 1.6 Two time regimes and the dynamics (engine.ts)

- **Fast** (rotor speed, yaw, gusts): `J·dω/dt = T_aero − T_elec − T_friction` with a fixed step of 20 ms whatever the frame rate, at
  `dt × slowMo`. One implicit Euler step per tick, solved by bisection on a function that increases with ω, so no frame is
  unstable. `J = 0.13 kg·m²` at 1.2 m (**estimate**, §3; ≈ 0.08 for three 0.35 kg blades, 0.04 for two steel discs with magnets),
  friction `0.05 N·m + 0.0005·ω` (estimate). The rotor reaches 350 rpm in about 5 s from rest in 8 m/s.
- **Slow** (clock, weather, battery, energy counters, scripted events): integrate the _averages_ of the steady-state model over
  the gusts (5-point Gauss-Hermite on the wind speed), × `dt × timeScale`. At ×3600 a day passes in 24 s. The averages are solved
  again when the parameters change (at most 8 times a second) or when the state of charge or the wind has moved.
- **Energy ledger** (`sim.ledger`, J, fast clock): rotor energy = friction + copper + diodes + cable + bus + kinetic energy, closed to
  3 % (the test).
- **Visual rotor**: `rotorAngle` advances at `2.5 · tanh(turns per real second / 2.5)` turns per second at most; `rotorBlur` goes
  from 0 at 1.5 turns/s to 1 at 4 turns/s (with the slow motion the blades come back). `rpm` is always the true value.
- **Flags**: `runaway` (no path for the power, rotor above 1.1 × the charging speed), `overspeed` (tips above 89 m/s = 200 mph, S4 p. 9),
  `overload` (rectified current above 20 A, the rating of the brake switch, S4 p. 48), `lowBattery`, `batteryFull`, `overcharge`.

### 1.7 Steady-state solver and hysteresis (steady.ts)

The operating point in a steady wind: the rotor speed is the first point, scanning up from rest, where the electrical and
friction torques catch up with the aerodynamic one (the point reached when the rotor spins up), then the yaw by bisection on the
moment balance. Used for the power curve, the cycle averages of §1.6, the yearly yield and the tests. The stalled branch can
disappear at high wind (a fixed tail passes from 875 rpm at 20 m/s to 2 771 rpm at 25 m/s): the rotor then jumps to the fast branch, and in
a falling wind it would stay on it (hysteresis). The steady solver does not follow that; the time-stepping engine does.

### 1.8 Yearly yield (yield.ts)

`E = 8 760 h · ∫ P̄(v) f(v) dv` over the Weibull density of the hub wind, on a 0.25 m/s grid; `P̄` is the steady power curve at the
reference battery (half charged, nothing else on the bus) averaged over the site's turbulence (5-point Gauss-Hermite, quasi-static: the
rotor's inertia is ignored). Outputs: energy to the bus, mean power, capacity factor against `200 W × (D/1.2)²` (K2 scaled with the area:
K3 says 2 000 W at 4.2 m, the area rule gives 2 450 W), kWh per m² (compare with K25) and the hours and energy of each 1 m/s band.

## 2. Parameters (all editable live, `PiggottSim.set`)

| Parameter (`PiggottParams`)      | Unit   | Range         | Default (hamlet) | Status                                          |
| -------------------------------- | ------ | ------------- | ---------------- | ----------------------------------------------- |
| `meanWind` U10                   | m/s    | 1–25          | 5                | preset (research §5); 3.5 / 5 / 7 for the sites |
| `weibullK`                       | –      | 1.2–3         | 2                | Rayleigh (research §5)                          |
| `weather`, `gusts`               | –      | on, 0–2.5     | on, 1            | estimates (§1.1)                                |
| `mastHeight`                     | m      | 3–24          | 12               | 6–18 m are the values of K24                    |
| `obstacleHeight`                 | m      | 0–15          | 5 (hamlet)       | estimate                                        |
| `altitude`                       | m      | 0–2500        | 0                | density 1.23 at 0 (S3)                          |
| `diameter` D                     | m      | 1.0–4.2       | 1.2              | reported K1, K3                                 |
| `turns` N                        | –      | 20–200        | 76               | reported K7 (K9: 85 / 170 in the 2003 plans)    |
| `tailWeight`                     | ×      | 0.3–3         | 1                | 1 = calibrated on K12                           |
| `fixedTail`                      | –      | on/off        | off              | the storm comparison                            |
| `cableSection`, `cableLength`    | mm², m | 1.5–35, 2–100 | 10, 15           | estimates; K21 tabulates 2.5–35 mm² and 30–90 m |
| `batteryConnected`, `brake`      | –      | on/off        | on, off          | K22                                             |
| `dumpLoad`                       | –      | on/off        | on               | K22 (14 V)                                      |
| `batteryAh`, `loadPower`         | Ah, W  | 20–400, 0–300 | 100, 10          | estimates                                       |
| `slowMo`, `timeScale`, `running` | –      | kit           | 1, 1, true       | kit time controls                               |

Every value set is clamped to its range. Editing anything but the time controls makes the preset `custom`; a scripted event or
ramp of a scenario is cancelled when the visitor edits the quantity it moves.

## 3. Constants, their status and what was calibrated

All of them are in `src/sim/machine.ts` with their tag. The ones that matter:

| Constant                           | Value              | Status                           | Source / reasoning                                                                              |
| ---------------------------------- | ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| rotor diameter, blades             | 1.2 m, 3           | reported                         | K1, K4                                                                                          |
| air density                        | 1.23 kg/m³         | reported                         | S3                                                                                              |
| magnets, coils, turns, wire        | 8, 6, 76, 1.4 mm   | reported                         | K6, K7                                                                                          |
| `KE_LL_REF`                        | 0.3024 V·s/rad     | derived                          | K10: 1.9 V / (2π rad/s); the only calibration of the electromagnetic part                       |
| `R_PHASE_REF`                      | 0.371 Ω            | derived                          | stator drawing S4 p. 46 (§1.3); within 0.3–0.4 Ω of research §2                                 |
| `MEAN_TURN_LENGTH`                 | 214.8 mm           | derived                          | idem; reported wire mass 1.5 kg would need 240 mm                                               |
| `L_PHASE_REF`                      | 1.0 mH             | estimate                         | air-cored coil, §1.3                                                                            |
| rectifier drop, factor             | 1.5 V, 1.35        | reported / derived               | S4 p. 36; 3√2/π                                                                                 |
| offset `e`                         | 41 mm (125 at 2.4) | reported                         | K13                                                                                             |
| tail swing, hinge                  | 95°, 20° / 55°     | reported                         | K13 (the 3D role uses them; the model only needs the swing)                                     |
| `LAMBDA_OPT`, `CP_MAX`             | 7, 0.30            | reported / estimate              | K16; K15 band, K17 gives 0.31                                                                   |
| `LAMBDA_RUNAWAY`                   | 10.75              | estimate                         | 1.54 × λ_opt, typical of fixed-pitch rotors; **the most influential unpublished number** (§7.4) |
| `CQ_START`, `CT_*`                 | 0.04, 0.35 → 8/9   | estimate                         | starting torque, thrust coefficient                                                             |
| `INERTIA_REF`                      | 0.13 kg·m²         | estimate                         | blades from S4 p. 43 stations, discs from K6; only sets the time scale of gusts (seconds)       |
| friction                           | 0.05 N·m + 0.0005ω | estimate                         | trailer hub bearings                                                                            |
| `YAW_STOP_DEG`, `TAU`              | 5°, 1.5 s          | estimate                         | S4 p. 31 "slight angle"; response time                                                          |
| `TAIL_SWING_ORIGIN_DEG`            | 55°                | estimate                         | shape of the furling plateau                                                                    |
| **`TAIL_MASS_REF`**                | **0.767 kg**       | **calibrated**                   | **K12: furling starts at 10 m/s** (effective weight at a 0.2 m arm, `M_0 = 1.50 N·m`)           |
| battery, regulation                | see §1.4           | reported limits, estimated curve | K22: 11.5 V, 14 V; the curve, 100 Ah, resistances are estimates                                 |
| `TIP_SPEED_LIMIT`, `CURRENT_LIMIT` | 89 m/s, 20 A       | reported                         | S4 p. 9 (200 mph; **not in research.md**), S4 p. 48 (research §3)                               |

**The calibrated constant, and what it was calibrated on.** `TAIL_MASS_REF` makes the steady-state furling start (the tail lifts 1° beyond
its stop) at **10.00 m/s** (K12: "about 10 m/s"). The hold moment is proportional to the weight, so `calibrateTailMass()` is a bisection on
the weight; `steady.test.ts` checks that it still finds the stored value to 1 %. For the other diameters the design tail moment follows
`D^(2 + 1.61)` (thrust ∝ D², offset ∝ D^1.61), so every size furls at 10 m/s at `tailWeight = 1`. The `tailWeight` slider is a multiple of
it: 0.6 furls at 7.3 m/s, 1.8 at 13.8 m/s (a heavier tail furls later, S4 p. 31; the onset grows a little faster than the square root of the weight).
Nothing else is calibrated: `ke` is derived from K10, the resistance from the geometry, `Cp_max` and `λ_opt` from K15–K17.

## 4. What the 3D role reads (`PiggottState`, every field is documented with units in `types.ts`)

The state is flat and read-only. The fast quantities are already slowed by `slowMo`.

| Field                                                                                   | Meaning                                                                                                                                       |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `rotorAngle` rad, `rotorBlur` 0..1                                                      | visual angle (speed capped at 2.5 turns per real second, increases with time: the 3D role chooses the sense) and the blur disc opacity        |
| `rpm`, `omega`, `tipSpeed` m/s, `lambda`, `cp`, `ct`                                    | true rotor values (never capped)                                                                                                              |
| `wind` m/s, `windMean`, `turbulence`, `airDensity`                                      | instantaneous hub wind, the hour's mean, intensity                                                                                            |
| `yaw` deg, `tailSwing` deg (0..95), `furled` 0..1                                       | rotor axis away from the wind (5° on the stop); swing of the tail about its inclined hinge; fraction of the way to fully furled               |
| `windPower`, `rotorPower`, `thrust`                                                     | W, W, N                                                                                                                                       |
| `emf`, `openCircuitVolts`, `frequency`, `dcCurrent`                                     | V rms between phases, V, Hz, A                                                                                                                |
| `busVoltage`, `busPower`, `batteryCurrent`, `batteryPower`, `soc`                       | battery terminals (the bridge output when the battery is off), power delivered to the bus (0 with the brake closed), net into the cells, 0..1 |
| `dumpPower`, `loadPower`, `frictionLoss`, `copperLoss`, `diodeLoss`, `cableLoss`        | W                                                                                                                                             |
| `etaMech`, `etaAlternator`, `etaRectifier`, `etaCable`, `etaRotor`, `etaChain`          | efficiencies of the stages, rotor / wind, bus / rotor                                                                                         |
| `brake`, `batteryConnected`, `dumpActive`, `lvdOpen`                                    | switches and regulation                                                                                                                       |
| `runaway`, `overspeed`, `overload`, `lowBattery`, `batteryFull`, `overcharge`, `alarms` | flags; the alarm keys the strip shows                                                                                                         |
| `simTime`, `day`, `hour`, `energy*`                                                     | slow clock (the run starts at 08:00), Wh counters of wind, rotor, bus, dump, house, today                                                     |
| `sim.scope`, `sim.history`, `sim.ledger`                                                | last minute of wind / rpm / power, 48 h of state of charge / wind / power, energy books                                                       |
| `sim.getCurve()`, `getYearly()`, `getFurlingOnset()`, `steadyPoint(v)`                  | steady power curve, yearly yield with its bins, furling wind speed, one steady operating point                                                |

The 3D scene should show `tailSwing` as the rotation of the tail about the hinge and `yaw` as the rotation of the nacelle about the yaw
axis (they are linked: `yaw − 5° ≈ tailSwing × 0.84`). `thrust` and `copperLoss` are the quantities that explode in the fixed-tail storm.

## 5. Presets and scenarios

| id              | What                                                             |
| --------------- | ---------------------------------------------------------------- |
| `calm-valley`   | 3.5 m/s at 10 m, trees of 8 m, mast 12 m: 3.0 m/s at the hub     |
| `hamlet`        | 5 m/s, trees of 5 m, mast 12 m (the default): 4.9 m/s at the hub |
| `windy-plateau` | 7 m/s, open ground, mast 12 m: 7.2 m/s at the hub                |

| id                 | What                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wind-sweep`       | steady wind (no gusts, no weather) from 1 to 20 m/s in 5 minutes: cut-in at about 2.6 m/s, then the power curve, the furling from 10 m/s, the plateau (K12, K19, K20)    |
| `gusts`            | 7 m/s, gustiness × 2.2 among 8 m trees: the power jumps about while the mean is steady                                                                                   |
| `storm`            | wind from 6 to 25 m/s in 3 minutes: the tail folds, the thrust and the power level off, the alternator stays under 20 A, the tips under 89 m/s                           |
| `storm-fixed-tail` | the same with the tail locked: overload (above 20 A) from about 20 m/s, then overspeed from about 22 m/s, copper loss over 2 kW, thrust nine times higher                |
| `battery-full`     | a battery at 95 % in 9 m/s: it refuses the current, the dump load holds the bus at 14 V (K22)                                                                            |
| `runaway`          | the battery is disconnected after 20 s (rotor to 1 100–1 300 rpm, open-circuit voltage over 40 V), the brake switch closed after 70 s (the rotor falls to under 100 rpm) |
| `brake-switch`     | the brake closes after 20 s and opens after 70 s at 8 m/s                                                                                                                |
| `thin-cable`       | 2.5 mm² over 40 m at 8 m/s: the cable burns 11 % of the power generated, against under 2 % for the default cable (K21)                                                   |
| `low-mast`         | 6 m mast among 8 m trees: the hub wind falls to about two thirds of a 12 m mast's, the turbulence intensity is 0.32 against 0.13 in the hamlet (K24)                     |
| `few-turns`        | 38 turns at 4 m/s: the rotor spins freely at 550–620 rpm and charges nothing (K9, S5)                                                                                    |
| `stator-24v`       | 152 turns (the 24 V stator, K9) on the 12 V battery at 8 m/s: it charges from half the speed, but holds the rotor back: less than half the power                         |

## 6. Key figures → tests → results

Tolerances are those of the brief. "Model" is the value of the default machine. A test that retrieves a source figure asserts the
figure. The lines marked **finding** are the figures the model does **not** retrieve: their tests assert what the model finds
(named `FINDING`), so that a future change cannot hide the gap.

| K       | Figure (source)                                                   | Target                    | Model                                                                                  | Tolerance           | Test (`src/sim/…`)                                                     |
| ------- | ----------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| K1, K4  | 1.2 m, three blades                                               | as reported               | preset                                                                                 | exact               | `engine.test.ts` › presets                                             |
| K3      | family 1.0 to 4.2 m                                               | slider                    | 1.0–4.2 m, scaled alternator and tail                                                  | range               | `steady.test.ts` › K18                                                 |
| K6, K8  | 8 magnets, 6 coils, 4 : 3                                         | as reported               | 8, 6                                                                                   | exact               | `physics.test.ts` › K8                                                 |
| K7      | 6 × 76 turns of 1.4 mm, about 1.5 kg of wire                      | R_ph 0.3–0.4 Ω            | 0.371 Ω; 1.35 kg                                                                       | 20 % on the mass    | `rotor.test.ts` › K7                                                   |
| K10     | 1.9 V between phases at 60 rpm                                    | 1.9 V                     | 1.9 V                                                                                  | exact               | `rotor.test.ts` › K10                                                  |
| K12     | furling starts at about 10 m/s                                    | 8–12 m/s                  | 10.00 m/s (calibrated); 7.3 / 13.8 m/s for tail weight × 0.6 / × 1.8                   | 8–12                | `steady.test.ts` › K12                                                 |
| K13     | offset 41 mm (1.2 m), 125 mm (2.4 m)                              | as reported               | 41.0 / 125.0 mm                                                                        | exact               | `physics.test.ts` › K13                                                |
| K14     | 0.70 W at 1 m/s, 696 W at 10 m/s                                  | 696 W                     | 695.6 W                                                                                | ± 1 %               | `physics.test.ts` › K14                                                |
| K15     | Betz 0.593; homebuilt Cp 0.25–0.35                                | never above Betz          | peak 0.300 at λ = 7.0; 0.593 never reached                                             | band                | `rotor.test.ts` › K15                                                  |
| K16     | λ ≈ 7; 334 rpm at 3 m/s                                           | 334 rpm                   | 334.2 rpm (167.1 rpm for the 2.4 m example)                                            | exact               | `physics.test.ts` › K16                                                |
| K17     | P ≈ 0.15·D²·v³ = 216 W at 10 m/s                                  | within 20 %               | 208.7 W (−3.4 %)                                                                       | 20 %                | `rotor.test.ts` › K17                                                  |
| K18     | 2.4 m: about 500 W normally; S7: 2 m 500 W, 4 m 2 000 W at 12 m/s | about 500 / 500 / 2 000 W | **finding**: 242 W (2.4 m), 167 W (2 m), 697 W (4 m) at 12 m/s; P ∝ D² to 3 %          | ratio 2.1–2.9 below | `steady.test.ts` › K18 (scaling) and K18 FINDING                       |
| K2, K19 | 200 W at 12 V; the wind of the rating is unknown                  | peak 150–250 W (§5)       | **finding**: peak **62.9 W at 14.5 m/s**; 50.4 W at 10 m/s; 60.4 W at 12 m/s           | not retrieved       | `steady.test.ts` › K2/K19 (seven tests, the FINDING ones) and K19 flat |
| K19     | curve flat after the furling                                      | flat                      | 62.8 → 62.4 → 59.6 → 55.9 W at 14, 16, 20, 25 m/s (within 20 % of the peak)            | 20 %                | `steady.test.ts` › K12 › K19                                           |
| K20     | cut-in about 330 rpm, 3 m/s                                       | 2.5–4 m/s                 | first watt at 2.6 m/s; 2.9 W at 3 m/s; charging speed 324 rpm at 12.35 V               | 2.5–4 m/s           | `steady.test.ts` › K20; `engine.test.ts` › K20                         |
| K21     | wiring loss 38 % (12 V), 13 % (24 V), 4 % (48 V)                  | 38, 13, 4 %               | 37.8, 13.2, 3.7 %; four more rows of the table within one point                        | ± 1 point           | `physics.test.ts` › K21; `steady.test.ts` › K21 in the model           |
| K22     | 11.5 V, 14 V; brake shorts the alternator, not the battery        | limits                    | dump holds 14.00 V; house cut at < 11.5 V; brake: battery untouched, rotor < 120 rpm   | exact               | `engine.test.ts` › K22 (five tests)                                    |
| K24     | the higher the mast the better                                    | monotone                  | 6 m among 8 m trees yields 30 % of an 18 m mast                                        | < 35 %              | `steady.test.ts` › K25 › K24; `engine.test.ts` › low-mast              |
| K25     | 113–340 kWh/year for 1.131 m²                                     | in the bracket            | hamlet 132 kWh (143 over open ground), windy plateau 242 kWh; calm valley 45 kWh below | bracket             | `steady.test.ts` › K25                                                 |

Other behaviours tested: energy conservation (the battery never gets more than the rotor, the books close to 1e-6 in steady state and
3 % in the dynamics); determinism for a seed and independence from the frame rate (30, 60, 144 fps agree to 3 %); the slow motion slows the
rotor, not the clock; a day at ×3600 equals mean power × 24 h to 5 %; the weather's long-run mean; the 3D variables (visual speed cap, blur,
yaw / tail swing); all 11 scenarios and their alarms; clamping of `set`; no non-finite value under 400 random live edits; the panel
(`src/panels/*.test.ts`) and the FR/EN strings.

## 7. Findings and open puzzles

### 7.1 K19: the 200 W is not reached (the owner asked to report, not to tune)

With K10 (ke), the winding derived from the geometry, the usual shape of a stall-regulated rotor and the tail calibrated on K12:

| Wind at the hub | rotor speed | λ   | Cp    | rotor power | battery power | copper | yaw |
| --------------- | ----------- | --- | ----- | ----------- | ------------- | ------ | --- |
| 5 m/s           | 348 rpm     | 4.4 | 0.21  | 18 W        | 13 W          | 1 W    | 5°  |
| 8 m/s           | 384 rpm     | 3.0 | 0.13  | 46 W        | 33 W          | 5 W    | 5°  |
| **10 m/s**      | 417 rpm     | 2.6 | 0.106 | 73 W        | **50 W**      | 12 W   | 6°  |
| **12 m/s**      | 436 rpm     | 2.5 | 0.100 | 90 W        | **60 W**      | 17.5 W | 25° |
| 14.5 m/s (peak) | 441 rpm     | 2.5 | 0.099 | 94 W        | **62.9 W**    | 18.9 W | 40° |
| 20 m/s          | 434 rpm     | 2.5 | 0.101 | 88 W        | 59.6 W        | 17 W   | 57° |

- **Peak battery power: 62.9 W at 14.5 m/s** (furling machine). Power at 10 m/s: 50 W; at 12 m/s: 60 W. That is 3.2 times under the
  200 W of K2. Overall efficiency wind → battery at the peak: 3.0 % (rotor 4.5 % of the wind × chain 67 % of the rotor power).
- **Alternator efficiency** (1 − copper / air-gap power): 82 % at 10 m/s, 80 % at 12 m/s, 79 % at the peak. Chain from rotor to battery at the peak:
  bearings 3.4 W, copper 18.9 W, diodes 7.6 W, cable 1.3 W, battery 62.9 W (67 % of the rotor power).
- **Without furling** (fixed tail) the 200 W is reached at **18.5 m/s**, where the alternator carries 15.9 A, burns **187 W** of copper (efficiency
  56 %), and turns the rotor at 736 rpm.
- Power rating in the _general_ sense of S6 and S7 therefore cannot be a measured battery power of this winding at 10–12 m/s.

### 7.2 Why: the alternator pins the rotor in the stall

K10 puts the cut-in at 324 rpm (about 3 m/s at λ = 7, K20). Above it, the current rises as `(V_oc − 14.5 V)/R_dc`, and
`V_oc` rises with the speed at 0.043 V/rpm: a few tens of rpm above the cut-in the electrical torque equals the aerodynamic torque. At
10 m/s the rotor would have to turn at 1 114 rpm to sit at λ = 7, where `V_oc` would be 48 V and the current 27 A: the alternator would ask
957 W at the shaft (345 W into the battery) when the blades have 209 W at best. The rotor cannot get there. It stays at **λ = 2.5, 417 rpm, in the stall, with Cp = 0.11 instead of 0.30**. S4
p. 38 says the same in words ("this alternator holds the blades speed down very low at high power … can cause the blades to stall") and the
model reproduces its other remark: **a thin cable lets the rotor run faster and loses less to the stall** (40 m of 2.5 mm²: rotor
73 → 85 W at 10 m/s, battery 50.4 → 52.0 W, 9.8 W burnt in the cable; the test `S4 p. 38`).

### 7.3 The winding puzzle (research §2 check 4)

The arithmetic of the research holds: at 200 W and 14 V (14.3 A) a phase of 0.371 Ω would burn `2·0.371·14.3² = 151 W`, as
much as the output. In the model that is what the 200 W costs (187 W at 18.5 m/s above). **But the copper is not what limits the machine at
its peak**: there the alternator is 79 % efficient. The machine never gets to the current at which the copper would hurt; the stalled
rotor is the limit. So the two puzzles have the same answer: **200 W is not a sustained 12 V output of this winding**, whatever the wind;
as a nameplate it is a label of the family (S6: "200 W to 2 000 W").

### 7.4 How much the answer depends on what no source gives

The most influential unpublished number is the shape of Cp(λ) at low tip speed ratio (the stall). I first tried the steeper `λ_r = 10` (34 W at 10 m/s),
found its stall shoulder lower than that of the stall-regulated rotors I know (Cp at half the design tip speed ratio about 0.4 of the peak), and moved to `10.75`,
which gives the usual 0.42 and a **more generous** result, not a less generous one; both are in the table. The table shows what each assumption does
(default tail calibration kept; the 5 m/s hamlet over open ground):

| Variant                              | cut-in  | battery at 10 / 12 m/s | peak         | fixed tail, 12 m/s | Cp at 10 m/s | year, 5 m/s open |
| ------------------------------------ | ------- | ---------------------- | ------------ | ------------------ | ------------ | ---------------- |
| **default** (λ_r 10.75, Cp 0.30)     | 2.6 m/s | 50 / 60 W              | 63 W at 14.5 | 74 W               | 0.106        | 143 kWh          |
| steeper stall (λ_r 10)               | 2.65    | 34 / 41 W              | 44 W at 15   | 48 W               | 0.068        | 108 kWh          |
| broader (λ_r 12)                     | 2.6     | 69 / 81 W              | 83 W at 14   | 106 W              | 0.158        | 181 kWh          |
| much broader (λ_r 14, no real rotor) | 2.6     | 85 / 96 W              | 98 W at 13.8 | 134 W              | 0.207        | 211 kWh          |
| Cp_max 0.35                          | 2.5     | 60 / 71 W              | 73 W at 14.3 | 89 W               | 0.132        | 171 kWh          |
| Cp_max 0.25                          | 2.75    | 41 / 50 W              | 53 W at 14.8 | 60 W               | 0.084        | 115 kWh          |
| inductance 3 mH                      | 2.6     | 57 / 67 W              | 68 W at 13.8 | 101 W              | 0.129        | 154 kWh          |
| inductance 0.3 mH                    | 2.6     | 49 / 59 W              | 62 W at 14.8 | 70 W               | 0.101        | 140 kWh          |

The variants were run by editing the constant in `machine.ts` and recomputing the power curve and the yearly yield (they are not kept as tests: they would pin estimates).

No plausible variant reaches 200 W: even a rotor curve broader than any rotor gives 98 W at the peak. The shape of the stall moves the answer
by a factor of 2; the sources fix none of it.

### 7.5 What the winding would have to be (the lesson of K9 and S5)

Re-winding the same stator, nothing else changed (fixed tail = the power the alternator and rotor could give; the furling peak uses the tail as calibrated for 76 turns; the
yearly energy is for the 5 m/s hamlet over open ground with the furling tail):

| Turns per coil     | cut-in  | battery at 8 / 10 / 12 m/s, no furling | peak with furling | year, 5 m/s |
| ------------------ | ------- | -------------------------------------- | ----------------- | ----------- |
| 24                 | 6.3 m/s | 64 / 152 / 258 W                       | 88 W              | 146 kWh     |
| 30                 | 5.2     | 80 / 149 / 234 W                       | 102 W             | 215 kWh     |
| 38                 | 4.2     | 74 / 125 / 188 W                       | 98 W              | **238 kWh** |
| 46                 | 3.6     | 63 / 101 / 149 W                       | 90 W              | 226 kWh     |
| 56                 | 3.1     | 50 / 78 / 113 W                        | 80 W              | 197 kWh     |
| **76 (the video)** | 2.6     | 33 / 51 / 74 W                         | 63 W              | 143 kWh     |
| 110                | 2.4     | 21 / 33 / 49 W                         | 49 W              | 92 kWh      |
| 152 (24 V)         | 2.55    | 15 / 24 / 35 W                         | 38 W              | 65 kWh      |

A winding of 30 turns gives the 200 W of the nameplate at 12 m/s; it costs a cut-in of 5.2 m/s. In the model **a stator wound with half the
turns would harvest about 65 % more energy a year at a 5 m/s site** (238 against 143 kWh), because the 76-turn winding holds the rotor in the stall. This
is the trade-off the maker states in S5 ("fewer turns … does not work at low rpm but gives more output at high speed"); the _size_ of the gain depends on
the stall (§7.4) and must not be read as advice. The 76 turns of the video favour charging in light winds, the use the lab's
presets ask for.

### 7.6 The other figures

- **K25 is retrieved**: the hamlet (5 m/s, 5 m trees) gives 132 kWh a year (117 kWh/m²), over open ground 143 (126), the windy plateau 242
  (214 kWh/m²): inside the 100–300 kWh/m² of S10, so the _energy_ is plausible while the _peak power_ is not retrieved. Capacity factor against the
  200 W: 7.6 % (hamlet), 13.8 % (windy plateau), 2.6 % (calm valley with 8 m trees, which gives 45 kWh, under the bracket).
- **The yield hardly depends on the distribution**: because the stalled rotor's power curve is almost a straight line of the wind speed (not a cube), a Weibull of
  shape 1.5 and one of 3 with the same mean differ by under 10 % in energy, while the wind carries 1.9 times more. K25's "2.85 times more
  or less" describes cubic machines.
- **Storm** (scenario `storm-fixed-tail`): at 25 m/s a fixed tail takes 373 N of thrust, against 41 N for the folding tail (nine times
  more), 54 A and 2.2 kW of copper loss in the stator (the winding would burn), and the rotor leaves the stalled branch for 2 771 rpm, tips at 174 m/s
  (the 200 mph of S4 is 89 m/s). With the brake closed and the tail fixed the same jump happens at 25 m/s: the short circuit is not enough in a storm.
- **K18**: P ∝ D² holds to 3 %, so the sizes of S4/S7 are 2.1–2.9 times under their published figures (242 W for 2.4 m against "about 500 W
  normally", 167 W for 2 m and 697 W for 4 m against 500 and 2 000 W at 12 m/s). The same factor 2–3 as K19, the same cause.

### 7.7 In `docs/research.md` (to correct or add; not edited)

- §5 says "the electrical side reuses `@onigam/lab-kit/sim/electric` (rectifier, battery, cable, dump load)": the kit only has `CU_RHO`, `cableResistance` and a 48 V
  LiFePO4 `ocv`. See `docs/kit-requests.md`.
- Missing from §2/§3 and used here: the blade tip speed of 200 mph (89 m/s) as the noise / erosion limit (S4 p. 9); the coil outline 86 × 70 mm of the stator
  drawing (S4 p. 46, from which the turn length is derived); the 3.5 V at 60 rpm of the 2.4 m alternator (S4 p. 36), 1.84 times the 1.9 V of K10; the remark of S4 p. 36 that the DC-shorted
  alternator "is still easy to turn at low speeds but becomes very hard to turn faster than about 5 times per second"; the relay of 16 A in S4's controller.
- §3 says "two single-phase bridge rectifiers on a heatsink" while §5.3 says "three-phase bridge": the model uses the equivalent three-phase bridge; K7/S5 differ on the wire
  (1.4 mm, or 2 × 1 mm for 76 turns), same copper area.
- §2 K17: correct (0.15 = ½·1.23·π/4·Cp gives Cp = 0.3105). K19's two ratios (0.17 at 12 m/s, 0.29 at 10 m/s) are correct arithmetic, but the premise that the
  200 W is a battery power at 10–12 m/s is what the model contradicts (§7.1).
- Nothing could be verified on the video (§8.8 of the research): the first reading at the end of S1 ("on était à 1…") would settle K19.

## 8. Known limits of the model

- **Pedagogical, not a design tool.** Every number that matters for the _level_ of the power is an estimate (§7.4). The shape and the order of magnitude of
  the curves, the cut-in, the furling plateau and the trade-offs (turns, cable, mast, tail weight) are what the model is for.
- **Quasi-static electrics**: the periodic regime at every speed; no transient of the bridge, no ripple of the DC current, no cable inductance. The AC cable is
  replaced by its DC equivalent.
- **Copper at 20 °C**: hot windings are 20–30 % more resistive; no thermal model, so "overload" is a current threshold (20 A), not a temperature.
- **Rotor**: one `Cp(λ)` curve for all diameters (no Reynolds effect), the yaw reduces the wind normal to the disc and nothing more (no skewed-wake effects, no
  cyclic loads); the blade stall is the curve, there is no dynamic stall.
- **Furling**: a quasi-static moment balance with a lumped tail (weight × arm) and a first-order response; no overshoot, no flutter, no hysteresis of the hinge. The shape
  of the plateau depends on `TAIL_SWING_ORIGIN_DEG` and `Ct(λ)`, the onset only on the calibrated weight.
- **Turbulence**: one point, one direction (the wind direction does not change, so the tail has nothing to follow); the yearly yield treats the rotor as following gusts
  instantly (its inertia is ignored there; the live view has it).
- **Battery**: a table and two resistances; no temperature, no self-discharge, no ageing, no gassing. The state of charge is clamped at 100 %.
- **Steady solver** follows the stalled branch from rest; the hysteresis of §1.7 is only in the time-stepping engine.
- Constant air density with the altitude only; no icing, no wind shear in the rotor disc; no tower shadow.
- The lab must say, as the research does, that this is an educational model, not a construction plan.
