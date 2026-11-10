'use strict';
// ===== ゲームデータ =====
const ELEM = {
  none: { n: '無', c: '#d0d0d0' },
  fire: { n: '火', c: '#ff6a3d' },
  water: { n: '水', c: '#3da5ff' },
  wind: { n: '風', c: '#5ee07a' },
  earth: { n: '土', c: '#d9a441' },
  light: { n: '光', c: '#ffe66d' },
  dark: { n: '闇', c: '#b36bff' },
};
// A は B に強い (水→火→風→土→水, 光⇔闇)
const BEATS = { water: 'fire', fire: 'wind', wind: 'earth', earth: 'water', light: 'dark', dark: 'light' };
function elemMult(atkElem, defElem) {
  if (!atkElem || atkElem === 'none' || !defElem || defElem === 'none') return 1;
  if (BEATS[atkElem] === defElem) return 2;
  if (atkElem === defElem) return 0.5;
  return 1;
}

// ---------- スキル ----------
// type: phys/mag/heal/buff/debuff/revive/cure  target: enemy/enemies/ally/allies/self/dead
const SKILLS = {
  attack: { n: 'こうげき', mp: 0, type: 'phys', target: 'enemy', pow: 1 },
  // 物理
  slash: { n: 'パワースラッシュ', mp: 4, type: 'phys', target: 'enemy', pow: 1.6, desc: '力をこめた一撃' },
  holyblade: { n: 'ホーリーブレード', mp: 7, type: 'phys', target: 'enemy', pow: 1.9, elem: 'light', desc: '光をまとう斬撃' },
  flameslash: { n: '炎舞斬り', mp: 6, type: 'phys', target: 'enemy', pow: 1.8, elem: 'fire', desc: '炎の剣舞' },
  guren: { n: '紅蓮一閃', mp: 18, type: 'phys', target: 'enemies', pow: 1.7, elem: 'fire', desc: '敵全体を焼き斬る' },
  windarrow: { n: 'ウィンドアロー', mp: 5, type: 'phys', target: 'enemy', pow: 1.7, elem: 'wind', desc: '風の矢' },
  arrowrain: { n: 'アローレイン', mp: 14, type: 'phys', target: 'enemies', pow: 1.2, elem: 'wind', desc: '矢の雨で全体攻撃' },
  rockhammer: { n: 'ロックハンマー', mp: 6, type: 'phys', target: 'enemy', pow: 2.0, elem: 'earth', desc: '大地の大槌' },
  quake: { n: 'グランドクエイク', mp: 16, type: 'phys', target: 'enemies', pow: 1.4, elem: 'earth', desc: '地割れで全体攻撃' },
  double: { n: '二段斬り', mp: 5, type: 'phys', target: 'enemy', pow: 0.95, hits: 2, desc: '素早い二連撃' },
  shadowstep: { n: '影縫い', mp: 8, type: 'phys', target: 'enemy', pow: 1.2, hits: 3, elem: 'wind', desc: '三連の忍術' },
  punch: { n: '正拳突き', mp: 4, type: 'phys', target: 'enemy', pow: 1.8, desc: '気合の一撃' },
  starfall: { n: 'スターフォール', mp: 22, type: 'mag', target: 'enemies', pow: 2.2, elem: 'light', desc: '星の雨が降り注ぐ' },
  // 魔法
  fire: { n: 'ファイア', mp: 4, type: 'mag', target: 'enemy', pow: 1.6, elem: 'fire', desc: '火の玉' },
  firestorm: { n: 'フレイムストーム', mp: 14, type: 'mag', target: 'enemies', pow: 1.4, elem: 'fire', desc: '炎の嵐' },
  aqua: { n: 'アクア', mp: 4, type: 'mag', target: 'enemy', pow: 1.6, elem: 'water', desc: '水の弾丸' },
  ice: { n: 'アイスニードル', mp: 6, type: 'mag', target: 'enemy', pow: 1.9, elem: 'water', desc: '氷の針' },
  blizzard: { n: 'ブリザード', mp: 15, type: 'mag', target: 'enemies', pow: 1.5, elem: 'water', desc: '吹雪で全体攻撃' },
  gust: { n: 'ウィンド', mp: 4, type: 'mag', target: 'enemy', pow: 1.6, elem: 'wind', desc: 'かまいたち' },
  tornado: { n: 'トルネード', mp: 16, type: 'mag', target: 'enemies', pow: 1.6, elem: 'wind', desc: '竜巻で全体攻撃' },
  stone: { n: 'ストーン', mp: 4, type: 'mag', target: 'enemy', pow: 1.6, elem: 'earth', desc: '石つぶて' },
  holy: { n: 'ホーリー', mp: 8, type: 'mag', target: 'enemy', pow: 2.0, elem: 'light', desc: '聖なる光' },
  judgement: { n: 'ジャッジメント', mp: 20, type: 'mag', target: 'enemies', pow: 1.8, elem: 'light', desc: '裁きの光' },
  shadow: { n: 'シャドウ', mp: 4, type: 'mag', target: 'enemy', pow: 1.6, elem: 'dark', desc: '闇の弾' },
  darkball: { n: 'ダークボール', mp: 7, type: 'mag', target: 'enemy', pow: 2.1, elem: 'dark', desc: '闇の大玉' },
  blackhole: { n: 'ブラックホール', mp: 22, type: 'mag', target: 'enemies', pow: 2.0, elem: 'dark', desc: '全てを呑む闇' },
  drain: { n: 'ドレイン', mp: 6, type: 'mag', target: 'enemy', pow: 1.4, elem: 'dark', drain: 0.5, desc: '与えたダメージの半分を吸収' },
  // 回復
  heal: { n: 'ヒール', mp: 4, type: 'heal', target: 'ally', pow: 1.0, desc: '味方1人のHP回復' },
  healmore: { n: 'ハイヒール', mp: 9, type: 'heal', target: 'ally', pow: 2.4, desc: '味方1人のHPを大回復' },
  healall: { n: 'ヒールオール', mp: 14, type: 'heal', target: 'allies', pow: 1.2, desc: '味方全員のHP回復' },
  prayer: { n: '星の祈り', mp: 24, type: 'heal', target: 'allies', pow: 2.2, buff: ['atk', 1.3, 3], desc: '全員を大回復し攻撃力UP' },
  revive: { n: 'リヴァイブ', mp: 16, type: 'revive', target: 'dead', pow: 0.5, desc: '戦闘不能から復活' },
  cure: { n: 'キュア', mp: 3, type: 'cure', target: 'ally', desc: '毒を治す' },
  // 補助
  guard: { n: '聖なる守り', mp: 8, type: 'buff', target: 'allies', stat: 'def', mul: 1.4, turns: 3, desc: '味方全員の防御UP' },
  ironwall: { n: '鉄壁', mp: 5, type: 'buff', target: 'self', stat: 'def', mul: 1.8, turns: 3, desc: '自分の防御を大きくUP' },
  rage: { n: '鬼神化', mp: 8, type: 'buff', target: 'self', stat: 'atk', mul: 1.6, turns: 3, desc: '自分の攻撃を大きくUP' },
  cheer: { n: '応援歌', mp: 8, type: 'buff', target: 'allies', stat: 'atk', mul: 1.3, turns: 3, desc: '味方全員の攻撃UP' },
  haste: { n: '疾風の加護', mp: 8, type: 'buff', target: 'allies', stat: 'spd', mul: 1.5, turns: 3, desc: '味方全員の素早さUP' },
  curse: { n: 'カース', mp: 6, type: 'debuff', target: 'enemy', stat: 'atk', mul: 0.7, turns: 3, desc: '敵1体の攻撃DOWN' },
  break: { n: 'アーマーブレイク', mp: 6, type: 'debuff', target: 'enemy', stat: 'def', mul: 0.6, turns: 3, desc: '敵1体の防御DOWN' },
  tidal: { n: 'タイダルウェイブ', mp: 20, type: 'mag', target: 'enemies', pow: 1.9, elem: 'water', desc: '大波で敵全体を押し流す' },
  umisong: { n: '潮騒の歌', mp: 16, type: 'heal', target: 'allies', pow: 1.4, buff: ['def', 1.3, 3], desc: '全員を回復し防御UP' },
  dragonlance: { n: 'ドラゴンランス', mp: 14, type: 'phys', target: 'enemy', pow: 2.5, elem: 'earth', desc: '竜の力を宿す必殺の槍' },
  firedance: { n: '炎の舞', mp: 7, type: 'phys', target: 'enemy', pow: 1.0, hits: 2, elem: 'fire', desc: '炎をまとう二連撃' },
  iai: { n: '居合・桜花', mp: 9, type: 'phys', target: 'enemy', pow: 2.2, desc: '一瞬の抜刀術' },
  sakura: { n: '千本桜', mp: 16, type: 'phys', target: 'enemies', pow: 1.3, elem: 'wind', desc: '花吹雪の斬撃で全体攻撃' },
  // 敵専用
  e_bite: { n: 'かみつき', type: 'phys', target: 'enemy', pow: 1.3 },
  e_poison: { n: 'どくばり', type: 'phys', target: 'enemy', pow: 0.9, poison: 0.6 },
  e_fire: { n: 'ほのお', type: 'mag', target: 'enemy', pow: 1.4, elem: 'fire' },
  e_firebreath: { n: '灼熱のブレス', type: 'mag', target: 'enemies', pow: 1.3, elem: 'fire' },
  e_icebreath: { n: '凍てつく息吹', type: 'mag', target: 'enemies', pow: 1.3, elem: 'water' },
  e_ice: { n: 'こおりのつぶて', type: 'mag', target: 'enemy', pow: 1.4, elem: 'water' },
  e_wind: { n: 'かまいたち', type: 'mag', target: 'enemy', pow: 1.4, elem: 'wind' },
  e_leaf: { n: '木の葉の嵐', type: 'mag', target: 'enemies', pow: 1.2, elem: 'wind' },
  e_root: { n: 'からみつく根', type: 'phys', target: 'enemy', pow: 1.6 },
  e_rock: { n: 'いわおとし', type: 'phys', target: 'enemies', pow: 1.1, elem: 'earth' },
  e_smash: { n: 'たたきつぶす', type: 'phys', target: 'enemy', pow: 2.0, elem: 'earth' },
  e_dark: { n: 'やみのいかずち', type: 'mag', target: 'enemy', pow: 1.5, elem: 'dark' },
  e_darkwave: { n: '魔王の波動', type: 'mag', target: 'enemies', pow: 1.5, elem: 'dark' },
  e_drain: { n: 'きゅうけつ', type: 'phys', target: 'enemy', pow: 1.0, drain: 0.6 },
  e_heal: { n: 'じこさいせい', type: 'heal', target: 'self', pow: 1.5 },
  e_charge: { n: 'ちからをためる', type: 'buff', target: 'self', stat: 'atk', mul: 1.5, turns: 2 },
};

