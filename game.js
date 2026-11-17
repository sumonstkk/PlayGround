import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07121a);
scene.fog = new THREE.Fog(0x07121a, 25, 55);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 20, 23);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xbde9ed, 0x101a24, 2.15));
const keyLight = new THREE.DirectionalLight(0xc9f9ff, 3.2);
keyLight.position.set(-7, 16, 8); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -16; keyLight.shadow.camera.right = 16; keyLight.shadow.camera.top = 16; keyLight.shadow.camera.bottom = -16; scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x28d9dc, 40, 20); cyanLight.position.set(-9, 3, 0); scene.add(cyanLight);
const pinkLight = new THREE.PointLight(0xf83276, 35, 18); pinkLight.position.set(9, 3, -2); scene.add(pinkLight);

const mat = (color, roughness = .55, metalness = .25, emissive = 0x000000, intensity = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: intensity });
const floorMat = mat(0x15252d, .82, .35);
const darkMat = mat(0x0b161f, .52, .6);
const trimMat = mat(0x243b43, .32, .78);
const cyanMat = mat(0x63f6ec, .25, .48, 0x12d8da, 1.4);
const pinkMat = mat(0xff527b, .3, .45, 0xf21e60, 1.1);
const goldMat = mat(0xffc478, .3, .5, 0xd87928, .8);
const glassBlue = new THREE.MeshStandardMaterial({ color: 0x4298b0, roughness: .18, metalness: .3, transparent: true, opacity: .44, emissive: 0x12313e, emissiveIntensity: .7 });
const plane = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), floorMat); plane.rotation.x = -Math.PI / 2; plane.receiveShadow = true; scene.add(plane);

function box(parent, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = options.shadow !== false; mesh.receiveShadow = true;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh); return mesh;
}
function cylinder(parent, rt, rb, h, position, material, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function addArena() {
  // Recessed floor panels and the arena's fine, luminous circuit grid.
  for (let i = -15; i <= 15; i += 3) {
    const lineX = new THREE.Mesh(new THREE.BoxGeometry(.025, .018, 30), i === 0 ? mat(0x276d70, .4, .2, 0x0b4a4b, .7) : mat(0x29414a, .55, .4));
    lineX.position.set(i, .012, 0); scene.add(lineX);
    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(30, .018, .025), i === 0 ? mat(0x276d70, .4, .2, 0x0b4a4b, .7) : mat(0x29414a, .55, .4));
    lineZ.position.set(0, .013, i); scene.add(lineZ);
  }
  for (let x = -12; x <= 12; x += 6) for (let z = -12; z <= 12; z += 6) {
    const p = box(scene, [2.85, .035, 2.85], [x, -.005, z], mat(0x192a32, .72, .35), { shadow: false });
    p.position.y = .005;
  }
  // Raised perimeter, segmented neon strips and corner pylons.
  const wallMat = mat(0x101d26, .4, .72);
  box(scene, [31, .75, .55], [0, .35, -15], wallMat);
  box(scene, [31, .75, .55], [0, .35, 15], wallMat);
  box(scene, [.55, .75, 31], [-15, .35, 0], wallMat);
  box(scene, [.55, .75, 31], [15, .35, 0], wallMat);
  for (const z of [-14.7, 14.7]) for (let x = -12; x <= 12; x += 4) box(scene, [2.2, .07, .06], [x, .4, z], x % 8 === 0 ? cyanMat : pinkMat, { shadow: false });
  for (const x of [-14.7, 14.7]) for (let z = -12; z <= 12; z += 4) box(scene, [.06, .07, 2.2], [x, .4, z], x < 0 ? cyanMat : pinkMat, { shadow: false });
  for (const [x, z, color] of [[-14,-14,cyanMat],[14,-14,pinkMat],[-14,14,cyanMat],[14,14,pinkMat]]) {
    cylinder(scene, .48, .55, 2.7, [x, 1.15, z], darkMat, 8);
    cylinder(scene, .52, .52, .12, [x, 2.5, z], color, 8);
    const lamp = new THREE.PointLight(color === cyanMat ? 0x37e9e7 : 0xff4b7f, 18, 8); lamp.position.set(x, 2.4, z); scene.add(lamp);
  }
  // Offset, waist-high cover gives both players meaningful lanes without blocking the view.
  const cover = (x, z, w, d, accent) => {
    box(scene, [w, 1.15, d], [x, .58, z], darkMat);
    box(scene, [w + .08, .08, d + .08], [x, 1.18, z], trimMat);
    box(scene, [w * .72, .045, .045], [x, 1.225, z - d / 2 - .028], accent, { shadow: false });
    for (let k = -1; k <= 1; k += 2) box(scene, [.07, .2, d + .04], [x + k * (w / 2 - .1), .2, z], trimMat);
  };
  cover(-5.4, -3.1, 3.4, 1.1, pinkMat); cover(5.1, 3.2, 3.3, 1.1, cyanMat);
  cover(0, -6.6, 2.8, 1.0, pinkMat); cover(-.8, 6.7, 2.9, 1.0, cyanMat);
  // Angular, low profile center dais.
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.65, .22, 8), mat(0x172b33, .45, .68)); dais.position.y = .11; dais.rotation.y = Math.PI / 8; dais.receiveShadow = true; dais.castShadow = true; scene.add(dais);
  const daisRing = new THREE.Mesh(new THREE.TorusGeometry(3.23, .035, 6, 8), cyanMat); daisRing.rotation.x = Math.PI / 2; daisRing.position.y = .24; daisRing.rotation.z = Math.PI / 8; scene.add(daisRing);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const marker = box(scene, [.1, .035, .48], [Math.cos(a) * 11.6, .035, Math.sin(a) * 11.6], i % 2 ? pinkMat : cyanMat, { shadow: false });
    marker.rotation.y = -a;
  }
  // Suspended architectural beams add scale and a readable arena silhouette.
  for (let z of [-13.9, 13.9]) {
    box(scene, [27, .12, .12], [0, 4.3, z], trimMat);
    for (let x = -10; x <= 10; x += 5) box(scene, [.08, 3.7, .08], [x, 2.45, z], trimMat);
  }
  // Distant city blocks behind the arena edge.
  for (let i = 0; i < 12; i++) {
    const x = -23 + i * 4.2, h = 3 + (i * 13 % 6);
    box(scene, [2.5, h, 2], [x, h / 2 - .2, -22], mat(i % 2 ? 0x101f29 : 0x12212a, .8, .3), { shadow: false });
    for (let y = .8; y < h - .4; y += 1.1) box(scene, [.045, .28, .035], [x - .5 + (i % 3) * .35, y, -20.96], i % 3 ? cyanMat : pinkMat, { shadow: false });
  }
}
addArena();

