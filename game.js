// ═══════════════════════════════════════════════════════════════════════════════
// COSMODEX — Space Mission Design Game
// NASA Space Apps Challenge 2026
// Built with Three.js — Procedural low-poly 3D, orbital mechanics, event system
// ═══════════════════════════════════════════════════════════════════════════════

import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';
import { GLTFLoader } from './lib/GLTFLoader.js';

// ─────────────────────────────────────────────────────
// KENNEY SPACE KIT ASSET LOADER
// ─────────────────────────────────────────────────────

class AssetLoader {
  constructor() {
    this.models = {};
    this.loader = new GLTFLoader();
    this.loaded = false;
    this.loadPromise = null;
  }

  loadAll() {
    if (this.loadPromise) return this.loadPromise;

    const list = [
      'craft_speederA', 'craft_speederB', 'craft_cargoA', 'craft_miner',
      'rocket_baseA', 'rocket_fuelA', 'rocket_sidesA', 'rocket_topA',
      'platform_large', 'hangar_largeA',
      'satelliteDish', 'satelliteDish_detailed', 'machine_generator', 'machine_wireless',
      'crater', 'craterLarge', 'meteor', 'meteor_detailed',
      'rock_crystalsLargeA', 'rover', 'astronautA', 'alien'
    ];

    this.loadPromise = Promise.all(list.map(id => {
      return new Promise(resolve => {
        this.loader.load(`./assets/models/${id}.glb`, gltf => {
          gltf.scene.traverse(node => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          this.models[id] = gltf.scene;
          resolve();
        }, undefined, () => resolve());
      });
    })).then(() => {
      this.loaded = true;
      console.log('✓ Kenney Space Kit assets loaded into memory');
    });

    return this.loadPromise;
  }

  clone(id, align = 'center') {
    if (!this.models[id]) return null;
    const raw = this.models[id].clone(true);
    const wrapper = new THREE.Group();
    const box = new THREE.Box3().setFromObject(raw);
    const center = new THREE.Vector3();
    box.getCenter(center);
    if (align === 'bottom') {
      raw.position.set(-center.x, -box.min.y, -center.z);
    } else {
      raw.position.set(-center.x, -center.y, -center.z);
    }
    wrapper.add(raw);
    return wrapper;
  }
}

const Assets = new AssetLoader();
window.Assets = Assets;

// ─────────────────────────────────────────────────────
// DATA TABLES
// ─────────────────────────────────────────────────────

const MISSIONS = [
  {
    id: 'lunar_surveyor',
    name: 'LUNAR SURVEYOR',
    icon: '🌙',
    desc: 'Map the lunar surface from orbit. Identify landing sites for future crewed missions using spectral imaging and laser altimetry.',
    difficulty: 2,
    destination: 'Moon',
    budgetM: 450,
    maxMassKg: 1200,
    maxPowerW: 800,
    scienceGoal: 300,
    durationDays: 365,
    distAU: 0.00257,
    deltavReq: 4100,
    color: 0xbbbbcc,
    radius: 1.2,
    orbitRadius: 12,
    phases: ['launch', 'trans_lunar', 'lunar_orbit_insertion', 'mapping', 'extended'],
    phaseLabels: ['LAUNCH', 'TRANS-LUNAR COAST', 'LUNAR ORBIT INSERT', 'PRIMARY MAPPING', 'EXTENDED OPS'],
    reward: 'LUNAR CARTOGRAPHY BADGE'
  },
  {
    id: 'mars_pathfinder',
    name: 'MARS PATHFINDER II',
    icon: '🔴',
    desc: 'Deliver a science package to Mars orbit. Study the atmosphere, search for subsurface water with ground-penetrating radar.',
    difficulty: 3,
    destination: 'Mars',
    budgetM: 780,
    maxMassKg: 2000,
    maxPowerW: 1200,
    scienceGoal: 500,
    durationDays: 687,
    distAU: 0.524,
    deltavReq: 5700,
    color: 0xcc4422,
    radius: 0.9,
    orbitRadius: 20,
    phases: ['launch', 'cruise', 'mars_orbit_insertion', 'aerobrake', 'science', 'extended'],
    phaseLabels: ['LAUNCH', 'INTERPLANETARY CRUISE', 'MARS ORBIT INSERT', 'AEROBRAKING', 'PRIMARY SCIENCE', 'EXTENDED OPS'],
    reward: 'MARS EXPLORER BADGE'
  },
  {
    id: 'asteroid_rendezvous',
    name: 'ASTEROID RECON',
    icon: '☄️',
    desc: 'Rendezvous with near-Earth asteroid 2026 XR7. Characterize composition, spin rate, and evaluate deflection strategies.',
    difficulty: 4,
    destination: 'Asteroid',
    budgetM: 620,
    maxMassKg: 900,
    maxPowerW: 600,
    scienceGoal: 400,
    durationDays: 540,
    distAU: 0.15,
    deltavReq: 6200,
    color: 0x887766,
    radius: 0.35,
    orbitRadius: 8,
    phases: ['launch', 'cruise', 'approach', 'proximity_ops', 'mapping', 'sample'],
    phaseLabels: ['LAUNCH', 'CRUISE', 'APPROACH', 'PROXIMITY OPS', 'SURFACE MAPPING', 'SAMPLE ANALYSIS'],
    reward: 'ASTEROID HUNTER BADGE'
  },
  {
    id: 'solar_sentinel',
    name: 'SOLAR SENTINEL',
    icon: '☀️',
    desc: 'Station a solar observatory at the Sun-Earth L1 point. Monitor solar wind, coronal mass ejections, and space weather.',
    difficulty: 3,
    destination: 'Sun-L1',
    budgetM: 550,
    maxMassKg: 1500,
    maxPowerW: 2000,
    scienceGoal: 450,
    durationDays: 1095,
    distAU: 0.01,
    deltavReq: 3800,
    color: 0xffcc00,
    radius: 4.0,
    orbitRadius: 30,
    phases: ['launch', 'transfer', 'l1_insertion', 'commissioning', 'monitoring', 'extended'],
    phaseLabels: ['LAUNCH', 'L1 TRANSFER', 'L1 INSERTION', 'COMMISSIONING', 'SOLAR MONITORING', 'EXTENDED OPS'],
    reward: 'HELIOPHYSICS BADGE'
  }
];

const COMPONENT_CATEGORIES = ['structure', 'power', 'science', 'comms'];
const CATEGORY_LABELS = { structure: 'STRUCTURE', power: 'POWER', science: 'SCIENCE', comms: 'COMMS' };
const BUILDER_STEPS = ['step-structure', 'step-power', 'step-science', 'step-comm'];

const COMPONENTS = [
  // ── STRUCTURE ──
  { id: 'bus_small', cat: 'structure', name: 'Small Bus (300kg)', mass: 300, power: 0, cost: 40, science: 0, desc: 'Compact spacecraft bus. Limited payload capacity.' },
  { id: 'bus_med', cat: 'structure', name: 'Medium Bus (600kg)', mass: 600, power: 0, cost: 75, science: 0, desc: 'Standard bus with room for multiple instruments.' },
  { id: 'bus_large', cat: 'structure', name: 'Large Bus (1000kg)', mass: 1000, power: 0, cost: 120, science: 0, desc: 'Heavy platform for flagship-class payloads.' },
  { id: 'thruster_mono', cat: 'structure', name: 'Monopropellant RCS', mass: 25, power: 10, cost: 15, science: 0, desc: 'Basic attitude control. Low delta-v.' },
  { id: 'thruster_bi', cat: 'structure', name: 'Bipropellant Engine', mass: 80, power: 20, cost: 45, science: 0, desc: 'Efficient main engine for orbit maneuvers.', deltav: 800 },
  { id: 'thruster_ion', cat: 'structure', name: 'Ion Thruster', mass: 40, power: 200, cost: 65, science: 0, desc: 'High-Isp electric propulsion. Slow but very efficient.', deltav: 2000 },
  { id: 'shield_thermal', cat: 'structure', name: 'Thermal Shield', mass: 60, power: 0, cost: 30, science: 0, desc: 'Multi-layer insulation + heat shield. Required for inner solar system.' },
  { id: 'shield_rad', cat: 'structure', name: 'Radiation Vault', mass: 45, power: 0, cost: 35, science: 0, desc: 'Protects electronics from radiation. Reduces failure chance.' },

  // ── POWER ──
  { id: 'solar_small', cat: 'power', name: 'Small Solar Array', mass: 30, power: -300, cost: 20, science: 0, desc: 'Compact panels. Good for inner solar system.' },
  { id: 'solar_large', cat: 'power', name: 'Large Solar Array', mass: 80, power: -800, cost: 50, science: 0, desc: 'High-output panels. Degrades beyond Mars.' },
  { id: 'rtg', cat: 'power', name: 'RTG (Plutonium-238)', mass: 55, power: -500, cost: 90, science: 0, desc: 'Radioisotope generator. Works anywhere. Long-lived.' },
  { id: 'battery', cat: 'power', name: 'Li-Ion Battery Pack', mass: 20, power: -100, cost: 10, science: 0, desc: 'Supplemental energy storage for peak loads.' },

  // ── SCIENCE ──
  { id: 'camera_narrow', cat: 'science', name: 'Narrow-Angle Camera', mass: 15, power: 30, cost: 25, science: 60, desc: 'High-resolution imaging. Surface mapping at <1m/pixel.' },
  { id: 'camera_wide', cat: 'science', name: 'Wide-Angle Camera', mass: 10, power: 20, cost: 18, science: 40, desc: 'Context imaging. Weather monitoring and approach nav.' },
  { id: 'spectrometer', cat: 'science', name: 'IR Spectrometer', mass: 25, power: 40, cost: 35, science: 80, desc: 'Mineral composition mapping. Detects water signatures.' },
  { id: 'magnetometer', cat: 'science', name: 'Magnetometer Boom', mass: 8, power: 10, cost: 12, science: 50, desc: 'Measures magnetic field. Crucial for solar wind studies.' },
  { id: 'radar', cat: 'science', name: 'Ground-Penetrating Radar', mass: 40, power: 80, cost: 55, science: 100, desc: 'Subsurface sounding. Can detect buried ice to 1km depth.' },
  { id: 'particle', cat: 'science', name: 'Particle Detector', mass: 12, power: 25, cost: 20, science: 55, desc: 'Measures energetic particle flux. Space weather monitoring.' },
  { id: 'lidar', cat: 'science', name: 'Laser Altimeter', mass: 18, power: 50, cost: 40, science: 70, desc: 'Precise topographic mapping via laser ranging.' },
  { id: 'mass_spec', cat: 'science', name: 'Mass Spectrometer', mass: 30, power: 60, cost: 50, science: 90, desc: 'Analyzes atmospheric or surface composition at molecular level.' },

  // ── COMMS ──
  { id: 'antenna_low', cat: 'comms', name: 'Low-Gain Antenna', mass: 5, power: 10, cost: 8, science: 0, desc: 'Omnidirectional. Low data rate but always-on link.' },
  { id: 'antenna_med', cat: 'comms', name: 'Medium-Gain Antenna', mass: 12, power: 25, cost: 18, science: 0, desc: 'Steerable dish. 256 kbps at lunar distance.' },
  { id: 'antenna_high', cat: 'comms', name: 'High-Gain Antenna', mass: 30, power: 60, cost: 40, science: 0, desc: '3m dish. 2 Mbps to DSN. Required for deep space.' },
  { id: 'transponder', cat: 'comms', name: 'X-Band Transponder', mass: 8, power: 15, cost: 22, science: 0, desc: 'Coherent dual-frequency. Enables radio science.' },
];

const LAUNCH_VEHICLES = [
  { id: 'scout', name: 'Scout IV', payloadKg: 600, costM: 30, reliability: 0.92, desc: 'Light lifter. LEO only.' },
  { id: 'atlas', name: 'Atlas V-541', payloadKg: 1800, costM: 110, reliability: 0.97, desc: 'Workhorse medium-lift.' },
  { id: 'falcon', name: 'Falcon Heavy', payloadKg: 3500, costM: 150, reliability: 0.96, desc: 'Heavy lift. Reusable cores.' },
  { id: 'sls', name: 'SLS Block 1B', payloadKg: 5000, costM: 350, reliability: 0.95, desc: 'Super heavy. Deep space rated.' },
];

// ── RANDOM EVENTS ──

const EVENTS_POOL = [
  {
    id: 'solar_flare',
    title: '⚡ SOLAR FLARE DETECTED',
    desc: 'A Class-X solar flare is heading toward your spacecraft. Energetic protons could damage electronics and degrade solar panels.',
    choices: [
      { label: 'Enter Safe Mode — power down instruments', effect: { health: -5, power: 5, scienceLost: 20, time: 2 }, feedback: 'Safe mode preserved most systems. Minor panel degradation noted.' },
      { label: 'Ride it out — keep instruments running', effect: { health: -18, power: -10, scienceGain: 30 }, feedback: 'Instruments captured rare flare data, but electronics took a hit.' },
      { label: 'Reorient spacecraft — use bus as shield', effect: { health: -8, power: 0, time: 1 }, feedback: 'Bus body shielded critical systems. Some surface damage to thermal blankets.' },
    ],
    condition: null,
  },
  {
    id: 'comm_loss',
    title: '📡 COMMUNICATION BLACKOUT',
    desc: 'Solar conjunction has placed the Sun between Earth and your spacecraft. DSN link is degraded to near-zero.',
    choices: [
      { label: 'Autonomous operations — let onboard AI run science', effect: { scienceGain: 15, health: -3, time: 3 }, feedback: 'Autonomous sequences collected modest data during blackout.' },
      { label: 'Hibernate — wait for conjunction to pass', effect: { time: 5, health: 2 }, feedback: 'Spacecraft safely hibernated. Conjunction cleared with no issues.' },
    ],
    condition: null,
  },
  {
    id: 'gyro_failure',
    title: '🔧 REACTION WHEEL FAILURE',
    desc: 'Reaction wheel #2 has seized. Attitude control degraded. Pointing accuracy reduced for all instruments.',
    choices: [
      { label: 'Switch to backup wheel', effect: { health: -5, costM: 0 }, feedback: 'Backup wheel engaged. Full pointing restored but redundancy lost.' },
      { label: 'Use thrusters for attitude control', effect: { health: -2, deltavLost: 150, scienceLost: 10 }, feedback: 'Thrusters compensating, but burning precious fuel. Science slightly impacted.' },
      { label: 'Attempt wheel restart sequence', effect: { health: -10, scienceGain: 5 }, feedback: 'Restart failed initially, then succeeded on 3rd try. Wheel running rough.' },
    ],
    condition: null,
  },
  {
    id: 'discovery',
    title: '🔬 UNEXPECTED DISCOVERY',
    desc: 'Your spectrometer has detected an anomalous spectral signature — possible water ice in a permanently shadowed crater.',
    choices: [
      { label: 'Redirect orbit for closer look — burns fuel', effect: { scienceGain: 80, deltavLost: 200, time: 3 }, feedback: 'Spectacular confirmation of exposed water ice! Major scientific discovery!' },
      { label: 'Observe from current orbit — preserve fuel', effect: { scienceGain: 30 }, feedback: 'Partial confirmation from current altitude. Tantalizing but inconclusive.' },
    ],
    condition: null,
  },
  {
    id: 'micrometeorite',
    title: '💥 MICROMETEORITE IMPACT',
    desc: 'Telemetry shows a sudden pressure drop in propellant tank B. Likely micrometeorite puncture.',
    choices: [
      { label: 'Isolate tank B — lose half remaining propellant', effect: { health: -8, deltavLost: 400 }, feedback: 'Tank isolated. Remaining propellant secured but delta-v margin is thin.' },
      { label: 'Attempt remote seal — risky', effect: { health: -20, deltavLost: 100 }, feedback: 'Seal partially held. Slow leak continues but most propellant saved.' },
    ],
    condition: null,
  },
  {
    id: 'software_glitch',
    title: '💻 FLIGHT SOFTWARE ANOMALY',
    desc: 'Onboard computer entered a boot loop after a memory bit-flip from cosmic ray strike.',
    choices: [
      { label: 'Upload patched firmware', effect: { health: -2, time: 1 }, feedback: 'Patch uploaded and verified. System back to nominal.' },
      { label: 'Hard reset to backup partition', effect: { health: -5, scienceLost: 15 }, feedback: 'Reset successful but lost buffered science data that hadn\'t been downlinked.' },
    ],
    condition: null,
  },
  {
    id: 'bonus_flyby',
    title: '🪐 BONUS FLYBY OPPORTUNITY',
    desc: 'A small asteroid will pass within 50,000 km of your trajectory. You can divert for a close flyby.',
    choices: [
      { label: 'Perform flyby — spend delta-v for science', effect: { scienceGain: 60, deltavLost: 300, time: 2 }, feedback: 'Flyby captured stunning images and spectral data of a previously uncharacterized body!' },
      { label: 'Stay on course — mission first', effect: { scienceGain: 5 }, feedback: 'Long-range observations only. Good discipline — saved fuel for primary mission.' },
    ],
    condition: null,
  },
  {
    id: 'thermal_issue',
    title: '🌡️ THERMAL SUBSYSTEM WARNING',
    desc: 'Instrument bay temperature rising above safe limits. A heater circuit is stuck ON.',
    choices: [
      { label: 'Cut heater circuit — risk cold side effects later', effect: { health: -6, power: 5 }, feedback: 'Heater disabled. Temperatures stabilized. May face cold issues during eclipse.' },
      { label: 'Reorient for better thermal balance', effect: { health: -3, power: -5, scienceLost: 10, time: 1 }, feedback: 'New attitude reduces heating but some instruments can\'t point at target.' },
    ],
    condition: null,
  },
  {
    id: 'funding_cut',
    title: '💰 BUDGET REVIEW',
    desc: 'Congressional review has flagged your mission. Justify continued operations or face a 15% budget cut.',
    choices: [
      { label: 'Present discovery data to committee', effect: { costM: -20, scienceGain: 10 }, feedback: 'Committee impressed by results. Budget preserved and slight increase granted!' },
      { label: 'Accept reduced operations tempo', effect: { costM: 40, scienceLost: 30 }, feedback: 'Budget cut absorbed. Reduced data collection rate for remainder of mission.' },
    ],
    condition: null,
  },
  {
    id: 'instrument_upgrade',
    title: '📊 SOFTWARE CALIBRATION COMPLETE',
    desc: 'Ground team finished recalibrating your main science instrument. Performance improved by 20%.',
    choices: [
      { label: 'Apply new calibration tables', effect: { scienceGain: 25 }, feedback: 'New calibration applied. Data quality significantly improved!' },
    ],
    condition: null,
  },
];


// ─────────────────────────────────────────────────────
// LOW-POLY GEOMETRY FACTORIES
// ─────────────────────────────────────────────────────

function jitter(geo, amount) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
    pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
    pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createLowPolyPlanet(radius, color, detail = 1) {
  const geo = jitter(new THREE.IcosahedronGeometry(radius, detail), radius * 0.08);
  const mat = new THREE.MeshPhongMaterial({
    color, flatShading: true,
    shininess: 10,
  });
  const mesh = new THREE.Mesh(geo, mat);

  // atmosphere glow
  const glowGeo = new THREE.IcosahedronGeometry(radius * 1.15, detail);
  const glowMat = new THREE.MeshPhongMaterial({
    color, transparent: true, opacity: 0.12,
    side: THREE.BackSide, flatShading: true,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  mesh.add(glow);

  return mesh;
}

function createLowPolySun(radius) {
  const geo = jitter(new THREE.IcosahedronGeometry(radius, 2), radius * 0.05);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  const mesh = new THREE.Mesh(geo, mat);

  // corona layers
  for (let i = 1; i <= 3; i++) {
    const cGeo = new THREE.IcosahedronGeometry(radius * (1 + i * 0.15), 1);
    const cMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.06 / i,
      side: THREE.BackSide,
    });
    mesh.add(new THREE.Mesh(cGeo, cMat));
  }

  // point light
  const light = new THREE.PointLight(0xffeedd, 2.5, 200);
  mesh.add(light);

  return mesh;
}

function createStarfield(count = 3000) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 200 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // color variation: white, blue-ish, yellow-ish
    const t = Math.random();
    if (t < 0.6) { colors[i*3] = 0.9; colors[i*3+1] = 0.92; colors[i*3+2] = 1.0; }
    else if (t < 0.8) { colors[i*3] = 1.0; colors[i*3+1] = 0.95; colors[i*3+2] = 0.7; }
    else { colors[i*3] = 0.7; colors[i*3+1] = 0.8; colors[i*3+2] = 1.0; }

