'use strict';
// ===== 冒険の暮らし: 昼夜と天候・採集・釣り・料理・図鑑と実績 =====

// ---------- 食材・料理 (ITEMS に追加。cat: food=食材 / dish=料理) ----------
ITEM_CATS.splice(3, 0, ['food', '食材'], ['dish', '料理']);
const FOODS = {
  herb: { n: '薬草', desc: '草原や森で採れる。スープの材料' },
  mushroom: { n: '森キノコ', desc: '森で採れる香りのよいキノコ' },
  berry: { n: '森のベリー', desc: '甘ずっぱい木の実' },
  wheat: { n: '野生の麦', desc: '草原で採れる。お菓子の材料' },
  spice: { n: '砂漠のスパイス', desc: '砂漠で採れる。カレーに欠かせない' },
  cactusfruit: { n: 'サボテンの実', desc: 'みずみずしい砂漠の果実' },
  snowberry: { n: '雪いちご', desc: '雪原に実る冷たいいちご' },
  firepepper: { n: '火炎唐辛子', desc: '火山地帯の激辛唐辛子' },
  coconut: { n: 'ココナッツ', desc: '南国の島々で採れる' },
  crystalsalt: { n: '星の塩', desc: '水晶の荒野で採れる、きらきら光る塩' },
  cloudcotton: { n: '雲わた', desc: '空の大陸で採れる、ふわふわの甘い雲' },
  skyhoney: { n: '天空はちみつ', desc: '空の大陸の花から採れる蜜' },
  moonherb: { n: '月光草', desc: '夜にしか光らない珍しい草' },
};
// 魚 (water: lake=川や湖 / sea=海 / cloud=雲海、time: night=夜だけ day=昼だけ、weather: その天気のときだけ)
const FISH = {
  ayu: { n: 'アユ', water: 'lake', rar: 1, desc: '川や湖でよく釣れる' },
  trout: { n: 'ニジマス', water: 'lake', rar: 1, desc: '川や湖で釣れる' },
  catfish: { n: 'ナマズ', water: 'lake', rar: 2, time: 'night', desc: '夜の湖に出る大物' },
  goldkoi: { n: '黄金ゴイ', water: 'lake', rar: 3, weather: 'rain', desc: '雨の日にだけ姿を見せる幻のコイ' },
  icefish: { n: '氷魚', water: 'lake', rar: 2, area: 'snow', desc: '雪原の冷たい水で釣れる' },
  aji: { n: 'アジ', water: 'sea', rar: 1, desc: '海でよく釣れる' },
  tai: { n: 'タイ', water: 'sea', rar: 2, desc: 'おめでたい海の魚' },
  squid: { n: 'イカ', water: 'sea', rar: 2, time: 'night', desc: '夜の海で釣れる' },
  tuna: { n: 'マグロ', water: 'sea', rar: 3, desc: '海の王様。めったに釣れない' },
  starslug: { n: '星ウミウシ', water: 'sea', rar: 3, time: 'night', area: 'island', desc: '南国の夜の海に光るウミウシ' },
  crystalfish: { n: 'クリスタルフィッシュ', water: 'sea', rar: 2, area: 'crystal', desc: '水晶の荒野の海で釣れる透明な魚' },
  cloudfish: { n: 'クモウオ', water: 'cloud', rar: 1, desc: '雲海を泳ぐふわふわの魚' },
  thunderfish: { n: 'カミナリウオ', water: 'cloud', rar: 2, weather: 'wind', desc: '風の強い日に雲海で釣れる' },
  skywhale: { n: 'ソラクジラの子', water: 'cloud', rar: 3, time: 'night', desc: '夜の雲海にあらわれる伝説の魚' },
};
// 料理。heal: 回復量(戦闘中も使える) / buff: 食べると次の3回の戦闘で効果
const MEAL_BATTLES = 3;
const RECIPES = {
  herbsoup: { n: '薬草スープ', need: { herb: 2 }, heal: 300, desc: 'HPを300回復' },
  grilledfish: { n: '焼き魚', need: { fish1: 1, herb: 1 }, heal: 600, desc: 'HPを600回復' },
  mushstew: { n: 'キノコシチュー', need: { mushroom: 2, herb: 1 }, heal: 900, desc: 'HPを900回復' },
  paella: { n: '海鮮パエリア', need: { tai: 1, squid: 1, spice: 1 }, heal: 2000, desc: 'HPを2000回復' },
  berrytart: { n: 'ベリータルト', need: { berry: 2, wheat: 1 }, buff: { block: 20 }, desc: '戦闘開始時にブロック20' },
  curry: { n: '激辛カレー', need: { firepepper: 1, spice: 1, herb: 1 }, buff: { str: 2 }, desc: '戦闘開始時に筋力+2' },
  sorbet: { n: '雪いちごシャーベット', need: { snowberry: 2 }, buff: { dex: 2 }, desc: '戦闘開始時に敏捷+2' },
  pudding: { n: 'ココナッツプリン', need: { coconut: 1, skyhoney: 1 }, buff: { regen: 6 }, desc: '戦闘開始時に再生6' },
  saltgrill: { n: '星塩焼き', need: { crystalsalt: 1, fish2: 1 }, buff: { draw: 2, energy: 1 }, desc: '最初のターン、カードを2枚多く引きエナジー+1' },
  kabayaki: { n: 'ナマズの蒲焼き', need: { catfish: 1, spice: 1 }, buff: { thorns: 4 }, desc: '戦闘開始時にトゲ4' },
  cloudcake: { n: '雲のケーキ', need: { cloudcotton: 2, berry: 1, wheat: 1 }, buff: { ult: 6 }, desc: '戦闘開始時に奥義ゲージ+6' },
  moonsalad: { n: '月光サラダ', need: { moonherb: 1, herb: 1, cactusfruit: 1 }, buff: { str: 1, dex: 1, regen: 3 }, desc: '戦闘開始時に筋力+1・敏捷+1・再生3' },
  feast: { n: '黄金のごちそう', need: { goldkoi: 1, tuna: 1, skyhoney: 1 }, buff: { str: 3, dex: 2, energy: 1, ult: 6 }, desc: '筋力+3・敏捷+2・最初のエナジー+1・奥義ゲージ+6' },
};
// 料理の材料の「どの魚でもOK」: fish1 = ふつうの魚 / fish2 = 少しめずらしい魚
const FISH_ANY = { fish1: ['ayu', 'trout', 'aji', 'cloudfish', 'icefish'], fish2: ['tai', 'crystalfish', 'thunderfish', 'trout', 'catfish'] };
const ANY_N = { fish1: 'ふつうの魚', fish2: 'めずらしい魚' };
for (const k in FOODS) ITEMS[k] = { n: FOODS[k].n, cat: 'food', price: 0, type: 'none', desc: FOODS[k].desc };
for (const k in FISH) ITEMS[k] = { n: FISH[k].n, cat: 'food', price: 0, type: 'none', desc: '魚。' + FISH[k].desc };
for (const k in RECIPES) { const r = RECIPES[k]; ITEMS['d_' + k] = r.heal ? { n: r.n, cat: 'dish', price: 0, type: 'heal', amt: r.heal, desc: r.desc + ' (戦闘中も使える)', bdesc: r.desc } : { n: r.n, cat: 'dish', price: 0, type: 'buff', desc: `食べると次の${MEAL_BATTLES}回の戦闘で: ${r.desc}` }; }