function buildHero(primary, colorMat) {
  const root = new THREE.Group(); scene.add(root);
  const visual = new THREE.Group(); root.add(visual);
  visual.scale.setScalar(1.22);
  const armor = primary ? mat(0x17424a, .35, .72) : mat(0x462537, .36, .68);
  const dark = mat(0x121c25, .48, .7);
  const accent = colorMat;
  // Compact armored silhouette, with distinct helmet, shoulder plates and energy core.
  cylinder(visual, .29, .32, .25, [0, .83, 0], dark, 8);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.27, .35, .75, 6), armor); torso.position.y = 1.35; torso.castShadow = true; visual.add(torso);
  box(visual, [.54, .12, .32], [0, 1.55, -.015], accent);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), accent); core.position.set(0, 1.37, .31); visual.add(core);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8), dark); head.scale.set(1, 1.05, .9); head.position.y = 1.94; head.castShadow = true; visual.add(head);
  const visor = box(visual, [.34, .075, .12], [0, 1.98, .21], accent); visor.rotation.x = -.12;
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), armor); shoulder.scale.set(1.22, .76, .9); shoulder.position.set(side * .39, 1.58, 0); shoulder.castShadow = true; visual.add(shoulder);
    const arm = box(visual, [.19, .48, .2], [side * .42, 1.19, .05], dark); arm.rotation.z = side * -.08;
    const leg = box(visual, [.22, .55, .25], [side * .16, .43, 0], armor); leg.rotation.x = -.02;
    box(visual, [.28, .13, .38], [side * .16, .14, .09], dark);
  }
  // Forward rifle points along local +Z.
  box(visual, [.16, .18, .62], [0, 1.35, .53], dark);
  box(visual, [.09, .09, .26], [0, 1.38, .92], accent);
  cylinder(visual, .1, .1, .19, [0, 1.37, 1.02], dark, 8).rotation.x = Math.PI / 2;
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.65, 24), new THREE.MeshBasicMaterial({ color: primary ? 0x18cbcd : 0xed245e, transparent: true, opacity: .17, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .025; visual.add(shadow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.55, .025, 5, 8), accent); ring.rotation.x = Math.PI / 2; ring.position.y = .04; visual.add(ring);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 12), new THREE.MeshBasicMaterial({ color: primary ? 0x4ddce8 : 0xff4775, transparent: true, opacity: .11, wireframe: true })); shield.position.y = 1; shield.visible = false; root.add(shield);
  return { root, visual, shield, accent, armor, primary, hp: 100, maxHp: 100, shieldHp: primary ? 40 : 25, maxShield: primary ? 40 : 25, alive: true, speed: primary ? 5.3 : 3.8, cooldown: 0, abilityTimer: 0, barrierTimer: 0, movePhase: 0, hitFlash: 0 };
}
const player = buildHero(true, cyanMat);
const enemy = buildHero(false, pinkMat);
player.root.position.set(-1.8, 0, 8.3); enemy.root.position.set(1.8, 0, -8.3);