// ---------- キャラクター (全員かわいい女の子!) ----------
// look: hair, eye, cloth, acc(色), accType(飾り), style(髪型), hat(帽子色)
const CHARS = {
  aria: {
    n: 'アリア', title: '星を継ぐ剣士', rar: 4, elem: 'light', role: '剣士', gacha: false,
    base: { hp: 54, mp: 14, atk: 14, def: 10, mag: 8, spd: 11 }, grow: { hp: 10, mp: 2.2, atk: 2.7, def: 2.0, mag: 1.5, spd: 1.3 },
    skills: [[1, 'slash'], [3, 'heal'], [8, 'holyblade'], [14, 'guard'], [22, 'judgement']],
    look: { hair: '#f2c14e', eye: '#3b7dd8', cloth: '#3a6ed8', acc: '#e43b44', accType: 'ribbon', style: 'pony' },
    profile: '星晶石の声を聞いた村の少女。まっすぐで少しおっちょこちょい。',
  },
  seres: {
    n: 'セレス', title: '白銀の聖騎士', rar: 5, elem: 'light', role: '聖騎士', gacha: true,
    base: { hp: 66, mp: 20, atk: 17, def: 15, mag: 12, spd: 10 }, grow: { hp: 12, mp: 2.6, atk: 3.1, def: 2.7, mag: 2.0, spd: 1.3 },
    skills: [[1, 'holyblade'], [1, 'heal'], [6, 'guard'], [12, 'healall'], [20, 'judgement']],
    look: { hair: '#e8ecf6', eye: '#e8a020', cloth: '#f0f0ff', acc: '#e8b83a', accType: 'tiara', style: 'long' },
    profile: '王都の聖騎士団長。凛とした佇まいだが甘いものに目がない。',
  },
  noa: {
    n: 'ノア', title: '宵闇の魔女', rar: 5, elem: 'dark', role: '魔女', gacha: true,
    base: { hp: 48, mp: 30, atk: 9, def: 9, mag: 20, spd: 12 }, grow: { hp: 8, mp: 3.6, atk: 1.4, def: 1.6, mag: 3.5, spd: 1.5 },
    skills: [[1, 'darkball'], [1, 'drain'], [5, 'curse'], [12, 'shadow'], [18, 'blackhole']],
    look: { hair: '#5a3a8a', eye: '#e43b44', cloth: '#4a2a6a', acc: '#e8b83a', accType: 'witch', style: 'long', hat: '#2a1a40' },
    profile: '森の奥に住む天才魔女。眠そうだが魔力は底なし。',
  },
  homura: {
    n: 'ホムラ', title: '紅蓮の巫女剣士', rar: 5, elem: 'fire', role: '巫女剣士', gacha: true,
    base: { hp: 58, mp: 18, atk: 19, def: 11, mag: 12, spd: 13 }, grow: { hp: 10, mp: 2.4, atk: 3.5, def: 1.9, mag: 2.0, spd: 1.7 },
    skills: [[1, 'flameslash'], [4, 'rage'], [9, 'fire'], [14, 'guren'], [20, 'firestorm']],
    look: { hair: '#d8352a', eye: '#f5c542', cloth: '#ffffff', acc: '#e43b44', accType: 'flower', style: 'twin' },
    profile: '東の島国から来た巫女。熱血で負けず嫌い。',
  },
  sylphy: {
    n: 'シルフィ', title: '翠風の精霊弓姫', rar: 5, elem: 'wind', role: '弓使い', gacha: true,
    base: { hp: 52, mp: 22, atk: 17, def: 10, mag: 14, spd: 16 }, grow: { hp: 9, mp: 2.8, atk: 3.1, def: 1.7, mag: 2.3, spd: 2.1 },
    skills: [[1, 'windarrow'], [4, 'haste'], [8, 'heal'], [13, 'arrowrain'], [19, 'tornado']],
    look: { hair: '#7fd67a', eye: '#2a9a6a', cloth: '#3f8f5e', acc: '#f5c542', accType: 'elf', style: 'long' },
    profile: '風の精霊の血を引くエルフの姫。好奇心旺盛でいたずら好き。',
  },
  stella: {
    n: 'ステラ', title: '星詠みの姫君', rar: 5, elem: 'light', role: '星詠み', gacha: false, limited: true,
    base: { hp: 56, mp: 32, atk: 10, def: 12, mag: 21, spd: 13 }, grow: { hp: 10, mp: 3.8, atk: 1.5, def: 2.0, mag: 3.6, spd: 1.6 },
    skills: [[1, 'holy'], [1, 'healmore'], [6, 'healall'], [12, 'starfall'], [18, 'prayer'], [24, 'revive']],
    look: { hair: '#f4a6d8', eye: '#8a5ae8', cloth: '#ffe6f6', acc: '#ffe66d', accType: 'star', style: 'twin' },
    profile: '星の声を聴く王女。【限定】水晶の加護を受けた者の前にだけ現れる。',
  },
  shizuku: {
    n: 'シズク', title: '水辺の癒し手', rar: 4, elem: 'water', role: '癒し手', gacha: true,
    base: { hp: 50, mp: 26, atk: 8, def: 10, mag: 15, spd: 10 }, grow: { hp: 9, mp: 3.2, atk: 1.3, def: 1.8, mag: 2.6, spd: 1.3 },
    skills: [[1, 'heal'], [1, 'aqua'], [5, 'cure'], [10, 'healall'], [16, 'revive'], [22, 'healmore']],
    look: { hair: '#7ac8f0', eye: '#2a6ad8', cloth: '#e8f4ff', acc: '#3da5ff', accType: 'hairpin', style: 'long' },
    profile: '泉の神殿の見習い神官。おっとりしていて誰にでも優しい。',
  },
  yuki: {
    n: 'ユキ', title: '氷華の魔導士', rar: 4, elem: 'water', role: '魔導士', gacha: true,
    base: { hp: 44, mp: 26, atk: 8, def: 8, mag: 18, spd: 11 }, grow: { hp: 8, mp: 3.2, atk: 1.2, def: 1.5, mag: 3.1, spd: 1.4 },
    skills: [[1, 'ice'], [5, 'aqua'], [10, 'blizzard'], [16, 'break']],
    look: { hair: '#f4f8ff', eye: '#5ac8f0', cloth: '#5a8ad8', acc: '#7ac8f0', accType: 'ribbon', style: 'bob' },
    profile: '雪国生まれのクールな魔導士。実は寂しがり屋。',
  },
  lily: {
    n: 'リリィ', title: '鉄槌のおてんば娘', rar: 4, elem: 'earth', role: 'ハンマー', gacha: true,
    base: { hp: 62, mp: 12, atk: 18, def: 13, mag: 6, spd: 8 }, grow: { hp: 12, mp: 1.6, atk: 3.2, def: 2.4, mag: 1.0, spd: 1.1 },
    skills: [[1, 'rockhammer'], [4, 'ironwall'], [9, 'break'], [15, 'quake']],
    look: { hair: '#e8893a', eye: '#6a4a2a', cloth: '#d9a441', acc: '#3a6ed8', accType: 'band', style: 'twin' },
    profile: '鍛冶屋の娘。自分の背丈より大きなハンマーを振り回す。',
  },
  miko: {
    n: 'ミコ', title: 'ねこみみ僧侶', rar: 4, elem: 'light', role: '僧侶', gacha: true,
    base: { hp: 50, mp: 24, atk: 9, def: 10, mag: 14, spd: 12 }, grow: { hp: 9, mp: 3.0, atk: 1.4, def: 1.8, mag: 2.4, spd: 1.5 },
    skills: [[1, 'heal'], [3, 'holy'], [8, 'cure'], [12, 'healall'], [18, 'revive']],
    look: { hair: '#f6a2c0', eye: '#e8a020', cloth: '#ffffff', acc: '#f6757a', accType: 'cat', style: 'bob' },
    profile: '修道院育ちの猫耳少女。語尾に「にゃ」がつくのを気にしている。',
  },
  kagura: {
    n: 'カグラ', title: '疾風のくノ一', rar: 4, elem: 'wind', role: '忍者', gacha: true,
    base: { hp: 48, mp: 16, atk: 16, def: 9, mag: 9, spd: 18 }, grow: { hp: 8, mp: 2.0, atk: 3.0, def: 1.5, mag: 1.4, spd: 2.3 },
    skills: [[1, 'double'], [5, 'gust'], [10, 'shadowstep'], [16, 'haste']],
    look: { hair: '#2a3a6a', eye: '#e43b44', cloth: '#3a3a5a', acc: '#e43b44', accType: 'band', style: 'pony' },
    profile: '隠れ里の若きくノ一。無口だが、実は可愛いものが大好き。',
  },
  mei: {
    n: 'メイ', title: '見習い魔法使い', rar: 3, elem: 'fire', role: '魔法使い', gacha: true,
    base: { hp: 40, mp: 20, atk: 7, def: 7, mag: 14, spd: 10 }, grow: { hp: 7, mp: 2.6, atk: 1.1, def: 1.3, mag: 2.5, spd: 1.3 },
    skills: [[1, 'fire'], [7, 'firestorm']],
    look: { hair: '#f08a24', eye: '#3a7a3a', cloth: '#c0392b', acc: '#f5c542', accType: 'witch', style: 'bob', hat: '#a8303a' },
    profile: '魔法学校の落第生。でも火の魔法だけは得意!',
  },
  popo: {
    n: 'ポポ', title: 'すばしっこい盗賊', rar: 3, elem: 'wind', role: '盗賊', gacha: true,
    base: { hp: 44, mp: 10, atk: 12, def: 8, mag: 6, spd: 16 }, grow: { hp: 8, mp: 1.4, atk: 2.4, def: 1.4, mag: 1.0, spd: 2.0 },
    skills: [[1, 'double'], [8, 'gust']],
    look: { hair: '#6ab04c', eye: '#8a5a2a', cloth: '#8a6a3a', acc: '#f5c542', accType: 'hairpin', style: 'bob' },
    profile: '港町の元気な盗賊少女。宝箱の匂いがわかるらしい。',
  },
  coco: {
    n: 'ココ', title: 'げんき格闘家', rar: 3, elem: 'earth', role: '格闘家', gacha: true,
    base: { hp: 56, mp: 8, atk: 15, def: 10, mag: 4, spd: 12 }, grow: { hp: 11, mp: 1.2, atk: 2.8, def: 1.8, mag: 0.8, spd: 1.5 },
    skills: [[1, 'punch'], [8, 'ironwall']],
    look: { hair: '#8a5a3a', eye: '#3a2a1a', cloth: '#e43b44', acc: '#ffffff', accType: 'band', style: 'pony' },
    profile: '道場の看板娘。朝ごはんは三杯おかわりする。',
  },
  nemu: {
    n: 'ネム', title: 'ねむねむ吟遊詩人', rar: 3, elem: 'dark', role: '吟遊詩人', gacha: true,
    base: { hp: 42, mp: 20, atk: 8, def: 8, mag: 12, spd: 11 }, grow: { hp: 7, mp: 2.6, atk: 1.3, def: 1.4, mag: 2.1, spd: 1.4 },
    skills: [[1, 'shadow'], [4, 'cheer'], [10, 'curse']],
    look: { hair: '#b8a0e8', eye: '#6a4ab8', cloth: '#6a5aa8', acc: '#f6a2c0', accType: 'flower', style: 'long' },
    profile: 'いつも眠そうな吟遊詩人。歌うと元気が出るらしい。',
  },
  pico: {
    n: 'ピコ', title: '見習いシスター', rar: 3, elem: 'water', role: 'シスター', gacha: true,
    base: { hp: 44, mp: 22, atk: 7, def: 9, mag: 12, spd: 10 }, grow: { hp: 8, mp: 2.8, atk: 1.1, def: 1.6, mag: 2.1, spd: 1.3 },
    skills: [[1, 'heal'], [5, 'aqua'], [12, 'cure']],
    look: { hair: '#5ad0c8', eye: '#2a6a8a', cloth: '#2a3a6a', acc: '#ffffff', accType: 'ribbon', style: 'twin' },
    profile: '教会のちびっこシスター。背伸びしたいお年頃。',
  },
  // ---- 追加キャラ ----
  rapidhat: {
    n: 'ラピッドハット', title: 'うさぎ連れの手品師', rar: 5, elem: 'wind', role: '手品師', gacha: true,
    base: { hp: 54, mp: 20, atk: 17, def: 10, mag: 14, spd: 17 }, grow: { hp: 10, mp: 2.6, atk: 3.1, def: 1.7, mag: 2.2, spd: 2.1 },
    skills: [[1, 'double']],
    look: { hair: '#f6d8a0', eye: '#e43b44', cloth: '#2a2a5a', acc: '#e43b44', accType: 'silkhat', style: 'twin', hat: '#22223a' },
    profile: 'シルクハットから何でも取り出す旅の手品師。相棒のうさぎは帽子の中で昼寝中。',
  },
  viola: {
    n: 'ヴィオラ', title: '真紅の吸血探偵', rar: 5, elem: 'dark', role: '吸血姫', gacha: true,
    base: { hp: 60, mp: 14, atk: 23, def: 8, mag: 12, spd: 14 }, grow: { hp: 11, mp: 1.8, atk: 4.0, def: 1.4, mag: 1.6, spd: 1.8 },
    skills: [[1, 'slash']],
    look: { hair: '#f2f0f6', eye: '#d8203a', cloth: '#4a1a2a', acc: '#a8303a', accType: 'batwing', style: 'long' },
    profile: '夜の街の事件を解く吸血鬼の探偵。血を代償に、真相も敵もまとめて切り裂く。',
  },
  aurora: {
    n: 'オーロラ', title: '極光の大魔法使い', rar: 5, elem: 'light', role: '大魔法使い', gacha: true,
    base: { hp: 50, mp: 34, atk: 9, def: 9, mag: 22, spd: 10 }, grow: { hp: 9, mp: 4.0, atk: 1.3, def: 1.6, mag: 3.8, spd: 1.3 },
    skills: [[1, 'holy']],
    look: { hair: '#7ae8c8', eye: '#c27ff0', cloth: '#2a2a6a', acc: '#f6a2f0', accType: 'witch', style: 'long', hat: '#3a2a7a' },
    profile: '北の果てで夜空の光を研究する大魔法使い。呪文はとにかく長いが、そのぶん威力は絶大。',
  },
  kanae: {
    n: 'かなえ', title: '物静かなメイド', rar: 5, elem: 'water', role: 'メイド', gacha: true,
    base: { hp: 56, mp: 28, atk: 14, def: 12, mag: 18, spd: 14 }, grow: { hp: 10, mp: 3.4, atk: 2.4, def: 2.0, mag: 3.3, spd: 1.7 },
    skills: [[1, 'heal']],
    look: { hair: '#a4a2b4', eye: '#7a5aa8', cloth: '#7a2a3a', acc: '#ffffff', accType: 'maid', style: 'bob' },
    profile: '屋敷に仕える無口なメイド。尽くした分だけ、ここぞの一撃は誰より重い。',
  },
  lumia: {
    n: 'ルミア', title: '全力少女', rar: 5, elem: 'light', role: 'アタッカー', gacha: true,
    base: { hp: 58, mp: 16, atk: 21, def: 10, mag: 10, spd: 15 }, grow: { hp: 10, mp: 2.0, atk: 3.7, def: 1.7, mag: 1.4, spd: 1.8 },
    skills: [[1, 'slash']],
    look: { hair: '#ece8f4', eye: '#5a8ad8', cloth: '#9a8ac8', acc: '#ffd94a', accType: 'star', style: 'long' },
    profile: '何事にも全力投球。自信はないけれど、決めた夢だけは絶対にあきらめない。',
  },
  misuzu: {
    n: 'みすず', title: 'おっとり守護者', rar: 5, elem: 'earth', role: '守護者', gacha: true,
    base: { hp: 78, mp: 20, atk: 12, def: 18, mag: 16, spd: 9 }, grow: { hp: 15, mp: 2.6, atk: 1.9, def: 3.0, mag: 2.4, spd: 1.1 },
    skills: [[1, 'heal']],
    look: { hair: '#3e3e70', eye: '#8a7ab8', cloth: '#3f6a5a', acc: '#f6a2c0', accType: 'flower', style: 'pony' },
    profile: 'のんびり屋のお姉さん。みんなを守った分だけ、想いは強くなる。',
  },
  marina: {
    n: 'マリナ', title: '蒼海の歌姫', rar: 5, elem: 'water', role: '歌姫', gacha: true,
    base: { hp: 54, mp: 30, atk: 9, def: 11, mag: 20, spd: 12 }, grow: { hp: 10, mp: 3.6, atk: 1.4, def: 1.9, mag: 3.4, spd: 1.5 },
    skills: [[1, 'aqua'], [1, 'heal'], [6, 'umisong'], [12, 'tidal'], [18, 'revive']],
    look: { hair: '#3a8ae8', eye: '#5ae8f0', cloth: '#e8f8ff', acc: '#f6a2c0', accType: 'flower', style: 'long' },
    profile: '海辺の国の歌姫。歌声で波をあやつる。泳ぎは苦手。',
  },
  terra: {
    n: 'テラ', title: '大地の竜騎姫', rar: 5, elem: 'earth', role: '竜騎士', gacha: true,
    base: { hp: 70, mp: 16, atk: 20, def: 16, mag: 8, spd: 9 }, grow: { hp: 13, mp: 2.0, atk: 3.5, def: 2.8, mag: 1.2, spd: 1.2 },
    skills: [[1, 'rockhammer'], [4, 'ironwall'], [9, 'dragonlance'], [15, 'quake']],
    look: { hair: '#c8a060', eye: '#3f8f3e', cloth: '#8a6a3a', acc: '#e8b83a', accType: 'horns', style: 'pony' },
    profile: '竜の血を引く騎士。大食いで、おやつの時間は譲らない。',
  },
  akane: {
    n: 'アカネ', title: '炎の踊り子', rar: 4, elem: 'fire', role: '踊り子', gacha: true,
    base: { hp: 50, mp: 18, atk: 15, def: 9, mag: 12, spd: 15 }, grow: { hp: 9, mp: 2.4, atk: 2.8, def: 1.5, mag: 2.0, spd: 1.9 },
    skills: [[1, 'firedance'], [5, 'cheer'], [10, 'fire'], [16, 'firestorm']],
    look: { hair: '#f08a24', eye: '#e43b44', cloth: '#e43b44', acc: '#f5c542', accType: 'hairpin', style: 'pony' },
    profile: '旅一座の看板娘。踊りだすと止まらない。',
  },
  lilith: {
    n: 'リリス', title: '小悪魔シスター', rar: 4, elem: 'dark', role: 'シスター', gacha: true,
    base: { hp: 46, mp: 24, atk: 9, def: 9, mag: 17, spd: 13 }, grow: { hp: 8, mp: 3.0, atk: 1.3, def: 1.6, mag: 3.0, spd: 1.6 },
    skills: [[1, 'shadow'], [3, 'drain'], [8, 'curse'], [14, 'darkball']],
    look: { hair: '#4a3060', eye: '#e43b44', cloth: '#2a2238', acc: '#a8303a', accType: 'horns', style: 'twin' },
    profile: '教会に住みついた小悪魔。いたずら好きだけど根は優しい。',
  },
  tsubaki: {
    n: 'ツバキ', title: '桜の侍', rar: 4, elem: 'wind', role: '侍', gacha: true,
    base: { hp: 54, mp: 14, atk: 18, def: 11, mag: 7, spd: 14 }, grow: { hp: 10, mp: 1.8, atk: 3.3, def: 1.9, mag: 1.0, spd: 1.8 },
    skills: [[1, 'iai'], [6, 'double'], [12, 'sakura'], [18, 'rage']],
    look: { hair: '#f6a2c0', eye: '#8a3a5a', cloth: '#3a2a5a', acc: '#ffffff', accType: 'band', style: 'pony' },
    profile: '東の国から来た剣士。桜餅に目がない。',
  },
  sora: {
    n: 'ソラ', title: '見習い騎士', rar: 3, elem: 'light', role: '騎士', gacha: true,
    base: { hp: 52, mp: 10, atk: 13, def: 12, mag: 6, spd: 9 }, grow: { hp: 10, mp: 1.4, atk: 2.5, def: 2.1, mag: 1.0, spd: 1.2 },
    skills: [[1, 'slash'], [8, 'guard']],
    look: { hair: '#f2d06e', eye: '#3a7ad8', cloth: '#8a92a6', acc: '#ffe66d', accType: 'halo', style: 'bob' },
    profile: '騎士団の新入り。いつか聖騎士になるのが夢。',
  },
  mint: {
    n: 'ミント', title: '薬草摘みの少女', rar: 3, elem: 'wind', role: '薬師', gacha: true,
    base: { hp: 44, mp: 20, atk: 7, def: 9, mag: 12, spd: 11 }, grow: { hp: 8, mp: 2.6, atk: 1.1, def: 1.6, mag: 2.1, spd: 1.4 },
    skills: [[1, 'heal'], [4, 'cure'], [8, 'gust']],
    look: { hair: '#8ae8a0', eye: '#3a8a5a', cloth: '#f4f0e8', acc: '#ffffff', accType: 'bunny', style: 'twin' },
    profile: '森で薬草を集める少女。うさぎの耳飾りがお気に入り。',
  },
  chloe: {
    n: 'クロエ', title: '黒猫の使い魔', rar: 3, elem: 'dark', role: '使い魔', gacha: true,
    base: { hp: 42, mp: 18, atk: 12, def: 8, mag: 11, spd: 15 }, grow: { hp: 7, mp: 2.3, atk: 2.2, def: 1.3, mag: 1.9, spd: 1.9 },
    skills: [[1, 'shadow'], [6, 'double'], [12, 'curse']],
    look: { hair: '#42425e', eye: '#ffe66d', cloth: '#4a3a6a', acc: '#e43b44', accType: 'cat', style: 'bob' },
    profile: '魔女に仕える黒猫が少女の姿になった。気まぐれ。',
  },
};