// 採集ポイントの食材 (エリアごと)
const GATHER = {
  meadow: [['herb', 5], ['wheat', 4], ['berry', 1]], forest: [['mushroom', 4], ['berry', 3], ['herb', 2]],
  desert: [['spice', 4], ['cactusfruit', 3]], snow: [['snowberry', 4], ['herb', 1]], volcano: [['firepepper', 4], ['spice', 1]],
  island: [['coconut', 4], ['berry', 1]], crystal: [['crystalsalt', 4], ['herb', 1]], sky: [['cloudcotton', 4], ['skyhoney', 3]],
};

// ---------- 天気 ----------
const WEATHER = {
  clear: { n: '晴れ', i: '☀' }, cloudy: { n: 'くもり', i: '☁' }, rain: { n: '雨', i: '☂' }, snow: { n: '雪', i: '❄' },
  sandstorm: { n: '砂嵐', i: '🌪' }, ash: { n: '火山灰', i: '🌋' }, aurora: { n: 'オーロラ', i: '✦' }, wind: { n: '強風', i: '🍃' },
};
const AREA_WEATHER = {
  meadow: ['clear', 'clear', 'cloudy', 'rain'], forest: ['clear', 'cloudy', 'rain', 'rain'], desert: ['clear', 'clear', 'clear', 'sandstorm'],
  snow: ['snow', 'snow', 'clear', 'cloudy'], volcano: ['clear', 'ash', 'ash', 'cloudy'], island: ['clear', 'clear', 'rain', 'cloudy'],
  crystal: ['clear', 'aurora', 'clear', 'cloudy'], sky: ['clear', 'clear', 'wind', 'wind'],
};

