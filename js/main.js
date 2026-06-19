import { MODELS, GENERIC_MISREADS } from './models.js?v=20260619-refactor4';
import { SoundEngine } from './sound.js?v=20260619-refactor4';
import { createScene } from './scene.js?v=20260619-refactor4';

const $ = (id) => document.getElementById(id);

let soundEnabled = true;
let spinEnabled = true;
let skyEnabled = true;
let scatterEnabled = false;

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
  const spec = $('spec');
  const btn = $('b-spec');
  const hidden = !spec?.classList.contains('hidden');
  spec?.classList.toggle('hidden', hidden);
  if (btn) btn.textContent = hidden ? '顯示說明' : '隱藏說明';
});

scene.boot();