// ---------- 装備 ----------
// slot: w(武器) a(防具) x(アクセ)
const EQUIPS = {
  // 武器
  bronze: { n: 'ブロンズソード', slot: 'w', rar: 3, st: { atk: 6 } },
  appstaff: { n: '見習いの杖', slot: 'w', rar: 3, st: { mag: 6 } },
  shortbow: { n: 'ショートボウ', slot: 'w', rar: 3, st: { atk: 4, spd: 3 } },
  mithril: { n: 'ミスリルソード', slot: 'w', rar: 4, st: { atk: 14 } },
  magestaff: { n: '魔導師の杖', slot: 'w', rar: 4, st: { mag: 14, mp: 8 } },
  galebow: { n: '疾風の弓', slot: 'w', rar: 4, st: { atk: 10, spd: 6 }, elem: 'wind' },
  flamesword: { n: 'フレイムソード', slot: 'w', rar: 4, st: { atk: 12 }, elem: 'fire' },
  icerod: { n: 'アイスロッド', slot: 'w', rar: 4, st: { mag: 12, atk: 4 }, elem: 'water' },
  luminas: { n: '聖剣ルミナス', slot: 'w', rar: 5, st: { atk: 26, def: 4 }, elem: 'light' },
  starrod: { n: '星詠みの杖', slot: 'w', rar: 5, st: { mag: 26, mp: 20 } },
  artemis: { n: '魔弓アルテミス', slot: 'w', rar: 5, st: { atk: 22, spd: 10 }, elem: 'wind' },
  // 防具
  traveler: { n: '旅人の服', slot: 'a', rar: 3, st: { def: 4, hp: 10 } },
  leather: { n: '革のよろい', slot: 'a', rar: 3, st: { def: 7 } },
  mithrilmail: { n: 'ミスリルメイル', slot: 'a', rar: 4, st: { def: 14, hp: 20 } },
  magerobe: { n: '魔法のローブ', slot: 'a', rar: 4, st: { def: 8, mag: 6, mp: 10 } },
  fluffy: { n: 'ふわふわドレス', slot: 'a', rar: 4, st: { def: 10, hp: 40 } },
  angeldress: { n: '天使のドレス', slot: 'a', rar: 5, st: { def: 20, hp: 80, mag: 8 } },
  dragonmail: { n: '竜鱗の鎧', slot: 'a', rar: 5, st: { def: 28, hp: 40 } },
  // アクセサリ
  powerring: { n: '力のリング', slot: 'x', rar: 3, st: { atk: 4 } },
  charm: { n: '守りのお守り', slot: 'x', rar: 3, st: { def: 4 } },
  bunny: { n: 'うさみみバンド', slot: 'x', rar: 3, st: { spd: 4 } },
  pendant: { n: '魔力のペンダント', slot: 'x', rar: 4, st: { mag: 8, mp: 15 } },
  brooch: { n: '命のブローチ', slot: 'x', rar: 4, st: { hp: 60 } },
  nekomimi: { n: '猫耳カチューシャ', slot: 'x', rar: 4, st: { spd: 8, atk: 3 } },
  goddess: { n: '女神のティアラ', slot: 'x', rar: 5, st: { hp: 50, atk: 6, def: 6, mag: 6, spd: 6 } },
  spirit: { n: '精霊の髪飾り', slot: 'x', rar: 5, st: { mp: 40, mag: 12 } },
};
const SLOT_N = { w: '武器', a: '防具', x: 'アクセ' };
const STAT_N = { hp: 'HP', mp: 'MP', atk: '攻撃', def: '防御', mag: '魔力', spd: '素早' };

