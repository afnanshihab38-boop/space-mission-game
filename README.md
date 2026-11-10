# COSMODEX — Space Mission Design Game
### NASA Space Apps Challenge 2026: Space Mission Design Game

**COSMODEX** is a 3D interactive space mission design simulation game built with **Three.js**, implementing authentic systems engineering constraints, orbital mechanics, manual flight controls, dynamic procedural audio, and real-time operations.

---

## 🎮 Interactive Controls & Flight Mechanics

### 🕹️ Spacecraft Attitude & Propulsion
- **`SPACE` / `SHIFT`**: **Prograde Burn** — Fires main rocket engines, accelerates forward, expands orbit altitude ($r$).
- **`X` / `CTRL`**: **Retrograde Burn** — Fires reverse thrusters, brakes orbital velocity, lowers periapsis.
- **`W` / `S`**: **Pitch Attitude** — Nose down / Nose up.
- **`A` / `D`**: **Yaw Attitude** — Turn left / Turn right.
- **`Q` / `E`**: **Roll Attitude** — Roll counter-clockwise / clockwise.
- **`F`**: **Toggle SAS** — Automatic Stability Assist System (damps angular drift).
- **On-Screen D-Pad & Burn Buttons**: Full touch/mouse support on the bottom Flight Dock.

### 🎥 Multi-Angle Camera Views
- **`1`**: **Orbit View** — Center destination planet with 360° mouse drag orbit controls.
- **`2`**: **Chase Cam** — Smooth dynamic camera following behind the spacecraft.
- **`3`**: **Cockpit / Sensor View** — First-person perspective looking out into deep space.
- **`C`**: Cycle camera modes.

### ⏱️ Time Warp & Simulation Speed
- **`[` / `]`** or Dock Buttons: **1x**, **5x**, **25x** time acceleration.

### 🔬 Clickable 3D Surface Science Targets
- Click glowing anomaly beacons placed on the celestial body (e.g. *Water-Ice Shadowed Basin*, *Magnetic Field Anomaly*, *Impact Crater*) to aim your spacecraft instruments and fire targeted observation beams for bonus science data!

### 🔊 Procedural Web Audio Synthesizer
- Built-in Web Audio API synthesizer for engine rumble, RCS thruster hissing, sensor telemetry pings, and emergency klaxons.

---

## 🚀 How to Run

1. Start the server (if not already running):
   ```bash
   cd "C:\Users\Afnan Shihab\.gemini\antigravity\scratch\space-mission-game"
   node server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
