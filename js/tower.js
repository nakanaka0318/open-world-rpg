'use strict';
// ===== 星界の塔 (魔王撃破後のエンドレス・ローグライク) =====
// 負けるまで1階ずつ登る。階ごとに 戦闘/エリート/イベント/休憩所/商人 から選び、5階ごとにボス。
// 1回の挑戦の中だけ有効: 追加カード・カード強化・一時レリック・星屑(塔の通貨)。
// ずっと残る報酬: 星晶石・塔専用の武器カード・最高到達階の記録と称号。

// 一時レリック (1回の挑戦の中だけ)
const TOWER_RELICS = {
  t_block: { n: '星屑のお守り', icon: 'armor', desc: () => '戦闘開始時、ブロック15を得る', start: B => B.relicBlock(15) },
  t_str: { n: '戦乙女の羽', icon: 'tiara', desc: () => '戦闘開始時、筋力+2', start: B => B.relicSt('str', 2) },
  t_draw: { n: '時計草のしおり', icon: 'staff', desc: () => '最初のターン、カードを2枚多く引く', draw: () => 2 },
  t_regen: { n: '再生の種', icon: 'amulet', desc: () => '戦闘開始時、再生5', start: B => B.relicSt('regen', 5) },
  t_dex: { n: '風切りの靴', icon: 'ring', desc: () => '戦闘開始時、敏捷+2', start: B => B.relicSt('dex', 2) },
  t_energy: { n: '星の砂時計', icon: 'staff', desc: () => '最初のターン、エナジー+2', start: B => { B.energy += 2; B.popParty('エナジー+2', 'mp'); } },
  t_thorns: { n: '茨の冠', icon: 'tiara', desc: () => '戦闘開始時、トゲ4', start: B => B.relicSt('thorns', 4) },
  t_weak: { n: '月影のヴェール', icon: 'amulet', desc: () => '戦闘開始時、敵全体に脱力2', start: B => { for (const e of B.enemies) if (e.alive) B.debuff(e, 'weak', 2); } },
  t_turnblock: { n: '黒鉄の小手', icon: 'armor', desc: () => '毎ターン開始時、ブロック6を得る', turn: B => B.relicBlock(6) },
  t_heart: { n: '鉄の心臓', icon: 'ring', desc: () => '最大HP+15% (手に入れたときに適用)', maxhp: 0.15 },
};
const TOWER_TITLES = [[10, '塔の挑戦者'], [25, '星界の登攀者'], [50, '天頂を目指す者'], [75, '星を掴む者'], [100, '星界の覇者']];
const NODE = {
  battle: { n: '戦闘', icon: '⚔', d: '普通の敵と戦う。勝つとカードを1枚追加できる' },
  elite: { n: 'エリート', icon: '☠', d: '強敵と戦う。報酬が多く、レリックが手に入ることも' },
  event: { n: 'イベント', icon: '?', d: '何が起こるかはお楽しみ' },
  rest: { n: '休憩所', icon: '☕', d: 'HPを回復するか、カードを1枚強化する' },
  shop: { n: '商人', icon: '$', d: '星屑でカード・レリック・回復を買える' },
  boss: { n: 'ボス', icon: '♛', d: '5階ごとの番人。倒すと塔の武器カードが手に入ることも' },
};