// ---------- アイテム ----------
// cat: heal(回復) / status(状態回復) / rare(貴重品)。カテゴリはメニューのタブに使われます。
const ITEM_CATS = [['all', 'すべて'], ['heal', '回復'], ['status', '状態'], ['rare', '貴重品']];
const ITEMS = {
  potion: { n: 'ポーション', cat: 'heal', price: 30, type: 'heal', amt: 60, desc: 'HPを60回復 (戦闘中はパーティのHP)' },
  hipotion: { n: 'ハイポーション', cat: 'heal', price: 120, type: 'heal', amt: 220, desc: 'HPを220回復' },
  ether: { n: 'エーテル', cat: 'heal', price: 100, type: 'mp', amt: 1, desc: '戦闘中に使うと エナジー+1', bdesc: 'エナジー+1' },
  antidote: { n: 'どくけし草', cat: 'status', price: 20, type: 'cure', desc: '毒・脱力・脆弱を治す(戦闘中)', bdesc: '毒・脱力・脆弱を治す' },
  feather: { n: '天使の羽', cat: 'heal', price: 240, type: 'revive', amt: 0.3, desc: 'パーティのHPを最大の30%回復', bdesc: 'HPを最大の30%回復' },
  elixir: { n: 'エリクサー', cat: 'rare', price: 0, type: 'full', desc: 'HPを全回復' },
};