    sizes[i] = 0.3 + Math.random() * 1.2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.8, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.85,
  });

  return new THREE.Points(geo, mat);
}

function createLowPolyAsteroid(radius) {
  const geo = jitter(new THREE.IcosahedronGeometry(radius, 1), radius * 0.3);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x887766, flatShading: true, shininess: 5,
  });
  return new THREE.Mesh(geo, mat);
}

function createOrbitRing(radius, color = 0x3c96ff, opacity = 0.2) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(128);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const ring = new THREE.LineLoop(geo, mat);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

// ── Spacecraft 3D Builder ──

function buildSpacecraftMesh(equipped) {
  const group = new THREE.Group();

  // Determine bus model from Kenney Space Kit
  const bus = equipped.find(c => c.id.startsWith('bus_'));
  let modelKey = 'craft_speederA';
  let busScale = 0.55;

  if (bus) {
    if (bus.id === 'bus_small') {
      modelKey = 'craft_speederA';
      busScale = 0.55;
    } else if (bus.id === 'bus_med') {
      modelKey = 'craft_speederB';
      busScale = 0.65;
    } else if (bus.id === 'bus_large') {
      modelKey = 'craft_cargoA';
      busScale = 0.75;
    }
  }

  // Heavy survey / miner payload
  if (equipped.some(c => c.id === 'drill' || c.id === 'sample_return')) {
    modelKey = 'craft_miner';
  }

  const kenneyBus = Assets.clone(modelKey, 'center');
  if (kenneyBus) {
    kenneyBus.scale.set(busScale, busScale, busScale);
    kenneyBus.rotation.y = Math.PI; // Face forward
    group.add(kenneyBus);
  } else {
    // Procedural fallback body
    const bodyGeo = new THREE.CylinderGeometry(busScale, busScale * 0.9, busScale * 1.6, 8, 1);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true, shininess: 30 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const coneGeo = new THREE.ConeGeometry(busScale * 0.5, busScale * 0.6, 6);
    const coneMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc, flatShading: true });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = busScale * 1.1;
    group.add(cone);
  }

  // Antennas from Kenney Space Kit
  if (equipped.some(c => c.id === 'antenna_high')) {
    const dish = Assets.clone('satelliteDish_detailed', 'center');
    if (dish) {
      dish.scale.set(0.35, 0.35, 0.35);
      dish.position.set(0, busScale * 0.8, -busScale * 0.2);
      dish.rotation.x = -0.3;
      group.add(dish);
    } else {
      const dishGeo = new THREE.SphereGeometry(busScale * 0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 3);
      const dishMat = new THREE.MeshPhongMaterial({ color: 0xddddee, flatShading: true, side: THREE.DoubleSide });
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = Math.PI;
      dishMesh.position.set(0, busScale * 1.6, busScale * 0.5);
      group.add(dishMesh);
    }
  } else if (equipped.some(c => c.id === 'antenna_med')) {
    const dish = Assets.clone('satelliteDish', 'center');
    if (dish) {
      dish.scale.set(0.28, 0.28, 0.28);
      dish.position.set(0, busScale * 0.75, 0);
      group.add(dish);
    }
  }

  // RTG Power Generator from Kenney Space Kit
  if (equipped.some(c => c.id === 'rtg')) {
    const rtg = Assets.clone('machine_generator', 'center');
    if (rtg) {
      rtg.scale.set(0.22, 0.22, 0.22);
      rtg.position.set(0, -0.15, -busScale * 0.75);
      group.add(rtg);
    }
  }

  // Science Sensor Arrays from Kenney Space Kit
  if (equipped.some(c => c.id === 'radar' || c.id === 'spectrometer' || c.id === 'particle')) {
    const sensor = Assets.clone('machine_wireless', 'center');
    if (sensor) {
      sensor.scale.set(0.24, 0.24, 0.24);
      sensor.position.set(0, busScale * 0.45, busScale * 0.55);
      group.add(sensor);
    }
  }

  // Solar panels with articulated struts
  const hasSolar = equipped.some(c => c.id.startsWith('solar_'));
  if (hasSolar) {
    const large = equipped.some(c => c.id === 'solar_large');
    const pW = large ? busScale * 2.6 : busScale * 1.6;
    const pH = busScale * 0.85;
    const panelGeo = new THREE.BoxGeometry(pW, 0.03, pH);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1a3a8a, flatShading: true, shininess: 80 });

    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-busScale - pW / 2, 0, 0);
    group.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(busScale + pW / 2, 0, 0);
    group.add(rightPanel);
  }

  // Magnetometer boom
  if (equipped.some(c => c.id === 'magnetometer')) {
    const boomGeo = new THREE.CylinderGeometry(0.015, 0.015, busScale * 3, 4);
    const boomMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true });
    const boom = new THREE.Mesh(boomGeo, boomMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(-busScale - busScale * 1.5, 0.3, 0.3);
    group.add(boom);

    const sensorGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const sensor = new THREE.Mesh(sensorGeo, new THREE.MeshPhongMaterial({ color: 0xffcc00, flatShading: true }));
    sensor.position.set(-busScale - busScale * 3.0, 0.3, 0.3);
    group.add(sensor);
  }

  // Engine exhaust nozzle
  const nozGeo = new THREE.CylinderGeometry(busScale * 0.15, busScale * 0.28, busScale * 0.35, 8);
  const nozMat = new THREE.MeshPhongMaterial({ color: 0x333344, flatShading: true });
  const noz = new THREE.Mesh(nozGeo, nozMat);
  noz.position.set(0, 0, -busScale * 1.05);
  noz.rotation.x = Math.PI / 2;
  group.add(noz);

  return group;
}


