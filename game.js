// ═══════════════════════════════════════════════════════════════════════════════
// MISSION ARCHITECT — Build Your Own Space Mission
// NASA Space Apps Challenge 2026 — Spacecraft Engineering & Orbital Simulator
// Built with Three.js — 60 FPS Low-Poly 3D, Real Orbital Mechanics & Sourced NASA Data
// ═══════════════════════════════════════════════════════════════════════════════

import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';
import { GLTFLoader } from './lib/GLTFLoader.js';

// ─────────────────────────────────────────────────────
// 1. ASSET LOADER (41 GLB MODELS FROM USER & SPACE KIT)
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
      // Planets
      'Planet_1', 'Planet_2', 'Planet_6', 'Planet_7', 'Planet_11',
      // Spacecrafts
      'Spaceship_RaeTheRedPanda', 'Spaceship_FinnTheFrog', 'Spaceship_FernandoTheFlamingo', 'Spaceship_BarbaraTheBee',
      'craft_speederA', 'craft_speederB', 'craft_cargoA', 'craft_miner',
      // Space Station & Surface Habitats
      'Base_Large', 'Building_L', 'GeodesicDome', 'House_Long', 'platform_large', 'hangar_largeA',
      // Rovers
      'Rover_1', 'Rover_2', 'rover',
      // Characters
      'Astronaut_RaeTheRedPanda', 'Astronaut_FernandoTheFlamingo', 'Astronaut_BarbaraTheBee', 'Astronaut_FinnTheFrog', 'astronautA', 'alien',
      // Rocket Modules & Components
      'rocket_baseA', 'rocket_fuelA', 'rocket_sidesA', 'rocket_topA',
      'satelliteDish', 'satelliteDish_detailed', 'machine_generator', 'machine_wireless',
      // Planetary Surface & Space Debris
      'crater', 'craterLarge', 'meteor', 'meteor_detailed', 'rock_crystalsLargeA'
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
      console.log(`✓ Mission Architect: ${Object.keys(this.models).length} 3D assets loaded into memory.`);
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
// 2. MISSION DIRECTIVES & STORY CHAPTERS
// ─────────────────────────────────────────────────────

const MISSIONS = [
  {
    id: 'lunar_supply',
    chapter: 'CHAPTER 01',
    name: 'Moon Supply Mission',
    destination: 'The Moon',
    planetModel: 'Planet_2',
    icon: '🌙',
    difficulty: 'Beginner Trainee',
    budgetM: 450,
    maxMassKg: 1200,
    minDeltav: 3800,
    minComms: 70,
    requiredPayload: 'payload_lunar_kit',
    targetStation: 'Lunar Research Base Alpha',
    desc: 'Deliver scientific equipment safely to Lunar Research Station Alpha on the Moon’s South Pole.',
    detailedBrief: 'A scientific outpost at Malapert Mountain requires urgent delivery of spectral sensors and ground communication arrays. Your spacecraft must carry the Lunar Supply Kit, achieve lunar transfer trajectory, and rendezvous with Station Alpha.',
    distanceKm: 384400,
    orbitRadius: 13,
    reward: 'Lunar Cartography Badge'
  },
  {
    id: 'mars_explorer',
    chapter: 'CHAPTER 02',
    name: 'Mars Explorer Expedition',
    destination: 'Mars',
    planetModel: 'Planet_6',
    icon: '🔴',
    difficulty: 'Intermediate Architect',
    budgetM: 750,
    maxMassKg: 1800,
    minDeltav: 4600,
    minComms: 80,
    requiredPayload: 'payload_rover',
    targetStation: 'Jezero Surface Outpost',
    desc: 'Transport an autonomous scientific research rover through deep space to Mars.',
    detailedBrief: 'Planetary scientists have identified potential fossilized biosignatures in Jezero Crater. Assemble a heavy transit spacecraft equipped with the Surface Rover Deployer to deliver Rover-1 across interplanetary distances.',
    distanceKm: 225000000,
    orbitRadius: 15,
    reward: 'Ares Vanguard Citation'
  },
  {
    id: 'asteroid_sample',
    chapter: 'CHAPTER 03',
    name: 'Asteroid Sample Return',
    destination: 'Asteroid 101955',
    planetModel: 'Planet_11',
    icon: '☄️',
    difficulty: 'Advanced Specialist',
    budgetM: 920,
    maxMassKg: 1500,
    minDeltav: 5200,
    minComms: 85,
    requiredPayload: 'payload_radar',
    targetStation: 'Asteroid Surface Monolith',
    desc: 'Rendezvous with a carbonaceous near-Earth asteroid, collect core samples, and return to Earth orbit.',
    detailedBrief: 'A pristine carbonaceous asteroid holds clues to the origin of organic compounds in the solar system. Navigate beyond Martian orbit, survey the asteroid with radar, and collect subsurface scientific data.',
    distanceKm: 310000000,
    orbitRadius: 11,
    reward: 'Deep Space Pioneer Award'
  }
];

// ─────────────────────────────────────────────────────
// 3. SPACECRAFT ENGINEERING COMPONENT LIBRARY
// ─────────────────────────────────────────────────────

const COMPONENT_CATEGORIES = [
  { id: 'hull', name: '① HULL & BUS', hint: 'Select the primary chassis and structural bus.' },
  { id: 'engine', name: '② PROPULSION', hint: 'Engines determine thrust, Isp efficiency, and delta-v.' },
  { id: 'fuel', name: '③ FUEL TANKS', hint: 'Propellant capacity directly increases delta-v but adds mass.' },
  { id: 'power', name: '④ POWER SYSTEMS', hint: 'Solar panels or RTGs generate electricity for all active systems.' },
  { id: 'comms', name: '⑤ COMMUNICATIONS', hint: 'High-gain antennas ensure reliable Deep Space Network telemetry.' },
  { id: 'payload', name: '⑥ SCIENCE PAYLOAD', hint: 'Mission-required instruments and planetary surface equipment.' }
];

const COMPONENTS = [
  // ── 1. HULL & BUS ──
  {
    id: 'hull_scout',
    cat: 'hull',
    name: 'Light Recon Bus',
    mass: 250,
    cost: 35,
    powerDraw: 40,
    model: 'Spaceship_FinnTheFrog',
    desc: 'Compact aerodynamic scout chassis. Minimal dry mass, but limited to light payloads.'
  },
  {
    id: 'hull_science',
    cat: 'hull',
    name: 'Modular Science Bus',
    mass: 450,
    cost: 65,
    powerDraw: 80,
    model: 'Spaceship_RaeTheRedPanda',
    desc: 'Standard Artemis-class spacecraft bus. Balanced mass with ample payload attachment bays.'
  },
  {
    id: 'hull_heavy',
    cat: 'hull',
    name: 'Heavy Cargo Hauler',
    mass: 800,
    cost: 95,
    powerDraw: 140,
    model: 'Spaceship_FernandoTheFlamingo',
    desc: 'Reinforced titanium structure built for flagship planetary rover delivery missions.'
  },

  // ── 2. PROPULSION ──
  {
    id: 'eng_mono',
    cat: 'engine',
    name: 'Monopropellant RCS Engine',
    mass: 45,
    cost: 18,
    deltavBonus: 1200,
    powerDraw: 15,
    isp: 230,
    desc: 'Hydrazine catalytic thruster. Lightweight and reliable, but modest specific impulse.'
  },
  {
    id: 'eng_bi',
    cat: 'engine',
    name: 'Bipropellant Liquid Core',
    mass: 110,
    cost: 42,
    deltavBonus: 2400,
    powerDraw: 30,
    isp: 325,
    desc: 'High-thrust hypergolic propulsion. Excellent thrust-to-weight for orbital insertion maneuvers.'
  },
  {
    id: 'eng_ion',
    cat: 'engine',
    name: 'NEXT Ion Electric Thruster',
    mass: 65,
    cost: 65,
    deltavBonus: 3900,
    powerDraw: 350,
    isp: 3100,
    desc: 'Xenon ion electrostatic engine. Extremely high fuel efficiency, but requires substantial electrical power.'
  },

  // ── 3. FUEL TANKS ──
  {
    id: 'fuel_small',
    cat: 'fuel',
    name: 'Compact Cryo Tank (250L)',
    mass: 180,
    cost: 14,
    deltavBonus: 600,
    desc: 'Pressurized composite tank holding 180kg of propellant. Minimal mass overhead.'
  },
  {
    id: 'fuel_med',
    cat: 'fuel',
    name: 'Standard Cryo Tank (550L)',
    mass: 380,
    cost: 28,
    deltavBonus: 1500,
    desc: 'Standard multi-layer insulated propellant tank. Ample margins for lunar missions.'
  },
  {
    id: 'fuel_large',
    cat: 'fuel',
    name: 'Extended Tank Array (900L)',
    mass: 620,
    cost: 48,
    deltavBonus: 2400,
    desc: 'High-capacity propellant array. Essential for deep space interplanetary transit.'
  },

  // ── 4. POWER SYSTEMS ──
  {
    id: 'power_ultraflex',
    cat: 'power',
    name: 'UltraFlex Solar Array',
    mass: 35,
    cost: 22,
    powerGen: 380,
    desc: 'Lightweight circular unfolding photovoltaic array. Generates +380W in inner solar system.'
  },
  {
    id: 'power_wings',
    cat: 'power',
    name: 'High-Efficiency Solar Wings',
    mass: 75,
    cost: 45,
    powerGen: 720,
    desc: 'Dual articulating triple-junction solar panels. Generates +720W to power ion thrusters and sensors.'
  },
  {
    id: 'power_rtg',
    cat: 'power',
    name: 'Multi-Mission RTG (Pu-238)',
    mass: 60,
    cost: 85,
    powerGen: 460,
    subsystemModel: 'machine_generator',
    desc: 'Radioisotope thermoelectric generator. Delivers constant +460W unaffected by shadows or distance from Sun.'
  },
  {
    id: 'power_battery',
    cat: 'power',
    name: 'Li-Ion Peak Storage Battery',
    mass: 25,
    cost: 12,
    powerGen: 160,
    desc: 'High-energy-density buffer battery providing +160W during eclipse periods.'
  },

  // ── 5. COMMUNICATIONS ──
  {
    id: 'comms_low',
    cat: 'comms',
    name: 'Low-Gain Omnidirectional Antenna',
    mass: 10,
    cost: 8,
    commsRating: 45,
    powerDraw: 20,
    desc: 'Omnidirectional antenna. Reliable low-frequency beacon, but limited bandwidth over long range.'
  },
  {
    id: 'comms_med',
    cat: 'comms',
    name: 'Medium-Gain Parabolic Horn',
    mass: 25,
    cost: 22,
    commsRating: 78,
    powerDraw: 50,
    subsystemModel: 'satelliteDish',
    desc: 'Steerable parabolic horn satisfying telemetry link margin at lunar distances (78% DSN link).'
  },
  {
    id: 'comms_high',
    cat: 'comms',
    name: 'High-Gain Cassegrain Dish',
    mass: 45,
    cost: 45,
    commsRating: 98,
    powerDraw: 110,
    subsystemModel: 'satelliteDish_detailed',
    desc: '1.2m Cassegrain reflector dish providing 98% Deep Space Network link margin across the solar system.'
  },

  // ── 6. SCIENCE PAYLOAD ──
  {
    id: 'payload_lunar_kit',
    cat: 'payload',
    name: 'Lunar Research Supply Kit',
    mass: 140,
    cost: 32,
    sciValue: 120,
    powerDraw: 80,
    subsystemModel: 'machine_wireless',
    desc: 'Core delivery payload for Lunar Station Alpha: spectral detectors, cryo coolers, and data recorders.'
  },
  {
    id: 'payload_radar',
    cat: 'payload',
    name: 'Ground Penetrating Radar',
    mass: 40,
    cost: 24,
    sciValue: 75,
    powerDraw: 65,
    subsystemModel: 'machine_wireless',
    desc: 'Synthetic aperture radar sounding instrument to map subsurface ice deposits and lava tubes.'
  },
  {
    id: 'payload_spectrometer',
    cat: 'payload',
    name: 'Multispectral Mineral Mapper',
    mass: 35,
    cost: 26,
    sciValue: 85,
    powerDraw: 55,
    desc: 'Infrared spectrometer providing high-resolution mineralogical composition maps.'
  },
  {
    id: 'payload_rover',
    cat: 'payload',
    name: 'Surface Rover Deployer',
    mass: 220,
    cost: 55,
    sciValue: 160,
    powerDraw: 120,
    subsystemModel: 'Rover_1',
    desc: 'Encapsulated planetary exploration rover capable of autonomous surface mobility and sampling.'
  }
];

