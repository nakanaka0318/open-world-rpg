'use strict';
// ===== カード (スレスパ風デッキバトル) =====
// 効果の書き方 (半角スペース区切り):
//  d8 = 敵1体に8ダメージ / d4x3 = 4ダメージを3回 / D6 = 敵全体に6ダメージ
//  b8 = ブロック8 / h6 = HP6回復 / c2 = 2枚引く / e1 = エナジー+1
//  s2 = 筋力+2 / f2 = 敏捷+2 / g3 = 再生3 / t3 = トゲ3
//  v2 = 脆弱2 / w2 = 脱力2 / p4 = 毒4 (小文字は敵1体、大文字 V W P は敵全体)
//  !E = 廃棄 (この戦闘で1回きり) / !R = 保留 (ターン終了時に捨てない) / !S = 奉仕 (使うと奉仕回数+1)
//  z8 = 防御無視で8ダメージ+奉仕した回数×6 / m3 = 献身3ターン(与ダメ1/2、回復とブロック2.5倍)
//  q1 = 防御無視で「この戦闘で得たブロック+回復したHP」分のダメージ
// 数値はキャラのレベル(攻撃・防御・魔力)と、凸(固有カード)・精錬(共通カード)で上がります。

const CARD_TYPE = { a: 'アタック', s: 'スキル' };