// ---------- 敵 ----------
const ENEMIES = {
  slime: { n: 'スライム', spr: 'slime', pal: { B: '#4fa4ff' }, elem: 'water', hp: 24, atk: 12, def: 5, mag: 6, spd: 6, exp: 7, gold: 6, act: [['attack', 1]], drop: [['potion', 0.12]] },
  bat: { n: 'おおこうもり', spr: 'bat', pal: { B: '#6a4a8a' }, elem: 'wind', hp: 20, atk: 13, def: 4, mag: 5, spd: 12, exp: 8, gold: 5, act: [['attack', 3], ['e_drain', 1]] },
  mush: { n: 'いたずらキノコ', spr: 'mush', pal: { B: '#e43b44', S: '#f0e0c0' }, elem: 'earth', hp: 30, atk: 12, def: 7, mag: 6, spd: 5, exp: 9, gold: 8, act: [['attack', 3], ['e_poison', 1]], drop: [['antidote', 0.2]] },
  wolf: { n: 'フォレストウルフ', spr: 'wolf', pal: { B: '#7a6a5a' }, elem: 'earth', hp: 48, atk: 22, def: 10, mag: 6, spd: 14, exp: 18, gold: 14, act: [['attack', 2], ['e_bite', 1]] },
  mush2: { n: 'マタンゴ', spr: 'mush', pal: { B: '#8a5ae8', S: '#e8d8f0' }, elem: 'wind', hp: 55, atk: 20, def: 12, mag: 14, spd: 7, exp: 20, gold: 16, act: [['attack', 2], ['e_poison', 1], ['e_wind', 1]], drop: [['potion', 0.2]] },
  bee: { n: 'キラービー', spr: 'bat', pal: { B: '#e8b83a' }, elem: 'wind', hp: 40, atk: 21, def: 9, mag: 8, spd: 18, exp: 17, gold: 12, act: [['attack', 2], ['e_poison', 1]] },
  scorp: { n: 'デザートスコーピオン', spr: 'scorp', pal: { B: '#c87a3a' }, elem: 'earth', hp: 70, atk: 30, def: 18, mag: 8, spd: 12, exp: 30, gold: 22, act: [['attack', 2], ['e_poison', 1]], drop: [['antidote', 0.25]] },
  mummy: { n: 'ミイラ兵', spr: 'skel', pal: { B: '#d8c8a0', W: '#e8dcc0', E: '#3a2a1a' }, elem: 'dark', hp: 85, atk: 28, def: 16, mag: 10, spd: 8, exp: 34, gold: 26, act: [['attack', 3], ['e_dark', 1]] },
  sandslime: { n: 'サンドスライム', spr: 'slime', pal: { B: '#d9b26a' }, elem: 'earth', hp: 60, atk: 26, def: 22, mag: 10, spd: 8, exp: 28, gold: 20, act: [['attack', 2], ['e_rock', 1]], drop: [['hipotion', 0.08]] },
  snowwolf: { n: 'スノーウルフ', spr: 'wolf', pal: { B: '#c8d8f0' }, elem: 'water', hp: 100, atk: 38, def: 22, mag: 12, spd: 18, exp: 48, gold: 30, act: [['attack', 2], ['e_bite', 1], ['e_ice', 1]] },
  iceghost: { n: 'アイスゴースト', spr: 'ghost', pal: { B: '#9ad8f0' }, elem: 'water', hp: 80, atk: 26, def: 18, mag: 34, spd: 14, exp: 46, gold: 28, act: [['e_ice', 2], ['attack', 1]], drop: [['ether', 0.12]] },
  iceslime: { n: 'フロストスライム', spr: 'slime', pal: { B: '#e8f4ff' }, elem: 'water', hp: 90, atk: 34, def: 28, mag: 20, spd: 10, exp: 44, gold: 32, act: [['attack', 2], ['e_icebreath', 1]] },
  wisp: { n: 'ファイアスピリット', spr: 'wisp', pal: { B: '#f08a24' }, elem: 'fire', hp: 110, atk: 32, def: 24, mag: 44, spd: 18, exp: 64, gold: 40, act: [['e_fire', 2], ['attack', 1]], drop: [['ether', 0.15]] },
  hellhound: { n: 'ヘルハウンド', spr: 'wolf', pal: { B: '#a8302a' }, elem: 'fire', hp: 140, atk: 50, def: 28, mag: 20, spd: 20, exp: 70, gold: 44, act: [['attack', 2], ['e_bite', 1], ['e_fire', 1]] },
  bombslime: { n: 'マグマスライム', spr: 'slime', pal: { B: '#e04a1f' }, elem: 'fire', hp: 120, atk: 44, def: 34, mag: 30, spd: 12, exp: 66, gold: 46, act: [['attack', 2], ['e_firebreath', 1]], drop: [['hipotion', 0.12]] },
  imp: { n: 'デビルインプ', spr: 'imp', pal: { B: '#5a3a8a', A: '#e8e0d0' }, elem: 'dark', hp: 170, atk: 56, def: 34, mag: 50, spd: 22, exp: 110, gold: 60, act: [['attack', 2], ['e_dark', 2]] },
  dknight: { n: 'スケルトンナイト', spr: 'skel', pal: { B: '#c8c8d8', W: '#d8d8e8', A: '#8a92a6' }, elem: 'dark', hp: 220, atk: 64, def: 44, mag: 20, spd: 16, exp: 120, gold: 64, act: [['attack', 3], ['e_charge', 1]] },
  darkghost: { n: 'ダークレイス', spr: 'ghost', pal: { B: '#4a3a6a', E: '#ffe66d' }, elem: 'dark', hp: 180, atk: 48, def: 36, mag: 62, spd: 20, exp: 115, gold: 58, act: [['e_dark', 2], ['e_drain', 1]], drop: [['ether', 0.2]] },
  // 南国の島々
  crab: { n: 'シザークラブ', spr: 'scorp', pal: { B: '#e04a3a' }, elem: 'water', hp: 95, atk: 36, def: 26, mag: 10, spd: 12, exp: 50, gold: 34, act: [['attack', 2], ['e_bite', 1]] },
  seaslime: { n: 'マリンスライム', spr: 'slime', pal: { B: '#3ad0c0' }, elem: 'water', hp: 85, atk: 32, def: 20, mag: 26, spd: 12, exp: 46, gold: 30, act: [['attack', 2], ['e_ice', 1]], drop: [['ether', 0.12]] },
  parrot: { n: 'トロピカルバード', spr: 'bat', pal: { B: '#3fbf5a' }, elem: 'wind', hp: 75, atk: 38, def: 16, mag: 20, spd: 22, exp: 48, gold: 32, act: [['attack', 2], ['e_wind', 1]] },
  // 水晶の荒野
  cryslime: { n: 'プリズムスライム', spr: 'slime', pal: { B: '#b48ae8' }, elem: 'light', hp: 220, atk: 70, def: 46, mag: 60, spd: 16, exp: 150, gold: 80, act: [['attack', 2], ['e_charge', 1]] },
  crybat: { n: 'クリスタルバット', spr: 'bat', pal: { B: '#8ad0f0' }, elem: 'light', hp: 180, atk: 74, def: 36, mag: 40, spd: 26, exp: 140, gold: 76, act: [['attack', 2], ['e_drain', 1]] },
  cryghost: { n: '結晶の亡霊', spr: 'ghost', pal: { B: '#d8c8f8', E: '#5ac8f0' }, elem: 'dark', hp: 200, atk: 60, def: 40, mag: 78, spd: 22, exp: 150, gold: 80, act: [['e_dark', 2], ['e_poison', 1]] },
  crywolf: { n: '結晶狼', spr: 'wolf', pal: { B: '#9a8ad8' }, elem: 'earth', hp: 260, atk: 82, def: 44, mag: 30, spd: 24, exp: 170, gold: 90, act: [['attack', 2], ['e_bite', 1]] },
  // ボス
  treant: { n: '森の大精霊ドリアード', spr: 'treant', pal: { G: '#3f8f3e', T: '#7a5a3a', R: '#3a1a10' }, elem: 'wind', boss: true, hp: 520, chp: 220, atk: 30, def: 16, mag: 24, spd: 9, exp: 320, gold: 300, act: [['attack', 2], ['e_root', 2], ['e_leaf', 2], ['e_heal', 1]] },
  golemk: { n: '砂の守護者ゴーレム', spr: 'golem', pal: { B: '#c8a060', A: '#5ae8f0' }, elem: 'earth', boss: true, hp: 980, chp: 360, atk: 46, def: 34, mag: 20, spd: 7, exp: 650, gold: 500, act: [['attack', 2], ['e_smash', 2], ['e_rock', 2], ['e_charge', 1]] },
  frostd: { n: '氷竜フロストドラゴン', spr: 'dragon', pal: { B: '#7ac8f0', A: '#3a7ad8', S: '#e8f8ff' }, elem: 'water', boss: true, hp: 1500, chp: 460, atk: 60, def: 40, mag: 56, spd: 16, exp: 1000, gold: 700, act: [['attack', 2], ['e_ice', 2], ['e_icebreath', 2], ['e_bite', 1]] },
  flamed: { n: '炎竜イグニス', spr: 'dragon', pal: { B: '#d8352a', A: '#f08a24', S: '#ffd34d' }, elem: 'fire', boss: true, hp: 2100, chp: 600, atk: 76, def: 48, mag: 70, spd: 18, exp: 1500, gold: 900, act: [['attack', 2], ['e_fire', 2], ['e_firebreath', 2], ['e_charge', 1]] },
  ancient: { n: '古代の守護騎士', spr: 'skel', pal: { B: '#c8a060', W: '#e8c890', A: '#f5c542' }, elem: 'earth', boss: true, hp: 600, chp: 300, atk: 38, def: 24, mag: 16, spd: 10, exp: 500, gold: 300, act: [['attack', 2], ['e_smash', 1], ['e_charge', 1]] },
  serpent: { n: '海竜リヴァイア', spr: 'dragon', pal: { B: '#2ab0a0', A: '#1a7a8a', S: '#c8f8e8' }, elem: 'water', boss: true, hp: 1500, chp: 520, atk: 64, def: 40, mag: 60, spd: 18, exp: 1300, gold: 800, act: [['attack', 2], ['e_icebreath', 2], ['e_bite', 1], ['e_heal', 1]] },
  crygolem: { n: '結晶の巨像', spr: 'golem', pal: { B: '#9a8ad8', A: '#ffffff' }, elem: 'light', boss: true, hp: 3000, chp: 1000, atk: 96, def: 60, mag: 70, spd: 12, exp: 4000, gold: 2000, act: [['attack', 2], ['e_smash', 2], ['e_rock', 1], ['e_charge', 1]] },
  demon: { n: '魔王ノクス', spr: 'demon', pal: { S: '#a8b8d8', K: '#3a1a5a', A: '#e8e0d0', G: '#f5c542', E: '#ff3b3b' }, elem: 'dark', boss: true, hp: 3800, chp: 800, atk: 88, def: 54, mag: 90, spd: 22, exp: 5000, gold: 3000, act: [['attack', 2], ['e_dark', 2], ['e_darkwave', 2], ['e_drain', 1], ['e_charge', 1]] },
};