// ─────────────────────────────────────────────────────
// NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────

function notify(text, type = 'info') {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  el.className = `notif ${type}`;
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 4000);
}

// ─────────────────────────────────────────────────────
// TELEMETRY CANVAS RENDERER
// ─────────────────────────────────────────────────────

class TelemetryGraph {
  constructor(canvasId, lineColor = '#3c96ff') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = [];
    this.maxPoints = 120;
    this.lineColor = lineColor;
  }

  push(value) {
    this.data.push(Math.max(0, Math.min(100, value)));
    if (this.data.length > this.maxPoints) this.data.shift();
  }

  draw() {
    if (!this.ctx) return;
    const c = this.canvas;
    c.width = c.clientWidth * (window.devicePixelRatio || 1);
    c.height = c.clientHeight * (window.devicePixelRatio || 1);
    const ctx = this.ctx;
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const w = c.clientWidth, h = c.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(60,150,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += h / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.data.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < this.data.length; i++) {
      const x = (i / (this.maxPoints - 1)) * w;
      const y = h - (this.data[i] / 100) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // fill under
    const lastX = ((this.data.length - 1) / (this.maxPoints - 1)) * w;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = this.lineColor.replace(')', ',0.08)').replace('rgb', 'rgba');
    ctx.fill();
  }
}

// ─────────────────────────────────────────────────────
// 2D ORBIT DIAGRAM RENDERER
// ─────────────────────────────────────────────────────

class OrbitDiagram {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
  }

  draw(periapsis, apoapsis, targetRadius = 6371, planetColor = '#3c96ff') {
    if (!this.ctx) return;
    const c = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const ctx = this.ctx;
    ctx.scale(dpr, dpr);
    const w = c.clientWidth, h = c.clientHeight;
    const cx = w / 2, cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Scale: map max orbit to 90% of half-canvas
    const maxOrbit = targetRadius + apoapsis;
    const minOrbit = targetRadius + periapsis;
    const scale = (Math.min(w, h) * 0.42) / maxOrbit;

    const planetR = Math.max(6, targetRadius * scale);

    // Planet
    ctx.beginPath();
    ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
    ctx.fillStyle = planetColor;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = planetColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Atmosphere
    ctx.beginPath();
    ctx.arc(cx, cy, planetR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = planetColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Orbit ellipse
    const semiMajor = (maxOrbit + minOrbit) / 2 * scale;
    const semiMinor = Math.sqrt(maxOrbit * minOrbit) * scale;
    const offsetX = (maxOrbit - minOrbit) / 2 * scale;

    ctx.beginPath();
    ctx.ellipse(cx + offsetX, cy, semiMajor, semiMinor, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#3c96ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Periapsis marker
    const periX = cx + offsetX - semiMajor;
    ctx.beginPath();
    ctx.arc(periX, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e676';
    ctx.fill();
    ctx.font = '9px monospace';
    ctx.fillStyle = '#00e676';
    ctx.fillText(`Pe: ${periapsis}km`, periX - 15, cy + 14);

    // Apoapsis marker
    const apoX = cx + offsetX + semiMajor;
    ctx.beginPath();
    ctx.arc(apoX, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b35';
    ctx.fill();
    ctx.fillStyle = '#ff6b35';
    ctx.fillText(`Ap: ${apoapsis}km`, apoX - 20, cy + 14);

    // Spacecraft icon at periapsis
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(periX, cy - 6);
    ctx.lineTo(periX - 4, cy + 4);
    ctx.lineTo(periX + 4, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Labels
    ctx.fillStyle = '#6880aa';
    ctx.font = '8px monospace';
    ctx.fillText('EARTH', cx - 14, cy + planetR + 14);
  }
}

// ─────────────────────────────────────────────────────
// ORBITAL MECHANICS HELPERS
// ─────────────────────────────────────────────────────

const MU_EARTH = 398600.4418; // km³/s²

function hohmannDeltaV(r1, r2) {
  // Hohmann transfer delta-v from circular orbit r1 to r2 (in km from center)
  const a_transfer = (r1 + r2) / 2;
  const dv1 = Math.abs(Math.sqrt(MU_EARTH / r1) * (Math.sqrt(2 * r2 / (r1 + r2)) - 1));
  const dv2 = Math.abs(Math.sqrt(MU_EARTH / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2))));
  return { dv1, dv2, total: dv1 + dv2 };
}

function orbitalPeriod(semiMajor) {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajor, 3) / MU_EARTH);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }


// ─────────────────────────────────────────────────────
// PROCEDURAL AUDIO SYNTHESIZER (WEB AUDIO API)
// ─────────────────────────────────────────────────────

class SoundManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.thrustOsc = null;
    this.thrustGain = null;
    this.noiseNode = null;
    this.noiseGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupThrustSynth();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupThrustSynth() {
    if (!this.ctx) return;
    try {
      // Noise buffer for rocket thrust rumble
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02; // Brown/pink noise
        lastOut = output[i];
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.noiseNode.connect(filter);
      filter.connect(this.noiseGain);
      this.noiseGain.connect(this.ctx.destination);
      this.noiseNode.start(0);
    } catch (e) {
      console.warn('Audio setup error:', e);
    }
  }

  setThrust(active) {
    if (!this.enabled || !this.ctx || !this.noiseGain) return;
    const now = this.ctx.currentTime;
    if (active) {
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    } else {
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    }
  }

  playBeep(freq = 660, dur = 0.08) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  }

  playScan() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playAlarm() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// ─────────────────────────────────────────────────────
// MAIN GAME STATE & ENGINE
// ─────────────────────────────────────────────────────

class SpaceMissionGame {
  constructor() {
    this.currentScreen = 'title';
    this.selectedMission = null;
    this.equippedComponents = [];
    this.selectedCategory = 'structure';
    this.selectedLaunchVehicle = LAUNCH_VEHICLES[1]; // Atlas default
    this.craftName = 'PROBE-01';

    // Interactive flight & manual controls
    this.flight = {
      pitch: 0,
      yaw: 0,
      roll: 0,
      pitchRate: 0,
      yawRate: 0,
      rollRate: 0,
      burning: 0, // 1 = prograde, -1 = retrograde, 0 = off
      sas: true,
      currentOrbitR: 12,
      speedKms: 7.4,
      altKm: 350,
      deltavAvail: 3200
    };

    // Camera & time control
    this.cameraMode = 'orbit'; // 'orbit', 'chase', 'cockpit'
    this.timeWarp = 1;

    // Keys currently held
    this.keysHeld = {};

    // Audio
    this.sound = new SoundManager();

    // Launch parameters
    this.launchParams = {
      depart: 0,
      incl: 0,
      peri: 200,
      apo: 400
    };

    // Mission runtime state
    this.missionState = {
      active: false,
      paused: false,
      elapsedTime: 0,
      phaseIndex: 0,
      health: 100,
      power: 100,
      scienceScore: 0,
      dataDownlinked: 0,
      budgetRemaining: 0,
      deltavRemaining: 3200,
      orbitAngle: 0,
      orbitSpeed: 0.008,
      activeInstruments: {},
      logHistory: [],
      eventQueue: [],
      activeEvent: null,
      telemetryHistory: []
    };

    // 3D Engine references
    this.mainRenderer = null;
    this.mainScene = null;
    this.mainCamera = null;
    this.mainControls = null;
    this.spacecraftMesh = null;
    this.targetPlanetMesh = null;
    this.earthMesh = null;
    this.titleMoon = null;
    this.titleAstronaut = null;
    this.asteroidDebris = [];
    this.orbitCurveMesh = null;
    this.engineFlameParticles = null;
    this.surfaceWaypoints = [];

    // Raycasting for interactive surface anomalies
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.builderRenderer = null;
    this.builderScene = null;
    this.builderCamera = null;
    this.builderControls = null;
    this.builderCraftMesh = null;

    this.launchRenderer = null;
    this.launchScene = null;
    this.launchCamera = null;
    this.rocketMesh = null;
    this.launchPadPlatform = null;
    this.launchHangar = null;
    this.launchDish = null;
    this.launchParticles = null;

    this.orbitDiagram = null;
    this.telemetryGraph = null;

    this.init();
  }

  init() {
    this.initMain3D();
    this.initBuilder3D();
    this.initLaunch3D();
    this.orbitDiagram = new OrbitDiagram('orbit-canvas');
    this.telemetryGraph = new TelemetryGraph('telem-canvas', '#3c96ff');

    this.renderMissionsList();
    this.setupWindowListeners();
    this.setupKeyboardListeners();
    this.setupRaycasting();
    this.animateMain();

    // Load Kenney Space Kit assets and upgrade scenes
    Assets.loadAll().then(() => {
      this.onAssetsLoaded();
    });

    // Default craft name sync
    const craftNameInput = document.getElementById('craft-name');
    if (craftNameInput) {
      craftNameInput.addEventListener('input', (e) => {
        this.craftName = e.target.value.trim() || 'PROBE-01';
      });
    }

    // Audio init on first interaction
    window.addEventListener('click', () => this.sound.init(), { once: true });
    window.addEventListener('keydown', () => this.sound.init(), { once: true });
  }