// 各キャラ5枚の固有カード: [名前, 種類, コスト, 効果]
const UNIQUE_CARDS = {
  aria: [['星の剣', 'a', 1, 'd7'], ['パワースラッシュ', 'a', 2, 'd13'], ['星の盾', 's', 1, 'b7'], ['ホーリーブレード', 'a', 1, 'd5 v1'], ['ひらめき', 's', 0, 'c2 !E']],
  seres: [['聖騎士の剣', 'a', 1, 'd8'], ['ヒール', 's', 1, 'h8'], ['聖なる守り', 's', 1, 'b10'], ['ジャッジメント', 'a', 2, 'D9 V1'], ['盾の誓い', 's', 2, 'b16 t3']],
  noa: [['ダークボール', 'a', 1, 'd9'], ['ドレイン', 'a', 1, 'd6 h4'], ['カース', 's', 1, 'w2 v2'], ['ブラックホール', 'a', 2, 'D12'], ['宵闇の契約', 's', 0, 'e2 !E']],
  homura: [['炎舞斬り', 'a', 1, 'd9'], ['鬼神化', 's', 1, 's2 !E'], ['紅蓮一閃', 'a', 2, 'D10'], ['火炎陣', 'a', 1, 'd5 p4'], ['巫女の祓い', 's', 1, 'b8 c1']],
  sylphy: [['ウィンドアロー', 'a', 1, 'd8'], ['アローレイン', 'a', 1, 'D5'], ['疾風の加護', 's', 1, 'c2 e1 !E'], ['精霊の矢', 'a', 0, 'd4 c1'], ['トルネード', 'a', 2, 'D7x2']],
  stella: [['スターライト', 'a', 1, 'd9 w1'], ['ハイヒール', 's', 1, 'h12'], ['スターフォール', 'a', 2, 'D8x2'], ['星の祈り', 's', 2, 'h10 s2 !E'], ['流れ星', 'a', 0, 'd6 c1 !E']],
  marina: [['アクア', 'a', 1, 'd8'], ['潮騒の歌', 's', 1, 'h6 b6'], ['タイダルウェイブ', 'a', 2, 'D11'], ['人魚の子守唄', 's', 1, 'W2'], ['アンコール', 's', 1, 'c3 !E']],
  terra: [['ロックハンマー', 'a', 1, 'd10'], ['竜鱗の守り', 's', 1, 'b11'], ['ドラゴンランス', 'a', 2, 'd18 v2'], ['グランドクエイク', 'a', 2, 'D9 W1'], ['竜の血潮', 's', 1, 's2 b5 !E']],
  shizuku: [['アクア', 'a', 1, 'd6'], ['ヒール', 's', 1, 'h8'], ['ヒールオール', 's', 2, 'h14 !E'], ['癒しの泉', 's', 1, 'g4'], ['水のヴェール', 's', 1, 'b7']],
  yuki: [['アイスニードル', 'a', 1, 'd7'], ['ブリザード', 'a', 2, 'D8'], ['氷の壁', 's', 1, 'b8'], ['フロストバイト', 'a', 1, 'd4 w2'], ['凍てつく視線', 's', 0, 'v2 !E']],
  lily: [['ロックハンマー', 'a', 1, 'd9'], ['鉄壁', 's', 1, 'b9'], ['アーマーブレイク', 'a', 1, 'd5 v2'], ['グランドクエイク', 'a', 2, 'D8'], ['大振り', 'a', 2, 'd16']],
  miko: [['ホーリー', 'a', 1, 'd7'], ['ヒール', 's', 1, 'h8'], ['キュア', 's', 0, 'h3 c1'], ['ねこパンチ', 'a', 0, 'd3x2'], ['祝福', 's', 1, 'g3 b5']],
  kagura: [['二段斬り', 'a', 1, 'd4x2'], ['影縫い', 'a', 1, 'd3x3'], ['風遁', 'a', 1, 'D5'], ['変わり身', 's', 1, 'b8'], ['毒手裏剣', 'a', 1, 'd4 p4']],
  akane: [['炎の舞', 'a', 1, 'd4x2'], ['応援歌', 's', 1, 's1 c1 !E'], ['ファイア', 'a', 1, 'd8'], ['ステップ', 's', 0, 'b4 c1'], ['フレイムストーム', 'a', 2, 'D9']],
  lilith: [['シャドウ', 'a', 1, 'd7'], ['ドレイン', 'a', 1, 'd5 h4'], ['カース', 's', 1, 'w2'], ['悪魔のささやき', 's', 1, 'v2 c1'], ['ダークボール', 'a', 2, 'd15']],
  tsubaki: [['居合・桜花', 'a', 1, 'd9'], ['二段斬り', 'a', 1, 'd5x2'], ['千本桜', 'a', 2, 'D6x2'], ['見切り', 's', 1, 'b8'], ['心眼', 's', 1, 's1 c1 !E']],
  mei: [['ファイア', 'a', 1, 'd7'], ['火の粉', 'a', 0, 'd3'], ['フレイムストーム', 'a', 2, 'D7'], ['魔法の盾', 's', 1, 'b6'], ['がんばる!', 's', 1, 's1 !E']],
  popo: [['二段斬り', 'a', 1, 'd3x2'], ['すり抜け', 's', 1, 'b5 c1'], ['ウィンド', 'a', 1, 'd6'], ['足払い', 'a', 1, 'd4 w1'], ['お宝さがし', 's', 0, 'c2 !E']],
  coco: [['正拳突き', 'a', 1, 'd8'], ['連打', 'a', 1, 'd2x4'], ['鉄壁', 's', 1, 'b7'], ['気合', 's', 1, 's1 !E'], ['回し蹴り', 'a', 2, 'D7']],
  nemu: [['シャドウ', 'a', 1, 'd6'], ['応援歌', 's', 1, 's1 !E'], ['子守唄', 's', 1, 'W1'], ['カース', 's', 1, 'w2'], ['休符', 's', 0, 'b4']],
  pico: [['ヒール', 's', 1, 'h7'], ['アクア', 'a', 1, 'd6'], ['キュア', 's', 0, 'h3'], ['お祈り', 's', 1, 'g3'], ['水鉄砲', 'a', 0, 'd3']],
  sora: [['スラッシュ', 'a', 1, 'd7'], ['騎士の盾', 's', 1, 'b8'], ['聖なる守り', 's', 2, 'b13'], ['シールドバッシュ', 'a', 1, 'd5 b4'], ['突撃', 'a', 2, 'd13']],
  mint: [['ヒール', 's', 1, 'h7'], ['薬草', 's', 0, 'g2'], ['ウィンド', 'a', 1, 'd6'], ['しびれ薬', 's', 1, 'w2'], ['毒草', 'a', 1, 'p5']],
  kanae: [['お茶をどうぞ', 's', 1, 'g3 c1 !S'], ['お掃除', 's', 0, 'b5 c1 !S'], ['お支度', 's', 1, 'e2 !E !S'], ['お出迎え', 's', 1, 'b8 s1 !S'], ['ご奉仕の成果', 'a', 2, 'z8']],
  lumia: [['全力ストライク', 'a', 1, 'd9 s1'], ['揺さぶり', 'a', 1, 'd7 v2'], ['全力全開', 'a', 2, 'd16 s2'], ['崩しの一手', 'a', 2, 'd12 w2 v2'], ['がむしゃらな連撃', 'a', 1, 'd5x2 s1']],
  misuzu: [['そっと叩く', 'a', 1, 'd6'], ['守りの構え', 's', 1, 'b12'], ['いたわりの手', 's', 1, 'h12'], ['献身の誓い', 's', 1, 'm3 !E'], ['想いの一撃', 'a', 2, 'q1 !E']],
  chloe: [['ひっかき', 'a', 1, 'd3x2'], ['シャドウ', 'a', 1, 'd6'], ['しのび足', 's', 1, 'b6'], ['カース', 's', 1, 'w1 v1'], ['猫の気まぐれ', 's', 0, 'c1 e1 !E']],
};