const projectiles = [], particles = [], barriers = [];
function makeProjectile(owner, start, direction, damage, color, speed = 26) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(.105, 8, 6), color);
  mesh.position.copy(start); scene.add(mesh);
  const glow = new THREE.PointLight(owner === player ? 0x52ffff : 0xff3f70, 2, 3); mesh.add(glow);
  projectiles.push({ mesh, owner, direction: direction.clone().normalize(), speed, damage, life: 1.4, color });
  const streak = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .52, 6), color); streak.position.copy(start).addScaledVector(direction, -.22); streak.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); scene.add(streak);
  projectiles[projectiles.length - 1].streak = streak;
}
function burst(position, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(.045 + Math.random() * .045, 0), color); mesh.position.copy(position); scene.add(mesh);
    particles.push({ mesh, velocity: new THREE.Vector3((Math.random() - .5) * 5, Math.random() * 4, (Math.random() - .5) * 5), life: .3 + Math.random() * .38 });
  }
}
function createBarrier(hero) {
  const geo = new THREE.BoxGeometry(2.6, 2.35, .16);
  const color = hero === player ? 0x63efff : 0xff7392;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: .28, emissive: color, emissiveIntensity: .7, metalness: .3, roughness: .2, side: THREE.DoubleSide }));
  mesh.position.copy(hero.root.position); mesh.position.y = 1.18;
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color })); mesh.add(edge);
  scene.add(mesh); barriers.push({ mesh, hero, life: 2.15 });
  hero.barrierTimer = 8;
}

const raycaster = new THREE.Raycaster();
// Aim on the weapon-height plane so the camera's elevated perspective does not
// shift cursor targets behind the opponent when projected onto the floor.
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.42);
const pointer = new THREE.Vector2();
let aimPoint = new THREE.Vector3(0, 0, 0);
let active = false, pausedByFocus = false, firing = false, soundOn = true, roundTransition = false;
let audioContext = null;
function playTone(frequency, duration = .075, type = 'triangle', volume = .018) {
  if (!soundOn || !audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();
  const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * .58), audioContext.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}