  onAssetsLoaded() {
    // 1. Refresh rocket & environment in launch scene
    if (this.launchScene) {
      if (this.rocketMesh) {
        this.launchScene.remove(this.rocketMesh);
        this.rocketMesh = this.createRocketModel();
        this.rocketMesh.position.set(0, 4.5, 0);
        this.launchScene.add(this.rocketMesh);
      }
      if (!this.launchPadPlatform) {
        this.launchPadPlatform = Assets.clone('platform_large', 'bottom');
        if (this.launchPadPlatform) {
          this.launchPadPlatform.scale.set(4.5, 3.0, 4.5);
          this.launchPadPlatform.position.set(0, 0, 0);
          this.launchScene.add(this.launchPadPlatform);
        }
      }
      if (!this.launchHangar) {
        this.launchHangar = Assets.clone('hangar_largeA', 'bottom');
        if (this.launchHangar) {
          this.launchHangar.scale.set(3.5, 3.5, 3.5);
          this.launchHangar.position.set(-13, 0, -8);
          this.launchHangar.rotation.y = Math.PI / 4;
          this.launchScene.add(this.launchHangar);
        }
      }
      if (!this.launchDish) {
        this.launchDish = Assets.clone('satelliteDish_detailed', 'bottom');
        if (this.launchDish) {
          this.launchDish.scale.set(1.5, 1.5, 1.5);
          this.launchDish.position.set(10, 0, -5);
          this.launchDish.rotation.y = -Math.PI / 3;
          this.launchScene.add(this.launchDish);
        }
      }
    }

    // 2. Floating astronaut in title screen
    if (this.mainScene && !this.titleAstronaut) {
      this.titleAstronaut = Assets.clone('astronautA', 'center');
      if (this.titleAstronaut) {
        this.titleAstronaut.scale.set(0.9, 0.9, 0.9);
        this.titleAstronaut.position.set(7.5, 2.2, 5.0);
        this.mainScene.add(this.titleAstronaut);
      }
    }

    // 3. Refresh builder preview craft
    if (this.builderScene) {
      this.refreshBuilderCraft();
    }
  }