// 共通カード (カード召喚・宝箱で入手): id: [名前, 種類, コスト, 効果, レア度]
const COMMON_CARDS = {
  c_strike: ['ストライク', 'a', 1, 'd6', 3],
  c_defend: ['ディフェンド', 's', 1, 'b5', 3],
  c_quick: ['クイックスラッシュ', 'a', 0, 'd3 c1', 3],
  c_bandage: ['応急手当', 's', 1, 'h5', 3],
  c_focus: ['集中', 's', 1, 'c2', 3],
  c_twin: ['二連撃', 'a', 1, 'd4x2', 3],
  c_wall: ['鉄壁の構え', 's', 2, 'b12', 3],
  c_trip: ['足払い', 'a', 1, 'd4 w1', 3],
  c_aim: ['急所狙い', 'a', 1, 'd5 v1', 3],
  c_rage: ['気合だめ', 's', 1, 's1 !E', 3],
  c_whirl: ['旋風斬り', 'a', 1, 'D6', 4],
  c_venom: ['毒の刃', 'a', 1, 'd4 p4', 4],
  c_bash: ['盾打ち', 'a', 1, 'd6 b5', 4],
  c_medit: ['瞑想', 's', 0, 'e1 c1 !E', 4],
  c_bless: ['加護の祈り', 's', 1, 'b6 g3', 4],
  c_bigheal: ['大治癒', 's', 2, 'h16 !E', 4],
  c_heavy: ['渾身の一撃', 'a', 2, 'd17', 4],
  c_spike: ['トゲの鎧', 's', 1, 't3 b4', 4],
  c_star: ['星の剣', 'a', 2, 'D13', 5],
  c_hourglass: ['時の砂', 's', 0, 'e2 !E', 5],
  c_miracle: ['奇跡の祈り', 's', 2, 'h25 b10 !E', 5],
  c_dragon: ['竜の血', 's', 1, 's3 !E', 5],
  c_thousand: ['千本突き', 'a', 2, 'd3x6', 5],
  c_aegis: ['無敵の盾', 's', 2, 'b24', 5],
};
const STARTER_DECK = ['c_strike', 'c_defend', 'c_quick', 'c_bandage', 'c_focus'];