// ---------- 実績 ----------
const ACHIEVEMENTS = [
  { id: 'kill50', n: '駆け出しの冒険者', desc: '魔物を50体倒す', cond: () => Life.kills() >= 50, stones: 100 },
  { id: 'kill500', n: '歴戦の勇者', desc: '魔物を500体倒す', cond: () => Life.kills() >= 500, stones: 300 },
  { id: 'kill2000', n: '伝説の狩人', desc: '魔物を2000体倒す', cond: () => Life.kills() >= 2000, stones: 1000 },
  { id: 'seen30', n: '魔物博士', desc: '魔物を30種類見つける', cond: () => Object.keys(G.seen || {}).length >= 30, stones: 200 },
  { id: 'night5', n: '夜ふかし', desc: '夜にしか出ない魔物を5種類倒す', cond: () => NIGHT_ENEMIES.filter(k => (G.kills || {})[k]).length >= 5, stones: 300 },
  { id: 'fish1', n: 'はじめての一匹', desc: '魚を釣る', cond: () => Life.fishTotal() >= 1, stones: 50 },
  { id: 'fish10', n: '釣り好き', desc: '魚を10種類釣る', cond: () => Object.keys(G.fishLog || {}).length >= 10, stones: 300 },
  { id: 'fishall', n: '釣り名人', desc: '魚をすべての種類釣る', cond: () => Object.keys(FISH).every(k => (G.fishLog || {})[k]), stones: 1000 },
  { id: 'gather30', n: '採集上手', desc: '採集を30回する', cond: () => (G.gatherCount || 0) >= 30, stones: 150 },
  { id: 'cook1', n: 'はじめての料理', desc: '料理を作る', cond: () => Object.keys(G.cooked || {}).length >= 1, stones: 50 },
  { id: 'cookall', n: '天才シェフ', desc: '料理をすべての種類作る', cond: () => Object.keys(RECIPES).every(k => (G.cooked || {})[k]), stones: 1000 },
  { id: 'chars10', n: '仲間がいっぱい', desc: '仲間を10人集める', cond: () => Object.keys(G.roster).length >= 10, stones: 200 },
  { id: 'charsall', n: '星の絆', desc: 'ガチャの仲間を全員集める', cond: () => Object.keys(CHARS).filter(k => CHARS[k].gacha || CHARS[k].limited).every(k => G.roster[k]), stones: 2000 },
  { id: 'bond10', n: '心をかよわせて', desc: 'だれかの絆レベルを10にする', cond: () => secretOn() && Object.values(G.roster).some(c => c.bond && c.bond.lv >= 10), stones: 300, secret: true },
  { id: 'gacha100', n: '召喚マニア', desc: 'ガチャを100回引く', cond: () => G.gacha.total >= 100, stones: 500 },
  { id: 'crystal4', n: '封印を解く者', desc: '封印の水晶を4つ集める', cond: () => G.crystals.length >= 4, stones: 300 },
  { id: 'clear1', n: '星晶の勇者', desc: '魔王ノクスを倒す', cond: () => !!G.flags.cleared, stones: 500 },
  { id: 'clear2', n: '天空の英雄', desc: '天蓋の王ヴァルディスを倒す', cond: () => !!G.flags.cleared2, stones: 1000 },
  { id: 'tower10', n: '塔の挑戦者', desc: '星界の塔で10階に到達', cond: () => (G.tower && G.tower.best || 0) >= 10, stones: 300 },
  { id: 'tower30', n: '塔の覇者', desc: '星界の塔で30階に到達', cond: () => (G.tower && G.tower.best || 0) >= 30, stones: 1000 },
  { id: 'lv60', n: '極めし者', desc: 'だれかのレベルを60にする', cond: () => Object.values(G.roster).some(c => c.lv >= LV_CAP), stones: 500 },
];