let playerScore = 0, enemyScore = 0, round = 1, lastTime = performance.now(), matchDone = false;
const keys = new Set();
const hud = {
  playerHp: document.querySelector('#player-health'), enemyHp: document.querySelector('#enemy-health'),
  playerHpText: document.querySelector('#player-hp-text'), enemyHpText: document.querySelector('#enemy-hp-text'),
  playerShield: document.querySelector('#player-shield-text'), enemyShield: document.querySelector('#enemy-shield-text'),
  pScore: document.querySelector('#player-score'), eScore: document.querySelector('#enemy-score'), round: document.querySelector('#round-number'),
};
function aimAt(x, y) {
  pointer.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(ground, aimPoint);
  const crosshair = document.querySelector('#crosshair');
  crosshair.style.left = `${x}px`; crosshair.style.top = `${y}px`;
}
function facing(hero, point) {
  const dx = point.x - hero.root.position.x, dz = point.z - hero.root.position.z;
  hero.visual.rotation.y = Math.atan2(dx, dz);
}
function fire(hero, target) {
  if (!hero.alive || hero.cooldown > 0) return;
  hero.cooldown = hero === player ? .19 : .62 + Math.random() * .32;
  const from = hero.root.position.clone().add(new THREE.Vector3(0, 1.42, 0));
  let direction = new THREE.Vector3(target.x - from.x, .015, target.z - from.z).normalize();
  if (hero === enemy && Math.random() < .18) direction.x += (Math.random() - .5) * .16;
  const start = from.clone().addScaledVector(direction, .66);
  makeProjectile(hero, start, direction, hero === player ? 13 : 9, hero.accent, hero === player ? 31 : 22);
  playTone(hero === player ? 720 : 290, .065, 'triangle', hero === player ? .014 : .009);
  if (hero === player) {
    const flash = new THREE.PointLight(0x64ffff, 4, 4); flash.position.copy(start); scene.add(flash); setTimeout(() => scene.remove(flash), 55);
  }
}
function hit(target, damage, position) {
  if (!target.alive) return;
  let remaining = damage;
  if (target.shieldHp > 0) { const absorbed = Math.min(target.shieldHp, remaining); target.shieldHp -= absorbed; remaining -= absorbed; }
  if (remaining > 0) target.hp = Math.max(0, target.hp - remaining);
  target.hitFlash = .15;
  target.shield.visible = target.shieldHp > 0 && target.shieldHp < target.maxShield;
  burst(position, target === player ? pinkMat : cyanMat, 5);
  if (target === player) { const f = document.querySelector('#damage-flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 90); }
  if (target.hp <= 0) finishRound(target === player ? enemy : player);
}
function finishRound(winner) {
  if (roundTransition || matchDone) return;
  roundTransition = true;
  if (winner === player) playerScore++; else enemyScore++;
  hud.pScore.textContent = playerScore; hud.eScore.textContent = enemyScore;
  document.querySelector('#round-banner').classList.add('hidden');
  document.querySelector('#toast').textContent = winner === player ? 'ROUND WON // CLEAN ELIMINATION' : 'ROUND LOST // REGROUP';
  document.querySelector('#toast').classList.add('show');
  setTimeout(() => document.querySelector('#toast').classList.remove('show'), 1500);
  if (playerScore === 3 || enemyScore === 3) {
    matchDone = true; active = false;
    const panel = document.querySelector('#center-message'); panel.classList.remove('hidden');
    panel.querySelector('.message-kicker').textContent = 'MATCH COMPLETE // ' + (playerScore > enemyScore ? 'VICTORY' : 'DEFEAT');
    panel.querySelector('h1').innerHTML = playerScore > enemyScore ? 'ARENA<br><em>CHAMPION.</em>' : 'BACK TO<br><em>THE GRID.</em>';
    panel.querySelector('p').textContent = playerScore > enemyScore ? 'The district is yours. Queue up for another duel.' : 'The Phantom takes this one. Your rematch starts now.';
    panel.querySelector('#start-button').innerHTML = 'PLAY AGAIN <span>↗</span>';
    panel.querySelector('.loading-hint').textContent = 'BEST OF FIVE  •  WIN TWO MORE AND TAKE THE ROUND';
    document.querySelector('#crosshair').classList.remove('visible');
    return;
  }
  setTimeout(() => {
    round++; hud.round.textContent = String(round).padStart(2, '0');
    for (const hero of [player, enemy]) {
      hero.hp = 100; hero.shieldHp = hero.maxShield; hero.alive = true; hero.root.visible = true; hero.shield.visible = false; hero.cooldown = 0;
    }
    player.root.position.set(-1.8 + (round % 2) * 3.6, 0, 8.3);
    enemy.root.position.set(1.8 - (round % 2) * 3.6, 0, -8.3);
    roundTransition = false;
    showRound();
  }, 1650);
}
function showRound() {
  const banner = document.querySelector('#round-banner'); banner.querySelector('b').textContent = String(round).padStart(2, '0'); banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 1450);
}
function resetMatch() {
  playerScore = 0; enemyScore = 0; round = 1; matchDone = false; roundTransition = false;
  hud.pScore.textContent = '0'; hud.eScore.textContent = '0'; hud.round.textContent = '01';
  for (const hero of [player, enemy]) { hero.hp = 100; hero.shieldHp = hero.maxShield; hero.alive = true; hero.root.visible = true; hero.shield.visible = false; hero.cooldown = 0; hero.abilityTimer = 0; hero.barrierTimer = 0; }
  player.root.position.set(-1.8, 0, 8.3); enemy.root.position.set(1.8, 0, -8.3);
  document.querySelector('#center-message').classList.add('hidden'); active = true;
  document.querySelector('#crosshair').classList.add('visible'); showRound();
}
function dash() {
  if (!active || player.abilityTimer > 0) return;
  const direction = new THREE.Vector3((keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0), 0, (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0));
  if (direction.lengthSq() < .01) direction.set(aimPoint.x - player.root.position.x, 0, aimPoint.z - player.root.position.z);
  direction.normalize(); player.root.position.addScaledVector(direction, 3.1); player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -13.2, 13.2); player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -13.2, 13.2);
  player.abilityTimer = 4.2; burst(player.root.position.clone().add(new THREE.Vector3(0, 1, 0)), cyanMat, 14);
}
function barrier() { if (active && player.barrierTimer <= 0) createBarrier(player); }