// ---------- 構築 ----------
const CARDS = {};
function parseFx(str) {
  const ops = [], flags = {};
  for (const tk of str.split(/\s+/)) {
    if (tk === '!E') { flags.exhaust = true; continue; }
    if (tk === '!R') { flags.retain = true; continue; }
    if (tk === '!S') { flags.serve = true; continue; }
    const m = /^([a-zA-Z])(\d+)(?:x(\d+))?$/.exec(tk);
    if (!m) continue;
    ops.push({ k: m[1], n: +m[2], hits: m[3] ? +m[3] : 1 });
  }
  return { ops, flags };
}
(function buildCards() {
  for (const owner in UNIQUE_CARDS) {
    UNIQUE_CARDS[owner].forEach(([n, type, cost, fx], i) => {
      const p = parseFx(fx);
      CARDS[owner + '_' + i] = { id: owner + '_' + i, n, type, cost, ops: p.ops, flags: p.flags, owner, rar: CHARS[owner] ? CHARS[owner].rar : 3 };
    });
  }
  for (const id in COMMON_CARDS) {
    const [n, type, cost, fx, rar] = COMMON_CARDS[id];
    const p = parseFx(fx);
    CARDS[id] = { id, n, type, cost, ops: p.ops, flags: p.flags, owner: null, rar, common: true };
  }
  CARDS.blank = { id: 'blank', n: '空白のカード', type: 's', cost: -1, ops: [], flags: {}, owner: null, rar: 1, blank: true };
})();
function charCards(charId) { return [0, 1, 2, 3, 4].map(i => charId + '_' + i).filter(id => CARDS[id]); }
function cardPool(rar) { return Object.keys(COMMON_CARDS).filter(k => COMMON_CARDS[k][4] === rar); }
function cardNeedsTarget(c) { return c.ops.some(o => 'dvwpzq'.includes(o.k)); }