const Tower = {
  active: false,
  bonus(cid) { return this.active && G && G.towerRun && G.towerRun.up ? (G.towerRun.up[cid] || 0) : 0; },
  stats() { G.tower = G.tower || { best: 0, runs: 0, clears: 0 }; return G.tower; },
  title() { const b = this.stats().best; let t = ''; for (const [f, n] of TOWER_TITLES) if (b >= f) t = n; return t; },
  run() { return G.towerRun; },

  // 敵の強さ: 階が上がるほど指数的に強くなる (上限なし)
  power(floor) { return 40 * Math.pow(1.075, floor); },
  mulFor(floor, kind) {
    const T = this.power(floor) * (kind === 'elite' ? 1.5 : kind === 'boss' ? 1.35 : 1);
    return id => Math.max(0.3, T / ENEMIES[id].atk);
  },
  enemyGroup(floor, kind) {
    const areas = ['forest', 'desert', 'snow', 'volcano', 'island', 'crystal', 'castle'];
    const area = areas[Math.floor(Math.random() * areas.length)];
    if (kind === 'boss') {
      const bosses = Object.keys(ENEMIES).filter(k => ENEMIES[k].boss);
      return { ids: [U.pick(bosses)], bg: U.pick(['castle', 'crystal', 'lava', 'ice']) };
    }
    if (kind === 'elite') {
      const strong = ['crywolf', 'dknight', 'hellhound', 'snowwolf', 'imp', 'cryghost'];
      return { ids: [U.pick(strong)], bg: 'crystal' };
    }
    return { ids: U.pick(AREAS[area].groups).slice(), bg: AREAS[area].bg };
  },
  deckBase() {
    const deck = [];
    const pc = partyChars();
    for (let i = 0; i < 4; i++) { const c = pc[i]; if (c) deck.push(...charCards(c.id)); else for (let k = 0; k < 5; k++) deck.push('blank'); }
    deck.push(...(G.deck || STARTER_DECK).slice(0, 5));
    return deck;
  },
  newRun() {
    const pc = partyChars();
    const max = pc.reduce((a, c) => a + charStats(c).hp, 0);
    G.towerRun = { floor: 0, hp: max, max, deck: this.deckBase(), up: {}, relics: [], dust: 50, choices: null, stones: 0 };
    this.stats().runs++;
    this.nextChoices();
  },
  nextChoices() {
    const R = G.towerRun;
    const f = R.floor + 1;
    if (f % 5 === 0) { R.choices = ['boss']; return; }
    const pool = [['battle', 45], ['elite', f >= 3 ? 15 : 0], ['event', 18], ['rest', f % 5 === 4 ? 25 : 10], ['shop', 12]];
    const pick = () => { const tot = pool.reduce((a, p) => a + p[1], 0); let r = Math.random() * tot; for (const [k, w] of pool) { r -= w; if (r <= 0) return k; } return 'battle'; };
    const out = new Set(['battle']);
    while (out.size < 3) out.add(pick());
    R.choices = U.pick([[...out], [...out].reverse()]).slice(0, 3);
  },
  extraRelics() { return (G.towerRun.relics || []).map(id => ({ id, L: 0, r: TOWER_RELICS[id] })); },

  // ---------- 画面 ----------
  async open() {
    if (!G.flags.cleared) { await UI.say('不思議な光の門だ…。今はまだ開かない。'); return; }
    if (!G.towerRun) {
      const s = this.stats();
      const c = await UI.ask(`星界の塔へようこそ。\n負けるまで、どこまでも登り続ける試練の塔。\n(最高到達: ${s.best}階${this.title() ? ' / 称号「' + this.title() + '」' : ''})\n挑戦しますか?`, ['挑戦する', 'やめる']);
      if (c !== 0) return;
      this.newRun();
      Game.autoSave(true);
    }
    this.active = true;
    Sound.bgm('boss');
    await this.screen();
    this.active = false;
    Field.updateLoc(true);
    Game.hud();
    Game.autoSave(true);
  },
  screen() {
    return new Promise(res => {
      const el = U.el('div', 'layer tower-layer');
      const head = U.el('div', 'tw-head');
      const body = U.el('div', 'tw-body');
      el.append(head, body);
      let lm = null;
      const layer = { el, handle: k => { if (lm) lm.handle(k); } };
      const close = () => { UI.pop(layer); res(); };
      const render = () => {
        const R = G.towerRun;
        if (!R) { close(); return; }
        head.innerHTML = `<div class="tw-title">星界の塔 <b>${R.floor + 1}階</b><small>最高 ${this.stats().best}階</small></div>
          <div class="tw-hp"><i style="width:${100 * R.hp / R.max}%"></i><span>HP ${R.hp}/${R.max}</span></div>
          <div class="tw-res"><span>星屑 <b>${R.dust}</b></span><span>今回の星晶石 <b>${R.stones}</b></span><span>デッキ ${R.deck.length}枚</span></div>
          <div class="tw-relics">${R.relics.map(id => `<span title="${U.esc(TOWER_RELICS[id].desc())}"><img src="${this.relicIcon(id)}">${U.esc(TOWER_RELICS[id].n)}</span>`).join('')}</div>`;
        body.innerHTML = '';
        body.appendChild(U.el('div', 'tw-q', R.choices[0] === 'boss' ? '番人が待ち構えている…!' : '次はどこへ進む?'));
        const items = R.choices.map(k => ({ label: `<span class="tw-ic tw-${k}">${NODE[k].icon}</span><b>${NODE[k].n}</b><br><small>${NODE[k].d}</small>`, cls: 'tw-node' }));
        items.push({ label: '🃏 デッキを見る', cls: 'tw-sub' }, { label: '🏳 撤退する(報酬を持ち帰る)', cls: 'tw-sub' }, { label: '一度外に出る(続きから再開できる)', cls: 'tw-sub' });
        lm = new ListMenu({
          items, onSelect: async i => {
            lm.locked = true;
            if (i < R.choices.length) await this.enter(R.choices[i]);
            else if (i === R.choices.length) await this.viewDeck();
            else if (i === R.choices.length + 1) { const c = await UI.ask('撤退しますか?\n(ここまでの星晶石は持ち帰れます)', ['撤退する', 'やめる']); if (c === 0) { await this.endRun(false); } }
            else { close(); return; }
            if (lm) lm.locked = false;
            if (!G.towerRun) { close(); return; }
            render();
          },
          onCancel: () => close(),
        });
        body.appendChild(lm.el);
      };
      UI.push(layer);
      render();
    });
  },
  relicIcon(id) { this._ri = this._ri || {}; return this._ri[id] || (this._ri[id] = iconCanvas(TOWER_RELICS[id].icon, '#ffd94a').toDataURL()); },

  async enter(kind) {
    const R = G.towerRun;
    if (kind === 'battle' || kind === 'elite' || kind === 'boss') {
      const f = R.floor + 1;
      const g = this.enemyGroup(f, kind);
      const res = await Battle.start(g.ids, { bg: g.bg, boss: kind === 'boss', mulOf: this.mulFor(f, kind), deck: R.deck, pool: { hp: R.hp, max: R.max }, extraRelics: this.extraRelics(), noReward: true, noEscape: true, arena: true, tag: kind === 'elite' ? '【精鋭】' : kind === 'boss' ? `【${f}階の番人】` : '' });
      Game.scene = 'field';
      Sound.bgm('boss');
      if (res !== 'win') { R.hp = 0; await this.endRun(true); return; }
      R.hp = Math.max(1, Battle.finalHP || R.hp);
      const st = kind === 'boss' ? 400 : kind === 'elite' ? 120 : 40;
      const dust = kind === 'boss' ? 120 : kind === 'elite' ? 60 : 25;
      R.stones += st; R.dust += dust;
      G.stones += st; Game.hud();
      let msg = `勝利! 星晶石 +${st} / 星屑 +${dust}`;
      if (kind === 'elite' && Math.random() < 0.6) { const r = this.giveRelic(); if (r) msg += `\nレリック「${TOWER_RELICS[r].n}」を手に入れた!`; }
      if (kind === 'boss') {
        G.tower.clears = (G.tower.clears || 0) + 1;
        if (Math.random() < 0.5 + Math.min(0.4, f / 100)) { const w = U.pick(TOWER_WEAPONS); const t = grant({ card: w }); msg += `\n塔の武器カード ${t} を手に入れた!\n(デッキ画面の共通カード枠に入れられます)`; }
        const r = this.giveRelic(); if (r) msg += `\nレリック「${TOWER_RELICS[r].n}」を手に入れた!`;
      }
      Sound.play('chest');
      await UI.say(msg);
      await this.cardReward(kind);
    } else if (kind === 'rest') await this.rest();
    else if (kind === 'shop') await this.shop();
    else if (kind === 'event') await this.event();
    if (G.towerRun) this.advance();
  },
  advance() {
    const R = G.towerRun;
    R.floor++;
    const s = this.stats();
    if (R.floor > s.best) {
      const bonus = 100;
      s.best = R.floor; G.stones += bonus; R.stones += bonus;
      UI.toast(`最高到達 ${R.floor}階 更新! 星晶石 +${bonus}`, 1800);
      for (const [f, n] of TOWER_TITLES) if (R.floor === f) setTimeout(() => UI.toast(`称号「${n}」を獲得!`, 2400), 1900);
    }
    this.nextChoices();
    Game.hud();
    Game.autoSave(true);
  },
  async endRun(lost) {
    const R = G.towerRun;
    const f = R.floor;
    G.towerRun = null;
    healAll();
    Game.autoSave(true);
    await UI.say(`${lost ? 'パーティは力尽きた…。' : '塔から撤退した。'}\n到達: ${f}階 ／ 最高記録: ${this.stats().best}階\nこの挑戦で得た星晶石: ${R.stones}${this.title() ? `\n称号「${this.title()}」` : ''}`);
  },
  giveRelic() {
    const R = G.towerRun;
    const left = Object.keys(TOWER_RELICS).filter(k => !R.relics.includes(k));
    if (!left.length) return null;
    const id = U.pick(left);
    R.relics.push(id);
    const r = TOWER_RELICS[id];
    if (r.maxhp) { const add = Math.round(R.max * r.maxhp); R.max += add; R.hp += add; }
    return id;
  },
  rewardChoices(kind) {
    const out = [];
    const party = partyChars().map(c => c.id);
    while (out.length < 3) {
      const r = Math.random();
      let k;
      if (r < 0.35 && party.length) k = U.pick(charCards(U.pick(party)));
      else { const rar = Math.random() < (kind === 'boss' ? 0.4 : kind === 'elite' ? 0.25 : 0.08) ? 5 : Math.random() < 0.35 ? 4 : 3; k = U.pick(cardPool(rar)); }
      if (k && !out.includes(k)) out.push(k);
    }
    return out;
  },
  pickCard(title, list, skipLabel = 'スキップ') {
    return new Promise(res => {
      const el = U.el('div', 'layer pick-layer');
      el.innerHTML = `<div class="pick-h">${U.esc(title)}</div>`;
      const row = U.el('div', 'pick-row');
      let sel = 0;
      const cards = list.map((cid, i) => { const w = U.el('div', 'pick-c'); w.innerHTML = cardFaceHTML(cid); w.onclick = e => { e.stopPropagation(); done(cid); }; row.appendChild(w); return w; });
      const skip = U.el('div', 'btn sub', skipLabel);
      skip.onclick = e => { e.stopPropagation(); done(null); };
      el.append(row, skip);
      const mark = () => cards.forEach((w, i) => w.classList.toggle('cur', i === sel));
      const done = v => { UI.pop(layer); Sound.play(v ? 'ok' : 'cancel'); res(v); };
      const layer = { el, handle: k => { if (k === 'left') { sel = (sel + list.length - 1) % list.length; mark(); } else if (k === 'right') { sel = (sel + 1) % list.length; mark(); } else if (k === 'a') done(list[sel]); else if (k === 'b') done(null); } };
      UI.push(layer); mark();
    });
  },
  async cardReward(kind) {
    const cid = await this.pickCard('カードを1枚デッキに加える', this.rewardChoices(kind));
    if (cid) { G.towerRun.deck.push(cid); UI.toast(`「${CARDS[cid].n}」をデッキに加えた`); }
  },
  deckIds() { return [...new Set(G.towerRun.deck)].filter(c => !CARDS[c].blank); },
  async upgradeCard() {
    const ids = this.deckIds();
    const cid = await this.pickCardList('強化するカードを選ぶ(この挑戦の間 +1)', ids);
    if (!cid) return false;
    G.towerRun.up[cid] = (G.towerRun.up[cid] || 0) + 1;
    Sound.play('levelup');
    UI.toast(`「${CARDS[cid].n}」を強化した!`);
    return true;
  },
  pickCardList(title, ids) {
    return new Promise(res => {
      let chosen = null;
      Menu.tabList({
        title, tabs: [{ n: 'すべて' }, { n: 'アタック', f: k => CARDS[k].type === 'a' }, { n: 'スキル', f: k => CARDS[k].type === 's' }],
        items: () => ids,
        label: k => `<span class="rar r${Math.min(5, CARDS[k].rar)}">★${Math.min(5, CARDS[k].rar)}</span> ${U.esc(CARDS[k].n)}${cardLevel(k) ? ` <b class="lb">+${cardLevel(k)}</b>` : ''} <small class="eqst">⚡${cardCost(k)} ${U.esc(cardDesc(k))}</small>`,
        note: k => cardFaceHTML(k, { cls: 'big' }),
        onSelect: async (k, ctx) => { chosen = k; ctx.close(); },
      }).then(() => res(chosen));
    });
  },
  async rest() {
    const R = G.towerRun;
    const heal = Math.round(R.max * 0.35);
    const c = await UI.ask(`静かな休憩所だ。\n(HP ${R.hp}/${R.max})`, [`休む (HP +${heal})`, 'カードを1枚強化する']);
    if (c === 1) { if (!(await this.upgradeCard())) { R.hp = Math.min(R.max, R.hp + heal); } }
    else { R.hp = Math.min(R.max, R.hp + heal); Sound.play('heal'); }
  },
  async shop() {
    const R = G.towerRun;
    const stock = this.rewardChoices('elite');
    const relic = Object.keys(TOWER_RELICS).filter(k => !R.relics.includes(k));
    const relicId = relic.length ? U.pick(relic) : null;
    for (; ;) {
      const opts = [`カードを買う (星屑 60)`, `カードを強化 (星屑 70)`, `カードを1枚削除 (星屑 50)`, `回復 HP+30% (星屑 40)`];
      if (relicId && !R.relics.includes(relicId)) opts.push(`レリック「${TOWER_RELICS[relicId].n}」(星屑 120)`);
      opts.push('立ち去る');
      const c = await UI.ask(`星屑の商人「いらっしゃい、なんでもあるよ」\n(星屑 ${R.dust})`, opts);
      if (c < 0 || c === opts.length - 1) break;
      const pay = n => { if (R.dust < n) { Sound.play('buzz'); UI.toast('星屑が足りない'); return false; } R.dust -= n; return true; };
      if (c === 0 && R.dust >= 60) { const cid = await this.pickCard('買うカードを選ぶ', stock, 'やめる'); if (cid && pay(60)) { R.deck.push(cid); stock.splice(stock.indexOf(cid), 1); } }
      else if (c === 1 && R.dust >= 70) { const ok = await this.upgradeCard(); if (ok) pay(70); }
      else if (c === 2 && R.dust >= 50) { const cid = await this.pickCardList('削除するカード', [...new Set(R.deck)]); if (cid && pay(50)) { R.deck.splice(R.deck.indexOf(cid), 1); UI.toast(`「${CARDS[cid].n}」を削除した`); } }
      else if (c === 3 && pay(40)) { R.hp = Math.min(R.max, R.hp + Math.round(R.max * 0.3)); Sound.play('heal'); }
      else if (c === 4 && relicId && pay(120)) { R.relics.push(relicId); const r = TOWER_RELICS[relicId]; if (r.maxhp) { const add = Math.round(R.max * r.maxhp); R.max += add; R.hp += add; } Sound.play('chest'); }
      else Sound.play('buzz');
    }
  },
  async event() {
    const R = G.towerRun;
    const evs = [
      async () => { const c = await UI.ask('怪しい祭壇がある。\n「血を捧げよ。さすれば力を授けん」', ['HPを15%捧げる', '立ち去る']); if (c === 0) { R.hp = Math.max(1, R.hp - Math.round(R.max * 0.15)); const r = this.giveRelic(); await UI.say(r ? `レリック「${TOWER_RELICS[r].n}」を授かった!` : '何も起こらなかった…'); } },
      async () => { const v = Math.round(R.max * 0.25); R.hp = Math.min(R.max, R.hp + v); Sound.play('heal'); await UI.say(`星の泉を見つけた。\n冷たい水がパーティを癒した。(HP +${v})`); },
      async () => { const v = 40 + Math.floor(Math.random() * 60); R.dust += v; Sound.play('chest'); await UI.say(`迷子の商人を助けた。\nお礼に星屑を ${v} もらった!`); },
      async () => { const c = await UI.ask('呪われた宝箱だ。\n開ければ強いカードが手に入るが、\n「空白のカード」も混ざってしまう。', ['開ける', 'やめておく']); if (c === 0) { const k = U.pick(cardPool(5)); R.deck.push(k, 'blank'); Sound.play('chest'); await UI.say(`「${CARDS[k].n}」を手に入れた!\n…しかし空白のカードがデッキに混ざった。`); } },
      async () => { const c = await UI.ask('星を観る少女がいる。\n「あなたのカード、少しだけ磨いてあげる」', ['お願いする', '断る']); if (c === 0) await this.upgradeCard(); },
      async () => { const v = 80 + Math.floor(R.floor * 4); G.stones += v; R.stones += v; Game.hud(); Sound.play('chest'); await UI.say(`床に星晶石が散らばっている!\n星晶石 +${v}`); },
    ];
    await U.pick(evs)();
  },
  async viewDeck() {
    const counts = {};
    for (const c of G.towerRun.deck) counts[c] = (counts[c] || 0) + 1;
    Battle.viewPile ? Battle.viewPile.call(Battle, `塔のデッキ`, G.towerRun.deck.map(cid => ({ cid }))) : null;
    await new Promise(r => { const iv = setInterval(() => { if (!UI.stack.some(l => l.el && l.el.classList.contains('pile-layer'))) { clearInterval(iv); r(); } }, 150); });
  },
};