const startButton = document.querySelector('#start-button');
startButton.addEventListener('click', () => { if (!audioContext) audioContext = new AudioContext(); audioContext.resume(); if (matchDone) resetMatch(); else { resetMatch(); if (innerWidth > 700) canvas.focus(); } });
document.querySelector('#sound-toggle').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.innerHTML = soundOn ? '♫ <span>SOUND ON</span>' : '♫ <span>SOUND OFF</span>'; });
window.addEventListener('keydown', e => { const key = e.key.toLowerCase(); keys.add(key); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault(); if (key === 'shift') dash(); if (key === 'e') barrier(); if (key === 'r') { if (active || matchDone) resetMatch(); } });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { firing = false; keys.clear(); pausedByFocus = true; });
window.addEventListener('focus', () => { pausedByFocus = false; });
canvas.addEventListener('pointermove', e => { aimAt(e.clientX, e.clientY); });
canvas.addEventListener('pointerdown', e => { if (e.button === 0) { firing = true; aimAt(e.clientX, e.clientY); fire(player, aimPoint); } });
window.addEventListener('pointerup', e => { if (e.button === 0) firing = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.querySelector('#dash-ability').addEventListener('click', dash);
document.querySelector('#barrier-ability').addEventListener('click', barrier);

// Optional mobile joystick, firing and abilities.
const mobile = document.querySelector('#mobile-controls');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) mobile.classList.add('active');
const pad = document.querySelector('#move-pad'); let joy = { x: 0, y: 0 }, padPointer = null;
pad.addEventListener('pointerdown', e => { padPointer = e.pointerId; pad.setPointerCapture(e.pointerId); updateJoy(e); });
pad.addEventListener('pointermove', e => { if (e.pointerId === padPointer) updateJoy(e); });
function updateJoy(e) { const r = pad.getBoundingClientRect(); joy.x = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / 42, -1, 1); joy.y = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / 42, -1, 1); const thumb = pad.querySelector('.pad-thumb'); thumb.style.transform = `translate(${joy.x * 28}px,${joy.y * 28}px)`; }
pad.addEventListener('pointerup', () => { padPointer = null; joy = { x: 0, y: 0 }; pad.querySelector('.pad-thumb').style.transform = ''; });
document.querySelector('#mobile-fire').addEventListener('pointerdown', e => { e.preventDefault(); firing = true; aimPoint.copy(enemy.root.position); });
window.addEventListener('pointerup', () => { firing = false; });
document.querySelector('#mobile-dash').addEventListener('click', dash); document.querySelector('#mobile-barrier').addEventListener('click', barrier);