// エリア別出現 (lv目安)
const AREAS = {
  meadow: { n: '草原', bg: 'meadow', groups: [['slime'], ['slime', 'slime'], ['bat'], ['slime', 'mush'], ['mush', 'bat']] },
  forest: { n: '森', bg: 'forest', groups: [['wolf'], ['mush2', 'bee'], ['bee', 'bee'], ['wolf', 'mush2'], ['wolf', 'bee']] },
  desert: { n: '砂漠', bg: 'desert', groups: [['scorp'], ['sandslime', 'scorp'], ['mummy'], ['sandslime', 'sandslime'], ['mummy', 'scorp']] },
  snow: { n: '雪原', bg: 'snow', groups: [['snowwolf'], ['iceghost', 'iceslime'], ['snowwolf', 'iceghost'], ['iceslime', 'iceslime']] },
  volcano: { n: '火山地帯', bg: 'volcano', groups: [['hellhound'], ['wisp', 'bombslime'], ['hellhound', 'wisp'], ['bombslime', 'bombslime']] },
  shrine: { n: '風の神殿', bg: 'shrine', groups: [['wolf', 'bee'], ['mush2', 'mush2'], ['bee', 'bee', 'bee']] },
  ruins: { n: '砂の遺跡', bg: 'ruins', groups: [['mummy', 'mummy'], ['sandslime', 'mummy'], ['scorp', 'scorp']] },
  icecave: { n: '氷の洞窟', bg: 'ice', groups: [['iceghost', 'iceghost'], ['iceslime', 'snowwolf'], ['snowwolf', 'snowwolf']] },
  volccave: { n: '炎の火山', bg: 'lava', groups: [['wisp', 'wisp'], ['hellhound', 'bombslime'], ['bombslime', 'wisp', 'wisp']] },
  island: { n: '南国の島々', bg: 'beach', groups: [['crab'], ['seaslime', 'parrot'], ['crab', 'seaslime'], ['parrot', 'parrot']] },
  crystal: { n: '水晶の荒野', bg: 'crystal', groups: [['crywolf'], ['cryslime', 'crybat'], ['cryghost', 'crybat'], ['crywolf', 'cryghost']] },
  subruin: { n: '忘れられた遺構', bg: 'shrine', groups: [['wolf', 'mush2'], ['bee', 'wolf']] },
  subsea: { n: '潮騒の洞窟', bg: 'ice', groups: [['crab', 'seaslime'], ['seaslime', 'seaslime', 'parrot']] },
  subcrys: { n: '結晶の迷宮', bg: 'crystal', groups: [['crywolf', 'cryslime'], ['cryghost', 'cryghost']] },
  castle: { n: '魔王城', bg: 'castle', groups: [['imp', 'imp'], ['dknight'], ['darkghost', 'imp'], ['dknight', 'darkghost']] },
};

