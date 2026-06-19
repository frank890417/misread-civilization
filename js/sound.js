// ============================================================================
// sound.js — 聲音系統（Tone.js）
// ----------------------------------------------------------------------------
// 中古教堂持續和絃床（D Dorian）+ 人聲合唱 + 聖詠旋律（凸顯第 6 音 ti=B）
// + 偶現鐘聲 + glitch 人聲扭曲 + 每物件不同音色 + 小石頭「碎碎」音粒。
// 全程 ADSR。首次互動（真實點擊）才 SoundEngine.start() 解鎖 AudioContext。
// 對外 API：start() / hit(soundDef, layerUp) / crumble() / chime() / setMuted() / isStarted()
// ============================================================================
import * as Tone from 'tone';

// D Dorian：中古調式。大六度 ti(B) 是 Dorian 招牌＝教堂感來源；b7(C) 是次要色。
const DORIAN = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];
// 以 D 為中心的和聲，每個和絃都含第 6 音 ti(B)（哲宇的 re-fa-la-do + ti）
const PROG = [
  ['D3', 'A3', 'F4', 'B4'],   // Dm6 — re fa la + 第6音 ti(B)
  ['D3', 'A3', 'B4', 'C5'],   // Dm6/7 — 6(B) + 7(C) 一起＝Dorian 全色
  ['G3', 'D4', 'F4', 'B4'],   // IV 色，B 持續
  ['A3', 'E4', 'F4', 'B4'],   // v 色，B 持續
];
// 聖詠動機：D Dorian 級數 2-4-6-6-[7]-6-5-6 → E G B B C B A B；[7]=C 拉長加重
const CHANT = ['E4', 'G4', 'B4', 'B4', 'C5', 'B4', 'A4', 'B4'];