// 強化段階 (固有=凸数, 共通=精錬)
function cardLevel(cid) {
  const c = CARDS[cid];
  if (!c || c.blank) return 0;
  if (c.owner) return G && G.roster[c.owner] ? G.roster[c.owner].lb : 0;
  return G && G.cards && G.cards[cid] ? G.cards[cid].r : 0;
}
function cardCost(cid, L = cardLevel(cid)) { const c = CARDS[cid]; if (c.cost >= 2 && L >= 5) return c.cost - 1; return c.cost; }
function powMult(v) { return 0.4 + v / 22; }
function cardPower(cid) {
  const c = CARDS[cid];
  if (c.owner && G && G.roster[c.owner]) { const s = charStats(G.roster[c.owner]); const b = CHARS[c.owner].base; return { p: b.atk >= b.mag ? s.atk : s.mag, def: s.def, mag: s.mag }; }
  const pc = G ? partyChars() : [];
  if (!pc.length) return { p: 14, def: 10, mag: 10 };
  const avg = k => pc.reduce((a, ch) => a + charStats(ch)[k], 0) / pc.length;
  return { p: Math.max(avg('atk'), avg('mag')), def: avg('def'), mag: avg('mag') };
}
// 実際の数値を計算した効果
function cardOps(cid) {
  const c = CARDS[cid];
  const L = cardLevel(cid), pw = cardPower(cid);
  const up = 1 + 0.25 * L;
  const st = (L >= 3 ? 1 : 0) + (L >= 5 ? 1 : 0);
  return c.ops.map(o => {
    let n = o.n;
    if (o.k === 'd' || o.k === 'D') n = Math.max(1, Math.round(o.n * up * powMult(pw.p)));
    else if (o.k === 'z') return { k: 'z', n: Math.round(o.n * up * powMult(pw.p)), per: Math.round(o.n * 0.75 * up * powMult(pw.p)), hits: 1 };
    else if (o.k === 'b') n = Math.round(o.n * up * powMult(pw.def * 1.3));
    else if (o.k === 'h' || o.k === 'g') n = Math.round(o.n * up * powMult(pw.mag * 1.2));
    else if (o.k === 'm' || o.k === 'q') n = o.n;
    else if ('pPt'.includes(o.k)) n = Math.round(o.n * up * (0.5 + powMult(pw.p) * 0.5));
    else if ('sfvwVW'.includes(o.k)) n = o.n + st;
    return { k: o.k, n, hits: o.hits };
  });
}
const FX_TXT = {
  z: (n, h, o) => `防御無視で${n}ダメージ+奉仕した回数×${o.per}`, q: () => 'この戦闘で得たブロック+回復したHP分の防御無視ダメージ', m: n => `献身${n}ターン(与ダメージ1/2、回復とブロック2.5倍)`,
  d: (n, h) => `${n}ダメージ${h > 1 ? '×' + h : ''}`, D: (n, h) => `敵全体に${n}ダメージ${h > 1 ? '×' + h : ''}`,
  b: n => `ブロック${n}`, h: n => `HP${n}回復`, c: n => `${n}枚引く`, e: n => `エナジー+${n}`,
  s: n => `筋力+${n}`, f: n => `敏捷+${n}`, g: n => `再生${n}`, t: n => `トゲ${n}`,
  v: n => `脆弱${n}`, w: n => `脱力${n}`, p: n => `毒${n}`, V: n => `敵全体に脆弱${n}`, W: n => `敵全体に脱力${n}`, P: n => `敵全体に毒${n}`,
};
function cardDesc(cid, ops) {
  const c = CARDS[cid];
  if (c.blank) return '何も起こらない';
  ops = ops || cardOps(cid);
  const t = ops.map(o => FX_TXT[o.k] ? FX_TXT[o.k](o.n, o.hits, o) : '').filter(Boolean);
  if (c.flags.serve) t.unshift('奉仕');
  if (c.flags.exhaust) t.push('廃棄');
  if (c.flags.retain) t.push('保留');
  return t.join('。');
}
const CARD_ICON = {};
function cardArtURL(cid) {
  const c = CARDS[cid];
  if (c.owner && CHARS[c.owner]) return portraitURL(CHARS[c.owner].look);
  if (CARD_ICON[cid]) return CARD_ICON[cid];
  const main = c.ops[0] ? c.ops[0].k : 'b';
  const kind = c.blank ? 'ring' : 'dD'.includes(main) ? 'sword' : main === 'b' || main === 't' ? 'armor' : 'hg'.includes(main) ? 'amulet' : 'ce'.includes(main) ? 'staff' : 'tiara';
  const col = c.blank ? '#5a5a7a' : { 3: '#7ac8f0', 4: '#c27ff0', 5: '#ffd94a' }[c.rar];
  return (CARD_ICON[cid] = iconCanvas(kind, col).toDataURL());
}
// カードの見た目 (HTML)
function cardFaceHTML(cid, opts = {}) {
  const c = CARDS[cid];
  const L = cardLevel(cid);
  const cost = cardCost(cid, L);
  const owner = c.owner && CHARS[c.owner];
  const ops = opts.ops || cardOps(cid);
  return `<div class="ccard ${c.type === 'a' ? 'atk' : 'skl'} r${c.rar}${c.blank ? ' blank' : ''}${opts.cls ? ' ' + opts.cls : ''}" data-cid="${cid}">
    <div class="cc-cost">${cost < 0 ? '-' : cost}</div>
    <div class="cc-name">${U.esc(c.n)}${L ? `<b>+${L}</b>` : ''}</div>
    <div class="cc-art" ${owner ? `style="--oc:${ELEM[owner.elem].c}"` : ''}><img src="${cardArtURL(cid)}"></div>
    <div class="cc-type">${owner ? U.esc(owner.n) : (c.blank ? '―' : '共通')}・${CARD_TYPE[c.type]}</div>
    <div class="cc-desc">${U.esc(cardDesc(cid, ops))}</div>
  </div>`;
}