function updateHud() {
  hud.playerHp.style.width = `${player.hp}%`; hud.enemyHp.style.width = `${enemy.hp}%`;
  hud.playerHpText.textContent = Math.ceil(player.hp); hud.enemyHpText.textContent = Math.ceil(enemy.hp);
  hud.playerShield.textContent = Math.ceil(player.shieldHp); hud.enemyShield.textContent = Math.ceil(enemy.shieldHp);
  const dashCd = document.querySelector('#dash-cd'), barrierCd = document.querySelector('#barrier-cd');
  dashCd.style.transform = `scaleX(${Math.min(1, player.abilityTimer / 4.2)})`; barrierCd.style.transform = `scaleX(${Math.min(1, player.barrierTimer / 8)})`;
  document.querySelector('#dash-ability').classList.toggle('ready', player.abilityTimer <= 0); document.querySelector('#barrier-ability').classList.toggle('ready', player.barrierTimer <= 0);
}
function update(dt) {
  if (active && !pausedByFocus && !roundTransition) {
    const movement = new THREE.Vector3((keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + joy.x, 0, (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0) + joy.y);
    if (movement.lengthSq() > .02) {
      movement.normalize(); player.root.position.addScaledVector(movement, player.speed * dt);
      player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -13.4, 13.4); player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -13.4, 13.4);
      player.movePhase += dt * 13; player.visual.position.y = Math.abs(Math.sin(player.movePhase)) * .055;
    } else player.visual.position.y = THREE.MathUtils.lerp(player.visual.position.y, 0, .2);
    if (innerWidth <= 700) aimPoint.copy(enemy.root.position);
    facing(player, aimPoint);
    if (firing) fire(player, aimPoint);
    player.cooldown = Math.max(0, player.cooldown - dt); player.abilityTimer = Math.max(0, player.abilityTimer - dt); player.barrierTimer = Math.max(0, player.barrierTimer - dt);
    // Phantom strafes, closes distance, and fires in deliberate bursts.
    enemy.cooldown = Math.max(0, enemy.cooldown - dt); enemy.abilityTimer += dt;
    const toPlayer = player.root.position.clone().sub(enemy.root.position); const dist = toPlayer.length();
    const toward = toPlayer.clone().normalize(); const strafe = new THREE.Vector3(-toward.z, 0, toward.x).multiplyScalar(Math.sin(performance.now() * .0011 + 1.2) * .66);
    if (dist > 7.3) enemy.root.position.addScaledVector(toward, enemy.speed * dt);
    else if (dist < 5.1) enemy.root.position.addScaledVector(toward, -enemy.speed * .55 * dt);
    enemy.root.position.addScaledVector(strafe, dt);
    enemy.root.position.x = THREE.MathUtils.clamp(enemy.root.position.x, -13.1, 13.1); enemy.root.position.z = THREE.MathUtils.clamp(enemy.root.position.z, -13.1, 13.1);
    facing(enemy, player.root.position);
    if (dist < 18 && enemy.cooldown <= 0) fire(enemy, player.root.position);
    if (enemy.abilityTimer > 8 && dist < 6.4) { enemy.abilityTimer = 0; createBarrier(enemy); }
    enemy.barrierTimer = Math.max(0, enemy.barrierTimer - dt);
    for (const hero of [player, enemy]) if (hero.hitFlash > 0) { hero.hitFlash -= dt; hero.visual.scale.setScalar(1.22 * (1 + Math.max(0, hero.hitFlash) * .15)); }
  }
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; p.life -= dt; p.mesh.position.addScaledVector(p.direction, p.speed * dt); p.streak.position.copy(p.mesh.position).addScaledVector(p.direction, -.25);
    const target = p.owner === player ? enemy : player;
    const delta = target.root.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(p.mesh.position);
    if (target.alive && delta.length() < .72) { hit(target, p.damage, p.mesh.position.clone()); p.life = -1; }
    // Barriers intercept shots for their owner.
    for (const b of barriers) if (b.hero === target && b.life > 0 && Math.abs(p.mesh.position.x - b.mesh.position.x) < 1.45 && Math.abs(p.mesh.position.z - b.mesh.position.z) < .35 && p.mesh.position.y < 2.4) { burst(p.mesh.position, b.hero === player ? cyanMat : pinkMat, 3); p.life = -1; }
    if (p.life <= 0 || p.mesh.position.length() > 45) { scene.remove(p.mesh); scene.remove(p.streak); projectiles.splice(i, 1); }
  }
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.mesh.position.addScaledVector(p.velocity, dt); p.velocity.y -= 5 * dt; p.mesh.scale.multiplyScalar(.94); if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); } }
  for (let i = barriers.length - 1; i >= 0; i--) { const b = barriers[i]; b.life -= dt; b.mesh.position.x = b.hero.root.position.x; b.mesh.position.z = b.hero.root.position.z - (b.hero === player ? .95 : -.95); b.mesh.rotation.y = b.hero.visual.rotation.y; b.mesh.material.opacity = Math.min(.38, b.life * .2); if (b.life <= 0) { scene.remove(b.mesh); barriers.splice(i, 1); } }
  // Use a steady, slightly elevated tactical camera so the full duel and arena cover stay legible.
  const camTarget = new THREE.Vector3(player.root.position.x * .17, 0, player.root.position.z * .13);
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTarget.x, .025); camera.position.z = THREE.MathUtils.lerp(camera.position.z, 23 + camTarget.z, .025); camera.lookAt(camTarget.x * .45, 0, camTarget.z * .45);
  updateHud();
}
function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, .04); lastTime = now;
  update(dt); renderer.render(scene, camera); requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); });

// Initial pointer position defaults toward the rival for immediate first input.
window.addEventListener('load', () => { aimPoint.copy(enemy.root.position); });
