'use strict';
// ===== サウンド (WebAudioで効果音とチップチューンBGMを生成) =====
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteFreq(n) {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  if (!m) return 0;
  const midi = (parseInt(m[2]) + 1) * 12 + NOTE_IDX[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
const BGM = {
  title: { bpm: 120, lead: 'C6 G5 E5 G5 C6 G5 E5 G5 | D6 A5 F5 A5 D6 A5 F5 A5 | E6 B5 G5 B5 E6 B5 G5 B5 | F6 C6 A5 C6 G6 D6 B5 D6', bass: 'C3 - - - - - - - | D3 - - - - - - - | E3 - - - - - - - | F3 - - - G3 - - -', wave: 'triangle' },
  field: { bpm: 132, lead: 'E5 - G5 - C6 - B5 A5 | G5 - E5 - C5 - D5 E5 | F5 - A5 - D6 - C6 B5 | C6 - - - G5 - - - | A5 - C6 - F6 - E6 D6 | C6 - A5 - G5 - E5 - | F5 - E5 - D5 - G5 - | C5 - - - . - - -', bass: 'C3 . G3 . C3 . G3 . | C3 . G3 . C3 . G3 . | F3 . C4 . F3 . C4 . | C3 . G3 . E3 . G3 . | F3 . C4 . F3 . C4 . | A2 . E3 . A2 . E3 . | D3 . A3 . G2 . D3 . | C3 . G3 . C3 . . .' },
  town: { bpm: 100, lead: 'A4 - C5 - F5 - E5 - | D5 - C5 - A4 - - - | Bb4 - D5 - G5 - F5 - | E5 - C5 - - - - - | A4 - C5 - F5 - A5 - | G5 - F5 - E5 - D5 - | C5 - E5 - G5 - E5 - | F5 - - - - - - -', bass: 'F3 . C4 . F3 . C4 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | F3 . C4 . F3 . C4 . | Bb2 . F3 . Bb2 . F3 . | C3 . G3 . C3 . G3 . | F3 . C4 . F3 . . .', wave: 'triangle' },
  dungeon: { bpm: 92, lead: 'A4 - - C5 B4 - E4 - | A4 - - C5 D5 - E5 - | F5 - E5 - D5 - C5 - | B4 - - - E4 - - - | A4 - - C5 B4 - G4 - | F4 - A4 - D5 - - - | E5 - D5 - C5 - B4 - | A4 - - - . - - -', bass: 'A2 . E3 . A2 . E3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | D2 . A2 . D2 . A2 . | E2 . B2 . E2 . G#2 . | A2 . E3 . A2 . . .' },
  battle: { bpm: 168, lead: 'E5 E5 . E5 G5 . A5 . | B5 - A5 - G5 - E5 - | D5 D5 . D5 F#5 . G5 . | A5 - G5 - F#5 - D5 - | C5 C5 . C5 E5 . G5 . | B5 - A5 - G5 - A5 - | B5 - - - D6 - B5 - | E6 - - - - - - -', bass: 'E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2 | B1 B2 B1 B2 D2 D3 D#2 D#3' },
  boss: { bpm: 176, lead: 'D5 . D5 F5 . D5 A5 . | G#5 - A5 - . - - - | D5 . D5 F5 . D5 C6 . | A#5 - A5 - . - - - | F5 . F5 G5 . F5 A5 . | A#5 - C6 - D6 - A5 - | G5 - F5 - E5 - C#5 - | D5 - - - . - - -', bass: 'D2 D2 D3 D2 D2 D3 D2 D3 | D2 D2 D3 D2 D2 D3 D2 D3 | A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2 | A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2 | G1 G1 G2 G1 G1 G2 G1 G2 | G1 G1 G2 G1 G1 G2 G1 G2 | A1 A1 A2 A1 A1 A2 A1 A2 | A1 A1 A2 A1 C#2 C#3 E2 E3' },
  gacha: { bpm: 140, lead: 'C6 E6 G6 E6 C6 E6 G6 C7 | B5 D6 G6 D6 B5 D6 G6 B6 | A5 C6 F6 C6 A5 C6 F6 A6 | G5 B5 D6 G6 F6 D6 B5 G5', bass: 'C3 - G3 - C3 - G3 - | G2 - D3 - G2 - D3 - | F2 - C3 - F2 - C3 - | G2 - D3 - G2 - B2 -', wave: 'triangle' },
};
const JINGLE = {
  win: { bpm: 180, lead: 'C5 C5 C5 C5 . Ab4 . Bb4 . C5 - Bb4 C5 - - - - - - -', bass: 'C3 C3 C3 C3 . Ab2 . Bb2 . C3 - - - - - - - - - -' },
  fanfare: { bpm: 150, lead: 'G5 - G5 G5 C6 - - - E6 - D6 C6 D6 - E6 - C6 - - - - - - -', bass: 'C3 - - - E3 - - - G3 - - - G2 - - - C3 - - - - - - -' },
};

const Sound = {
  ctx: null, master: null, bgmGain: null, sfxGain: null,
  enabled: true, music: true,
  cur: null, seq: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain(); this.bgmGain.gain.value = this.music ? 0.32 : 0; this.bgmGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.6; this.sfxGain.connect(this.master);
      if (this.pending) { const p = this.pending; this.pending = null; this.bgm(p); }
    } catch (e) { this.ctx = null; }
  },
  setMusic(on) { this.music = on; if (this.bgmGain) this.bgmGain.gain.value = on ? 0.32 : 0; },
  setSfx(on) { this.enabled = on; },
  tone(freq, t0, dur, type = 'square', vol = 0.3, slide = 0, dest) {
    const c = this.ctx; if (!c || !freq) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(t0, dur, vol = 0.3, hp = 800) {
    const c = this.ctx; if (!c) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t0);
  },
  play(name) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'cursor': this.tone(880, t, 0.04, 'square', 0.12); break;
      case 'ok': this.tone(660, t, 0.05, 'square', 0.15); this.tone(990, t + 0.05, 0.07, 'square', 0.15); break;
      case 'cancel': this.tone(440, t, 0.06, 'square', 0.13); this.tone(330, t + 0.05, 0.07, 'square', 0.12); break;
      case 'buzz': this.tone(140, t, 0.15, 'sawtooth', 0.15); break;
      case 'step': this.tone(200, t, 0.03, 'triangle', 0.05); break;
      case 'push': this.noise(t, 0.12, 0.25, 300); this.tone(110, t, 0.12, 'triangle', 0.2); break;
      case 'hit': this.noise(t, 0.1, 0.35, 1200); this.tone(220, t, 0.08, 'square', 0.18, 0.5); break;
      case 'crit': this.noise(t, 0.16, 0.45, 900); this.tone(440, t, 0.12, 'square', 0.2, 0.3); this.tone(880, t + 0.04, 0.1, 'square', 0.15, 0.4); break;
      case 'magic': for (let i = 0; i < 5; i++) this.tone(600 + i * 180, t + i * 0.035, 0.09, 'triangle', 0.15); break;
      case 'fire': this.noise(t, 0.35, 0.3, 400); this.tone(300, t, 0.3, 'sawtooth', 0.12, 0.4); break;
      case 'ice': for (let i = 0; i < 6; i++) this.tone(1400 + i * 120, t + i * 0.03, 0.07, 'sine', 0.12); break;
      case 'heal': for (let i = 0; i < 4; i++) this.tone([523, 659, 784, 1046][i], t + i * 0.07, 0.15, 'sine', 0.16); break;
      case 'buff': this.tone(400, t, 0.2, 'triangle', 0.15, 2); break;
      case 'debuff': this.tone(600, t, 0.2, 'triangle', 0.15, 0.5); break;
      case 'damage': this.noise(t, 0.12, 0.3, 500); this.tone(160, t, 0.15, 'square', 0.2, 0.5); break;
      case 'die': this.tone(400, t, 0.4, 'square', 0.15, 0.2); break;
      case 'escape': for (let i = 0; i < 4; i++) this.tone(800 - i * 120, t + i * 0.05, 0.06, 'square', 0.12); break;
      case 'chest': this.tone(523, t, 0.08, 'square', 0.15); this.tone(659, t + 0.08, 0.08, 'square', 0.15); this.tone(784, t + 0.16, 0.08, 'square', 0.15); this.tone(1046, t + 0.24, 0.25, 'square', 0.15); break;
      case 'switch': this.tone(300, t, 0.06, 'square', 0.15); this.tone(600, t + 0.06, 0.1, 'square', 0.15); break;
      case 'gate': this.noise(t, 0.4, 0.25, 200); this.tone(90, t, 0.4, 'sawtooth', 0.15, 0.6); break;
      case 'save': for (let i = 0; i < 6; i++) this.tone(523 * Math.pow(2, i / 6), t + i * 0.06, 0.2, 'sine', 0.13); break;
      case 'encounter': for (let i = 0; i < 8; i++) this.tone(300 + (i % 2) * 300 + i * 40, t + i * 0.04, 0.05, 'square', 0.14); break;
      case 'levelup': for (let i = 0; i < 6; i++) this.tone([523, 659, 784, 1046, 784, 1046][i], t + i * 0.08, 0.12, 'square', 0.14); break;
      case 'orb': this.tone(200, t, 0.6, 'sine', 0.2, 4); break;
      case 'star3': this.tone(880, t, 0.25, 'triangle', 0.18); break;
      case 'star4': for (let i = 0; i < 3; i++) this.tone([784, 988, 1175][i], t + i * 0.08, 0.25, 'triangle', 0.18); break;
      case 'star5': for (let i = 0; i < 8; i++) this.tone([523, 659, 784, 1046, 1318, 1568, 2093, 2637][i], t + i * 0.06, 0.4, 'triangle', 0.16); this.noise(t + 0.4, 0.6, 0.15, 3000); break;
      case 'puzzle': for (let i = 0; i < 5; i++) this.tone([392, 523, 659, 784, 1046][i], t + i * 0.09, 0.2, 'square', 0.14); break;
    }
  },
  parse(s) { return s.replace(/\|/g, ' ').trim().split(/\s+/); },
  bgm(name) {
    if (name === this.cur) return;
    if (!this.ctx) { this.pending = name; this.cur = null; return; }
    this.stopBgm();
    this.cur = name;
    const tr = BGM[name];
    if (!tr) return;
    this.startSeq(tr, true);
  },
  jingle(name, then) {
    if (!this.ctx) return;
    this.stopBgm();
    this.cur = null;
    this.startSeq(JINGLE[name], false, () => { if (then) this.bgm(then); });
  },
  startSeq(tr, loop, onEnd) {
    const lead = this.parse(tr.lead), bass = this.parse(tr.bass);
    const step = 60 / tr.bpm / 2;
    const len = Math.max(lead.length, bass.length);
    const self = this;
    const seq = { i: 0, t: this.ctx.currentTime + 0.05, stop: false };
    const durOf = (arr, i) => { let d = 1; while (arr[(i + d) % arr.length] === '-' && d < 16 && (loop || i + d < arr.length)) d++; return d; };
    const tick = () => {
      if (seq.stop || !self.ctx) return;
      const ahead = self.ctx.currentTime + 0.25;
      while (seq.t < ahead) {
        const i = seq.i;
        if (!loop && i >= len) { seq.stop = true; setTimeout(() => onEnd && onEnd(), 300); return; }
        const li = i % lead.length, bi = i % bass.length;
        const ln = lead[li], bn = bass[bi];
        if (ln && ln !== '-' && ln !== '.') self.tone(noteFreq(ln), seq.t, step * durOf(lead, li) * 0.92, tr.wave || 'square', 0.18, 0, self.bgmGain);
        if (bn && bn !== '-' && bn !== '.') self.tone(noteFreq(bn), seq.t, step * durOf(bass, bi) * 0.9, 'triangle', 0.32, 0, self.bgmGain);
        seq.t += step; seq.i++;
      }
      seq.timer = setTimeout(tick, 60);
    };
    this.seq = seq;
    tick();
  },
  stopBgm() { if (this.seq) { this.seq.stop = true; clearTimeout(this.seq.timer); this.seq = null; } },
};
