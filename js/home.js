'use strict';
// ===== マイホーム =====
// ルミナ村の南はずれの空き家。家具を置いたり、パーティにいない仲間が遊びに来たりする。
// 本棚: 家具・プレゼントの買い物、家具を置く / ベッド: 全回復 / 仲間: 話す・プレゼント・パーティに誘う

// 家具のドット絵 (16x16。'.'は透明、アウトラインは自動)
const FURN_PAL = {
  W: '#b07a48', w: '#6a3c22', R: '#e43b44', r: '#a8283a', P: '#f7a1c8', p: '#d878a8', G: '#5ab84a', g: '#2e7a34',
  Y: '#ffd94a', B: '#4a8ae8', b: '#2a5ab8', X: '#ffffff', K: '#5a5a6a', k: '#2a2030', S: '#9a9aa8', T: '#c8884a', t: '#8a5a2a',
};
const FURNITURE = {
  table: { n: '丸テーブル', price: 200, rows: ['', '', '', '', '...XXXXXXXXXX...', '..XXXXXXXXXXXX..', '.XXXPXXXXXXPXXX.', '.XXXXXXXXXXXXXX.', '..XXXXXXXXXXXX..', '...SSSSSSSSSS...', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.....WWWWWW.....'] },
  chair: { n: 'いす', price: 120, rows: ['', '....WWWWWWWW....', '....WwWWWWwW....', '....WWWWWWWW....', '....WwWWWWwW....', '....WWWWWWWW....', '....WWWWWWWW....', '...PPPPPPPPPP...', '...PPPPPPPPPP...', '...WWWWWWWWWW...', '...W........W...', '...W........W...', '...W........W...', '...w........w...'] },
  plant: { n: '観葉植物', price: 150, rows: ['', '......GG.GG.....', '.....GGGGGGG....', '....GgGGGGgGG...', '...GGGgGgGGGGG..', '...GgGGGGGGgGG..', '....GGGgGGGGG...', '.....GGgGGgG....', '.......gg.......', '.......gg.......', '....RRRRRRRR....', '....RrRRRRRR....', '.....RRRRRR.....', '.....RRRRRR.....', '......rrrr......'] },
  plush: { n: 'くまのぬいぐるみ', price: 250, rows: ['', '', '', '...TT.....TT....', '..TttT...TttT...', '..TTTTTTTTTTT...', '...TTTTTTTTT....', '...TkTTTTTkT....', '...TTTTPTTTT....', '....TTttTTT.....', '..TTTTTTTTTTT...', '.TT.TTTTTTT.TT..', '.TT.TTTPTTT.TT..', '....TTTTTTT.....', '...TTT...TTT....'] },
  shelf: { n: '本棚', price: 300, rows: ['..WWWWWWWWWWWW..', '..WRBGYRBPGRWW..', '..WRBGYRBPGRWW..', '..WRBGYRBPGRWW..', '..WWWWWWWWWWWW..', '..WGYPRBGYRBWW..', '..WGYPRBGYRBWW..', '..WGYPRBGYRBWW..', '..WWWWWWWWWWWW..', '..WBRYGPBRYGWW..', '..WBRYGPBRYGWW..', '..WBRYGPBRYGWW..', '..WWWWWWWWWWWW..', '..wwwwwwwwwwww..'] },
  sofa: { n: 'ソファ', price: 400, rows: ['', '', '', '...PPPPPPPPPP...', '..PPPPPPPPPPPP..', '..PPPPPPPPPPPP..', '..PpPPPPPPPPpP..', 'PPPPPPPPPPPPPPPP', 'PPPppppppppppPPP', 'PPPppppppppppPPP', 'PPPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPPPP', '.ww..........ww.'] },
  lamp: { n: 'スタンドライト', price: 180, rows: ['', '.....YYYYYY.....', '....YYYYYYYY....', '...YYYXYYYYYY...', '...YYYYYYYYYY...', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.....WWWWWW.....', '....WWWWWWWW....'] },
  fireplace: { n: '暖炉', price: 600, rows: ['.SSSSSSSSSSSSSS.', '.SKKKKKKKKKKKKS.', '.SSSSSSSSSSSSSS.', '..SSSSSSSSSSSS..', '..SSkkkkkkkkSS..', '..SSkkkkkkkkSS..', '..SSkkkkRkkkSS..', '..SSkkkRYRkkSS..', '..SSkkRYYYRkSS..', '..SSkkRYXYRkSS..', '..SSkRRYYYRRSS..', '..SSwwwwwwwwSS..', '..SSSSSSSSSSSS..', '.SSSSSSSSSSSSSS.'] },
  piano: { n: 'ピアノ', price: 900, rows: ['', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kXkXXkXkXXkk..', '..XXXXXXXXXXXX..', '..kkkkkkkkkkkk..', '..kk........kk..', '..kk........kk..', '..kk........kk..', '..kk...kk...kk..', '..kk...kk...kk..'] },
  aquarium: { n: '水槽', price: 700, rows: ['', '', '..XXXXXXXXXXXX..', '..XBBBBBBBBBBX..', '..XBBBBBBBBRBX..', '..XBBRRBBBBBBX..', '..XBBBRBBBBBBX..', '..XBBBBBBBGBBX..', '..XBGBBBBBGBBX..', '..XBGBBBBGGBBX..', '..XYYYYYYYYYYX..', '..XXXXXXXXXXXX..', '..WWWWWWWWWWWW..', '..W..........W..', '..W..........W..'] },
  star: { n: '星のオブジェ', price: 1200, rows: ['.......Y........', '.......YY.......', '......YYYY......', '.YYYYYYYYYYYYY..', '..YYYYYYXYYYY...', '...YYYYYYYYY....', '...YYYYYYYYY....', '..YYYYY.YYYYY...', '..YYY.....YYY...', '.......WW.......', '.......WW.......', '.......WW.......', '.....WWWWWW.....'] },
  game: { n: 'ゲーム機とテレビ', price: 800, rows: ['', '..KKKKKKKKKKKK..', '..KBBBBBBBBBBK..', '..KBGBBBBBBBBK..', '..KBBBBRBBBBBK..', '..KBBBBBBBGBBK..', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..', '.......KK.......', '.....KKKKKK.....', '', '...WWWWWWWWWW...', '...WkkkWWRRRW...', '...WWWWWWWWWW...', '...W........W...'] },
};
const FURN_IMG = {};
function furnCanvas(id) {
  if (FURN_IMG[id]) return FURN_IMG[id];
  const c = mkCanvas(16, 16), x = c.getContext('2d');
  const rows = FURNITURE[id].rows, oy = 16 - rows.length;
  paint(x, rows, FURN_PAL, 0, Math.max(0, oy));
  const img = x.getImageData(0, 0, 16, 16), d = img.data, out = new Uint8Array(256);
  for (let i = 0; i < 256; i++) if (!d[i * 4 + 3]) { const a = i % 16, b = (i / 16) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + dx, nb = b + dy; if (na >= 0 && nb >= 0 && na < 16 && nb < 16 && d[(nb * 16 + na) * 4 + 3]) out[i] = 1; } }
  for (let i = 0; i < 256; i++) if (out[i]) { d[i * 4] = 24; d[i * 4 + 1] = 20; d[i * 4 + 2] = 37; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  return (FURN_IMG[id] = c);
}
const FURN_URL = {};
function furnURL(id) { return FURN_URL[id] || (FURN_URL[id] = furnCanvas(id).toDataURL()); }

const HOME_GIRLS = 4;   // 遊びに来る仲間の最大人数
const TALK_CD = 90;     // 同じ仲間と話して絆が上がる間隔 (プレイ時間の秒)

const Home = {
  furn: [], girls: [], carrying: null,
  st() { return WORLD.structs.find(s => s.id === 'myhome'); },
  data() { G.home = G.home || { owned: {}, placed: [] }; G.gifts = G.gifts || {}; return G.home; },
  inside(x, y) { const s = this.st(); return s && x > s.x && y > s.y && x < s.x + s.w - 1 && y < s.y + s.h - 1; },
  region() { const s = this.st(); return s ? Field.regionAt(s.x + 1, s.y + 1) : -1; },
  // 置ける床か (扉の前1マスは空けておく)
  free(x, y) {
    if (!this.inside(x, y)) return false;
    const s = this.st();
    if (WORLD.tiles[Field.key(x, y)] !== T.WOODF) return false;
    if (Field.objAt(x, y) || (Field.p.x === x && Field.p.y === y)) return false;
    const door = { x: s.x + 6, y: s.y + s.h - 1 };
    if (Math.abs(x - door.x) + Math.abs(y - door.y) <= 1) return false;
    return true;
  },
  // フィールドに家具と仲間を置き直す
  refresh() {
    const s = this.st();
    if (!s || !G) return;
    for (const o of this.furn) Field.unplace(o);
    for (const o of this.girls) Field.unplace(o);
    this.furn = []; this.girls = [];
    const H = this.data();
    for (const p of H.placed) {
      const x = s.x + p.x, y = s.y + p.y;
      if (Field.objAt(x, y)) continue;
      const o = { type: 'furn', f: p.f, x, y, ref: p };
      this.furn.push(o); Field.place(o);
    }
    // パーティにいない仲間 (エピソード待ちを優先)
    const ids = Object.keys(G.roster).filter(k => !G.party.includes(k));
    const pri = ids.filter(k => Bond.pendingEp(k) >= 0);
    const rest = ids.filter(k => !pri.includes(k)).sort(() => Math.random() - 0.5);
    const pick = pri.concat(rest).slice(0, HOME_GIRLS);
    const reg = this.region();
    for (const id of pick) {
      for (let k = 0; k < 40; k++) {
        const x = s.x + 1 + Math.floor(Math.random() * (s.w - 2)), y = s.y + 1 + Math.floor(Math.random() * (s.h - 3));
        if (!this.free(x, y)) continue;
        const o = { type: 'npc', homeGirl: id, name: CHARS[id].n, look: charLook(id), x, y, fx: x, fy: y, t: 1, dir: 'd', timer: Math.random() * 3, wander: true, room: reg, talk: () => this.talk(id) };
        this.girls.push(o); Field.place(o); break;
      }
    }
  },
  // 家に入ったとき
  async onEnter() {
    this.refresh();
    if (!G.flags.homeIntro) {
      G.flags.homeIntro = 1;
      await UI.say(['ここはルミナ村の空き家…', '村長さんが「好きに使っていい」と言っていた。\n今日からここが、わたしたちの家だ!', '本棚で家具やプレゼントが買える。\nベッドで休むと全回復。\nパーティにいない仲間が遊びに来るよ。']);
      if (!this.data().owned.plant) { this.data().owned.plant = 1; this.data().owned.chair = 1; await UI.say('引っ越し祝いに「観葉植物」と「いす」をもらった!\n本棚の「家具を置く」で置いてみよう。'); }
      Game.autoSave(true);
    }
  },

  // ---------- 本棚のメニュー ----------
  async menu() {
    for (;;) {
      const c = await UI.ask(`マイホーム  所持金 ${G.gold}G`, ['仲間と話す', '家具を置く', '家具を買う', 'プレゼントを買う', '置いた家具を全部しまう', 'やめる']);
      if (c === 0) { await this.callGirl(); continue; }
      if (c === 1) { if (await this.choosePlace()) return; }
      else if (c === 2) await this.shop('furn');
      else if (c === 3) await this.shop('gift');
      else if (c === 4) {
        if (!this.data().placed.length) { await UI.say('置いてある家具はない。'); continue; }
        if ((await UI.ask('家具を全部しまいますか?', ['しまう', 'やめる'])) === 0) { this.data().placed = []; this.refresh(); Sound.play('ok'); Game.autoSave(); }
      } else return;
    }
  },
  // パーティにいる子も含めて、仲間を選んで話す (絆のエピソードや指輪はここからでもOK)
  async callGirl() {
    let chosen = null;
    await Menu.tabList({
      title: '話す仲間を選ぶ',
      tabs: [{ n: 'すべて' }, { n: 'エピソードあり', f: k => Bond.pendingEp(k) >= 0 }, { n: 'パーティ', f: k => G.party.includes(k) }],
      items: () => Object.keys(G.roster),
      label: k => `<img class="ico" src="${portraitURL(charLook(k))}"> ${U.esc(CHARS[k].n)} ${Bond.hearts(k)}${Bond.pendingEp(k) >= 0 ? ' <span class="tag lead">エピソード</span>' : ''}${typeof canConfess === 'function' && canConfess(k) ? ' <span class="tag lead">指輪OK</span>' : ''}`,
      onSelect: async (k, ctx) => { chosen = k; ctx.close(); },
    });
    if (chosen) await this.talk(chosen);
  },
  spare(f) { const H = this.data(); return (H.owned[f] || 0) - H.placed.filter(p => p.f === f).length; },
  async choosePlace() {
    const list = Object.keys(FURNITURE).filter(f => this.spare(f) > 0);
    if (!list.length) { await UI.say('置ける家具を持っていない。\n「家具を買う」で買おう。'); return false; }
    let chosen = null;
    await Menu.tabList({
      title: '置く家具を選ぶ',
      items: () => list,
      label: f => `<img class="ico" src="${furnURL(f)}"> ${U.esc(FURNITURE[f].n)} <small class="dim">×${this.spare(f)}</small>`,
      onSelect: async (f, ctx) => { chosen = f; ctx.close(); },
    });
    if (!chosen) return false;
    this.carrying = chosen;
    UI.toast(`「${FURNITURE[chosen].n}」を持った!<br>置きたい場所を向いてAボタン`, 2400);
    return true;
  },
  async shop(kind) {
    const isF = kind === 'furn';
    const keys = Object.keys(isF ? FURNITURE : GIFTS);
    await Menu.tabList({
      title: isF ? '家具を買う' : 'プレゼントを買う',
      items: () => keys,
      label: k => isF
        ? `<img class="ico" src="${furnURL(k)}"> ${U.esc(FURNITURE[k].n)} <b class="gold">${FURNITURE[k].price}G</b> <small class="dim">所持${this.data().owned[k] || 0}</small>`
        : `${U.esc(GIFTS[k].n)} <b class="gold">${GIFTS[k].price}G</b> <small class="dim">所持${G.gifts[k] || 0} ／ ${GIFTS[k].ring ? '恋人になる' : '絆+' + GIFTS[k].pt}</small>`,
      note: k => isF ? '' : GIFTS[k].ring ? '絆Lv10でエピソードを全部見た大人の仲間に渡すと、告白イベントで恋人(絆Lv11)になれる' : '好きな仲間にあげると2倍。' + Object.keys(GIFT_FAV).filter(id => GIFT_FAV[id] === k && G.roster[id]).map(id => CHARS[id].n).join('・') + (Object.keys(GIFT_FAV).some(id => GIFT_FAV[id] === k && G.roster[id]) ? 'が好きらしい' : ''),
      onSelect: async (k, ctx) => {
        const price = (isF ? FURNITURE : GIFTS)[k].price;
        if (G.gold < price) { Sound.play('buzz'); UI.toast('お金が足りない'); return; }
        G.gold -= price;
        if (isF) this.data().owned[k] = (this.data().owned[k] || 0) + 1; else G.gifts[k] = (G.gifts[k] || 0) + 1;
        Sound.play('chest'); Game.hud();
        UI.toast(`${(isF ? FURNITURE : GIFTS)[k].n} を買った!`);
        ctx.refresh && ctx.refresh();
      },
    });
    Game.autoSave();
  },
  // 家具を持っているときにAボタン
  async place(x, y) {
    if (!this.carrying) return false;
    if (!this.free(x, y)) { Sound.play('buzz'); const c = await UI.ask('ここには置けない。', ['ほかの場所を探す', '置くのをやめる']); if (c === 1) { this.carrying = null; } return true; }
    const s = this.st();
    this.data().placed.push({ f: this.carrying, x: x - s.x, y: y - s.y });
    Sound.play('ok');
    UI.toast(`${FURNITURE[this.carrying].n} を置いた!`);
    this.carrying = null;
    this.refresh();
    Game.autoSave();
    return true;
  },
  async furnTalk(o) {
    const c = await UI.ask(`${FURNITURE[o.f].n}だ。`, ['動かす', 'しまう', 'そのまま']);
    if (c === 2 || c < 0) return;
    const H = this.data();
    H.placed = H.placed.filter(p => p !== o.ref);
    if (c === 0) { this.carrying = o.f; UI.toast('置きたい場所を向いてAボタン', 2000); }
    Sound.play('ok');
    this.refresh();
    Game.autoSave();
  },
  async rest() {
    if ((await UI.ask('ベッドで休みますか?', ['休む', 'やめる'])) !== 0) return;
    Sound.play('heal');
    healAll();
    await UI.say('ぐっすり眠った。\nパーティ全員のHPが全回復した!');
    Game.hud();
    Game.autoSave(true);
  },

  // ---------- 仲間との会話 ----------
  async talk(id) {
    const c = G.roster[id];
    if (!c) return;
    const opt = { name: CHARS[id].n, look: charLook(id) };
    if (Bond.pendingEp(id) >= 0) { await Bond.playEp(id); return; }
    const b = bondOf(id);
    const tier = BOND_TALK[b.lv >= 7 ? 2 : b.lv >= 4 ? 1 : 0];
    await UI.say(isLover(id) ? U.pick(ROMANCE[id].talk) : U.pick(tier).replace('{n}', CHARS[id].n), opt);
    for (;;) {
      const lover = isLover(id);
      const ch = await UI.ask(`${CHARS[id].n}  ${lover ? '♥恋人' : bondOf(id).lv >= BOND_MAX ? '♥絆Lv MAX' : `♥絆Lv${bondOf(id).lv}`}`, ['おしゃべりする', 'プレゼントをあげる', 'パーティに誘う', lover ? 'デートに誘う' : 'またね'].concat(lover ? ['またね'] : []));
      if (ch === 3 && lover) { await Bond.date(id); continue; }
      if (ch === 0) {
        const now = G.playtime;
        if (c.talkT && now - c.talkT < TALK_CD) { await UI.say(U.pick(['さっきもお話ししたね。ふふ。', 'またあとでね。', 'ちょっと休憩中〜。']), opt); continue; }
        c.talkT = now;
        if (lover) { await UI.say(U.pick(ROMANCE[id].talk), opt); Sound.play('heal'); continue; }
        await UI.say(U.pick([`${CHARS[id].title}のお仕事の話、聞いてくれる?`, 'この前の冒険、楽しかったね!', 'ここ、いい家だね。', 'あなたと話すの、好きだな。', 'おなかすいたね。']), opt);
        Sound.play('heal');
        Bond.gain(id, 6);
        if (Bond.pendingEp(id) >= 0) await Bond.playEp(id);
      } else if (ch === 1) {
        const gs = Object.keys(GIFTS).filter(k => G.gifts[k] > 0);
        if (!gs.length) { await UI.say('プレゼントを持っていない。\n本棚の「プレゼントを買う」で買える。'); continue; }
        const gi = await UI.ask('どれをあげる?', gs.map(k => `${GIFTS[k].n} ×${G.gifts[k]}`).concat(['やめる']));
        if (gi < 0 || gi >= gs.length) continue;
        const k = gs[gi];
        if (GIFTS[k].ring) {
          if (canConfess(id)) { G.gifts[k]--; await Bond.confess(id); return; }
          await UI.say(lover ? 'もう、ちゃんと受け取ってるよ。…ずっと大事にしてる。' : 'きれいな指輪…!でも、これはとっても大切なものだから、\n今はまだ受け取れないよ。', opt);
          continue;
        }
        G.gifts[k]--;
        const fav = GIFT_FAV[id] === k;
        await UI.say(fav ? `わあっ、${GIFTS[k].n}!大好きなの!\nありがとう!` : `${GIFTS[k].n}?ありがとう、大事にするね。`, opt);
        Sound.play(fav ? 'star4' : 'heal');
        Bond.gain(id, GIFTS[k].pt * (fav ? 2 : 1));
        if (Bond.pendingEp(id) >= 0) await Bond.playEp(id);
        Game.autoSave();
      } else if (ch === 2) {
        const opts = G.party.map(k => `${CHARS[k].n} と交代`);
        if (G.party.length < 4) opts.unshift('パーティに加える');
        const pi = await UI.ask(`${CHARS[id].n} をパーティに入れる`, opts.concat(['やめる']));
        if (pi < 0 || pi >= opts.length) continue;
        if (G.party.length < 4 && pi === 0) G.party.push(id);
        else G.party[pi - (G.party.length < 4 ? 1 : 0)] = id;
        Sound.play('ok');
        await UI.say('よーし、一緒に行こう!', opt);
        this.refresh();
        Game.hud(); Game.autoSave();
        return;
      } else return;
    }
  },
};