export const SoundEngine = (() => {
  let started = false, muted = false;
  let startPromise = null;
  let busGain, reverb, padFilter, pad, drone, emerge, choir, cantor, glitchSynth, grain, eq;
  const voices = {};            // voiceId -> Tone instrument（lazy）
  let chordIdx = 0;

  // 每物件音色（皆獨立 ADSR）
  function makeVoice(id) {
    let v;
    switch (id) {
      case 'glass':     v = new Tone.FMSynth({ harmonicity: 2.5, modulationIndex: 7, oscillator: { type: 'sine' }, envelope: { attack: 0.004, decay: 1.4, sustain: 0.05, release: 1.8 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 }, volume: -12 }); break;
      case 'glassSoft': v = new Tone.FMSynth({ harmonicity: 1.5, modulationIndex: 4, envelope: { attack: 0.02, decay: 1.0, sustain: 0.1, release: 2.2 }, volume: -13 }); break;
      case 'marimba':   v = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.5, sustain: 0.0, release: 0.6 }, volume: -8 }); break;
      case 'metal':     v = new Tone.MetalSynth({ harmonicity: 4.1, resonance: 1200, octaves: 1.2, envelope: { attack: 0.002, decay: 1.1, release: 0.6 }, volume: -26 }); break;
      case 'pluck':     v = new Tone.PluckSynth({ attackNoise: 1.2, dampening: 2600, resonance: 0.92, volume: -4 }); break;
      case 'organLow':  v = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.04, decay: 0.6, sustain: 0.5, release: 2.4 }, volume: -16 }); break;
      case 'am':        v = new Tone.AMSynth({ harmonicity: 2.0, envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.6 }, volume: -12 }); break;
      case 'air':       v = new Tone.MonoSynth({ oscillator: { type: 'triangle' }, filter: { Q: 0.8, type: 'lowpass' }, filterEnvelope: { attack: 0.08, decay: 0.4, sustain: 0.1, release: 1.4, baseFrequency: 380, octaves: 1.6 }, envelope: { attack: 0.06, decay: 0.6, sustain: 0.05, release: 1.6 }, volume: -19 }); break;
      case 'duo':       v = new Tone.DuoSynth({ vibratoAmount: 0.3, harmonicity: 1.5, voice0: { envelope: { attack: 0.05, decay: 0.4, sustain: 0.3, release: 1.5 } }, voice1: { envelope: { attack: 0.08, decay: 0.4, sustain: 0.3, release: 1.5 } }, volume: -18 }); break;
      case 'bellLow':   v = new Tone.FMSynth({ harmonicity: 1.41, modulationIndex: 5, envelope: { attack: 0.005, decay: 2.2, sustain: 0, release: 2.4 }, volume: -10 }); break;
      default:          v = new Tone.Synth({ volume: -10 });
    }
    return v.connect(busGain);
  }

  async function start() {
    if (started) return startPromise;
    if (startPromise) return startPromise;

    startPromise = (async () => {
      await Tone.start();
      Tone.Transport.bpm.value = 52;

      const limiter = new Tone.Limiter(-1).toDestination();
      reverb = new Tone.Reverb({ decay: 11, preDelay: 0.05, wet: 0.5 }).connect(limiter);
      try { await reverb.ready; } catch (e) {}
      // 主鏈高頻整體削減（去掉三角/方波的尖銳）
      eq = new Tone.EQ3({ low: 0, mid: -1, high: -5, lowFrequency: 250, highFrequency: 3500 }).connect(reverb);
      busGain = new Tone.Gain(0.8).connect(eq);

      // 1. 教堂和絃床（柔鋸齒 → 低通 → 慢 ADSR）
      padFilter = new Tone.Filter(1200, 'lowpass').connect(busGain);
      pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 2.6, decay: 1.6, sustain: 0.85, release: 5.4 }, volume: -22 }).connect(padFilter);

      // 2. organum 開五度低音持音（管風琴踏板）
      drone = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 3.5, decay: 1, sustain: 1, release: 7 }, volume: -19 }).connect(busGain);
      drone.triggerAttack(['D2', 'A2']);

      // 3. 人聲合唱 pad（fat 失諧鋸齒 → 母音 formant → chorus + vibrato）
      const choirChorus = new Tone.Chorus({ frequency: 1.1, delayTime: 4, depth: 0.8, wet: 0.6 }).start();
      const choirVib = new Tone.Vibrato({ frequency: 5.2, depth: 0.07 });
      const choirFormant = new Tone.Filter({ type: 'bandpass', frequency: 950, Q: 0.7 });
      choir = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 28 }, envelope: { attack: 2.2, decay: 1.4, sustain: 0.85, release: 4.5 }, volume: -23 });
      choir.chain(choirFormant, choirVib, choirChorus, busGain);

      // 4. 聖詠旋律 cantor（人聲線唱 CHANT）
      const cantorChorus = new Tone.Chorus({ frequency: 0.8, delayTime: 3, depth: 0.5, wet: 0.4 }).start();
      cantor = new Tone.MonoSynth({ oscillator: { type: 'sawtooth' }, filter: { type: 'bandpass', Q: 1.4 }, filterEnvelope: { attack: 0.25, decay: 0.4, sustain: 0.7, release: 1.0, baseFrequency: 600, octaves: 2.2 }, envelope: { attack: 0.35, decay: 0.5, sustain: 0.85, release: 1.4 }, volume: -13 });
      cantor.chain(cantorChorus, busGain);

      // 5. 偶現鐘聲（稀疏 sparkle）
      emerge = new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 6, envelope: { attack: 0.004, decay: 1.8, sustain: 0, release: 2.0 }, volume: -18 }).connect(busGain);

      // 6. glitch 人聲（母音方波 → bitcrush → 低通圓滑，stutter 爆發＝AI 誤讀扭曲）
      const glitchFormant = new Tone.Filter({ type: 'bandpass', frequency: 1000, Q: 1.0 });
      const glitchCrush = new Tone.BitCrusher(5);
      const glitchTame = new Tone.Filter({ type: 'lowpass', frequency: 3000, Q: 0.5 });
      glitchSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 }, volume: -18 });
      glitchSynth.chain(glitchFormant, glitchCrush, glitchTame, busGain);

      // 7. 碎碎音粒（碰小石頭 → 快速連續小音粒，過低通不刺）
      const grainTame = new Tone.Filter({ type: 'lowpass', frequency: 3000, Q: 0.5 });
      grain = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 }, volume: -15 });
      grain.chain(grainTame, busGain);

      // ===== 排程 =====
      // 和絃 + 合唱同步走 PROG（合唱唱上三聲位，含 ti）
      new Tone.Loop((time) => { if (muted) return;
        const chord = PROG[chordIdx];
        pad.triggerAttackRelease(chord, '2m', time, 0.62);
        choir.triggerAttackRelease(chord.slice(-3), '2m', time, 0.55);
        chordIdx = (chordIdx + 1) % PROG.length;
      }, '2m').start(0);

      // 聖詠旋律（CHANT，[7]=C5 拉長加重）
      new Tone.Sequence((time, note) => { if (muted) return;
        const seven = (note === 'C5');
        cantor.triggerAttackRelease(note, seven ? '1n' : '2n', time, seven ? 1.0 : 0.72);
      }, CHANT, '2n').start('1m');

      // sparkle（稀疏）
      const eLoop = new Tone.Loop((time) => { if (muted) return;
        const n = DORIAN[(Math.random() * 7) | 0] + (4 + ((Math.random() * 3) | 0));
        emerge.triggerAttackRelease(n, '4n', time, 0.4 + Math.random() * 0.3);
      }, '2n'); eLoop.probability = 0.16; eLoop.humanize = true; eLoop.start('2m');

      // glitch 爆發（偶發 stutter）
      const gLoop = new Tone.Loop((time) => { if (muted) return;
        const base = CHANT[(Math.random() * CHANT.length) | 0];
        const reps = 5 + (Math.random() * 7 | 0);
        for (let i = 0; i < reps; i++) {
          const t = time + i * 0.045 * (0.6 + Math.random());
          const semis = [0, 0, 12, -12, 7, 5, -5, 3][(Math.random() * 8) | 0];
          glitchSynth.triggerAttackRelease(Tone.Frequency(base).transpose(semis), '32n', t, 0.4 + Math.random() * 0.4);
        }
      }, '1m'); gLoop.probability = 0.4; gLoop.humanize = true; gLoop.start('4m');

      Tone.Transport.start();
      started = true;
    })();

    return startPromise;
  }

  // 點擊物件 → 播放該物件音色。soundDef = { voice, note }
  function hit(soundDef, layerUp) {
    if (!started || muted || !soundDef) return;
    const v = voices[soundDef.voice] || (voices[soundDef.voice] = makeVoice(soundDef.voice));
    let note = soundDef.note;
    if (layerUp) { // 天空層小碎片 → 高八度更清亮
      const m = note.match(/([A-G]#?)(\d)/); if (m) note = m[1] + Math.min(7, +m[2] + 1);
    }
    try {
      const dur = (soundDef.voice === 'marimba' || soundDef.voice === 'pluck' || soundDef.voice === 'metal') ? '8n' : '2n';
      v.triggerAttackRelease(note, dur, undefined, 0.85);
      if (layerUp) crumble();   // 小石頭 → 額外快速碎碎音粒
    } catch (e) { console.warn('voice err', soundDef.voice, e); }
  }

  // 碎碎：快速連續的小音粒（碰小石頭觸發）
  function crumble() {
    if (!started || muted || !grain) return;
    const reps = 9 + (Math.random() * 8 | 0);   // 9–16 顆
    for (let i = 0; i < reps; i++) {
      const note = DORIAN[(Math.random() * 7) | 0] + (5 + ((Math.random() * 2) | 0));
      const t = `+${(i * 0.032 * (0.7 + Math.random() * 0.7)).toFixed(3)}`;
      grain.triggerAttackRelease(note, '32n', t, 0.3 + Math.random() * 0.4);
    }
  }

  function chime() { // 共鳴：合唱湧現 + 鐘聲撒一把和絃
    if (!started) return;
    const chord = PROG[chordIdx];
    if (choir) choir.triggerAttackRelease(chord, '1n', undefined, 0.75);
    if (emerge) chord.forEach((n, i) => emerge.triggerAttackRelease(n, '2n', '+' + (i * 0.08), 0.6));
  }

  function setMuted(m) { muted = m; if (busGain) busGain.gain.rampTo(m ? 0 : 0.8, 0.4); }

  return { start, hit, crumble, chime, setMuted, isStarted: () => started };
})();
