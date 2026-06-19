// ============================================================================
// scene.js — 3D 場景（three.js）
// ----------------------------------------------------------------------------
// HDRI 天空 sky sphere、霧面岩石材質、漂浮石陣（三層）、點擊互動（推+發光+音效+
// 誤讀字幕）、共鳴彩蛋，以及「活的族群」機制：石頭會緩慢地飄進來 / 飄出去。
// createScene({ models, sound, isSoundEnabled }) → 回傳控制 API 給 main.js 接 UI。
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const $ = (id) => document.getElementById(id);

// 族群參數
const INITIAL_UNIQUE = 12; // 開場先載入的模型種類數，其餘種類後續 lazy-load
const INITIAL_POP = 22;    // 開場建立的石頭數（用已載原型 clone 出密度）
const MIN_POP = 18;        // 族群下限
const MAX_POP = 28;        // 族群上限
const DRIFT_MS = 3400;  // 每隔多久換血一次（加 jitter）
const RES_TARGET = 18;  // 共鳴所需累積觸碰

export function createScene({ models, sound, isSoundEnabled = () => true }) {
  // ---- renderer / scene / camera ----
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xaecbe6, 0.006); // 淡藍空氣感（配 HDRI 白天）

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 600);
  camera.position.set(0, 3.4, 16);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.minDistance = 6; controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.26;
  controls.target.set(0, 2.2, 0);

  // ---- daylight lighting（配亮 HDRI 天空）----
  scene.add(new THREE.HemisphereLight(0xbcd6f0, 0x6b5a40, 0.6));
  const sun = new THREE.DirectionalLight(0xfff4e2, 2.3); sun.position.set(-6, 10, 6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55); fill.position.set(7, 3, -5); scene.add(fill);
  const warm = new THREE.PointLight(0xffd9a8, 30, 50); warm.position.set(0, 5, 7); scene.add(warm);

  // ---- HDRI sky sphere + environment ----
  const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  let skyTex = null, skyOn = true;
  new THREE.TextureLoader().load('assets/hdri/sky.png', (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    skyTex = t; scene.background = t;
    scene.environment = pmrem.fromEquirectangular(t).texture;
  });

  // ---- GLB 載入（meshopt + webp）----
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const protoCache = {};   // id -> { obj } 原型（lazy，載一次重用）
  const barI = document.querySelector('#bar i');

  function matte(mt) {
    if (!mt) return;
    mt.metalness = 0.0; mt.roughness = 0.97; mt.envMapIntensity = 0.35;
    if (mt.map) { mt.map.colorSpace = THREE.SRGBColorSpace; mt.color.set(0xffffff); }
    mt.needsUpdate = true;
  }
  function normalize(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);
    const s = 2.4 / (Math.max(size.x, size.y, size.z) || 1);
    const wrap = new THREE.Group();
    obj.position.sub(center); obj.scale.multiplyScalar(s); obj.position.multiplyScalar(s);
    wrap.add(obj);
    return wrap;
  }
  function loadModel(model) {
    if (protoCache[model.id]) return Promise.resolve(protoCache[model.id]);
    return new Promise((resolve) => {
      loader.load(model.glb, (gltf) => {
        const obj = gltf.scene;
        obj.traverse(c => { if (c.isMesh) {
          c.castShadow = c.receiveShadow = false;
          (Array.isArray(c.material) ? c.material : [c.material]).forEach(matte);
        }});
        const proto = { obj: normalize(obj) };
        protoCache[model.id] = proto;
        resolve(proto);
      }, undefined, (err) => { console.warn('load fail', model.id, err); resolve(null); });
    });
  }

  // 依原型做出一個（可換色的）實體
  function tintClone(proto, hue) {
    const g = proto.obj.clone(true);
    g.traverse(c => { if (c.isMesh) {
      const cloned = (Array.isArray(c.material) ? c.material : [c.material]).map(mt => {
        const nm = mt.clone();
        if (hue !== 0 && nm.color) { const hsl = { h: 0, s: 0, l: 0 }; nm.color.getHSL(hsl);
          nm.color.setHSL((hsl.h + hue + 1) % 1, Math.min(hsl.s * 1.05, 1), hsl.l); }
        nm.emissive = new THREE.Color(0x000000); return nm;
      });
      c.material = cloned.length === 1 ? cloned[0] : cloned;
    }});
    return g;
  }

  // 一個三層漂浮 home slot（近景腰高環 / 天空層小碎片 / 地面層）
  function makeSlot() {
    const roll = Math.random();
    let layer = 0; if (roll > 0.78) layer = 1; else if (roll > 0.64) layer = 2;
    const ang = Math.random() * Math.PI * 2;
    let r, y, sc;
    if (layer === 0) { r = 6.5 + Math.random() * 2.4; y = 1.4 + Math.random() * 2.6; sc = 0.9 + Math.random() * 0.7; }
    else if (layer === 1) { r = 4 + Math.random() * 7; y = 6.5 + Math.random() * 4; sc = 0.4 + Math.random() * 0.35; }
    else { r = 3 + Math.random() * 6; y = -0.4 + Math.random() * 0.6; sc = 1.0 + Math.random() * 0.8; }
    const home = new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r);
    const scatter = new THREE.Vector3((Math.random() - .5) * 30, (Math.random() * 16 - 1), (Math.random() - .5) * 30);
    return { home, scatter, layer, sc };
  }

  // ---- 族群 ----
  const stones = [];
  let scatterMode = false, spinFloat = true;

  function makeStone(proto, model, slot, entering) {
    const hue = Math.random() < 0.5 ? 0 : (Math.random() * 0.6 - 0.3);
    const mesh = tintClone(proto, hue);
    mesh.scale.setScalar(slot.sc);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    // 飄進來：從 home 外側遠方起步、fade 0→1；開場建立：直接就位
    const start = entering ? slot.home.clone().multiplyScalar(2.6).add(new THREE.Vector3((Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 6)) : slot.home.clone();
    mesh.position.copy(start);
    scene.add(mesh);
    stones.push({
      mesh, model, home: slot.home.clone(), scatter: slot.scatter, layer: slot.layer,
      baseScale: slot.sc, phase: Math.random() * Math.PI * 2,
      spin: new THREE.Vector3((Math.random() - .5) * 0.0016, (Math.random() - .5) * 0.0026, (Math.random() - .5) * 0.0016),
      vel: new THREE.Vector3(), glow: 0,
      state: entering ? 'in' : 'idle', fade: entering ? 0 : 1, escape: null,
    });
    updateCount();
  }

  async function spawnIn() {
    const model = models[(Math.random() * models.length) | 0];
    const proto = await loadModel(model);
    if (!proto) return;
    makeStone(proto, model, makeSlot(), true);
  }
  function driftOut() {
    const cands = stones.filter(s => s.state === 'idle');
    if (!cands.length) return;
    const st = cands[(Math.random() * cands.length) | 0];
    st.state = 'out';
    st.escape = st.mesh.position.clone().setY(st.mesh.position.y + 2).normalize().multiplyScalar(42);
  }
  function driftTick() {
    const alive = stones.filter(s => s.state !== 'out').length;
    if (alive <= MIN_POP) spawnIn();
    else if (alive >= MAX_POP) driftOut();
    else { Math.random() < 0.5 ? spawnIn() : driftOut(); }
  }

  function disposeStone(st) {
    scene.remove(st.mesh);
    st.mesh.traverse(c => { if (c.isMesh) {
      (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m?.dispose?.());
    } });
  }
  function updateCount() { const el = $('st-count'); if (el) el.textContent = stones.filter(s => s.state !== 'out').length; }

  // ---- 互動 ----
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  const subEl = $('subtitle'), subT = subEl?.querySelector('.t');
  let subTimer = null;
  function misread(text) {
    if (!subEl) return;
    subT.textContent = text; subEl.classList.add('show');
    clearTimeout(subTimer); subTimer = setTimeout(() => subEl.classList.remove('show'), 3000);
  }

  let touches = 0, resonanceFlash = 0;
  function poke(st, playSound = true) {
    const dir = st.mesh.position.clone().sub(camera.position).normalize(); dir.y += 0.25;
    st.vel.add(dir.multiplyScalar(0.9));
    st.spin.multiplyScalar(2.4); st.glow = 1.0;
    const pool = (st.model.misreads && st.model.misreads.length) ? st.model.misreads : GENERIC;
    misread(pool[(Math.random() * pool.length) | 0]);
    touches++;
    const tEl = $('st-touch'); if (tEl) tEl.textContent = touches;
    const rEl = $('st-res'); if (rEl) rEl.textContent = Math.min(100, Math.round(touches / RES_TARGET * 100)) + '%';
    if (playSound && isSoundEnabled()) {
      sound.start()
        .then(() => sound.hit(st.model.sound, st.layer === 1))
        .catch((err) => console.warn('sound start failed', err));
    }
    if (touches % RES_TARGET === 0) resonate();
  }
  function onPointer(e) {
    if (e.target.closest('#spec') || e.target.closest('#ctrl')) return;
    ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(stones.map(s => s.mesh), true)[0];
    if (hit) { let o = hit.object; while (o.parent && !stones.find(s => s.mesh === o)) o = o.parent;
      const st = stones.find(s => s.mesh === o); if (st && st.state !== 'out') poke(st); }
  }
  renderer.domElement.addEventListener('pointerdown', onPointer);

  function resonate() {
    resonanceFlash = 1.0;
    stones.forEach(st => { if (st.state !== 'out') { st.glow = 1.0; const d = st.mesh.position.clone().normalize(); st.vel.add(d.multiplyScalar(0.5)); } });
    sound.chime();
    misread('⟡ 共 鳴 ⟡  文明短暫地被聽懂了');
  }

  // 通用誤讀池（從 models.js 注入）
  let GENERIC = ['未能辨識的遺物'];
  function setGenericMisreads(arr) { if (arr && arr.length) GENERIC = arr; }

  // ---- animate ----
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    for (let i = stones.length - 1; i >= 0; i--) {
      const st = stones[i];
      const target = st.state === 'out' ? st.escape : (scatterMode ? st.scatter : st.home);
      const toT = target.clone().sub(st.mesh.position).multiplyScalar(st.state === 'out' ? 0.02 : 0.012);
      st.vel.add(toT); st.vel.multiplyScalar(0.94);
      st.mesh.position.add(st.vel.clone().multiplyScalar(dt * 60 * 0.016));
      if (spinFloat) {
        st.mesh.position.y += Math.sin(t * 0.6 + st.phase) * 0.0024 * 60 * dt;
        st.mesh.rotation.x += st.spin.x * 60 * dt; st.mesh.rotation.y += st.spin.y * 60 * dt; st.mesh.rotation.z += st.spin.z * 60 * dt;
      }
      st.spin.multiplyScalar(0.992);
      // 淡入 / 淡出
      if (st.state === 'in') { st.fade = Math.min(1, st.fade + dt / 1.6); if (st.fade >= 1) st.state = 'idle'; }
      else if (st.state === 'out') { st.fade -= dt / 2.2; if (st.fade <= 0.02) { disposeStone(st); stones.splice(i, 1); updateCount(); continue; } }
      // glow 發光（點擊）
      if (st.glow > 0) {
        st.glow *= 0.94;
        st.mesh.traverse(c => { if (c.isMesh) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => { if (m?.emissive) m.emissive.setRGB(st.glow * 0.9, st.glow * 0.55, st.glow * 0.2); }); });
      }
      st.mesh.scale.setScalar(st.baseScale * st.fade * (1 + st.glow * 0.12));
    }
    if (resonanceFlash > 0) { resonanceFlash *= 0.97; renderer.toneMappingExposure = 1.0 + resonanceFlash * 0.6; warm.color.setHSL((t * 0.1) % 1, 0.6, 0.6); }
    else renderer.toneMappingExposure += (1.0 - renderer.toneMappingExposure) * 0.05;
    controls.update();
    renderer.render(scene, camera);
  }
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  // ---- boot：先載少量種類、clone 出密度 → 啟動 animate + 族群換血 ----
  let driftTimer = null;
  async function boot() {
    const loadlog = $('loadlog');
    const initialModels = models.slice(0, INITIAL_UNIQUE);
    const loaded = [];
    let done = 0;
    for (const m of initialModels) {
      const proto = await loadModel(m);
      done++; if (barI) barI.style.width = (done / initialModels.length * 100) + '%';
      if (loadlog) loadlog.textContent = `已召喚：${m.label}（${done}/${initialModels.length}）`;
      if (proto) loaded.push({ proto, model: m });
    }
    for (let i = 0; i < INITIAL_POP && loaded.length; i++) {
      const pick = loaded[i] || loaded[(Math.random() * loaded.length) | 0];
      makeStone(pick.proto, pick.model, makeSlot(), false);
    }
    const ld = $('loader'); if (ld) { ld.style.opacity = '0'; setTimeout(() => ld.style.display = 'none', 800); }
    animate();
    const tick = () => { driftTick(); driftTimer = setTimeout(tick, DRIFT_MS + Math.random() * 2600); };
    driftTimer = setTimeout(tick, DRIFT_MS);
  }

  // ---- 控制 API（給 main.js 接按鈕）----
  return {
    boot,
    setSpin(on) { spinFloat = on; controls.autoRotate = on; },
    setScatter(on) { scatterMode = on; },
    setSky(on) { skyOn = on; scene.background = (on && skyTex) ? skyTex : new THREE.Color(0x0c0f15); },
    resonate,
    setGenericMisreads,
  };
}