const Life = {
  // ---------- 時間 (1秒 = ゲーム内1分。1日は24分) ----------
  totalMin() { return 8 * 60 + (G ? G.playtime + (G.clockOfs || 0) : 0); },
  minutes() { return Math.floor(this.totalMin()) % 1440; },
  day() { return Math.floor(this.totalMin() / 1440); },
  hour() { return Math.floor(this.minutes() / 60); },
  isNight() { const h = this.hour(); return h >= 19 || h < 5; },
  phase() { const h = this.hour(); return h >= 19 || h < 5 ? 'night' : h < 7 ? 'dawn' : h >= 17 ? 'dusk' : 'day'; },
  clockText() { const m = this.minutes(); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  // 朝まで休む (マイホームのベッド)
  sleepUntilMorning() { const m = this.minutes(); const add = (7 * 60 - m + 1440) % 1440 || 1440; G.clockOfs = (G.clockOfs || 0) + add; },

  // ---------- 天気 (エリアごと、6時間ごとに変わる) ----------
  weatherAt(area) {
    const list = AREA_WEATHER[area] || AREA_WEATHER.meadow;
    const slot = this.day() * 4 + Math.floor(this.hour() / 6);
    let h = 0; for (const ch of area || 'x') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return list[Math.floor(U.hash2(slot, h % 997, 7) * list.length)];
  },
  weather() {
    if (!Field.p || Field.curRegion) return 'clear';
    return this.weatherAt(this.areaHere());
  },
  areaHere() { return biomeArea(Field.p.x, Field.p.y); },

  // ---------- 夜と天気の描画 ----------
  drawOverlay(ctx) {
    if (Field.curRegion) {
      const R = WORLD.regions[Field.curRegion];
      if (R && R.type === 'dungeon') return; // ダンジョンの中は昼夜なし
    }
    const W = Game.vw, H = Game.vh, t = Field.time, ph = this.phase();
    const tint = { night: 'rgba(16,24,72,0.46)', dawn: 'rgba(255,170,120,0.14)', dusk: 'rgba(240,110,70,0.20)', day: null }[ph];
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H); }
    if (ph === 'night' && !Field.curRegion) { // 星
      ctx.fillStyle = 'rgba(255,255,220,0.7)';
      for (let i = 0; i < 18; i++) if ((Math.floor(t * 2) + i) % 5) ctx.fillRect((U.hash2(i, 1, 3) * W) | 0, (U.hash2(i, 2, 3) * H * 0.5) | 0, 1, 1);
    }
    if (Field.curRegion) return;
    const w = this.weather();
    if (w === 'rain') {
      ctx.fillStyle = 'rgba(40,60,110,0.18)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(190,210,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 70; i++) { const x = (U.hash2(i, 3, 9) * (W + 40) + t * 60) % (W + 40) - 20, y = (U.hash2(i, 4, 9) * H + t * 260) % H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 7); }
      ctx.stroke();
    } else if (w === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 60; i++) { const x = (U.hash2(i, 5, 9) * W + Math.sin(t + i) * 8) % W, y = (U.hash2(i, 6, 9) * H + t * 30) % H; ctx.fillRect(x | 0, y | 0, 2, 2); }
    } else if (w === 'sandstorm') {
      ctx.fillStyle = 'rgba(220,170,90,0.28)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(240,210,150,0.6)';
      for (let i = 0; i < 50; i++) { const x = (U.hash2(i, 7, 9) * W + t * 200) % W, y = U.hash2(i, 8, 9) * H; ctx.fillRect(x | 0, y | 0, 6, 1); }
    } else if (w === 'ash') {
      ctx.fillStyle = 'rgba(60,40,40,0.18)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(70,60,60,0.8)';
      for (let i = 0; i < 40; i++) { const x = (U.hash2(i, 9, 9) * W + Math.sin(t * 0.7 + i) * 10) % W, y = (U.hash2(i, 10, 9) * H + t * 18) % H; ctx.fillRect(x | 0, y | 0, 1, 1); }
    } else if (w === 'wind') {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const x = (U.hash2(i, 11, 9) * (W + 60) + t * 160) % (W + 60) - 30, y = U.hash2(i, 12, 9) * H; ctx.moveTo(x, y); ctx.lineTo(x + 14, y - 1); }
      ctx.stroke();
    } else if (w === 'aurora' && ph === 'night') {
      for (let k = 0; k < 3; k++) { ctx.fillStyle = ['rgba(120,255,180,0.10)', 'rgba(140,200,255,0.10)', 'rgba(200,140,255,0.08)'][k]; ctx.beginPath(); ctx.moveTo(0, 10 + k * 8); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 14 + k * 8 + Math.sin(x * 0.03 + t * 0.6 + k) * 8); ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill(); }
    } else if (w === 'cloudy') { ctx.fillStyle = 'rgba(80,90,110,0.12)'; ctx.fillRect(0, 0, W, H); }
  },

  // ---------- 採集ポイント ----------
  // マップの到達できる場所に、エリアごとの光る採集ポイントを置く (マップ生成とは別の乱数)
  initGather() {
    this.points = [];
    const rnd = U.rng(424242), W = MW;
    const used = new Set();
    for (let k = 0; k < 6000 && this.points.length < 170; k++) {
      const x = 5 + Math.floor(rnd() * (MW - 10)), y = 5 + Math.floor(rnd() * (MH - 10)), i = y * W + x;
      if (!WORLD.reach[i] || WORLD.region[i]) continue;
      const t = WORLD.tiles[i];
      if (TILE_DEFS[t].solid || t === T.PATH || t === T.BRIDGE) continue;
      const area = biomeArea(x, y);
      if (!GATHER[area] || WORLD.biome[i] === 6) continue;
      if (this.points.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < 9)) continue;
      if (Field.objAt(x, y) || [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => used.has((y + dy) * W + x + dx))) continue;
      used.add(i);
      this.points.push({ type: 'gather', id: 'g' + this.points.length, x, y, area });
    }
    G.gather = G.gather || {};
    for (const p of this.points) if (!(G.gather[p.id] > G.playtime) && !Field.objAt(p.x, p.y)) Field.place(p);
  },
  update() {
    if (!this.points) return;
    if ((this._t = (this._t || 0) + 1) % 30) return;
    // HUDの時計を進める (天気が変わったら表示も変える)
    const ck = Game.hudEl && Game.hudEl.querySelector('.hud-clock');
    if (ck) { const W = WEATHER[this.weather()] || WEATHER.clear; ck.textContent = `${this.isNight() ? '🌙' : '☀'} ${this.clockText()} ${W.i}${W.n}`; }
    for (const p of this.points) {
      if (Field.objAt(p.x, p.y) || G.gather[p.id] > G.playtime) continue;
      if (Field.p.x === p.x && Field.p.y === p.y) continue;
      Field.place(p);
    }
  },
  pickWeighted(list) { const tot = list.reduce((a, b) => a + b[1], 0); let r = Math.random() * tot; for (const [k, w] of list) { r -= w; if (r <= 0) return k; } return list[0][0]; },
  async gather(o) {
    const list = GATHER[o.area] || GATHER.meadow;
    const got = {};
    const n = 1 + (Math.random() < 0.35 ? 1 : 0);
    for (let k = 0; k < n; k++) { const id = this.pickWeighted(list); got[id] = (got[id] || 0) + 1; }
    if (this.isNight() && Math.random() < 0.35) got.moonherb = 1;
    for (const k in got) addItem(k, got[k]);
    G.gather[o.id] = G.playtime + 240;
    G.gatherCount = (G.gatherCount || 0) + 1;
    Field.unplace(o);
    Sound.play('chest');
    await UI.say('採集した!\n' + Object.keys(got).map(k => `${ITEMS[k].n} ×${got[k]}`).join('、') + ' を手に入れた。');
    this.checkAch();
  },
  drawGather(ctx, o, sx, sy) {
    const t = Field.time, b = Math.sin(t * 3 + o.x) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255,240,140,${0.25 + b * 0.25})`; ctx.fillRect(sx + 3, sy + 3, 10, 10);
    ctx.fillStyle = '#3f8f3e'; ctx.fillRect(sx + 7, sy + 7, 2, 7); ctx.fillRect(sx + 4, sy + 9, 3, 2); ctx.fillRect(sx + 9, sy + 8, 3, 2);
    ctx.fillStyle = { desert: '#e8a040', snow: '#ff5a7a', volcano: '#e43b44', island: '#a87a4a', crystal: '#c8f4ff', sky: '#ffffff' }[o.area] || '#f6757a';
    ctx.fillRect(sx + 6, sy + 4, 4, 3);
    if (b > 0.7) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 12, sy + 2, 1, 1); ctx.fillRect(sx + 3, sy + 5, 1, 1); }
  },

  // ---------- 釣り ----------
  waterKind(t) { return t === T.OCEAN ? 'sea' : t === T.WATER ? 'lake' : t === T.CLOUD ? 'cloud' : null; },
  async fish(x, y) {
    const kind = this.waterKind(Field.tile(x, y));
    const c = await UI.ask(kind === 'cloud' ? '雲の海だ。釣り糸をたらしてみる?' : '水辺だ。釣りをする?', ['釣りをする', 'やめる']);
    if (c !== 0) return;
    const area = biomeArea(Field.p.x, Field.p.y), night = this.isNight(), w = this.weatherAt(area);
    const pool = Object.keys(FISH).filter(k => { const f = FISH[k]; return f.water === kind && (!f.time || (f.time === 'night') === night) && (!f.weather || f.weather === w) && (!f.area || f.area === area); });
    if (!pool.length) { await UI.say('……何も釣れそうにない。'); return; }
    const weight = k => ({ 1: 10, 2: 4, 3: 1 })[FISH[k].rar] * (FISH[k].weather || FISH[k].time ? 2 : 1);
    const id = this.pickWeighted(pool.map(k => [k, weight(k)]));
    Sound.play('step');
    const ok = await this.minigame(FISH[id].rar);
    if (!ok) { Sound.play('buzz'); await UI.say('あっ…逃げられた!'); return; }
    addItem(id, 1);
    G.fishLog = G.fishLog || {};
    const first = !G.fishLog[id];
    G.fishLog[id] = (G.fishLog[id] || 0) + 1;
    Sound.play(FISH[id].rar >= 3 ? 'star5' : 'chest');
    await UI.say(`${'★'.repeat(FISH[id].rar)} ${FISH[id].n} を釣り上げた!${first ? '\n(図鑑に登録された)' : ''}`);
    this.checkAch();
    Game.autoSave();
  },
  // タイミングで止める釣りミニゲーム。レアな魚ほど当たりの幅がせまく、速い
  minigame(rar) {
    return new Promise(res => {
      const el = U.el('div', 'layer fish-layer');
      const zw = [0, 26, 18, 11][rar], speed = [0, 1.0, 1.35, 1.75][rar];
      const z0 = 10 + Math.random() * (80 - zw);
      el.innerHTML = `<div class="fish-box"><div class="fish-t">魚がかかった!<br><small>マーカーが光るゾーンに来たらA(タップ)!</small></div><div class="fish-bar"><i class="fish-zone" style="left:${z0}%;width:${zw}%"></i><b class="fish-mk"></b></div></div>`;
      const mk = el.querySelector('.fish-mk');
      let pos = 0, dir = 1, done = false, last = performance.now();
      const step = (now) => {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        pos += dir * speed * 90 * dt;
        if (pos >= 100) { pos = 100; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; }
        mk.style.left = pos + '%';
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      const stop = () => { if (done) return; done = true; const hit = pos >= z0 && pos <= z0 + zw; el.classList.add(hit ? 'hit' : 'miss'); setTimeout(() => { UI.pop(layer); res(hit); }, 450); };
      const layer = { el, handle: k => { if (k === 'a') stop(); else if (k === 'b' && !done) { done = true; UI.pop(layer); res(false); } } };
      el.addEventListener('click', e => { e.stopPropagation(); stop(); });
      UI.push(layer);
    });
  },

  // ---------- 料理 ----------
  have(k, n) {
    if (FISH_ANY[k]) return FISH_ANY[k].reduce((a, f) => a + (G.items[f] || 0), 0) >= n;
    return (G.items[k] || 0) >= n;
  },
  consume(k, n) {
    if (!FISH_ANY[k]) { for (let i = 0; i < n; i++) useItemCount(k); return; }
    for (const f of FISH_ANY[k]) while (n > 0 && G.items[f] > 0) { useItemCount(f); n--; }
  },
  canCook(r) { return Object.keys(RECIPES[r].need).every(k => this.have(k, RECIPES[r].need[k])); },
  needText(r) { const nd = RECIPES[r].need; return Object.keys(nd).map(k => `${ANY_N[k] || ITEMS[k].n}×${nd[k]}${this.have(k, nd[k]) ? '' : '(不足)'}`).join(' ・ '); },
  cook() {
    return Menu.tabList({
      title: '料理 (どこでも作れる)',
      tabs: [{ n: 'すべて' }, { n: '作れる', f: r => this.canCook(r) }, { n: '回復', f: r => !!RECIPES[r].heal }, { n: '強化', f: r => !!RECIPES[r].buff }],
      items: () => Object.keys(RECIPES),
      label: r => `<span class="${this.canCook(r) ? '' : 'dim'}">${(G.cooked || {})[r] ? '' : '<span class="tag lead">NEW</span> '}${U.esc(RECIPES[r].n)}</span> <small class="dim">所持${G.items['d_' + r] || 0}</small>`,
      note: r => `${U.esc(RECIPES[r].desc)}<br>材料: ${U.esc(this.needText(r))}`,
      onSelect: async (r, ctx) => {
        if (!this.canCook(r)) { Sound.play('buzz'); UI.toast('材料が足りない'); return; }
        for (const k in RECIPES[r].need) this.consume(k, RECIPES[r].need[k]);
        addItem('d_' + r, 1);
        G.cooked = G.cooked || {};
        G.cooked[r] = (G.cooked[r] || 0) + 1;
        Sound.play('heal');
        UI.toast(`${RECIPES[r].n} ができた!`);
        this.checkAch();
        ctx.refresh(true);
      },
    });
  },
  // 強化料理を食べる
  eat(id) {
    const r = RECIPES[id.slice(2)];
    if (!r || !r.buff) return false;
    useItemCount(id);
    G.meal = { id: id.slice(2), left: MEAL_BATTLES };
    Sound.play('heal');
    UI.toast(`${r.n} を食べた!<br><small>次の${MEAL_BATTLES}回の戦闘で: ${r.desc}</small>`, 2400);
    return true;
  },
  // 戦闘開始時の料理の効果 (Battle.startTurn の1ターン目から呼ぶ)。追加ドロー数を返す
  mealStart(B) {
    if (!G.meal || !RECIPES[G.meal.id]) return 0;
    const f = RECIPES[G.meal.id].buff;
    if (f.block) B.relicBlock(f.block);
    for (const k of ['str', 'dex', 'regen', 'thorns']) if (f[k]) B.relicSt(k, f[k]);
    if (f.energy) { B.energy += f.energy; B.popParty('エナジー+' + f.energy, 'mp'); }
    if (f.ult && B.ultIds.length) B.gainUlt(f.ult);
    UI.toast(`料理の効果: ${RECIPES[G.meal.id].n} (のこり${G.meal.left}回)`, 1400);
    return f.draw || 0;
  },
  mealUsed() { if (G.meal && --G.meal.left <= 0) { UI.toast(`${RECIPES[G.meal.id].n} の効果が切れた`, 1400); G.meal = null; } },

  // ---------- 図鑑と実績 ----------
  kills() { return Object.values(G.kills || {}).reduce((a, b) => a + b, 0); },
  fishTotal() { return Object.values(G.fishLog || {}).reduce((a, b) => a + b, 0); },
  onBattleEnd(B, res) {
    G.seen = G.seen || {};
    for (const e of B.enemies) G.seen[e.id] = 1;
    if (res === 'win') { G.kills = G.kills || {}; for (const e of B.enemies) G.kills[e.id] = (G.kills[e.id] || 0) + 1; }
    if (!B.opts.arena && !B.opts.noReward && !B.opts.deck) this.mealUsed();
    this.checkAch();
  },
  checkAch() {
    if (!G) return;
    G.ach = G.ach || {};
    for (const a of ACHIEVEMENTS) if (!G.ach[a.id] && a.cond()) { G.ach[a.id] = 'done'; UI.toast(`🏆 実績解除「${a.n}」<br><small>図鑑の実績で報酬を受け取れる</small>`, 2400); }
  },
  book() {
    const tabs = [{ n: '魔物', k: 'mon' }, { n: '魚', k: 'fish' }, { n: '料理', k: 'dish' }, { n: '仲間', k: 'char' }, { n: '実績', k: 'ach' }];
    const all = [];
    for (const k in ENEMIES) all.push({ t: 'mon', k });
    for (const k in FISH) all.push({ t: 'fish', k });
    for (const k in RECIPES) all.push({ t: 'dish', k });
    for (const k in CHARS) all.push({ t: 'char', k });
    for (const a of ACHIEVEMENTS) if (!a.secret || secretOn()) all.push({ t: 'ach', k: a.id, a });
    const prog = t => {
      const xs = all.filter(x => x.t === t);
      const got = xs.filter(x => t === 'mon' ? (G.seen || {})[x.k] : t === 'fish' ? (G.fishLog || {})[x.k] : t === 'dish' ? (G.cooked || {})[x.k] : t === 'char' ? G.roster[x.k] : (G.ach || {})[x.k]).length;
      return `${got}/${xs.length}`;
    };
    return Menu.tabList({
      title: '図鑑',
      counts: false,
      tabs: tabs.map(tb => ({ n: `${tb.n} ${prog(tb.k)}`, f: x => x.t === tb.k })),
      items: () => all,
      label: x => {
        if (x.t === 'mon') { const e = ENEMIES[x.k], s = (G.seen || {})[x.k]; return s ? `<img class="ico" src="${enemySprite(e.spr, e.pal).toDataURL()}"> ${U.esc(e.n)}${e.boss ? ' <span class="tag lead">ボス</span>' : ''}${NIGHT_ENEMIES.includes(x.k) ? ' <small class="dim">夜</small>' : ''} <small class="dim">討伐${(G.kills || {})[x.k] || 0}</small>` : '<span class="dim">？？？</span>'; }
        if (x.t === 'fish') { const f = FISH[x.k], n = (G.fishLog || {})[x.k]; return n ? `${'★'.repeat(f.rar)} ${U.esc(f.n)} <small class="dim">釣った数${n}</small>` : `<span class="dim">${'★'.repeat(f.rar)} ？？？</span>`; }
        if (x.t === 'dish') { const r = RECIPES[x.k], n = (G.cooked || {})[x.k]; return `${n ? '' : '<span class="dim">'}${U.esc(r.n)}${n ? ` <small class="dim">作った数${n}</small>` : '</span>'}`; }
        if (x.t === 'char') { const d = CHARS[x.k], own = G.roster[x.k]; return own ? `<img class="ico" src="${portraitURL(charLook(x.k))}"> <span class="rar r${d.rar}">${'★'.repeat(d.rar)}</span> ${U.esc(d.n)}` : `<span class="dim"><span class="rar r${d.rar}">${'★'.repeat(d.rar)}</span> ？？？</span>`; }
        const st = (G.ach || {})[x.k];
        return `${st === 'got' ? '✅' : st === 'done' ? '🎁' : '⬜'} ${U.esc(x.a.n)} <small class="dim">◆${x.a.stones}</small>`;
      },
      note: x => {
        if (x.t === 'mon') { const e = ENEMIES[x.k]; return (G.seen || {})[x.k] ? `${ELEM[e.elem] ? ELEM[e.elem].n + '属性' : ''} HP${e.chp || e.hp} 攻撃${e.atk}${NIGHT_ENEMIES.includes(x.k) ? ' ／ 夜にだけ出る' : ''}` : 'まだ出会っていない'; }
        if (x.t === 'fish') { const f = FISH[x.k]; const where = { lake: '川や湖', sea: '海', cloud: '雲海' }[f.water] + (f.area ? `(${AREAS[f.area].n})` : '') + (f.time ? ' ／ 夜' : '') + (f.weather ? ' ／ ' + WEATHER[f.weather].n + 'のとき' : ''); return (G.fishLog || {})[x.k] ? `${U.esc(f.desc)}<br>${where}` : `ヒント: ${where}`; }
        if (x.t === 'dish') return `${U.esc(RECIPES[x.k].desc)}<br>材料: ${U.esc(this.needText(x.k))}`;
        if (x.t === 'char') return G.roster[x.k] ? U.esc(CHARS[x.k].profile) : 'まだ仲間になっていない';
        const st = (G.ach || {})[x.k];
        return `${U.esc(x.a.desc)}${st === 'done' ? '<br><b>タップで報酬を受け取る</b>' : st === 'got' ? '<br>受け取り済み' : ''}`;
      },
      onSelect: async (x, ctx) => {
        if (x.t !== 'ach' || G.ach[x.k] !== 'done') return;
        G.ach[x.k] = 'got'; G.stones += x.a.stones;
        Sound.play('star4'); Game.hud();
        UI.toast(`実績「${x.a.n}」の報酬<br>星晶石 ×${x.a.stones}`);
        ctx.refresh(true);
        Game.autoSave();
      },
    });
  },
};