// Helper clamps
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// ─────────────────────────────────────────────────────
// 4. PROCEDURAL WEB AUDIO SYNTHESIZER
// ─────────────────────────────────────────────────────

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.thrustOsc = null;
    this.thrustGain = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Noise buffer for thruster roar
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;

    this.thrustGain = this.ctx.createGain();
    this.thrustGain.gain.value = 0;

    whiteNoise.connect(filter);
    filter.connect(this.thrustGain);
    this.thrustGain.connect(this.ctx.destination);
    whiteNoise.start(0);
  }

  playBeep(freq = 600, duration = 0.08) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playChime() {
    if (!this.enabled || !this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playBeep(f, 0.15), idx * 80);
    });
  }

  playAlarm() {
    if (!this.enabled || !this.ctx) return;
    this.playBeep(880, 0.12);
    setTimeout(() => this.playBeep(440, 0.15), 130);
  }

  setThrust(active) {
    if (!this.ctx || !this.thrustGain) return;
    this.thrustGain.gain.setTargetAtTime(active && this.enabled ? 0.35 : 0, this.ctx.currentTime, 0.05);
  }
}

// ─────────────────────────────────────────────────────
// 5. TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────

function notify(text, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = text;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─────────────────────────────────────────────────────
// 6. MAIN GAME ENGINE
// ─────────────────────────────────────────────────────

class MissionArchitectGame {
  constructor() {
    this.sound = new SoundSystem();

    // Mission selection
    this.selectedMission = MISSIONS[0];
    this.currentScreen = 'title';
    this.selectedCategory = 'hull';

    // Spacecraft design configuration
    this.equippedComponents = [
      COMPONENTS.find(c => c.id === 'hull_science'),
      COMPONENTS.find(c => c.id === 'eng_bi'),
      COMPONENTS.find(c => c.id === 'fuel_med'),
      COMPONENTS.find(c => c.id === 'power_wings'),
      COMPONENTS.find(c => c.id === 'comms_med'),
      COMPONENTS.find(c => c.id === 'payload_lunar_kit')
    ];

    // Flight state & physics
    this.flight = {
      burning: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      pitchRate: 0,
      yawRate: 0,
      rollRate: 0,
      sas: true,
      currentOrbitR: 13.0,
      orbitAngle: 0,
      orbitSpeed: 0.007,
      speedKms: 1.62,
      altKm: 120,
      fuelPct: 100,
      powerPct: 100,
      healthPct: 100,
      scienceScore: 0,
      delivered: false
    };

    this.keysHeld = {};
    this.timeWarp = 1;
    this.cameraMode = 'orbit';

    // 3D Scene handles
    this.mainRenderer = null;
    this.mainScene = null;
    this.mainCamera = null;
    this.mainControls = null;

    this.builderRenderer = null;
    this.builderScene = null;
    this.builderCamera = null;
    this.builderControls = null;
    this.builderCraftMesh = null;

    this.launchRenderer = null;
    this.launchScene = null;
    this.launchCamera = null;
    this.rocketMesh = null;
    this.launchParticles = null;

    this.briefingRenderer = null;
    this.briefingScene = null;
    this.briefingCamera = null;
    this.commanderMesh = null;

    // Celestial meshes
    this.titleAstronaut = null;
    this.titleEarth = null;
    this.titleMoon = null;
    this.targetPlanetMesh = null;
    this.targetStationMesh = null;
    this.targetRoverMesh = null;
    this.spacecraftMesh = null;
    this.engineFlame = null;
    this.orbitRingMesh = null;
    this.surfaceAnomalies = [];

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  // ─────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────

  init() {
    this.initMain3D();
    this.initBriefing3D();
    this.initBuilder3D();
    this.initLaunch3D();

    this.renderMissionsGrid();
    this.renderCategoryTabs();
    this.renderComponents();
    this.updateLiveStats();

    this.setupWindowListeners();
    this.setupKeyboardListeners();
    this.setupRaycasting();
    this.animateMain();

    // Start background asset loading
    Assets.loadAll().then(() => {
      this.onAssetsLoaded();
    });

    window.addEventListener('click', () => this.sound.init(), { once: true });
    window.addEventListener('keydown', () => this.sound.init(), { once: true });
  }

  onAssetsLoaded() {
    console.log('✓ All 3D assets ready — upgrading scenes.');

    // 1. Title Screen Lunar Astronaut
    if (this.mainScene && !this.titleAstronaut) {
      this.titleAstronaut = Assets.clone('Astronaut_RaeTheRedPanda', 'bottom') || Assets.clone('astronautA', 'bottom');
      if (this.titleAstronaut) {
        this.titleAstronaut.scale.set(1.4, 1.4, 1.4);
        this.titleAstronaut.position.set(-6, -2, 10);
        this.titleAstronaut.rotation.y = 0.6;
        this.mainScene.add(this.titleAstronaut);
      }
    }

    // 2. Mission Briefing Holographic Commander
    if (this.briefingScene && !this.commanderMesh) {
      this.commanderMesh = Assets.clone('Astronaut_FernandoTheFlamingo', 'bottom') || Assets.clone('Astronaut_BarbaraTheBee', 'bottom');
      if (this.commanderMesh) {
        this.commanderMesh.scale.set(1.8, 1.8, 1.8);
        this.commanderMesh.position.set(0, -1.2, 0);
        this.briefingScene.add(this.commanderMesh);
      }
    }

    // 3. Launch Complex Platform & Rocket
    if (this.launchScene) {
      this.buildLaunchComplex();
    }

    // 4. Refresh Hangar Spacecraft
    this.refreshBuilderCraft();
  }

  // ─────────────────────────────────────────────────────
  // 3D SCENE SETUPS
  // ─────────────────────────────────────────────────────

  initMain3D() {
    const canvas = document.getElementById('canvas');
    this.mainScene = new THREE.Scene();
    this.mainScene.fog = new THREE.FogExp2(0x020510, 0.0015);

    this.mainCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.mainCamera.position.set(0, 16, 36);

    this.mainRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.mainRenderer.setSize(window.innerWidth, window.innerHeight);
    this.mainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.mainControls = new OrbitControls(this.mainCamera, canvas);
    this.mainControls.enableDamping = true;
    this.mainControls.dampingFactor = 0.05;
    this.mainControls.maxDistance = 250;
    this.mainControls.minDistance = 4;

    // Ambient & Directional Lighting
    const amb = new THREE.AmbientLight(0x223a66, 1.1);
    this.mainScene.add(amb);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.position.set(60, 45, 80);
    this.mainScene.add(sunLight);

    // Starfield
    const stars = this.createStarfield(3500);
    this.mainScene.add(stars);

    // Title Screen Scene: Earth in distance
    this.setupTitleScene();
  }

  setupTitleScene() {
    // Distant Earth
    const earthGeo = new THREE.IcosahedronGeometry(7, 3);
    const earthMat = new THREE.MeshPhongMaterial({ color: 0x1d6ee8, flatShading: true, shininess: 25 });
    this.titleEarth = new THREE.Mesh(earthGeo, earthMat);
    this.titleEarth.position.set(22, 10, -35);
    this.mainScene.add(this.titleEarth);

    // Lunar terrain platform in foreground
    const moonTerrainGeo = new THREE.PlaneGeometry(60, 60, 16, 16);
    const pos = moonTerrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, (Math.random() - 0.5) * 0.8);
    }
    moonTerrainGeo.computeVertexNormals();
    const moonTerrainMat = new THREE.MeshPhongMaterial({ color: 0x8890a0, flatShading: true, shininess: 5 });
    this.titleMoonGround = new THREE.Mesh(moonTerrainGeo, moonTerrainMat);
    this.titleMoonGround.rotation.x = -Math.PI / 2;
    this.titleMoonGround.position.set(0, -2, 5);
    this.mainScene.add(this.titleMoonGround);
  }

  createStarfield(count = 3000) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const r = 800 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i] = r * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i + 2] = r * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xd8e8ff, size: 1.2, transparent: true, opacity: 0.85 });
    return new THREE.Points(geo, mat);
  }

  initBriefing3D() {
    const canvas = document.getElementById('briefing-canvas');
    if (!canvas) return;

    this.briefingScene = new THREE.Scene();
    this.briefingCamera = new THREE.PerspectiveCamera(40, canvas.clientWidth / (canvas.clientHeight || 280), 0.1, 100);
    this.briefingCamera.position.set(0, 1.2, 3.8);

    this.briefingRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.briefingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const amb = new THREE.AmbientLight(0x3c96ff, 1.5);
    this.briefingScene.add(amb);

    const dir = new THREE.DirectionalLight(0x80d0ff, 2.0);
    dir.position.set(3, 4, 3);
    this.briefingScene.add(dir);

    // Hologram circular ring base
    const ringGeo = new THREE.RingGeometry(0.8, 1.0, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3c96ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.2;
    this.briefingScene.add(ring);
  }

  initBuilder3D() {
    const canvas = document.getElementById('spacecraft-canvas');
    if (!canvas) return;

    this.builderScene = new THREE.Scene();
    this.builderCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.builderCamera.position.set(4.5, 3.2, 5.5);

    this.builderRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.builderRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.builderControls = new OrbitControls(this.builderCamera, canvas);
    this.builderControls.enableDamping = true;
    this.builderControls.dampingFactor = 0.08;
    this.builderControls.autoRotate = true;
    this.builderControls.autoRotateSpeed = 1.2;

    const amb = new THREE.AmbientLight(0x223860, 1.2);
    this.builderScene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dir1.position.set(8, 10, 8);
    this.builderScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x3c96ff, 0.9);
    dir2.position.set(-6, -4, -6);
    this.builderScene.add(dir2);

    const grid = new THREE.GridHelper(8, 16, 0x3c96ff, 0x162c55);
    grid.position.y = -1.0;
    this.builderScene.add(grid);
  }

  initLaunch3D() {
    const canvas = document.getElementById('launch-canvas');
    if (!canvas) return;

    this.launchScene = new THREE.Scene();
    this.launchCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    this.launchCamera.position.set(0, 12, 26);
    this.launchCamera.lookAt(0, 5, 0);

    this.launchRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.launchRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const amb = new THREE.AmbientLight(0x1a2640, 1.2);
    this.launchScene.add(amb);

    const dir = new THREE.DirectionalLight(0xfff0dd, 2.2);
    dir.position.set(20, 30, 20);
    this.launchScene.add(dir);

    // Particle plume
    const pCount = 250;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xff6b35, size: 0.5, transparent: true, opacity: 0.8 });
    this.launchParticles = new THREE.Points(pGeo, pMat);
    this.launchParticles.visible = false;
    this.launchScene.add(this.launchParticles);

    this.buildLaunchComplex();
  }

  buildLaunchComplex() {
    if (!this.launchScene) return;

    // Platform
    const pad = Assets.clone('platform_large', 'bottom');
    if (pad) {
      pad.scale.set(4.8, 3.2, 4.8);
      pad.position.set(0, 0, 0);
      this.launchScene.add(pad);
    }

    // Spaceport Hangar
    const hangar = Assets.clone('hangar_largeA', 'bottom');
    if (hangar) {
      hangar.scale.set(3.8, 3.8, 3.8);
      hangar.position.set(-14, 0, -8);
      hangar.rotation.y = Math.PI / 4;
      this.launchScene.add(hangar);
    }

    // Radar dish
    const dish = Assets.clone('satelliteDish_detailed', 'bottom');
    if (dish) {
      dish.scale.set(1.6, 1.6, 1.6);
      dish.position.set(11, 0, -6);
      dish.rotation.y = -Math.PI / 3;
      this.launchScene.add(dish);
    }

    // Umbilical service tower
    const towerGeo = new THREE.BoxGeometry(1.2, 16, 1.2);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0xcc3322, flatShading: true });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-4.5, 7, 0);
    this.launchScene.add(tower);

    // Modular rocket
    if (this.rocketMesh) this.launchScene.remove(this.rocketMesh);
    this.rocketMesh = this.assembleModularRocket();
    this.rocketMesh.position.set(0, 4.5, 0);
    this.launchScene.add(this.rocketMesh);
  }

  assembleModularRocket() {
    const rocket = new THREE.Group();

    if (Assets.models['rocket_baseA']) {
      const s = 1.6;
      const core = new THREE.Group();

      const base = Assets.clone('rocket_baseA', 'bottom');
      base.scale.set(s, s, s);
      core.add(base);

      let curY = 1.6 * s;
      for (let i = 0; i < 6; i++) {
        const tank = Assets.clone('rocket_fuelA', 'bottom');
        tank.scale.set(s, s, s);
        tank.position.y = curY;
        core.add(tank);
        curY += 0.5 * s;
      }

      const top = Assets.clone('rocket_topA', 'bottom');
      top.scale.set(s, s, s);
      top.position.y = curY;
      core.add(top);
      curY += 0.8 * s;

      // Side boosters
      for (let side of [-1, 1]) {
        for (let b = 0; b < 3; b++) {
          const booster = Assets.clone('rocket_sidesA', 'bottom');
          booster.scale.set(s, s, s);
          booster.position.set(side * 1.35, 0.4 + b * (1.0 * s), 0);
          if (side < 0) booster.rotation.y = Math.PI;
          core.add(booster);
        }
      }

      core.position.y = -curY / 2;
      rocket.add(core);
      return rocket;
    }

    // Fallback procedural rocket
    const cGeo = new THREE.CylinderGeometry(0.7, 0.7, 7, 10);
    const cMat = new THREE.MeshPhongMaterial({ color: 0xeeeeff, flatShading: true });
    const c = new THREE.Mesh(cGeo, cMat);
    rocket.add(c);
    return rocket;
  }

  // ─────────────────────────────────────────────────────
  // SPACECRAFT DESIGN & BUILDER ENGINE
  // ─────────────────────────────────────────────────────

  buildSpacecraftModel(equipped) {
    const group = new THREE.Group();

    // 1. Primary Hull
    const hullComp = equipped.find(c => c.cat === 'hull') || COMPONENTS[1];
    let hullModelKey = hullComp.model || 'Spaceship_RaeTheRedPanda';
    let busScale = 0.35;

    let hullMesh = Assets.clone(hullModelKey, 'center');
    if (!hullMesh) {
      // Fallback bus models
      hullMesh = Assets.clone('craft_speederB', 'center') || Assets.clone('craft_speederA', 'center');
      busScale = 0.6;
    }

    if (hullMesh) {
      hullMesh.scale.set(busScale, busScale, busScale);
      group.add(hullMesh);
    } else {
      const geo = new THREE.CylinderGeometry(0.5, 0.6, 1.6, 8);
      const mat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true });
      group.add(new THREE.Mesh(geo, mat));
    }

    // 2. High-Gain or Medium-Gain Antenna
    const commComp = equipped.find(c => c.cat === 'comms');
    if (commComp && commComp.subsystemModel) {
      const dish = Assets.clone(commComp.subsystemModel, 'center');
      if (dish) {
        dish.scale.set(0.35, 0.35, 0.35);
        dish.position.set(0, 0.55, -0.4);
        dish.rotation.x = -0.3;
        group.add(dish);
      }
    }

    // 3. Power Systems (RTG)
    const powerComp = equipped.find(c => c.cat === 'power');
    if (powerComp && powerComp.subsystemModel) {
      const rtg = Assets.clone(powerComp.subsystemModel, 'center');
      if (rtg) {
        rtg.scale.set(0.24, 0.24, 0.24);
        rtg.position.set(0, -0.2, -0.6);
        group.add(rtg);
      }
    }

    // 4. Solar Wings (Procedural articulated struts if solar equipped)
    if (powerComp && (powerComp.id === 'power_ultraflex' || powerComp.id === 'power_wings')) {
      const isLarge = powerComp.id === 'power_wings';
      const w = isLarge ? 1.8 : 1.1;
      const pGeo = new THREE.BoxGeometry(w, 0.03, 0.6);
      const pMat = new THREE.MeshPhongMaterial({ color: 0x18388a, flatShading: true, shininess: 80 });

      const pLeft = new THREE.Mesh(pGeo, pMat);
      pLeft.position.set(-0.7 - w / 2, 0.1, 0);
      group.add(pLeft);

      const pRight = new THREE.Mesh(pGeo, pMat);
      pRight.position.set(0.7 + w / 2, 0.1, 0);
      group.add(pRight);
    }

    // 5. Science Payload Subsystems
    const payloadComp = equipped.find(c => c.cat === 'payload');
    if (payloadComp && payloadComp.subsystemModel) {
      const sub = Assets.clone(payloadComp.subsystemModel, 'center');
      if (sub) {
        const sc = payloadComp.id === 'payload_rover' ? 0.12 : 0.24;
        sub.scale.set(sc, sc, sc);
        sub.position.set(0, 0.35, 0.5);
        group.add(sub);
      }
    }

    return group;
  }

  refreshBuilderCraft() {
    if (!this.builderScene) return;
    if (this.builderCraftMesh) this.builderScene.remove(this.builderCraftMesh);
    this.builderCraftMesh = this.buildSpacecraftModel(this.equippedComponents);
    this.builderScene.add(this.builderCraftMesh);

    const tag = document.getElementById('hangar-craft-tag');
    if (tag) {
      const hull = this.equippedComponents.find(c => c.cat === 'hull');
      tag.textContent = `SPACECRAFT HULL: ${hull ? hull.name.toUpperCase() : 'STANDARD'}`;
    }
  }

  // ─────────────────────────────────────────────────────
  // LIVE ENGINEERING CALCULATIONS & TRADE-OFFS
  // ─────────────────────────────────────────────────────

  calculateStats() {
    let totalMass = 0;
    let totalCost = 0;
    let powerGen = 0;
    let powerDraw = 0;
    let totalDeltav = 0;
    let commsRating = 30;

    this.equippedComponents.forEach(c => {
      totalMass += c.mass || 0;
      totalCost += c.cost || 0;
      if (c.powerGen) powerGen += c.powerGen;
      if (c.powerDraw) powerDraw += c.powerDraw;
      if (c.deltavBonus) totalDeltav += c.deltavBonus;
      if (c.commsRating) commsRating = Math.max(commsRating, c.commsRating);
    });

    const netPower = powerGen - powerDraw;
    const m = this.selectedMission;

    const passMass = totalMass <= m.maxMassKg;
    const passDeltav = totalDeltav >= m.minDeltav;
    const passPower = netPower >= 0;
    const passComms = commsRating >= m.minComms;
    const allPass = passMass && passDeltav && passPower && passComms;

    return {
      totalMass,
      totalCost,
      powerGen,
      powerDraw,
      netPower,
      totalDeltav,
      commsRating,
      passMass,
      passDeltav,
      passPower,
      passComms,
      allPass
    };
  }

  updateLiveStats() {
    const stats = this.calculateStats();
    const m = this.selectedMission;

    // Mass
    const massEl = document.getElementById('stat-mass-val');
    const barMass = document.getElementById('bar-mass');
    if (massEl) massEl.textContent = `${stats.totalMass} / ${m.maxMassKg} kg`;
    if (barMass) {
      const pct = Math.min(100, (stats.totalMass / m.maxMassKg) * 100);
      barMass.style.width = `${pct}%`;
      barMass.style.backgroundColor = stats.passMass ? 'var(--accent)' : 'var(--danger)';
    }

    // Delta-v
    const deltavEl = document.getElementById('stat-deltav-val');
    const barDeltav = document.getElementById('bar-deltav');
    if (deltavEl) deltavEl.textContent = `${stats.totalDeltav.toLocaleString()} / ${m.minDeltav.toLocaleString()} m/s`;
    if (barDeltav) {
      const pct = Math.min(100, (stats.totalDeltav / m.minDeltav) * 100);
      barDeltav.style.width = `${pct}%`;
      barDeltav.style.backgroundColor = stats.passDeltav ? 'var(--success)' : 'var(--warn)';
    }

    // Power
    const powerEl = document.getElementById('stat-power-val');
    const barPower = document.getElementById('bar-power');
    if (powerEl) {
      powerEl.textContent = `${stats.netPower >= 0 ? '+' : ''}${stats.netPower} W`;
      powerEl.style.color = stats.passPower ? 'var(--success)' : 'var(--danger)';
    }
    if (barPower) {
      const pct = stats.powerGen > 0 ? Math.min(100, (stats.powerGen / (stats.powerDraw + 200)) * 100) : 0;
      barPower.style.width = `${pct}%`;
      barPower.style.backgroundColor = stats.passPower ? 'var(--success)' : 'var(--danger)';
    }

    // Comms
    const commsEl = document.getElementById('stat-comms-val');
    const barComms = document.getElementById('bar-comms');
    if (commsEl) commsEl.textContent = `${stats.commsRating}%`;
    if (barComms) {
      barComms.style.width = `${stats.commsRating}%`;
      barComms.style.backgroundColor = stats.passComms ? 'var(--accent)' : 'var(--danger)';
    }

    // Top indicator
    const topMass = document.getElementById('craft-mass-indicator');
    if (topMass) topMass.textContent = `${stats.totalMass} kg`;

    // Feasibility status box
    const feasEl = document.getElementById('builder-feasibility');
    const feasDesc = document.getElementById('builder-feasibility-desc');
    if (feasEl && feasDesc) {
      if (stats.allPass) {
        feasEl.textContent = 'READY TO VALIDATE';
        feasEl.style.color = 'var(--success)';
        feasDesc.textContent = 'All subsystems within mission constraints. Proceed to pre-flight engineering validation.';
      } else {
        feasEl.textContent = 'ENGINEERING DEFICIT';
        feasEl.style.color = 'var(--danger)';
        if (!stats.passMass) feasDesc.textContent = 'Spacecraft exceeds launch mass limit. Downgrade components or hull.';
        else if (!stats.passPower) feasDesc.textContent = 'Electrical deficit! Power consumption exceeds solar/RTG generation.';
        else if (!stats.passDeltav) feasDesc.textContent = 'Insufficient delta-v. Upgrade fuel tanks or install ion propulsion.';
        else feasDesc.textContent = 'Antenna link margin too weak for deep space telemetry. Upgrade dish.';
      }
    }

    this.renderEquippedList();
  }

  // ─────────────────────────────────────────────────────
  // UI RENDERING: TABS, COMPONENTS, EQUIPPED LIST
  // ─────────────────────────────────────────────────────

  renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;
    container.innerHTML = '';

    COMPONENT_CATEGORIES.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `cat-tab ${this.selectedCategory === cat.id ? 'active' : ''}`;
      tab.textContent = cat.name;
      tab.onclick = () => {
        this.sound.playBeep(520, 0.04);
        this.selectedCategory = cat.id;
        this.renderCategoryTabs();
        this.renderComponents();
      };
      container.appendChild(tab);
    });
  }

  renderComponents() {
    const container = document.getElementById('builder-components');
    const titleEl = document.getElementById('cat-header-title');
    const countEl = document.getElementById('cat-item-count');
    if (!container) return;

    container.innerHTML = '';
    const catObj = COMPONENT_CATEGORIES.find(c => c.id === this.selectedCategory);
    if (titleEl && catObj) titleEl.textContent = catObj.name;

    const list = COMPONENTS.filter(c => c.cat === this.selectedCategory);
    if (countEl) countEl.textContent = `${list.length} OPTIONS`;

    list.forEach(comp => {
      const isEquipped = this.equippedComponents.some(e => e.id === comp.id);
      const card = document.createElement('div');
      card.className = `comp-card ${isEquipped ? 'equipped' : ''}`;

      let statsHtml = `
        <div class="comp-stat-badge">Mass: <strong>${comp.mass} kg</strong></div>
        <div class="comp-stat-badge">Cost: <strong>$${comp.cost}M</strong></div>
      `;
      if (comp.deltavBonus) statsHtml += `<div class="comp-stat-badge">Δv: <strong>+${comp.deltavBonus} m/s</strong></div>`;
      if (comp.powerGen) statsHtml += `<div class="comp-stat-badge">Power: <strong style="color:var(--success)">+${comp.powerGen}W</strong></div>`;
      if (comp.powerDraw) statsHtml += `<div class="comp-stat-badge">Load: <strong style="color:var(--warn)">-${comp.powerDraw}W</strong></div>`;
      if (comp.commsRating) statsHtml += `<div class="comp-stat-badge">DSN Link: <strong>${comp.commsRating}%</strong></div>`;
      if (comp.sciValue) statsHtml += `<div class="comp-stat-badge">Science: <strong>+${comp.sciValue} pts</strong></div>`;

      card.innerHTML = `
        <div class="comp-title-row">
          <span class="comp-name">${comp.name}</span>
          <span class="meta-pill" style="${isEquipped ? 'background:rgba(0,230,118,0.2);color:var(--success)' : ''}">
            ${isEquipped ? 'EQUIPPED' : 'SELECT'}
          </span>
        </div>
        <div class="comp-stats-grid">${statsHtml}</div>
        <div class="comp-desc">${comp.desc}</div>
      `;

      card.onclick = () => {
        this.sound.playBeep(isEquipped ? 350 : 680, 0.05);
        this.toggleComponent(comp);
      };
      container.appendChild(card);
    });
  }

  toggleComponent(comp) {
    const idx = this.equippedComponents.findIndex(c => c.id === comp.id);
    if (idx >= 0) {
      // Don't unequip hull or sole propulsion
      if (comp.cat === 'hull') {
        notify('A spacecraft requires a primary structural hull.', 'warn');
        return;
      }
      this.equippedComponents.splice(idx, 1);
    } else {
      // If single-slot category (hull, engine, fuel), replace existing
      if (comp.cat === 'hull' || comp.cat === 'engine' || comp.cat === 'fuel' || comp.cat === 'comms') {
        this.equippedComponents = this.equippedComponents.filter(c => c.cat !== comp.cat);
      }
      this.equippedComponents.push(comp);
    }

    this.renderComponents();
    this.updateLiveStats();
    this.refreshBuilderCraft();
  }

  renderEquippedList() {
    const container = document.getElementById('equipped-list');
    if (!container) return;
    container.innerHTML = '';

    this.equippedComponents.forEach(comp => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '6px 10px';
      row.style.background = 'rgba(6,18,44,0.6)';
      row.style.borderRadius = '4px';
      row.style.fontFamily = 'var(--font-mono)';
      row.style.fontSize = '0.72rem';

      row.innerHTML = `
        <span style="color:#fff;">${comp.name}</span>
        <span style="color:var(--text-dim);">${comp.mass}kg</span>
      `;
      container.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────────────
  // MISSIONS GRID & BRIEFING
  // ─────────────────────────────────────────────────────

  renderMissionsGrid() {
    const container = document.getElementById('missions-grid');
    if (!container) return;
    container.innerHTML = '';

    MISSIONS.forEach((m, idx) => {
      const isSelected = m.id === this.selectedMission.id;
      const card = document.createElement('div');
      card.className = `mission-card ${isSelected ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="chapter-badge">${m.chapter} · ${m.difficulty}</div>
        <div class="mission-title">${m.icon} ${m.name}</div>
        <div class="mission-meta-row">
          <span class="meta-pill">DESTINATION: ${m.destination.toUpperCase()}</span>
          <span class="meta-pill">MAX MASS: ${m.maxMassKg}kg</span>
          <span class="meta-pill">MIN ΔV: ${m.minDeltav} m/s</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-dim);line-height:1.5;">${m.desc}</div>
        <button class="btn ${isSelected ? 'primary' : ''}" style="margin-top:auto;width:100%;">
          ${isSelected ? 'CURRENT ASSIGNMENT' : 'SELECT MISSION'}
        </button>
      `;

      card.onclick = () => {
        this.sound.playBeep(640, 0.06);
        this.selectMission(m);
      };
      container.appendChild(card);
    });
  }

  selectMission(m) {
    if (typeof m === 'string') {
      const found = MISSIONS.find(x => x.id === m || x.id.includes(m) || x.destination.toLowerCase().includes(m.toLowerCase()) || x.name.toLowerCase().includes(m.toLowerCase()));
      if (found) m = found;
    }
    if (!m || typeof m !== 'object') m = MISSIONS[0];
    this.selectedMission = m;
    this.renderMissionsGrid();
    this.updateBriefingCard();
    this.updateLiveStats();
  }

  updateBriefingCard() {
    const m = this.selectedMission || MISSIONS[0];
    if (!m) return;
    const hl = document.getElementById('briefing-headline');
    const desc = document.getElementById('briefing-desc');
    const mass = document.getElementById('b-mass');
    const deltav = document.getElementById('b-deltav');
    const power = document.getElementById('b-power');
    const comms = document.getElementById('b-comms');

    if (hl) hl.textContent = (m.name || 'MISSION').toUpperCase();
    if (desc) desc.textContent = m.detailedBrief || m.desc || '';
    if (mass) mass.textContent = `${(m.maxMassKg || 0).toLocaleString()} kg`;
    if (deltav) deltav.textContent = `${(m.minDeltav || 0).toLocaleString()} m/s`;
    if (power) power.textContent = 'Net ≥ 0 W';
    if (comms) comms.textContent = `≥ ${m.minComms || 0}% Link`;
  }

  selectCategory(catId) {
    if (catId === 'science') catId = 'payload';
    this.selectedCategory = catId;
    this.renderCategoryTabs();
    this.renderComponents();
    if (this.sound) this.sound.playBeep(520, 0.04);
  }

  switchCategory(catId) {
    this.selectCategory(catId);
  }

  selectComponent(catOrId, id) {
    const targetId = id || catOrId;
    const comp = COMPONENTS.find(c => c.id === targetId || c.id.includes(targetId) || c.name.toLowerCase().includes(targetId.toLowerCase()));
    if (comp) {
      this.toggleComponent(comp);
    }
  }

  // ─────────────────────────────────────────────────────
  // NAVIGATION & STATE TRANSITIONS
  // ─────────────────────────────────────────────────────

  goTo(screenName) {
    const screens = ['title', 'cinematic', 'briefing', 'mission', 'builder', 'validation', 'launch', 'ops', 'results'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s === screenName) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    this.currentScreen = screenName;
    this.sound.playBeep(480, 0.04);

    // Visibility toggles for 3D title scene objects
    const isTitleOrCinematic = screenName === 'title' || screenName === 'cinematic';
    if (this.titleAstronaut) this.titleAstronaut.visible = isTitleOrCinematic;
    if (this.titleEarth) this.titleEarth.visible = isTitleOrCinematic;
    if (this.titleMoonGround) this.titleMoonGround.visible = screenName === 'title';

    if (screenName === 'builder') {
      setTimeout(() => {
        this.onResize();
        this.refreshBuilderCraft();
      }, 50);
    } else if (screenName === 'briefing') {
      this.updateBriefingCard();
      setTimeout(() => this.onResize(), 50);
    } else if (screenName === 'validation') {
      this.runValidationDiagnostic();
    } else if (screenName === 'launch') {
      setTimeout(() => this.onResize(), 50);
    } else if (screenName === 'ops') {
      this.startFlightSimulation();
    }
  }

  startNewGame() {
    this.sound.init();
    this.playCinematic();
  }

  continueGame() {
    this.sound.init();
    this.goTo('builder');
  }

  playCinematic() {
    this.goTo('cinematic');
    const textEl = document.getElementById('cinematic-text');
    const narration = [
      "Humanity has always looked toward the stars. But reaching them requires more than courage. It requires planning, science, and smart decisions.",
      "Every kilogram matters. Every drop of fuel matters. Every decision matters.",
      "Welcome, Cadet. Your mission begins now."
    ];

    let step = 0;
    if (this.cinematicTimer) clearInterval(this.cinematicTimer);

    // Initial camera position for sweeping space view
    this.mainCamera.position.set(0, 30, 80);
    this.mainCamera.lookAt(0, 0, 0);

    this.cinematicTimer = setInterval(() => {
      step++;
      if (step < narration.length) {
        if (textEl) {
          textEl.style.opacity = '0';
          setTimeout(() => {
            textEl.textContent = narration[step];
            textEl.style.opacity = '1';
            this.sound.playBeep(600, 0.08);
          }, 300);
        }
      } else {
        clearInterval(this.cinematicTimer);
        setTimeout(() => this.skipCinematic(), 2500);
      }
    }, 5500);
  }

  skipCinematic() {
    if (this.cinematicTimer) clearInterval(this.cinematicTimer);
    this.goTo('briefing');
    this.sound.playChime();
  }

  skipIntro() {
    this.skipCinematic();
  }

  acceptMission() {
    this.sound.playBeep(880, 0.1);
    this.goTo('builder');
  }

  acceptBriefing() {
    this.acceptMission();
  }

  goToValidation() {
    this.goTo('validation');
  }

  proceedToValidation() {
    this.goToValidation();
  }

  startLaunchSequence() {
    this.executeLaunchSequence();
  }

  // ─────────────────────────────────────────────────────
  // ENGINEERING VALIDATION (SCREEN 5)
  // ─────────────────────────────────────────────────────

  runValidationDiagnostic() {
    const stats = this.calculateStats();
    const m = this.selectedMission;

    // Mass
    const mPill = document.getElementById('val-pill-mass');
    const mMetric = document.getElementById('val-metric-mass');
    const mDesc = document.getElementById('val-desc-mass');
    if (mPill) mPill.className = `val-status-pill ${stats.passMass ? 'pass' : 'fail'}`;
    if (mPill) mPill.textContent = stats.passMass ? 'PASS' : 'FAIL';
    if (mMetric) mMetric.textContent = `${stats.totalMass} / ${m.maxMassKg} kg`;
    if (mDesc) {
      mDesc.textContent = stats.passMass
        ? 'Total spacecraft dry mass is within launch vehicle lift limits.'
        : `OVERWEIGHT: Spacecraft exceeds allowable launch vehicle payload limit by ${stats.totalMass - m.maxMassKg} kg.`;
    }

    // Delta-v
    const dvPill = document.getElementById('val-pill-deltav');
    const dvMetric = document.getElementById('val-metric-deltav');
    const dvDesc = document.getElementById('val-desc-deltav');
    if (dvPill) dvPill.className = `val-status-pill ${stats.passDeltav ? 'pass' : 'fail'}`;
    if (dvPill) dvPill.textContent = stats.passDeltav ? 'PASS' : 'FAIL';
    if (dvMetric) dvMetric.textContent = `${stats.totalDeltav.toLocaleString()} / ${m.minDeltav.toLocaleString()} m/s`;
    if (dvDesc) {
      dvDesc.textContent = stats.passDeltav
        ? 'Propulsion system delivers sufficient delta-v to execute Hohmann transfer.'
        : `DEFICIT: Spacecraft lacks ${m.minDeltav - stats.totalDeltav} m/s delta-v required to reach destination.`;
    }

    // Power
    const pPill = document.getElementById('val-pill-power');
    const pMetric = document.getElementById('val-metric-power');
    const pDesc = document.getElementById('val-desc-power');
    if (pPill) pPill.className = `val-status-pill ${stats.passPower ? 'pass' : 'fail'}`;
    if (pPill) pPill.textContent = stats.passPower ? 'PASS' : 'FAIL';
    if (pMetric) pMetric.textContent = `${stats.netPower >= 0 ? '+' : ''}${stats.netPower} W NET`;
    if (pDesc) {
      pDesc.textContent = stats.passPower
        ? `Sufficient power margin (+${stats.powerGen}W generation vs -${stats.powerDraw}W load).`
        : `POWER SHORTAGE: System load (${stats.powerDraw}W) exceeds generation (${stats.powerGen}W). Computer brownout risk!`;
    }

    // Comms
    const cPill = document.getElementById('val-pill-comms');
    const cMetric = document.getElementById('val-metric-comms');
    const cDesc = document.getElementById('val-desc-comms');
    if (cPill) cPill.className = `val-status-pill ${stats.passComms ? 'pass' : 'fail'}`;
    if (cPill) cPill.textContent = stats.passComms ? 'PASS' : 'FAIL';
    if (cMetric) cMetric.textContent = `${stats.commsRating}% / ${m.minComms}% REQ`;
    if (cDesc) {
      cDesc.textContent = stats.passComms
        ? 'Antenna aperture satisfies Deep Space Network link budget requirements.'
        : `WEAK LINK: Signal attenuation at ${m.destination} requires a larger parabolic dish.`;
    }

    // Diagnostic summary
    const reportBox = document.getElementById('diagnostic-report-text');
    const proceedBtn = document.getElementById('btn-proceed-launchpad');
    if (reportBox && proceedBtn) {
      if (stats.allPass) {
        reportBox.style.borderLeftColor = 'var(--success)';
        reportBox.style.background = 'rgba(0,230,118,0.08)';
        reportBox.textContent = '✓ ALL SYSTEMS NOMINAL: Your design satisfies all mission constraints. Spacecraft certified for rollout to the launch platform.';
        proceedBtn.disabled = false;
        this.sound.playChime();
      } else {
        reportBox.style.borderLeftColor = 'var(--danger)';
        reportBox.style.background = 'rgba(255,23,68,0.08)';
        let fixes = [];
        if (!stats.passMass) fixes.push('Reduce spacecraft mass');
        if (!stats.passDeltav) fixes.push('Upgrade fuel tanks or engine');
        if (!stats.passPower) fixes.push('Install high-output solar arrays or RTG');
        if (!stats.passComms) fixes.push('Upgrade to a high-gain dish antenna');
        reportBox.textContent = `CRITICAL FAILURE DETECTED: Flight certification denied. Remedial engineering required: ${fixes.join(' · ')}. Return to the hangar and redesign.`;
        proceedBtn.disabled = true;
        this.sound.playAlarm();
      }
    }
  }

  // ─────────────────────────────────────────────────────
  // LAUNCH SEQUENCE (SCREEN 6)
  // ─────────────────────────────────────────────────────

  executeLaunchSequence() {
    this.sound.init();
    const btn = document.getElementById('btn-initiate-launch');
    if (btn) btn.disabled = true;

    const countEl = document.getElementById('launch-countdown-box');
    let t = 10;
    notify('Cryogenic propellant ignition armed! T-minus 10...', 'info');

    const cdInterval = setInterval(() => {
      t--;
      if (countEl) countEl.textContent = `T - ${t}`;
      this.sound.playBeep(440, 0.05);

      if (t === 3) {
        notify('Main engines ignite! Full thrust committed.', 'warn');
        this.sound.setThrust(true);
        if (this.launchParticles) this.launchParticles.visible = true;
      }

      if (t <= 0) {
        clearInterval(cdInterval);
        if (countEl) countEl.textContent = 'LIFTOFF!';
        this.sound.playBeep(880, 0.2);

        // Rocket ascent animation
        let alt = 4.5;
        const ascent = setInterval(() => {
          alt += 0.38;
          if (this.rocketMesh) this.rocketMesh.position.y = alt;
          if (this.launchParticles) {
            const p = this.launchParticles.geometry.attributes.position;
            for (let i = 0; i < p.count; i++) {
              p.setXYZ(i, (Math.random() - 0.5) * 1.2, alt - 4.5 - Math.random() * 4, (Math.random() - 0.5) * 1.2);
            }
            p.needsUpdate = true;
          }

          if (alt > 32) {
            clearInterval(ascent);
            this.sound.setThrust(false);
            if (this.launchParticles) this.launchParticles.visible = false;
            notify('Orbital insertion confirmed nominal! Spacecraft deployed.', 'success');
            setTimeout(() => {
              if (btn) btn.disabled = false;
              this.goTo('ops');
            }, 800);
          }
        }, 40);
      }
    }, 1000);
  }

  // ─────────────────────────────────────────────────────
  // FLIGHT SIMULATION & ORBITAL OPERATIONS (SCREEN 7)
  // ─────────────────────────────────────────────────────

  startFlightSimulation() {
    if (!this.selectedMission) this.selectedMission = MISSIONS[0];
    const m = this.selectedMission;

    // Reset flight values
    this.flight.burning = 0;
    this.flight.currentOrbitR = m.orbitRadius || 13.0;
    this.flight.orbitAngle = 0;
    this.flight.speedKms = 1.62;
    this.flight.altKm = 120;
    this.flight.fuelPct = 100;
    this.flight.powerPct = 100;
    this.flight.healthPct = 100;
    this.flight.scienceScore = 0;
    this.flight.delivered = false;

    // Update UI Header
    const chTag = document.getElementById('ops-chapter-tag');
    const nameEl = document.getElementById('ops-mission-name');
    const objEl = document.getElementById('ops-objective-text');
    if (chTag) chTag.textContent = m.chapter || 'CHAPTER 01';
    if (nameEl) nameEl.textContent = (m.name || 'ORBITAL FLIGHT').toUpperCase();
    if (objEl) objEl.textContent = `Target: Deliver equipment to ${m.targetStation || 'Surface Station'}`;

    // Clean old objects in mainScene
    if (this.targetPlanetMesh) this.mainScene.remove(this.targetPlanetMesh);
    if (this.targetStationMesh) this.mainScene.remove(this.targetStationMesh);
    if (this.targetRoverMesh) this.mainScene.remove(this.targetRoverMesh);
    if (this.spacecraftMesh) this.mainScene.remove(this.spacecraftMesh);
    if (this.orbitRingMesh) this.mainScene.remove(this.orbitRingMesh);
    this.surfaceAnomalies.forEach(a => this.mainScene.remove(a));
    this.surfaceAnomalies = [];

    // 1. Destination Planet Model
    let planet = Assets.clone(m.planetModel, 'center');
    if (!planet) {
      const geo = new THREE.IcosahedronGeometry(4.5, 2);
      const mat = new THREE.MeshPhongMaterial({ color: 0x99aacc, flatShading: true });
      planet = new THREE.Mesh(geo, mat);
    } else {
      planet.scale.set(2.8, 2.8, 2.8);
    }
    planet.position.set(0, 0, 0);
    this.targetPlanetMesh = planet;
    this.mainScene.add(this.targetPlanetMesh);

    // 2. Surface Base Station Alpha (on Moon/Mars)
    const baseModelKey = m.id === 'mars_explorer' ? 'Building_L' : 'GeodesicDome';
    let station = Assets.clone(baseModelKey, 'bottom') || Assets.clone('Base_Large', 'bottom');
    if (!station) {
      const g = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.8, roughness: 0.2 });
      station = new THREE.Mesh(g, mat);
    }
    station.scale.set(0.6, 0.6, 0.6);
    station.position.set(0, 4.3, 0); // Positioned at top pole of target
    station.traverse(child => {
      child.userData = { isStation: true, name: m.targetStation };
    });
    station.userData = { isStation: true, name: m.targetStation };
    this.targetStationMesh = station;
    this.mainScene.add(this.targetStationMesh);

    // 3. Surface Rover
    const rover = Assets.clone('Rover_1', 'bottom') || Assets.clone('rover', 'bottom');
    if (rover) {
      rover.scale.set(0.28, 0.28, 0.28);
      rover.position.set(1.5, 4.25, 0.8);
      rover.traverse(child => {
        child.userData = { isRover: true, name: 'Planetary Rover Alpha' };
      });
      rover.userData = { isRover: true, name: 'Planetary Rover Alpha' };
      this.targetRoverMesh = rover;
      this.mainScene.add(this.targetRoverMesh);
    }

    // 4. Orbit Track
    const orbitGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * m.orbitRadius, 0, Math.sin(a) * m.orbitRadius));
    }
    orbitGeo.setFromPoints(pts);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x3c96ff, transparent: true, opacity: 0.35 });
    this.orbitRingMesh = new THREE.Line(orbitGeo, orbitMat);
    this.mainScene.add(this.orbitRingMesh);

    // 5. Spacecraft in Orbit
    this.spacecraftMesh = this.buildSpacecraftModel(this.equippedComponents);
    this.spacecraftMesh.scale.set(1.4, 1.4, 1.4);

    // Engine flame
    const fGeo = new THREE.ConeGeometry(0.2, 1.4, 6);
    const fMat = new THREE.MeshBasicMaterial({ color: 0x3c96ff, transparent: true, opacity: 0.8 });
    this.engineFlame = new THREE.Mesh(fGeo, fMat);
    this.engineFlame.rotation.x = Math.PI / 2;
    this.engineFlame.position.set(0, 0, -1.2);
    this.engineFlame.visible = false;
    this.spacecraftMesh.add(this.engineFlame);

    this.mainScene.add(this.spacecraftMesh);

    // 6. Surface Science Anomalies
    this.createSurfaceAnomalies(m);

    this.setCameraMode('orbit');
    notify(`Entered ${m.destination} orbit. Use W/A/S/D to steer, SPACE to burn. Target the surface station to deliver payload!`, 'info');
  }

  createSurfaceAnomalies(m) {
    const data = [
      { name: 'Water-Ice South Polar Basin', sci: 60, color: 0x00e676, model: 'craterLarge' },
      { name: 'Subsurface Crystal Ridge', sci: 80, color: 0xffcc00, model: 'rock_crystalsLargeA' },
      { name: 'Magnetic Anomaly Core', sci: 90, color: 0x3c96ff, model: 'meteor_detailed' }
    ];

    data.forEach((anom, idx) => {
      const theta = (idx / data.length) * Math.PI * 2 + 0.8;
      const r = 4.4;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const group = new THREE.Group();
      group.position.set(x, -0.4, z);

      const model = Assets.clone(anom.model, 'bottom');
      if (model) {
        model.scale.set(0.8, 0.8, 0.8);
        group.add(model);
      }

      // Beacon halo
      const hGeo = new THREE.RingGeometry(0.3, 0.6, 6);
      const hMat = new THREE.MeshBasicMaterial({ color: anom.color, side: THREE.DoubleSide });
      const halo = new THREE.Mesh(hGeo, hMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.2;
      group.add(halo);

      group.userData = { anomaly: anom };
      this.mainScene.add(group);
      this.surfaceAnomalies.push(group);
    });
  }

  // ─────────────────────────────────────────────────────
  // FLIGHT CONTROLS & MANUAL THRUSTER PHYSICS
  // ─────────────────────────────────────────────────────

  setupKeyboardListeners() {
    window.addEventListener('keydown', e => {
      this.keysHeld[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.flight.burning = 1;
        this.sound.setThrust(true);
        if (this.engineFlame) this.engineFlame.visible = true;
      }
      if (e.code === 'KeyX') {
        e.preventDefault();
        this.flight.burning = -1;
        this.sound.setThrust(true);
      }
      if (e.code === 'KeyF') {
        this.toggleSAS();
      }
      if (e.code === 'Escape') {
        this.closeAllModals();
      }
      if (e.code === 'KeyH') {
        this.toggleTrainingModal();
      }
      if (e.code === 'Digit1') this.setCameraMode('orbit');
      if (e.code === 'Digit2') this.setCameraMode('chase');
      if (e.code === 'Digit3') this.setCameraMode('cockpit');
    });

    window.addEventListener('keyup', e => {
      this.keysHeld[e.code] = false;

      if (e.code === 'Space' || e.code === 'KeyX') {
        this.flight.burning = 0;
        this.sound.setThrust(false);
        if (this.engineFlame) this.engineFlame.visible = false;
      }
    });
  }

  toggleSAS() {
    this.flight.sas = !this.flight.sas;
    const btn = document.getElementById('btn-sas');
    if (btn) btn.textContent = `SAS [F]: ${this.flight.sas ? 'ON' : 'OFF'}`;
    notify(`SAS Stability Assist: ${this.flight.sas ? 'ENGAGED' : 'DISENGAGED'}`, 'info');
    this.sound.playBeep(this.flight.sas ? 800 : 400, 0.08);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    ['orbit', 'chase', 'cockpit'].forEach(m => {
      const b = document.getElementById(`cam-btn-${m}`);
      if (b) {
        if (m === mode) b.classList.add('primary');
        else b.classList.remove('primary');
      }
    });
    this.sound.playBeep(620, 0.04);
  }

  setTimeWarp(w) {
    this.timeWarp = w;
    [1, 5, 25].forEach(val => {
      const b = document.getElementById(`warp-btn-${val}`);
      if (b) {
        if (val === w) b.classList.add('primary');
        else b.classList.remove('primary');
      }
    });
    notify(`Time Acceleration: ${w}x`, 'info');
    this.sound.playBeep(550, 0.04);
  }

  setupRaycasting() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('click', e => {
      if (this.currentScreen !== 'ops') return;

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.mainCamera);

      const targets = [
        ...this.surfaceAnomalies,
        this.targetStationMesh,
        this.targetRoverMesh
      ].filter(Boolean);

      const intersects = this.raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit.parent && !hit.userData.anomaly && !hit.userData.isStation && !hit.userData.isRover) {
          hit = hit.parent;
        }

        if (hit.userData.isStation || hit.userData.isRover) {
          this.deliverPayloadToStation(hit.userData.name);
        } else if (hit.userData.anomaly) {
          this.scanSurfaceAnomaly(hit.userData.anomaly, hit);
        }
      }
    });
  }

  deliverPayload(stationName) {
    const target = stationName || (this.selectedMission && this.selectedMission.targetStation) || 'Station Alpha';
    this.deliverPayloadToStation(target);
  }

  deliverPayloadToStation(stationName) {
    if (this.flight.delivered) {
      notify(`Payload already received by ${stationName}! Mission objectives satisfied.`, 'info');
      return;
    }

    this.flight.delivered = true;
    this.flight.scienceScore += 180;
    this.sound.playChime();

    // Laser delivery link beam
    this.fireDownlinkBeam(this.targetStationMesh ? this.targetStationMesh.position : new THREE.Vector3(0, 4.3, 0));

    notify(`SUCCESS: Scientific Payload securely delivered to ${stationName}! +180 Science pts.`, 'success');
    const aiEl = document.getElementById('ops-ai-dialog');
    if (aiEl) {
      aiEl.innerHTML = `<strong>MISSION AI:</strong> "Outstanding work, Cadet! ${stationName} confirms receipt of all scientific equipment. Telemetry verified!"`;
    }

    setTimeout(() => {
      this.completeMission(true);
    }, 3000);
  }

  scanSurfaceAnomaly(anom, mesh) {
    this.sound.playBeep(880, 0.12);
    this.flight.scienceScore += anom.sci;
    this.fireDownlinkBeam(mesh.position);
    notify(`Surface targeted: ${anom.name} confirmed! +${anom.sci} Science pts`, 'success');
  }

  fireDownlinkBeam(targetPos) {
    if (!this.spacecraftMesh || !this.mainScene) return;
    const craftPos = this.spacecraftMesh.position.clone();
    const pts = [craftPos, targetPos];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00e676, linewidth: 3 });
    const beam = new THREE.Line(geo, mat);
    this.mainScene.add(beam);
    setTimeout(() => this.mainScene.remove(beam), 800);
  }

  completeMission(isSuccess = true) {
    const stats = this.calculateStats();

    // Scores
    const engScore = stats.allPass ? Math.min(100, Math.round(85 + (stats.netPower > 50 ? 8 : 4))) : 60;
    const resScore = Math.min(100, Math.round(this.flight.fuelPct * 0.5 + this.flight.powerPct * 0.4));
    const safeScore = Math.min(100, Math.round(this.flight.healthPct * 0.7 + (stats.commsRating >= 80 ? 25 : 15)));
    const totalScore = Math.round((engScore * 0.4) + (resScore * 0.3) + (safeScore * 0.3));

    const sEng = document.getElementById('score-eng');
    const sRes = document.getElementById('score-res');
    const sSafe = document.getElementById('score-safe');
    const sTot = document.getElementById('score-total');

    if (sEng) sEng.textContent = engScore;
    if (sRes) sRes.textContent = resScore;
    if (sSafe) sSafe.textContent = safeScore;
    if (sTot) sTot.textContent = `${totalScore} / 100`;

    const hl = document.getElementById('results-headline');
    const sub = document.getElementById('results-subheadline');
    if (hl) hl.textContent = isSuccess ? 'MISSION COMPLETE!' : 'MISSION COMPROMISED';
    if (sub) {
      sub.textContent = isSuccess
        ? `Congratulations Cadet! You delivered the scientific payload and earned the ${this.selectedMission.reward}.`
        : 'Subsystem margins depleted during transit. Review mass and power trade-offs before re-attempting.';
    }

    this.sound.playChime();
    this.goTo('results');
  }

  continueToNextChapter() {
    const curIdx = MISSIONS.findIndex(m => m.id === this.selectedMission.id);
    const nextIdx = (curIdx + 1) % MISSIONS.length;
    this.selectMission(MISSIONS[nextIdx]);
    this.goTo('briefing');
  }

  // ─────────────────────────────────────────────────────
  // MODAL HANDLERS
  // ─────────────────────────────────────────────────────

  toggleTrainingModal(force) {
    const m = document.getElementById('training-modal');
    if (!m) return;
    const shouldHide = typeof force === 'boolean' ? !force : !m.classList.contains('hidden');
    m.classList.toggle('hidden', shouldHide);
    if (this.sound) this.sound.playBeep(450, 0.04);
  }

  toggleNasaModal(force) {
    const m = document.getElementById('nasa-sources-modal');
    if (!m) return;
    const shouldHide = typeof force === 'boolean' ? !force : !m.classList.contains('hidden');
    m.classList.toggle('hidden', shouldHide);
    if (this.sound) this.sound.playBeep(450, 0.04);
  }

  toggleSettingsModal(force) {
    const m = document.getElementById('settings-modal');
    if (!m) return;
    const shouldHide = typeof force === 'boolean' ? !force : !m.classList.contains('hidden');
    m.classList.toggle('hidden', shouldHide);
    if (this.sound) this.sound.playBeep(450, 0.04);
  }

  closeAllModals() {
    this.toggleSettingsModal(false);
    this.toggleTrainingModal(false);
    this.toggleNasaModal(false);
  }

  toggleAudio() {
    this.sound.enabled = !this.sound.enabled;
    const btn = document.getElementById('cfg-btn-sfx');
    if (btn) btn.textContent = this.sound.enabled ? 'ENABLED' : 'MUTED';
    notify(`Audio Sound Effects: ${this.sound.enabled ? 'ON' : 'MUTED'}`, 'info');
  }

  // ─────────────────────────────────────────────────────
  // RESIZE & RENDER LOOP (60 FPS SMOOTH ANIMATIONS)
  // ─────────────────────────────────────────────────────

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (this.mainRenderer && this.mainCamera) {
      this.mainCamera.aspect = w / h;
      this.mainCamera.updateProjectionMatrix();
      this.mainRenderer.setSize(w, h);
    }

    const bCanvas = document.getElementById('spacecraft-canvas');
    if (this.builderRenderer && this.builderCamera && bCanvas && bCanvas.clientWidth > 0) {
      const bw = bCanvas.clientWidth;
      const bh = bCanvas.clientHeight || 450;
      this.builderCamera.aspect = bw / bh;
      this.builderCamera.updateProjectionMatrix();
      this.builderRenderer.setSize(bw, bh);
    }

    const brCanvas = document.getElementById('briefing-canvas');
    if (this.briefingRenderer && this.briefingCamera && brCanvas && brCanvas.clientWidth > 0) {
      const brw = brCanvas.clientWidth;
      const brh = brCanvas.clientHeight || 280;
      this.briefingCamera.aspect = brw / brh;
      this.briefingCamera.updateProjectionMatrix();
      this.briefingRenderer.setSize(brw, brh);
    }

    const lCanvas = document.getElementById('launch-canvas');
    if (this.launchRenderer && this.launchCamera && lCanvas && lCanvas.clientWidth > 0) {
      const lw = lCanvas.clientWidth;
      const lh = lCanvas.clientHeight || 500;
      this.launchCamera.aspect = lw / lh;
      this.launchCamera.updateProjectionMatrix();
      this.launchRenderer.setSize(lw, lh);
    }
  }

  setupWindowListeners() {
    window.addEventListener('resize', () => this.onResize());
  }

  animateMain() {
    requestAnimationFrame(() => this.animateMain());

    // Main 3D Scene
    if (this.mainRenderer && this.mainScene && this.mainCamera) {
      if (this.cameraMode === 'orbit' && this.mainControls) {
        this.mainControls.update();
      }

      // Title idle animations
      if (this.currentScreen === 'title' || this.currentScreen === 'cinematic') {
        if (this.titleEarth) this.titleEarth.rotation.y += 0.003;
        if (this.titleAstronaut) {
          const t = Date.now() * 0.001;
          this.titleAstronaut.position.y = -2 + Math.sin(t * 1.5) * 0.05;
        }
      }

      // In-flight physics loop
      if (this.currentScreen === 'ops' && this.selectedMission) {
        const dt = 0.016 * this.timeWarp;

        // Manual steering input
        if (this.keysHeld['KeyW']) this.flight.pitchRate = -0.035;
        else if (this.keysHeld['KeyS']) this.flight.pitchRate = 0.035;
        else if (this.flight.sas) this.flight.pitchRate *= 0.9;

        if (this.keysHeld['KeyA']) this.flight.yawRate = -0.035;
        else if (this.keysHeld['KeyD']) this.flight.yawRate = 0.035;
        else if (this.flight.sas) this.flight.yawRate *= 0.9;

        if (this.keysHeld['KeyQ']) this.flight.rollRate = -0.045;
        else if (this.keysHeld['KeyE']) this.flight.rollRate = 0.045;
        else if (this.flight.sas) this.flight.rollRate *= 0.9;

        this.flight.pitch += this.flight.pitchRate;
        this.flight.yaw += this.flight.yawRate;
        this.flight.roll += this.flight.rollRate;

        // Thruster burn physics
        if (this.flight.burning !== 0 && this.flight.fuelPct > 0) {
          this.flight.fuelPct = Math.max(0, this.flight.fuelPct - (0.08 * dt * 60));
          const rDelta = this.flight.burning * 0.015 * this.timeWarp;
          this.flight.currentOrbitR = clamp(this.flight.currentOrbitR + rDelta, 6.0, 35.0);
          this.flight.speedKms = clamp(this.flight.speedKms + this.flight.burning * 0.008, 0.8, 4.2);
          this.flight.altKm = Math.round((this.flight.currentOrbitR - 4.5) * 15);
        }

        // Orbit progression
        const speed = (this.flight.orbitSpeed * (10 / this.flight.currentOrbitR)) * this.timeWarp;
        this.flight.orbitAngle += speed;

        const r = this.flight.currentOrbitR;
        const x = Math.cos(this.flight.orbitAngle) * r;
        const z = Math.sin(this.flight.orbitAngle) * r;

        if (this.spacecraftMesh) {
          this.spacecraftMesh.position.set(x, 0, z);
          const tangentYaw = -this.flight.orbitAngle + Math.PI / 2;
          this.spacecraftMesh.rotation.set(this.flight.pitch, tangentYaw + this.flight.yaw, this.flight.roll);
        }

        // Target body rotation
        if (this.targetPlanetMesh) this.targetPlanetMesh.rotation.y += 0.003 * this.timeWarp;

        // Dynamic Cameras
        if (this.spacecraftMesh) {
          const craftPos = this.spacecraftMesh.position;
          if (this.cameraMode === 'chase') {
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.spacecraftMesh.rotation);
            const up = new THREE.Vector3(0, 1, 0).applyEuler(this.spacecraftMesh.rotation);
            const targetCam = craftPos.clone().sub(forward.multiplyScalar(5.5)).add(up.multiplyScalar(2.0));
            this.mainCamera.position.lerp(targetCam, 0.12);
            this.mainCamera.lookAt(craftPos);
          } else if (this.cameraMode === 'cockpit') {
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.spacecraftMesh.rotation);
            const camPos = craftPos.clone().add(forward.clone().multiplyScalar(0.9)).add(new THREE.Vector3(0, 0.25, 0));
            this.mainCamera.position.copy(camPos);
            this.mainCamera.lookAt(craftPos.clone().add(forward.multiplyScalar(20)));
          }
        }

        // HUD updates
        const fEl = document.getElementById('hud-fuel');
        const pEl = document.getElementById('hud-power');
        const hEl = document.getElementById('hud-health');
        const sEl = document.getElementById('hud-score');
        const tEl = document.getElementById('flight-telemetry-text');

        if (fEl) fEl.textContent = `${Math.round(this.flight.fuelPct)}%`;
        if (pEl) pEl.textContent = `${Math.round(this.flight.powerPct)}%`;
        if (hEl) hEl.textContent = `${Math.round(this.flight.healthPct)}%`;
        if (sEl) sEl.textContent = Math.round(this.flight.scienceScore);
        if (tEl) tEl.textContent = `ALT: ${this.flight.altKm} km | VEL: ${this.flight.speedKms.toFixed(2)} km/s`;
      }

      this.mainRenderer.render(this.mainScene, this.mainCamera);
    }

    // Holographic Commander Viewport (Briefing)
    if (this.currentScreen === 'briefing' && this.briefingRenderer && this.briefingScene && this.briefingCamera) {
      if (this.commanderMesh) this.commanderMesh.rotation.y += 0.01;
      this.briefingRenderer.render(this.briefingScene, this.briefingCamera);
    }

    // Spacecraft Builder Hangar
    if (this.currentScreen === 'builder' && this.builderRenderer && this.builderScene && this.builderCamera) {
      if (this.builderControls) this.builderControls.update();
      this.builderRenderer.render(this.builderScene, this.builderCamera);
    }

    // Launch Complex
    if (this.currentScreen === 'launch' && this.launchRenderer && this.launchScene && this.launchCamera) {
      this.launchRenderer.render(this.launchScene, this.launchCamera);
    }
  }
}

// ─────────────────────────────────────────────────────
// GLOBAL INITIALIZATION
// ─────────────────────────────────────────────────────

window.Game = new MissionArchitectGame();
