'use strict';
// ===== レリック (★5キャラ固有。パーティにいるだけで戦闘中に発動) =====
// L = そのキャラの凸数 (0〜5)。凸するほど数値が上がる。
// フック: start(B,L) 戦闘開始時 / turn(B,L) 毎ターン開始時 / draw(L) 最初のターンの追加ドロー
//         attack(B,L,count) アタックを使うたび / win(B,L) 勝利時
const RELICS = {
  seres: {
    n: '白銀の盾章', icon: 'armor',
    desc: L => `戦闘開始時、ブロック${8 + 4 * L}を得る`,
    start: (B, L) => B.relicBlock(8 + 4 * L),
  },
  noa: {
    n: '宵闇のグリモワール', icon: 'staff',
    desc: L => `戦闘開始時、敵全体に脱力${1 + Math.floor(L / 2)}`,
    start: (B, L) => { for (const e of B.enemies) if (e.alive) B.debuff(e, 'weak', 1 + Math.floor(L / 2)); },
  },
  homura: {
    n: '紅蓮の鈴', icon: 'amulet',
    desc: L => `戦闘開始時、筋力+${1 + Math.floor(L / 2)}`,
    start: (B, L) => B.relicSt('str', 1 + Math.floor(L / 2)),
  },
  sylphy: {
    n: '風精の羽飾り', icon: 'tiara',
    desc: L => `最初のターン、カードを${2 + Math.floor(L / 2)}枚多く引く`,
    draw: L => 2 + Math.floor(L / 2),
  },
  stella: {
    n: '星詠みの指輪', icon: 'ring',
    desc: L => `毎ターン開始時、HPを${3 + L}回復`,
    turn: (B, L) => B.relicHeal(3 + L),
  },
  marina: {
    n: '人魚の涙', icon: 'amulet',
    desc: L => `戦闘に勝利すると、最大HPの${6 + 2 * L}%回復`,
    win: (B, L) => B.relicHeal(Math.round(B.P.max * (6 + 2 * L) / 100)),
  },
  terra: {
    n: '竜鱗の首飾り', icon: 'amulet',
    desc: L => `毎ターン開始時、ブロック${3 + L}を得る`,
    turn: (B, L) => B.relicBlock(3 + L),
  },
  kanae: {
    n: '銀のティーセット', icon: 'ring',
    desc: L => `戦闘開始時、奉仕+${1 + Math.floor(L / 2)}`,
    start: (B, L) => B.relicSt('serve', 1 + Math.floor(L / 2)),
  },
  lumia: {
    n: '全力のお守り', icon: 'amulet',
    desc: L => `アタックを${L >= 5 ? 2 : 3}枚使うたびに筋力+1`,
    attack: (B, L, n) => { if (n % (L >= 5 ? 2 : 3) === 0) B.relicSt('str', 1); },
  },
  rapidhat: {
    n: 'うさぎの懐中ハット', icon: 'tiara',
    desc: L => `戦闘開始時、トリックカードを${2 + Math.floor(L / 2)}枚手札に加える`,
    start: (B, L) => { for (let k = 0; k < 2 + Math.floor(L / 2); k++) B.addToHand(U.pick(Object.keys(TRICK_CARDS))); },
  },
  viola: {
    n: '真紅のペンダント', icon: 'amulet',
    desc: L => `HPが半分以下のとき、与えるダメージ+${25 + 5 * L}%`,
    bonus: { dmg: (L, B) => B.P.hp <= B.P.max / 2 ? (25 + 5 * L) / 100 : 0 },
  },
  aurora: {
    n: '極光のティアラ', icon: 'tiara',
    desc: L => `チャージ1段階ごとの威力上昇 +50% → +${70 + 6 * L}%`,
    bonus: { charge: L => (20 + 6 * L) / 100 },
  },
  luka: {
    n: '船長の羅針盤', icon: 'ring',
    desc: L => `毎ターン開始時、敵全体に${3 + L}ダメージ`,
    turn: (B, L) => { for (const e of B.enemies) if (e.alive) B.hitEnemy(e, 3 + L); },
  },
  yumeno: {
    n: '攻略本', icon: 'staff',
    desc: L => `戦闘開始時、カードを${2 + Math.floor(L / 2)}枚多く引き、次のカードのコスト0`,
    draw: L => 2 + Math.floor(L / 2),
    start: (B) => { B.addSt(B.P, 'free', 1); },
  },
  nagisa: { n: '燃える拳帯', icon: 'amulet', desc: L => `毎ターン開始時、筋力+${L >= 5 ? 2 : 1}`, turn: (B, L) => B.relicSt('str', L >= 5 ? 2 : 1) },
  shion: { n: '黒のキング', icon: 'ring', desc: L => `最初のターン、カードを${1 + Math.floor(L / 3)}枚多く引き、次のカードのコスト0`, draw: L => 1 + Math.floor(L / 3), start: (B) => B.addSt(B.P, 'free', 1) },
  koharu: { n: '応援ポンポン', icon: 'tiara', desc: L => `戦闘開始時、エナジー+${L >= 5 ? 2 : 1}`, start: (B, L) => { B.energy += L >= 5 ? 2 : 1; B.popParty('エナジーUP', 'mp'); } },
  sumire: { n: '毒々フラスコ', icon: 'staff', desc: L => `戦闘開始時、敵全体に毒${4 + 2 * L}`, start: (B, L) => { for (const e of B.enemies) if (e.alive) B.debuff(e, 'poison', 4 + 2 * L); } },
  tsumugi: { n: 'ぬいぐるみの鞄', icon: 'amulet', desc: L => `戦闘開始時、使い魔を${L >= 4 ? 2 : 1}体召喚`, start: (B, L) => B.summon(L >= 4 ? 2 : 1, 'tsumugi_0') },
  rio: { n: 'ラッキーダイス', icon: 'ring', desc: L => `コインの表が出る確率UP(+${8 + 3 * L}%)。サイコロの目が3以下なら振り直すことがある`, bonus: { luck: L => (8 + 3 * L) / 100 } },
  kuroha: { n: '呪いの手鏡', icon: 'amulet', desc: L => `戦闘開始時、敵全体に呪い${2 + L}`, start: (B, L) => { for (const e of B.enemies) if (e.alive) B.debuff(e, 'curse', 2 + L); } },
  seira: { n: '金のタクト', icon: 'staff', desc: L => `戦闘開始時、次のアタックが全体化し、ブロックが${1 + Math.floor(L / 3)}ターン残る`, start: (B, L) => { B.relicSt('echo', 1); B.relicSt('barricade', 1 + Math.floor(L / 3)); } },
  misuzu: {
    n: '陽だまりの髪飾り', icon: 'tiara',
    desc: L => `戦闘開始時、再生${3 + L}`,
    start: (B, L) => B.relicSt('regen', 3 + L),
  },
};
const RELIC_ICON = {};
function relicIconURL(id) {
  if (RELIC_ICON[id]) return RELIC_ICON[id];
  const r = RELICS[id];
  return (RELIC_ICON[id] = iconCanvas(r.icon, ELEM[CHARS[id].elem].c).toDataURL());
}
function relicLevel(id) { return G && G.roster[id] ? G.roster[id].lb : 0; }
function relicHTML(id, L = relicLevel(id)) {
  const r = RELICS[id];
  if (!r) return '';
  return `<div class="relic"><img src="${relicIconURL(id)}"><div><b>${U.esc(r.n)}</b>${L ? ` <span class="lb">${L}凸</span>` : ''}<br><small>${U.esc(r.desc(L))}</small></div></div>`;
}
