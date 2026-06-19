import { MODELS, GENERIC_MISREADS } from './models.js?v=20260619-refactor4';
import { SoundEngine } from './sound.js?v=20260619-refactor4';
import { createScene } from './scene.js?v=20260619-refactor4';

const $ = (id) => document.getElementById(id);

let soundEnabled = true;
let spinEnabled = true;
let skyEnabled = true;
let scatterEnabled = false;
let specTouched = false;

const AUTO_SPEC_COLLAPSE_MS = 5000;

const scene = createScene({
  models: MODELS,
  sound: SoundEngine,
  isSoundEnabled: () => soundEnabled,
});

scene.setGenericMisreads(GENERIC_MISREADS);

function toggleButton(id, on) {
  const btn = $(id);
  if (btn) btn.classList.toggle('on', on);
}

function setSpecHidden(hidden) {
  const spec = $('spec');
  const btn = $('b-spec');
  spec?.classList.toggle('hidden', hidden);
  if (btn) btn.textContent = hidden ? '顯示說明' : '隱藏說明';
}

$('b-spin')?.addEventListener('click', () => {
  spinEnabled = !spinEnabled;
  scene.setSpin(spinEnabled);
  toggleButton('b-spin', spinEnabled);
});

$('b-sky')?.addEventListener('click', () => {
  skyEnabled = !skyEnabled;
  scene.setSky(skyEnabled);
  toggleButton('b-sky', skyEnabled);
});

$('b-ring')?.addEventListener('click', () => {
  scatterEnabled = !scatterEnabled;
  scene.setScatter(scatterEnabled);
  toggleButton('b-ring', scatterEnabled);
});

$('b-sound')?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  SoundEngine.setMuted(!soundEnabled);
  toggleButton('b-sound', soundEnabled);
});

$('b-resonate')?.addEventListener('click', () => {
  scene.resonate();
});

$('b-spec')?.addEventListener('click', () => {
  specTouched = true;
  setSpecHidden(!$('spec')?.classList.contains('hidden'));
});

setTimeout(() => {
  if (!specTouched) setSpecHidden(true);
}, AUTO_SPEC_COLLAPSE_MS);

scene.boot();