  setupWindowListeners() {
    window.addEventListener('resize', () => this.onResize());
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.sound.init();
      this.keysHeld[e.code] = true;

      // Global hotkeys
      if (e.code === 'KeyH') {
        this.toggleControlsModal();
      } else if (e.code === 'Digit1') {
        this.setCameraMode('orbit');
      } else if (e.code === 'Digit2') {
        this.setCameraMode('chase');
      } else if (e.code === 'Digit3') {
        this.setCameraMode('cockpit');
      } else if (e.code === 'KeyC') {
        const modes = ['orbit', 'chase', 'cockpit'];
        const next = modes[(modes.indexOf(this.cameraMode) + 1) % modes.length];
        this.setCameraMode(next);
      } else if (e.code === 'KeyF') {
        this.toggleSAS();
      } else if (e.code === 'BracketLeft') {
        this.adjustTimeWarp(-1);
      } else if (e.code === 'BracketRight') {
        this.adjustTimeWarp(1);
      } else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.missionState.active && this.currentScreen === 'ops') {
          e.preventDefault();
          this.startBurn(1);
        }
      } else if (e.code === 'KeyX' || e.code === 'ControlLeft') {
        if (this.missionState.active && this.currentScreen === 'ops') {
          e.preventDefault();
          this.startBurn(-1);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX' || e.code === 'ControlLeft') {
        this.stopBurn();
      }
    });
  }

  setupRaycasting() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('click', (e) => {
      if (this.currentScreen !== 'ops' || !this.missionState.active) return;
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.mainCamera);
      const intersects = this.raycaster.intersectObjects(this.surfaceWaypoints, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj.parent && !hitObj.userData.anomaly) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData.anomaly) {
          this.scanAnomaly(hitObj.userData.anomaly);
        }
      }
    });
  }

  onResize() {
    const canvas = document.getElementById('canvas');
    if (this.mainRenderer && canvas) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.mainCamera.aspect = w / h;
      this.mainCamera.updateProjectionMatrix();
      this.mainRenderer.setSize(w, h);
      this.mainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    const bCanvas = document.getElementById('spacecraft-canvas');
    if (this.builderRenderer && bCanvas && bCanvas.clientWidth > 0) {
      const bw = bCanvas.clientWidth;
      const bh = bCanvas.clientHeight || 400;
      this.builderCamera.aspect = bw / bh;
      this.builderCamera.updateProjectionMatrix();
      this.builderRenderer.setSize(bw, bh);
    }

    const lCanvas = document.getElementById('launch-canvas');
    if (this.launchRenderer && lCanvas && lCanvas.clientWidth > 0) {
      const lw = lCanvas.clientWidth;
      const lh = lCanvas.clientHeight || 500;
      this.launchCamera.aspect = lw / lh;
      this.launchCamera.updateProjectionMatrix();
      this.launchRenderer.setSize(lw, lh);
    }
  }

  // ─────────────────────────────────────────────────────
  // 3D SCENE INITIALIZERS
  // ─────────────────────────────────────────────────────

  initMain3D() {
    const canvas = document.getElementById('canvas');
    this.mainScene = new THREE.Scene();
    this.mainScene.fog = new THREE.FogExp2(0x030610, 0.002);

    this.mainCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.mainCamera.position.set(0, 18, 38);

    this.mainRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.mainRenderer.setSize(window.innerWidth, window.innerHeight);
    this.mainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.mainRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.mainRenderer.toneMappingExposure = 1.1;

    this.mainControls = new OrbitControls(this.mainCamera, canvas);
    this.mainControls.enableDamping = true;
    this.mainControls.dampingFactor = 0.05;
    this.mainControls.maxDistance = 300;
    this.mainControls.minDistance = 3;

    // Lighting
    const ambient = new THREE.AmbientLight(0x223355, 0.9);
    this.mainScene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    dirLight.position.set(60, 40, 80);
    this.mainScene.add(dirLight);

    // Starfield
    const stars = createStarfield(3500);
    this.mainScene.add(stars);

    // Default Earth for title view
    this.earthMesh = createLowPolyPlanet(5.5, 0x2277ff, 2);
    this.earthMesh.position.set(0, 0, 0);
    this.mainScene.add(this.earthMesh);

    // Title moon
    this.titleMoon = createLowPolyPlanet(1.2, 0xbbbbcc, 1);
    this.titleMoon.position.set(16, 4, -8);
    this.mainScene.add(this.titleMoon);

    const titleOrbit = createOrbitRing(18, 0x3c96ff, 0.15);
    this.mainScene.add(titleOrbit);

    // Floating Astronaut in Earth orbit (Kenney)
    this.titleAstronaut = Assets.clone('astronautA', 'center');
    if (this.titleAstronaut) {
      this.titleAstronaut.scale.set(0.9, 0.9, 0.9);
      this.titleAstronaut.position.set(7.5, 2.2, 5.0);
      this.mainScene.add(this.titleAstronaut);
    }
  }

  initBuilder3D() {
    const canvas = document.getElementById('spacecraft-canvas');
    if (!canvas) return;

    this.builderScene = new THREE.Scene();
    this.builderCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.builderCamera.position.set(2.5, 2.0, 3.5);

    this.builderRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.builderRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.builderControls = new OrbitControls(this.builderCamera, canvas);
    this.builderControls.enableDamping = true;
    this.builderControls.dampingFactor = 0.08;
    this.builderControls.autoRotate = true;
    this.builderControls.autoRotateSpeed = 1.5;

    const amb = new THREE.AmbientLight(0x334466, 1.2);
    this.builderScene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dir1.position.set(5, 8, 5);
    this.builderScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x3c96ff, 0.8);
    dir2.position.set(-5, -3, -5);
    this.builderScene.add(dir2);

    const grid = new THREE.GridHelper(6, 12, 0x3c96ff, 0x162c55);
    grid.position.y = -1.2;
    this.builderScene.add(grid);
  }

  initLaunch3D() {
    const canvas = document.getElementById('launch-canvas');
    if (!canvas) return;

    this.launchScene = new THREE.Scene();
    this.launchCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    this.launchCamera.position.set(0, 10, 24);
    this.launchCamera.lookAt(0, 5, 0);

    this.launchRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.launchRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const amb = new THREE.AmbientLight(0x1a2640, 1.0);
    this.launchScene.add(amb);

    const dir = new THREE.DirectionalLight(0xfff0dd, 2.2);
    dir.position.set(20, 30, 20);
    this.launchScene.add(dir);

    // Launch Pad Platform (Kenney)
    this.launchPadPlatform = Assets.clone('platform_large', 'bottom');
    if (this.launchPadPlatform) {
      this.launchPadPlatform.scale.set(4.5, 3.0, 4.5);
      this.launchPadPlatform.position.set(0, 0, 0);
      this.launchScene.add(this.launchPadPlatform);
    } else {
      const padGeo = new THREE.CylinderGeometry(6, 7, 1.5, 8);
      const padMat = new THREE.MeshPhongMaterial({ color: 0x222a38, flatShading: true });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = -0.75;
      this.launchScene.add(pad);
    }

    // Spaceport Hangar in background (Kenney)
    this.launchHangar = Assets.clone('hangar_largeA', 'bottom');
    if (this.launchHangar) {
      this.launchHangar.scale.set(3.5, 3.5, 3.5);
      this.launchHangar.position.set(-13, 0, -8);
      this.launchHangar.rotation.y = Math.PI / 4;
      this.launchScene.add(this.launchHangar);
    }

    // Launch Facility Tracking Radar Dish (Kenney)
    this.launchDish = Assets.clone('satelliteDish_detailed', 'bottom');
    if (this.launchDish) {
      this.launchDish.scale.set(1.5, 1.5, 1.5);
      this.launchDish.position.set(10, 0, -5);
      this.launchDish.rotation.y = -Math.PI / 3;
      this.launchScene.add(this.launchDish);
    }

    // Umbilical service tower
    const towerGeo = new THREE.BoxGeometry(1.2, 14, 1.2);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0xcc3322, flatShading: true });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-4, 6, 0);
    this.launchScene.add(tower);

    this.rocketMesh = this.createRocketModel();
    this.rocketMesh.position.set(0, 4.5, 0);
    this.launchScene.add(this.rocketMesh);

    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = 0;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xff6b35,
      size: 0.4,
      transparent: true,
      opacity: 0.8
    });
    this.launchParticles = new THREE.Points(pGeo, pMat);
    this.launchParticles.visible = false;
    this.launchScene.add(this.launchParticles);
  }

  createRocketModel() {
    const rocket = new THREE.Group();

    // Assemble Kenney modular heavy rocket if assets are loaded
    if (Assets.models['rocket_baseA']) {
      const s = 1.6;
      const rocketCore = new THREE.Group();

      // 1. Rocket base with engine bells
      const base = Assets.clone('rocket_baseA', 'bottom');
      base.scale.set(s, s, s);
      base.position.y = 0;
      rocketCore.add(base);

      let currentY = 1.6 * s;

      // 2. Fuel tank core segments
      for (let i = 0; i < 6; i++) {
        const tank = Assets.clone('rocket_fuelA', 'bottom');
        tank.scale.set(s, s, s);
        tank.position.y = currentY;
        rocketCore.add(tank);
        currentY += 0.5 * s;
      }

      // 3. Payload nose cone fairing
      const top = Assets.clone('rocket_topA', 'bottom');
      top.scale.set(s, s, s);
      top.position.y = currentY;
      rocketCore.add(top);
      currentY += 0.8 * s;

      // 4. Heavy strap-on side boosters
      for (let side of [-1, 1]) {
        for (let b = 0; b < 3; b++) {
          const booster = Assets.clone('rocket_sidesA', 'bottom');
          booster.scale.set(s, s, s);
          booster.position.set(side * 1.35, 0.4 + b * (1.0 * s), 0);
          if (side < 0) booster.rotation.y = Math.PI;
          rocketCore.add(booster);
        }
      }

      // Center vertically around (0, 0, 0) like the procedural rocket
      rocketCore.position.y = -currentY / 2;
      rocket.add(rocketCore);
      return rocket;
    }

    // Procedural fallback rocket
    const coreGeo = new THREE.CylinderGeometry(0.7, 0.7, 7, 10);
    const coreMat = new THREE.MeshPhongMaterial({ color: 0xeeeeff, flatShading: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    rocket.add(core);

    const fairGeo = new THREE.ConeGeometry(0.7, 2, 10);
    const fairMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true });
    const fair = new THREE.Mesh(fairGeo, fairMat);
    fair.position.y = 4.5;
    rocket.add(fair);

    for (let i = -1; i <= 1; i += 2) {
      const bGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
      const bMat = new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true });
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.set(i * 1.05, -0.8, 0);
      rocket.add(b);

      const bNoseGeo = new THREE.ConeGeometry(0.4, 1, 8);
      const bNose = new THREE.Mesh(bNoseGeo, bMat);
      bNose.position.set(i * 1.05, 2.2, 0);
      rocket.add(bNose);
    }

    const nozGeo = new THREE.CylinderGeometry(0.2, 0.4, 0.6, 8);
    const nozMat = new THREE.MeshPhongMaterial({ color: 0x333344, flatShading: true });
    const noz = new THREE.Mesh(nozGeo, nozMat);
    noz.position.y = -3.8;
    rocket.add(noz);

    return rocket;
  }

  createEngineFlameMesh() {
    const group = new THREE.Group();

    const coneGeo = new THREE.ConeGeometry(0.25, 1.8, 6);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x3c96ff,
      transparent: true,
      opacity: 0.85
    });
    const coreFlame = new THREE.Mesh(coneGeo, coneMat);
    coreFlame.rotation.x = Math.PI;
    coreFlame.position.y = -1.2;
    group.add(coreFlame);

    const outerGeo = new THREE.ConeGeometry(0.4, 2.4, 6);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.45
    });
    const outerFlame = new THREE.Mesh(outerGeo, outerMat);
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -1.5;
    group.add(outerFlame);

    group.visible = false;
    return group;
  }

  // ─────────────────────────────────────────────────────
  // FLIGHT CONTROLS & BURN PHYSICS
  // ─────────────────────────────────────────────────────

  setSteer(axis, val) {
    this.sound.init();
    if (axis === 'pitch') this.flight.pitchRate = val * 0.035;
    if (axis === 'yaw') this.flight.yawRate = val * 0.035;
    if (axis === 'roll') this.flight.rollRate = val * 0.045;
    if (val !== 0) this.sound.playBeep(440, 0.04);
  }

  toggleSAS() {
    this.sound.init();
    this.flight.sas = !this.flight.sas;
    const sasEl = document.getElementById('flight-sas-status');
    const sasBtn = document.getElementById('btn-sas');
    if (sasEl) {
      sasEl.textContent = this.flight.sas ? 'ON' : 'OFF';
      sasEl.style.color = this.flight.sas ? 'var(--success)' : 'var(--danger)';
    }
    if (sasBtn) {
      if (this.flight.sas) sasBtn.classList.add('active');
      else sasBtn.classList.remove('active');
    }
    notify(`SAS Stability Assist: ${this.flight.sas ? 'ENGAGED' : 'DISENGAGED'}`, 'info');
    this.sound.playBeep(this.flight.sas ? 780 : 390, 0.08);
  }

  startBurn(dir) {
    if (!this.missionState.active || this.flight.deltavAvail <= 0) {
      if (this.flight.deltavAvail <= 0) notify('Propellant depleted! Thrusters offline.', 'danger');
      return;
    }
    this.sound.init();
    this.flight.burning = dir;
    this.sound.setThrust(true);

    if (this.engineFlameParticles) {
      this.engineFlameParticles.visible = true;
      if (dir < 0) {
        // Retrograde flame color shifts to cold blue/white
        this.engineFlameParticles.children[0].material.color.setHex(0x00e676);
      } else {
        this.engineFlameParticles.children[0].material.color.setHex(0x3c96ff);
      }
    }

    const pBtn = document.getElementById('btn-burn-prograde');
    const rBtn = document.getElementById('btn-burn-retrograde');
    if (dir > 0 && pBtn) pBtn.classList.add('active');
    if (dir < 0 && rBtn) rBtn.classList.add('active');
  }

  stopBurn() {
    this.flight.burning = 0;
    this.sound.setThrust(false);
    if (this.engineFlameParticles) this.engineFlameParticles.visible = false;

    const pBtn = document.getElementById('btn-burn-prograde');
    const rBtn = document.getElementById('btn-burn-retrograde');
    if (pBtn) pBtn.classList.remove('active');
    if (rBtn) rBtn.classList.remove('active');
  }

  setCameraMode(mode) {
    this.sound.init();
    this.cameraMode = mode;
    ['orbit', 'chase', 'cockpit'].forEach(m => {
      const btn = document.getElementById(`cam-btn-${m}`);
      if (btn) {
        if (m === mode) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (mode === 'orbit') {
      this.mainControls.enabled = true;
      this.mainControls.target.set(0, 0, 0);
    } else {
      this.mainControls.enabled = false;
    }
    this.sound.playBeep(520, 0.05);
    notify(`CAMERA VIEW: ${mode.toUpperCase()}`, 'info');
  }

  setTimeWarp(warp) {
    this.sound.init();
    this.timeWarp = warp;
    [1, 5, 25].forEach(w => {
      const btn = document.getElementById(`warp-btn-${w}`);
      if (btn) {
        if (w === warp) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    this.sound.playBeep(620, 0.05);
    notify(`TIME WARP: ${warp}x`, 'info');
  }

  adjustTimeWarp(delta) {
    const warps = [1, 5, 25];
    let idx = warps.indexOf(this.timeWarp);
    idx = clamp(idx + delta, 0, warps.length - 1);
    this.setTimeWarp(warps[idx]);
  }

  toggleAudio() {
    const ok = this.sound.toggle();
    const btn = document.getElementById('btn-sound');
    if (btn) {
      btn.textContent = ok ? '🔊 SFX' : '🔇 MUTE';
      btn.style.color = ok ? 'inherit' : 'var(--text-dim)';
    }
    notify(`Audio SFX: ${ok ? 'ENABLED' : 'MUTED'}`, 'info');
  }

  toggleControlsModal() {
    const modal = document.getElementById('controls-modal');
    if (modal) {
      modal.classList.toggle('hidden');
      this.sound.playBeep(480, 0.06);
    }
  }

  // ─────────────────────────────────────────────────────
  // NAVIGATION & SCREEN FLOW
  // ─────────────────────────────────────────────────────

  goTo(screenName) {
    const screens = ['title', 'mission', 'builder', 'launch', 'ops', 'results'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s === screenName) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    this.currentScreen = screenName;

    if (this.titleAstronaut) this.titleAstronaut.visible = (screenName === 'title');
    if (this.earthMesh) this.earthMesh.visible = (screenName === 'title');
    if (this.titleMoon) this.titleMoon.visible = (screenName === 'title');

    if (screenName === 'builder') {
      setTimeout(() => {
        this.onResize();
        this.renderCategoryTabs();
        this.renderComponents();
        this.updateBuilderStats();
        this.refreshBuilderCraft();
      }, 50);
    } else if (screenName === 'launch') {
      setTimeout(() => {
        this.onResize();
        this.renderLaunchVehicles();
        this.updateLaunchStats();
      }, 50);
    } else if (screenName === 'ops') {
      this.startOperationsLoop();
    }
  }

  showHowToPlay() {
    this.toggleControlsModal();
  }

  showCredits() {
    alert(
      "★ COSMODEX — NASA Space Apps Challenge 2026\n\n" +
      "Theme: Space Mission Design Game\n" +
      "Procedural Low-Poly 3D Assets, Orbital Mechanics & Systems Engineering\n" +
      "Engineered with 60 FPS Camera, Procedural Web Audio Synth, & Manual Flight Thrusters."
    );
  }

  // ─────────────────────────────────────────────────────
  // MISSION SELECTION
  // ─────────────────────────────────────────────────────

  renderMissionsList() {
    const grid = document.getElementById('missions-grid');
    if (!grid) return;
    grid.innerHTML = '';

    MISSIONS.forEach(m => {
      const card = document.createElement('div');
      card.className = `mission-card ${this.selectedMission?.id === m.id ? 'selected' : ''}`;
      card.onclick = () => this.selectMission(m);

      let dots = '';
      for (let i = 1; i <= 5; i++) {
        dots += `<div class="diff-dot ${i <= m.difficulty ? 'active' : ''}"></div>`;
      }

      card.innerHTML = `
        <span class="mission-icon">${m.icon}</span>
        <h3>${m.name}</h3>
        <p class="mission-desc">${m.desc}</p>
        <div class="difficulty">
          ${dots}
          <span class="diff-label">DIFF ${m.difficulty}/5</span>
        </div>
        <div class="mission-reward">★ ${m.reward}</div>
      `;
      grid.appendChild(card);
    });
  }

  selectMission(m) {
    this.selectedMission = m;
    this.flight.currentOrbitR = m.orbitRadius;
    this.renderMissionsList();

    const btn = document.getElementById('btn-begin-mission');
    if (btn) btn.disabled = false;

    this.equippedComponents = [
      COMPONENTS.find(c => c.id === 'bus_small'),
      COMPONENTS.find(c => c.id === 'solar_small'),
      COMPONENTS.find(c => c.id === 'antenna_low'),
      COMPONENTS.find(c => c.id === 'camera_wide')
    ].filter(Boolean);

    if (this.mainCamera) {
      this.mainCamera.position.set(0, 14, 30);
      this.mainControls.target.set(0, 0, 0);
    }
  }

  beginMission() {
    if (!this.selectedMission) return;
    const titleEl = document.getElementById('builder-mission-title');
    if (titleEl) {
      titleEl.textContent = `TARGET: ${this.selectedMission.name} | BUDGET: $${this.selectedMission.budgetM}M | MAX MASS: ${this.selectedMission.maxMassKg}kg`;
    }
    this.goTo('builder');
  }

  // ─────────────────────────────────────────────────────
  // SPACECRAFT BUILDER
  // ─────────────────────────────────────────────────────

  renderCategoryTabs() {
    BUILDER_STEPS.forEach((stepId, idx) => {
      const el = document.getElementById(stepId);
      if (el) {
        const cat = COMPONENT_CATEGORIES[idx];
        el.className = `build-step ${this.selectedCategory === cat ? 'active' : ''}`;
        el.onclick = () => {
          this.selectedCategory = cat;
          this.renderCategoryTabs();
          this.renderComponents();
        };
      }
    });
  }

  renderComponents() {
    const container = document.getElementById('builder-components');
    if (!container) return;
    container.innerHTML = '';

    const list = COMPONENTS.filter(c => c.cat === this.selectedCategory);

    list.forEach(c => {
      const isEquipped = this.equippedComponents.some(ec => ec.id === c.id);
      const item = document.createElement('div');
      item.className = `component-item ${isEquipped ? 'equipped' : ''}`;
      item.onclick = () => this.toggleComponent(c);

      const powerTxt = c.power < 0 ? `+${Math.abs(c.power)}W GEN` : `${c.power}W REQ`;
      const pColor = c.power < 0 ? 'var(--success)' : 'var(--warn)';

      item.innerHTML = `
        <div class="comp-name">${c.name} ${isEquipped ? '✓' : ''}</div>
        <div class="text-xs text-dim">${c.desc}</div>
        <div class="comp-stats">
          <span class="stat-pill mass">${c.mass} kg</span>
          <span class="stat-pill power" style="border-color:${pColor};color:${pColor}">${powerTxt}</span>
          <span class="stat-pill cost">$${c.cost}M</span>
          ${c.science > 0 ? `<span class="stat-pill science">+${c.science} Sci</span>` : ''}
        </div>
      `;
      container.appendChild(item);
    });

    this.renderEquippedList();
  }

  renderEquippedList() {
    const el = document.getElementById('equipped-list');
    if (!el) return;
    el.innerHTML = '';

    if (this.equippedComponents.length === 0) {
      el.innerHTML = '<div class="text-xs text-dim">No components installed.</div>';
      return;
    }

    this.equippedComponents.forEach(c => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '4px 0';
      row.style.fontSize = '0.72rem';
      row.innerHTML = `
        <span style="color:#fff;">${c.name}</span>
        <button style="background:none;border:none;color:var(--danger);cursor:pointer;font-family:inherit;" onclick="Game.removeComponent('${c.id}')">✕</button>
      `;
      el.appendChild(row);
    });
  }

  removeComponent(id) {
    this.equippedComponents = this.equippedComponents.filter(c => c.id !== id);
    this.renderComponents();
    this.updateBuilderStats();
    this.refreshBuilderCraft();
  }

  toggleComponent(comp) {
    const isEquipped = this.equippedComponents.some(c => c.id === comp.id);

    if (isEquipped) {
      if (comp.cat === 'structure' && comp.id.startsWith('bus_')) {
        const busCount = this.equippedComponents.filter(c => c.id.startsWith('bus_')).length;
        if (busCount <= 1) {
          notify('Spacecraft requires at least one primary bus structure!', 'warn');
          return;
        }
      }
      this.equippedComponents = this.equippedComponents.filter(c => c.id !== comp.id);
    } else {
      if (comp.id.startsWith('bus_')) {
        this.equippedComponents = this.equippedComponents.filter(c => !c.id.startsWith('bus_'));
      }
      this.equippedComponents.push(comp);
    }

    this.renderComponents();
    this.updateBuilderStats();
    this.refreshBuilderCraft();
  }

  updateBuilderStats() {
    if (!this.selectedMission) return;

    let totalMass = 0;
    let powerGen = 0;
    let powerReq = 0;
    let totalCost = 0;
    let totalSci = 0;

    this.equippedComponents.forEach(c => {
      totalMass += c.mass;
      if (c.power < 0) powerGen += Math.abs(c.power);
      else powerReq += c.power;
      totalCost += c.cost;
      totalSci += c.science || 0;
    });

    const netPower = powerGen - powerReq;
    const m = this.selectedMission;

    const bDisplay = document.getElementById('budget-display');
    if (bDisplay) {
      const massPct = Math.min(100, (totalMass / m.maxMassKg) * 100);
      const costPct = Math.min(100, (totalCost / m.budgetM) * 100);
      const sciPct = Math.min(100, (totalSci / m.scienceGoal) * 100);

      bDisplay.innerHTML = `
        <div class="budget-row">
          <div class="budget-label">
            <span>MASS BUDGET</span>
            <span style="color:${totalMass > m.maxMassKg ? 'var(--danger)' : 'inherit'}">${totalMass} / ${m.maxMassKg} kg</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${totalMass > m.maxMassKg ? 'over' : 'mass'}" style="width:${massPct}%"></div>
          </div>
        </div>

        <div class="budget-row">
          <div class="budget-label">
            <span>FINANCIAL COST</span>
            <span style="color:${totalCost > m.budgetM ? 'var(--danger)' : 'inherit'}">$${totalCost}M / $${m.budgetM}M</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${totalCost > m.budgetM ? 'over' : 'cost'}" style="width:${costPct}%"></div>
          </div>
        </div>

        <div class="budget-row">
          <div class="budget-label">
            <span>POWER BALANCE</span>
            <span style="color:${netPower < 0 ? 'var(--danger)' : 'var(--success)'}">${powerGen}W Gen / ${powerReq}W Load (${netPower >= 0 ? '+' : ''}${netPower}W)</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill power" style="width:${Math.min(100, (powerGen / Math.max(1, powerReq)) * 100)}%"></div>
          </div>
        </div>

        <div class="budget-row">
          <div class="budget-label">
            <span>ESTIMATED SCIENCE VALUE</span>
            <span style="color:var(--success)">${totalSci} / ${m.scienceGoal} pts</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill science" style="width:${sciPct}%"></div>
          </div>
        </div>
      `;
    }

    const constEl = document.getElementById('mission-constraints');
    if (constEl) {
      const hasBus = this.equippedComponents.some(c => c.id.startsWith('bus_'));
      const hasPower = powerGen >= powerReq;
      const hasComm = this.equippedComponents.some(c => c.cat === 'comms');
      const hasSci = totalSci > 0;
      const underMass = totalMass <= m.maxMassKg;
      const underBudget = totalCost <= m.budgetM;

      const formatCheck = (ok, text) => `
        <div style="font-size:0.72rem;margin-bottom:4px;color:${ok ? 'var(--success)' : 'var(--danger)'}">
          ${ok ? '✔' : '✖'} ${text}
        </div>
      `;

      constEl.innerHTML = `
        ${formatCheck(hasBus, 'Primary structural bus installed')}
        ${formatCheck(underMass, `Mass within limit (${totalMass}/${m.maxMassKg} kg)`)}
        ${formatCheck(underBudget, `Financial cost within budget ($${totalCost}M/$${m.budgetM}M)`)}
        ${formatCheck(hasPower, `Positive power balance (${netPower >= 0 ? '+' : ''}${netPower}W)`)}
        ${formatCheck(hasComm, 'Communications payload equipped')}
        ${formatCheck(hasSci, `Science package active (${totalSci} pts)`)}
      `;

      const proceedBtn = document.getElementById('btn-proceed-launch');
      if (proceedBtn) {
        proceedBtn.disabled = !(hasBus && underMass && underBudget && hasPower && hasComm && hasSci);
      }
    }
  }

  refreshBuilderCraft() {
    if (!this.builderScene) return;

    if (this.builderCraftMesh) {
      this.builderScene.remove(this.builderCraftMesh);
    }

    this.builderCraftMesh = buildSpacecraftMesh(this.equippedComponents);
    this.builderScene.add(this.builderCraftMesh);
  }

  proceedToLaunch() {
    this.goTo('launch');
  }

  // ─────────────────────────────────────────────────────
  // LAUNCH OPERATIONS
  // ─────────────────────────────────────────────────────

  renderLaunchVehicles() {
    const grid = document.getElementById('lv-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const craftMass = this.equippedComponents.reduce((sum, c) => sum + c.mass, 0);

    LAUNCH_VEHICLES.forEach(lv => {
      const canCarry = lv.payloadKg >= craftMass;
      const card = document.createElement('div');
      card.className = `lv-card ${this.selectedLaunchVehicle.id === lv.id ? 'selected' : ''}`;
      if (!canCarry) card.style.opacity = '0.4';

      card.onclick = () => {
        if (!canCarry) {
          notify(`Cannot carry ${craftMass}kg craft! Max capacity: ${lv.payloadKg}kg`, 'warn');
          return;
        }
        this.selectedLaunchVehicle = lv;
        this.renderLaunchVehicles();
        this.updateLaunchStats();
      };

      card.innerHTML = `
        <div class="lv-name">${lv.name}</div>
        <div class="lv-payload">Max: ${lv.payloadKg} kg</div>
        <div class="lv-price">$${lv.costM}M</div>
        <div class="text-xs" style="color:var(--text-dim);margin-top:2px;">Rel: ${(lv.reliability * 100).toFixed(0)}%</div>
      `;
      grid.appendChild(card);
    });
  }

  updateLaunchParam(key, val) {
    this.launchParams[key] = parseFloat(val);

    if (key === 'depart') document.getElementById('depart-val').textContent = `${val}°`;
    if (key === 'incl') document.getElementById('incl-val').textContent = `${val}°`;
    if (key === 'peri') document.getElementById('peri-val').textContent = `${val}`;
    if (key === 'apo') document.getElementById('apo-val').textContent = `${val}`;

    this.updateLaunchStats();
  }

  updateLaunchStats() {
    if (!this.selectedMission) return;

    const peri = this.launchParams.peri;
    const apo = this.launchParams.apo;
    const r1 = 6371 + peri;
    const r2 = 6371 + apo;

    const hoh = hohmannDeltaV(r1, r2);
    const totalDeltavNeeded = this.selectedMission.deltavReq + (hoh.total * 1000);

    let craftDeltav = 3200;
    this.equippedComponents.forEach(c => {
      if (c.deltav) craftDeltav += c.deltav;
    });
    this.flight.deltavAvail = craftDeltav;

    const infoEl = document.getElementById('deltav-info');
    const barEl = document.getElementById('deltav-bar');
    const statEl = document.getElementById('deltav-status');

    if (infoEl) {
      infoEl.textContent = `Req Δv: ${totalDeltavNeeded.toFixed(0)} m/s | Available: ${craftDeltav} m/s`;
    }

    const pct = Math.min(100, (craftDeltav / totalDeltavNeeded) * 100);
    if (barEl) {
      barEl.style.width = `${pct}%`;
      barEl.style.backgroundColor = pct >= 95 ? 'var(--success)' : (pct >= 80 ? 'var(--warn)' : 'var(--danger)');
    }

    if (statEl) {
      if (pct >= 100) {
        statEl.textContent = 'Trajectory nominal — ample propulsion margins.';
        statEl.style.color = 'var(--success)';
      } else if (pct >= 85) {
        statEl.textContent = 'Marginal trajectory — close to delta-v limits.';
        statEl.style.color = 'var(--warn)';
      } else {
        statEl.textContent = 'Insufficient delta-v! Add ion propulsion or bipropellant.';
        statEl.style.color = 'var(--danger)';
      }
    }

    if (this.orbitDiagram) {
      this.orbitDiagram.draw(peri, apo, 6371, '#3c96ff');
    }
  }

  executeLaunch() {
    this.sound.init();
    notify('Ignition sequence started! T-minus 0...', 'info');

    const btn = document.getElementById('btn-launch');
    if (btn) btn.disabled = true;

    if (this.launchParticles) this.launchParticles.visible = true;
    this.sound.setThrust(true);

    let altitude = 4.5;
    const launchInterval = setInterval(() => {
      altitude += 0.35;
      if (this.rocketMesh) this.rocketMesh.position.y = altitude;
      if (this.launchParticles) {
        const pos = this.launchParticles.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, (Math.random() - 0.5) * 0.8, altitude - 4.5 - Math.random() * 3, (Math.random() - 0.5) * 0.8);
        }
        pos.needsUpdate = true;
      }

      if (altitude > 30) {
        clearInterval(launchInterval);
        this.sound.setThrust(false);
        if (this.launchParticles) this.launchParticles.visible = false;
        notify('Orbit insertion confirmed! Spacecraft deployed.', 'success');
        this.sound.playBeep(880, 0.2);
        setTimeout(() => {
          if (btn) btn.disabled = false;
          this.goTo('ops');
        }, 1000);
      }
    }, 40);
  }

  // ─────────────────────────────────────────────────────
  // OPERATIONS PHASE (MAIN GAMEPLAY)
  // ─────────────────────────────────────────────────────

  startOperationsLoop() {
    const m = this.selectedMission;
    if (!m) return;

    this.missionState.active = true;
    this.missionState.elapsedTime = 0;
    this.missionState.phaseIndex = 0;
    this.missionState.health = 100;
    this.missionState.power = 100;
    this.missionState.scienceScore = 0;
    this.missionState.dataDownlinked = 0;
    this.missionState.logHistory = [];
    this.missionState.eventQueue = [...EVENTS_POOL].sort(() => Math.random() - 0.5);

    this.flight.currentOrbitR = m.orbitRadius;
    this.flight.pitch = 0;
    this.flight.yaw = 0;
    this.flight.roll = 0;

    let totalCost = this.selectedLaunchVehicle.costM;
    this.equippedComponents.forEach(c => totalCost += c.cost);
    this.missionState.budgetRemaining = Math.max(0, m.budgetM - totalCost);

    const nameEl = document.getElementById('ops-mission-name');
    if (nameEl) nameEl.textContent = `MISSION: ${m.name} [${this.craftName}]`;

    this.setupOperationsScene();
    this.renderInstruments();
    this.renderPhaseProgress();

    this.logEvent('Orbit insertion confirmed nominal.');
    this.logEvent('Manual Flight Computer & Reaction Control Systems online.');
    notify('Use W/A/S/D to steer, SPACE to burn prograde!', 'info');

    if (this.eventTimer) clearInterval(this.eventTimer);
    this.eventTimer = setInterval(() => {
      if (this.missionState.active && !this.missionState.activeEvent) {
        if (Math.random() < 0.45 && this.missionState.eventQueue.length > 0) {
          const nextEvt = this.missionState.eventQueue.shift();
          this.triggerEvent(nextEvt);
        }
      }
    }, 12000);
  }

  setupOperationsScene() {
    if (!this.mainScene) return;

    if (this.earthMesh) this.mainScene.remove(this.earthMesh);
    if (this.titleMoon) this.mainScene.remove(this.titleMoon);
    if (this.titleAstronaut) this.mainScene.remove(this.titleAstronaut);
    if (this.targetPlanetMesh) this.mainScene.remove(this.targetPlanetMesh);
    if (this.spacecraftMesh) this.mainScene.remove(this.spacecraftMesh);
    if (this.orbitCurveMesh) this.mainScene.remove(this.orbitCurveMesh);
    if (this.asteroidDebris) {
      this.asteroidDebris.forEach(a => this.mainScene.remove(a));
      this.asteroidDebris = [];
    }

    // Clear old waypoints
    this.surfaceWaypoints.forEach(wp => this.mainScene.remove(wp));
    this.surfaceWaypoints = [];

    const m = this.selectedMission;

    // Create Target Body
    if (m.destination === 'Sun-L1') {
      this.targetPlanetMesh = createLowPolySun(m.radius);
    } else if (m.destination === 'Asteroid') {
      this.targetPlanetMesh = createLowPolyAsteroid(m.radius * 2.5);
      // Spawn surrounding tumbling micro-asteroids from Kenney meteor models
      for (let i = 0; i < 6; i++) {
        const metKey = i % 2 === 0 ? 'meteor' : 'meteor_detailed';
        const meteor = Assets.clone(metKey, 'center');
        if (meteor) {
          const dist = m.radius * 3.5 + Math.random() * 8;
          const ang = (i / 6) * Math.PI * 2;
          meteor.position.set(Math.cos(ang) * dist, (Math.random() - 0.5) * 4, Math.sin(ang) * dist);
          const sc = 0.5 + Math.random() * 0.8;
          meteor.scale.set(sc, sc, sc);
          this.mainScene.add(meteor);
          this.asteroidDebris.push(meteor);
        }
      }
    } else {
      this.targetPlanetMesh = createLowPolyPlanet(m.radius * 3.5, m.color, 2);
    }
    this.targetPlanetMesh.position.set(0, 0, 0);
    this.mainScene.add(this.targetPlanetMesh);

    // Create Orbit Track
    this.orbitCurveMesh = createOrbitRing(this.flight.currentOrbitR, 0x3c96ff, 0.35);
    this.mainScene.add(this.orbitCurveMesh);

    // Create Spacecraft Mesh
    this.spacecraftMesh = buildSpacecraftMesh(this.equippedComponents);
    this.spacecraftMesh.scale.set(1.4, 1.4, 1.4);

    // Add Engine Flame
    this.engineFlameParticles = this.createEngineFlameMesh();
    this.spacecraftMesh.add(this.engineFlameParticles);

    this.mainScene.add(this.spacecraftMesh);

    // Generate Interactive Science Anomalies on planet surface
    this.createSurfaceAnomalies(m);

    this.setCameraMode('orbit');
  }

  createSurfaceAnomalies(m) {
    const anomaliesData = [
      {
        name: 'Water-Ice Shadowed Basin',
        sci: 65,
        color: 0x00e676,
        type: 'ice',
        modelKey: 'craterLarge',
        scale: 1.6,
        align: 'bottom'
      },
      {
        name: 'Rare-Metal Mineral Vein',
        sci: 55,
        color: 0xffcc00,
        type: 'mineral',
        modelKey: 'rock_crystalsLargeA',
        scale: 1.4,
        align: 'bottom'
      },
      {
        name: 'Magnetic Field Anomaly',
        sci: 70,
        color: 0x3c96ff,
        type: 'magnetic',
        modelKey: 'meteor_detailed',
        scale: 1.3,
        align: 'center'
      },
      {
        name: 'Surface Surveyor Rover',
        sci: 80,
        color: 0xff6b35,
        type: 'rover',
        modelKey: 'rover',
        scale: 2.0,
        align: 'bottom'
      },
      {
        name: 'Alien Signal Artifact',
        sci: 95,
        color: 0xb388ff,
        type: 'relic',
        modelKey: 'alien',
        scale: 1.5,
        align: 'bottom'
      }
    ];

    const planetR = m.destination === 'Asteroid' ? m.radius * 2.5 : m.radius * 3.5;

    anomaliesData.forEach((anom, i) => {
      const theta = (i / anomaliesData.length) * Math.PI * 2 + 0.35;
      const phi = ((i % 2 === 0 ? 0.35 : -0.35) * (1 + (i % 3) * 0.2)) + Math.PI / 2;

      const norm = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).normalize();

      const pos = norm.clone().multiplyScalar(planetR);

      // Group marker
      const marker = new THREE.Group();
      marker.position.copy(pos);
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      marker.userData = { anomaly: anom };
      anom.marker = marker;

      // 3D Kenney model if available
      const model = Assets.clone(anom.modelKey, anom.align);
      if (model) {
        model.scale.set(anom.scale, anom.scale, anom.scale);
        model.traverse(node => {
          node.userData = { anomaly: anom };
        });
        marker.add(model);
      }

      // Holographic targeting beacon / halo ring
      const haloGeo = new THREE.RingGeometry(0.35, 0.65, 6);
      const haloMat = new THREE.MeshBasicMaterial({
        color: anom.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.25;
      marker.add(halo);

      // Low-poly floating diamond beacon at apex
      const beaconGeo = new THREE.OctahedronGeometry(0.24, 0);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: anom.color,
        wireframe: true
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 1.0;
      beacon.userData = { isBeacon: true, anomaly: anom };
      marker.add(beacon);

      this.mainScene.add(marker);
      this.surfaceWaypoints.push(marker);
    });
  }

  scanAnomaly(anom) {
    this.sound.init();
    this.sound.playScan();
    notify(`ANOMALY TARGET ACQUIRED: ${anom.name}`, 'info');

    // Laser beam visualization from spacecraft to target
    if (this.spacecraftMesh) {
      const craftPos = this.spacecraftMesh.position.clone();
      const targetPos = (anom && anom.marker) ? anom.marker.position.clone() : new THREE.Vector3(0, 0, 0);
      const points = [craftPos, targetPos];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: anom.color, linewidth: 2 });
      const beam = new THREE.Line(lineGeo, lineMat);
      this.mainScene.add(beam);

      setTimeout(() => {
        this.mainScene.remove(beam);
      }, 700);
    }

    this.missionState.scienceScore += anom.sci;
    this.missionState.dataDownlinked += Math.round(anom.sci * 0.3);
    this.logEvent(`Targeted observation of [${anom.name}]: +${anom.sci} science pts.`);
    notify(`Spectroscopic confirmation of ${anom.name}! +${anom.sci} Sci`, 'success');
    this.sound.playBeep(880, 0.15);
    this.updateHUD();
  }

  renderInstruments() {
    const grid = document.getElementById('instrument-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sciComps = this.equippedComponents.filter(c => c.cat === 'science');

    if (sciComps.length === 0) {
      grid.innerHTML = '<div class="text-xs text-dim">No science payload.</div>';
      return;
    }

    sciComps.forEach(inst => {
      const cell = document.createElement('div');
      cell.className = 'instrument-cell';
      cell.id = `inst-${inst.id}`;

      let icon = '🔭';
      if (inst.id.includes('camera')) icon = '📷';
      if (inst.id.includes('radar')) icon = '📡';
      if (inst.id.includes('spectro')) icon = '🌈';
      if (inst.id.includes('magnet')) icon = '🧲';

      cell.innerHTML = `
        <div class="inst-icon">${icon}</div>
        <div class="inst-name">${inst.name}</div>
        <div class="inst-data" id="inst-data-${inst.id}">READY</div>
      `;

      cell.onclick = () => this.runInstrumentScan(inst);
      grid.appendChild(cell);
    });
  }

  runInstrumentScan(inst) {
    const cell = document.getElementById(`inst-${inst.id}`);
    const dataLabel = document.getElementById(`inst-data-${inst.id}`);

    if (this.missionState.activeInstruments[inst.id]) return;

    this.sound.init();
    this.sound.playScan();
    this.missionState.activeInstruments[inst.id] = true;
    if (cell) cell.classList.add('scanning');
    if (dataLabel) dataLabel.textContent = 'SCANNING...';

    setTimeout(() => {
      delete this.missionState.activeInstruments[inst.id];
      if (cell) cell.classList.remove('scanning');
      if (dataLabel) dataLabel.textContent = 'READY';

      const sciGained = Math.round(inst.science * (0.8 + Math.random() * 0.4));
      const dataVolume = Math.round(sciGained * 0.25);

      this.missionState.scienceScore += sciGained;
      this.missionState.dataDownlinked += dataVolume;

      notify(`Data package downlinked: +${sciGained} Science pts (${inst.name})`, 'success');
      this.sound.playBeep(920, 0.12);
      this.logEvent(`Instrument [${inst.name}] observation complete. +${sciGained} sci.`);
      this.updateHUD();
    }, 2200);
  }

  renderPhaseProgress() {
    const container = document.getElementById('phase-progress');
    const label = document.getElementById('phase-label');
    if (!container || !this.selectedMission) return;

    container.innerHTML = '';
    const phases = this.selectedMission.phases;
    phases.forEach((p, idx) => {
      const dot = document.createElement('div');
      dot.className = `phase-dot ${idx < this.missionState.phaseIndex ? 'done' : (idx === this.missionState.phaseIndex ? 'active' : '')}`;
      container.appendChild(dot);
    });

    if (label) {
      label.textContent = this.selectedMission.phaseLabels[this.missionState.phaseIndex] || 'MISSION COMPLETE';
    }
  }

  logEvent(msg) {
    const logBox = document.getElementById('events-log');
    if (!logBox) return;

    const t = Math.floor(this.missionState.elapsedTime);
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">T+${t}d:</span><span>${msg}</span>`;
    logBox.prepend(entry);
  }

  triggerEvent(evt) {
    this.missionState.activeEvent = evt;
    this.sound.playAlarm();
    const card = document.getElementById('active-event');
    if (!card) return;

    let choicesHtml = '';
    evt.choices.forEach((c, idx) => {
      choicesHtml += `<button class="choice-btn" onclick="Game.resolveEvent(${idx})">${c.label}</button>`;
    });

    card.innerHTML = `
      <div class="event-title">${evt.title}</div>
      <div class="event-desc">${evt.desc}</div>
      <div class="event-choices">${choicesHtml}</div>
    `;
    card.style.display = 'block';
    notify(`ANOMALY: ${evt.title}`, 'warn');
  }

  resolveEvent(choiceIdx) {
    const evt = this.missionState.activeEvent;
    if (!evt) return;

    const choice = evt.choices[choiceIdx];
    const eff = choice.effect;

    if (eff.health) this.missionState.health = clamp(this.missionState.health + eff.health, 0, 100);
    if (eff.power) this.missionState.power = clamp(this.missionState.power + eff.power, 0, 100);
    if (eff.scienceGain) this.missionState.scienceScore += eff.scienceGain;
    if (eff.scienceLost) this.missionState.scienceScore = Math.max(0, this.missionState.scienceScore - eff.scienceLost);
    if (eff.costM) this.missionState.budgetRemaining = Math.max(0, this.missionState.budgetRemaining - eff.costM);

    this.logEvent(`Response: ${choice.label}. ${choice.feedback}`);
    notify(choice.feedback, eff.health < 0 ? 'warn' : 'info');

    const card = document.getElementById('active-event');
    if (card) card.style.display = 'none';
    this.missionState.activeEvent = null;

    this.updateHUD();

    if (this.missionState.health <= 0) {
      this.endMission(true);
    }
  }

  updateHUD() {
    const sEl = document.getElementById('hud-score');
    const hEl = document.getElementById('hud-health');
    const pEl = document.getElementById('hud-power');
    const dEl = document.getElementById('hud-data');
    const bEl = document.getElementById('hud-budget');
    const cEl = document.getElementById('mission-clock');

    if (sEl) sEl.textContent = Math.round(this.missionState.scienceScore);
    if (hEl) {
      hEl.textContent = `${Math.round(this.missionState.health)}%`;
      hEl.style.color = this.missionState.health < 30 ? 'var(--danger)' : 'inherit';
    }
    if (pEl) pEl.textContent = `${Math.round(this.missionState.power)}%`;
    if (dEl) dEl.textContent = Math.round(this.missionState.dataDownlinked);
    if (bEl) bEl.textContent = `$${Math.round(this.missionState.budgetRemaining)}M`;
    if (cEl) cEl.textContent = `T+${Math.floor(this.missionState.elapsedTime)}d`;

    // Flight telemetry badge
    const vEl = document.getElementById('flight-vel');
    const aEl = document.getElementById('flight-alt');
    const dvEl = document.getElementById('flight-deltav');

    if (vEl) vEl.textContent = `${this.flight.speedKms.toFixed(1)} km/s`;
    if (aEl) aEl.textContent = `${Math.round(this.flight.altKm)} km`;
    if (dvEl) dvEl.textContent = `${Math.round(this.flight.deltavAvail)} m/s`;
  }

  endMission(isFailure = false) {
    if (this.eventTimer) clearInterval(this.eventTimer);
    this.missionState.active = false;
    this.sound.setThrust(false);

    const m = this.selectedMission;
    const goal = m.scienceGoal;
    const achieved = this.missionState.scienceScore;
    const health = this.missionState.health;

    const titleEl = document.getElementById('results-title');
    const subEl = document.getElementById('results-subtitle');
    const bdEl = document.getElementById('score-breakdown');
    const totEl = document.getElementById('total-score');
    const repEl = document.getElementById('mission-report');

    const isSuccess = !isFailure && achieved >= goal * 0.6 && health > 0;

    if (titleEl) {
      titleEl.textContent = isSuccess ? 'MISSION SUCCESSFUL' : 'MISSION FAILED';
      titleEl.className = isSuccess ? 'success' : 'failure';
    }

    if (subEl) {
      subEl.textContent = isSuccess
        ? `Spacecraft ${this.craftName} completed primary scientific objectives at ${m.destination}.`
        : `Spacecraft ${this.craftName} lost or returned insufficient scientific data.`;
    }

    const sciBonus = achieved >= goal ? 300 : 0;
    const healthBonus = Math.round(health * 2.5);
    const budgetBonus = Math.round(this.missionState.budgetRemaining * 1.5);
    const finalScore = Math.max(0, Math.round(achieved + sciBonus + healthBonus + budgetBonus));

    if (bdEl) {
      bdEl.innerHTML = `
        <div class="score-row">
          <span class="score-label">SCIENCE DATA RETURN</span>
          <span class="score-val positive">+${achieved} pts</span>
        </div>
        <div class="score-row">
          <span class="score-label">PRIMARY GOAL BONUS (${goal} pts)</span>
          <span class="score-val ${sciBonus > 0 ? 'positive' : 'negative'}">${sciBonus > 0 ? '+300' : '0'} pts</span>
        </div>
        <div class="score-row">
          <span class="score-label">SPACECRAFT SURVIVAL (${health.toFixed(0)}%)</span>
          <span class="score-val positive">+${healthBonus} pts</span>
        </div>
        <div class="score-row">
          <span class="score-label">FISCAL EFFICIENCY ($${this.missionState.budgetRemaining.toFixed(0)}M left)</span>
          <span class="score-val positive">+${budgetBonus} pts</span>
        </div>
      `;
    }

    if (totEl) totEl.textContent = finalScore;

    if (repEl) {
      repEl.innerHTML = `
        <strong>POST-FLIGHT MISSION EVALUATION</strong><br/>
        Spacecraft: ${this.craftName} | Target: ${m.name}<br/>
        Downlinked ${this.missionState.dataDownlinked} Gb of telemetry & science data.<br/>
        ${isSuccess ? `Congratulations! You unlocked the <strong>${m.reward}</strong>.` : 'Review subsystem margins and power budgets before your next flight attempt.'}
      `;
    }

    this.goTo('results');
  }

  // ─────────────────────────────────────────────────────
  // ANIMATION LOOPS (60 FPS SMOOTH WITH INTERACTIVE DYNAMICS)
  // ─────────────────────────────────────────────────────

  animateMain() {
    requestAnimationFrame(() => this.animateMain());

    if (this.mainRenderer && this.mainScene && this.mainCamera) {
      if (this.cameraMode === 'orbit' && this.mainControls) {
        this.mainControls.update();
      }

      // Title idle rotation
      if (this.earthMesh) this.earthMesh.rotation.y += 0.003;
      if (this.titleMoon) this.titleMoon.rotation.y += 0.002;
      if (this.titleAstronaut && this.currentScreen === 'title') {
        const t = Date.now() * 0.001;
        this.titleAstronaut.rotation.y += 0.006;
        this.titleAstronaut.rotation.z = Math.sin(t * 0.6) * 0.15;
        this.titleAstronaut.position.y = 2.2 + Math.sin(t * 0.8) * 0.35;
      }
      if (this.asteroidDebris && this.asteroidDebris.length > 0) {
        this.asteroidDebris.forEach((ast, idx) => {
          ast.rotation.x += 0.005 * (idx + 1);
          ast.rotation.y += 0.007 * (idx + 1);
        });
      }

      // Operations loop
      if (this.missionState.active && this.selectedMission) {
        const dt = 0.016 * this.timeWarp;
        this.missionState.elapsedTime += 0.08 * this.timeWarp;

        // Keyboard steering input checks
        if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) this.flight.pitchRate = -0.035;
        else if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) this.flight.pitchRate = 0.035;
        else if (this.flight.sas) this.flight.pitchRate *= 0.9;

        if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) this.flight.yawRate = -0.035;
        else if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) this.flight.yawRate = 0.035;
        else if (this.flight.sas) this.flight.yawRate *= 0.9;

        if (this.keysHeld['KeyQ']) this.flight.rollRate = -0.045;
        else if (this.keysHeld['KeyE']) this.flight.rollRate = 0.045;
        else if (this.flight.sas) this.flight.rollRate *= 0.9;

        // Apply attitude rates
        this.flight.pitch += this.flight.pitchRate;
        this.flight.yaw += this.flight.yawRate;
        this.flight.roll += this.flight.rollRate;

        // Thruster burn physics
        if (this.flight.burning !== 0 && this.flight.deltavAvail > 0) {
          const burnDelta = 4.5 * dt * 60;
          this.flight.deltavAvail = Math.max(0, this.flight.deltavAvail - burnDelta);

          // Prograde burn increases orbital altitude & speed; Retrograde decreases
          const rDelta = this.flight.burning * 0.015 * (this.timeWarp);
          this.flight.currentOrbitR = clamp(this.flight.currentOrbitR + rDelta, 4.5, 50.0);
          this.flight.speedKms = clamp(this.flight.speedKms + this.flight.burning * 0.008, 3.2, 12.5);
          this.flight.altKm = (this.flight.currentOrbitR - 3.5) * 45;

          // Engine flame flicker animation
          if (this.engineFlameParticles) {
            const flicker = 0.8 + Math.random() * 0.4;
            this.engineFlameParticles.scale.set(flicker, flicker * (1.2 + Math.random() * 0.3), flicker);
          }

          // Dynamic update orbit ring
          if (this.orbitCurveMesh) {
            this.orbitCurveMesh.scale.set(
              this.flight.currentOrbitR / this.selectedMission.orbitRadius,
              1,
              this.flight.currentOrbitR / this.selectedMission.orbitRadius
            );
          }
        }

        // Orbital motion around celestial body
        const orbitAngularSpeed = (this.missionState.orbitSpeed * (10 / this.flight.currentOrbitR)) * this.timeWarp;
        this.missionState.orbitAngle += orbitAngularSpeed;

        const r = this.flight.currentOrbitR;
        const x = Math.cos(this.missionState.orbitAngle) * r;
        const z = Math.sin(this.missionState.orbitAngle) * r;

        if (this.spacecraftMesh) {
          this.spacecraftMesh.position.set(x, 0, z);

          // Combined base orbit tangential orientation + manual attitude rotations
          const baseYaw = -this.missionState.orbitAngle + Math.PI / 2;
          this.spacecraftMesh.rotation.set(this.flight.pitch, baseYaw + this.flight.yaw, this.flight.roll);
        }

        // Target body rotation
        if (this.targetPlanetMesh) {
          this.targetPlanetMesh.rotation.y += 0.004 * this.timeWarp;
        }

        // Pulse surface waypoint markers
        this.surfaceWaypoints.forEach((wp, idx) => {
          const beacon = wp.children.find(c => c.userData && c.userData.isBeacon);
          if (beacon) {
            beacon.rotation.y += 0.03;
            beacon.rotation.x += 0.015;
          }
        });

        // Dynamic Camera Views
        if (this.spacecraftMesh) {
          const craftPos = this.spacecraftMesh.position;

          if (this.cameraMode === 'chase') {
            // Chase Cam: mounted behind and slightly above spacecraft
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.spacecraftMesh.rotation);
            const up = new THREE.Vector3(0, 1, 0).applyEuler(this.spacecraftMesh.rotation);
            const camTargetPos = craftPos.clone().sub(forward.multiplyScalar(4.5)).add(up.multiplyScalar(1.6));
            this.mainCamera.position.lerp(camTargetPos, 0.1);
            this.mainCamera.lookAt(craftPos.clone().add(new THREE.Vector3(0, 0.4, 0)));
          } else if (this.cameraMode === 'cockpit') {
            // Cockpit / Sensor Cam: mounted on nose looking forward
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.spacecraftMesh.rotation);
            const camPos = craftPos.clone().add(forward.clone().multiplyScalar(0.8)).add(new THREE.Vector3(0, 0.2, 0));
            this.mainCamera.position.copy(camPos);
            this.mainCamera.lookAt(craftPos.clone().add(forward.multiplyScalar(20)));
          }
        }

        // Telemetry update
        if (this.telemetryGraph) {
          this.telemetryGraph.push(this.missionState.health);
          this.telemetryGraph.draw();
        }

        // Phase advance logic
        const totalDuration = this.selectedMission.durationDays;
        const progressFrac = Math.min(1, this.missionState.elapsedTime / totalDuration);
        const numPhases = this.selectedMission.phases.length;
        const newPhase = Math.min(numPhases - 1, Math.floor(progressFrac * numPhases));

        if (newPhase !== this.missionState.phaseIndex) {
          this.missionState.phaseIndex = newPhase;
          this.renderPhaseProgress();
          this.logEvent(`Entering phase: ${this.selectedMission.phaseLabels[newPhase]}`);
          notify(`PHASE ADVANCE: ${this.selectedMission.phaseLabels[newPhase]}`, 'info');
        }

        this.updateHUD();

        if (this.missionState.elapsedTime >= totalDuration) {
          this.endMission(false);
        }
      }

      this.mainRenderer.render(this.mainScene, this.mainCamera);
    }

    // Builder preview rendering
    if (this.currentScreen === 'builder' && this.builderRenderer && this.builderScene && this.builderCamera) {
      if (this.builderControls) this.builderControls.update();
      this.builderRenderer.render(this.builderScene, this.builderCamera);
    }

    // Launch preview rendering
    if (this.currentScreen === 'launch' && this.launchRenderer && this.launchScene && this.launchCamera) {
      this.launchRenderer.render(this.launchScene, this.launchCamera);
    }
  }
}

// ─────────────────────────────────────────────────────
// GLOBAL MOUNT & LAUNCH
// ─────────────────────────────────────────────────────

window.Game = new SpaceMissionGame();