// ---------- ガチャ ----------
const GACHA_COST = { single: 50, ten: 500 };
const PICKUP_ROT = ['seres', 'noa', 'homura', 'sylphy', 'marina', 'terra', 'kanae', 'lumia', 'misuzu', 'rapidhat', 'viola', 'aurora'];
function charPool(rar, opts = {}) {
  return Object.keys(CHARS).filter(k => CHARS[k].rar === rar && (CHARS[k].gacha || (opts.limited && k === 'stella')));
}
function equipPool(rar) { return Object.keys(EQUIPS).filter(k => EQUIPS[k].rar === rar); }
// バナーはこの配列に1行足すだけで増やせます。
//  show(G): 表示条件 / pickup: 確率UPの★5 / pickup4: 確率UPの★4 / elem: その属性のキャラが出やすい
//  rates: [★5%, ★4%, ★3%] / tenCost: 10連の価格 / onlyTen: 10連のみ / once: 1回限り
const BANNER_DEFS = [
  { id: 'beginner', n: 'はじめての召喚', sub: '1回限り!10連が半額 ★4以上1枠確定', kind: 'char', rates: [3, 15, 82], tenCost: 250, onlyTen: true, once: true, color: '#ff9fd0', show: g => !g.gacha.beginnerDone, feature: () => weeklyPickup() },
  { id: 'pickup', n: () => CHARS[selPickup()].n + ' ピックアップ', sub: '好きな★5を選んでピックアップ!選んだ★5は他の★5の8倍出やすい', kind: 'char', rates: [3, 12, 85], pickup: () => selPickup(), selectable: true, color: () => ELEM[CHARS[selPickup()].elem].c },
  { id: 'limited', n: '【限定】星詠みの姫君', sub: '水晶の加護により解放!限定★5 ステラ登場', kind: 'char', rates: [3, 12, 85], pickup: 'stella', limited: true, color: '#ffe66d', show: g => g.crystals.length >= 2 },
  { id: 'elem', n: () => ELEM[weeklyElem()].n + '属性フェス', sub: () => '今週は' + ELEM[weeklyElem()].n + '属性のキャラが出やすい!(該当★4・★5の出現率UP)', kind: 'char', rates: [3, 12, 85], elem: () => weeklyElem(), color: () => ELEM[weeklyElem()].c, show: g => g.crystals.length >= 1, feature: () => charPool(5).find(k => CHARS[k].elem === weeklyElem()) || 'seres' },
  { id: 'card', n: 'カード召喚', sub: 'デッキに入れる共通カードが手に入る。同じカードが出ると+1強化', kind: 'card', rates: [4, 16, 80], color: '#c8d0e0' },
];
// ピックアップ: 選んだキャラは他の★5の8倍の重みで抽選
const PICKUP_WEIGHT = 8;
function selPickup() { const k = G && G.gacha && G.gacha.pickup; return (k && CHARS[k] && CHARS[k].rar === 5 && (CHARS[k].gacha)) ? k : weeklyPickup(); }
function pickupPool(b) { const pool = charPool(5); if (b.limited && !pool.includes(b.pickup)) pool.push(b.pickup); return pool; }
function pickupDraw(b) {
  const pool = pickupPool(b);
  const tot = pool.reduce((a, k) => a + (k === b.pickup ? PICKUP_WEIGHT : 1), 0);
  let r = Math.random() * tot;
  for (const k of pool) { r -= k === b.pickup ? PICKUP_WEIGHT : 1; if (r <= 0) return k; }
  return pool[pool.length - 1];
}
function pickupRate(b) { const n = pickupPool(b).length; return b.rates[0] * PICKUP_WEIGHT / (PICKUP_WEIGHT + n - 1); }
function weeklyPickup() { return PICKUP_ROT[U.weekIndex() % PICKUP_ROT.length]; }
function weeklyElem() { const es = ['fire', 'water', 'wind', 'earth', 'light', 'dark']; return es[(U.weekIndex() + 3) % es.length]; }
function getBanners(state) {
  const v = (x) => typeof x === 'function' ? x(state) : x;
  return BANNER_DEFS.filter(d => (!d.show || d.show(state)) && !(d.once && state.gacha.used && state.gacha.used[d.id])).map(d => {
    const b = Object.assign({}, d);
    for (const k of ['n', 'sub', 'color', 'pickup', 'elem', 'feature']) b[k] = v(d[k]);
    if (b.kind === 'char' && !b.feature) b.feature = b.pickup || null;
    return b;
  });
}

// エリアの目安レベル。パーティの平均レベルがこれより FLEE_GAP 以上高いと、敵が逃げるようになる
const AREA_LV = { meadow: 2, forest: 6, desert: 10, snow: 13, volcano: 16, island: 13, crystal: 24, shrine: 6, ruins: 10, icecave: 13, volccave: 16, castle: 22, subruin: 9, subsea: 15, subcrys: 25 };
const FLEE_GAP = 8;

// ---------- 難易度 ----------
// 敵の強さの倍率 (HPと攻撃力の両方にかかる)。推奨レベルは変えずに敵だけ強くする。
const DIFFICULTY = { mob: 1.2, boss: 1.5, sub: 1.8, last: 2.0 };
const SUB_BOSSES = ['ancient', 'serpent', 'crygolem'];
const LAST_BOSS = 'demon';
function enemyMul(id) {
  const d = ENEMIES[id];
  if (!d.boss) return DIFFICULTY.mob;
  if (id === LAST_BOSS) return DIFFICULTY.last;
  if (SUB_BOSSES.includes(id)) return DIFFICULTY.sub;
  return DIFFICULTY.boss;
}
// 闘技場での再戦の段階: 倍率は上の通常倍率にさらに掛かる
const REMATCH_TIERS = [
  { id: 'normal', n: '通常', mul: 1, reward: 0 },
  { id: 'hard', n: '強化', mul: 1.6, reward: 300 },
  { id: 'extreme', n: '極', mul: 2.6, reward: 800 },
];

// ---------- 凸の強さ (レア度ごと) ----------
// 「相当凸数」E に変換して計算する。★5はそのまま。
// ★3: 3凸で今までの無凸、5凸で今までの3凸 / ★4: 1凸で今までの無凸、5凸で今までの4凸
// 主人公アリア(ガチャに出ない)は常に無凸相当。
function effLB(charId, lb) {
  const d = CHARS[charId];
  if (!d) return lb || 0;
  if (!d.gacha && !d.limited) return 0;
  lb = lb || 0;
  if (d.rar === 3) return 1.5 * (lb - 3);
  if (d.rar === 4) return lb - 1;
  return lb;
}
function lbStatMul(E) { return E >= 0 ? 1 + 0.08 * E : Math.pow(1.08, E); }
function lbCardMul(E) { return E >= 0 ? 1 + 0.25 * E : Math.pow(1.25, E); }

// ---------- 経験値 ----------
function expNext(lv) { return Math.round(8 * Math.pow(lv, 1.72) + 10); }
const LV_CAP = 60;
