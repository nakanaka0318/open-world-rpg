'use strict';
// ===== ストーリー・NPC・イベント =====
const NL = (hair, cloth, style = 'bob', accType = 'ribbon', acc = '#ffffff', eye = '#3a5a8a') => ({ hair, cloth, style, accType, acc, eye });
const SHOPS = {
  lumina: ['potion', 'antidote', 'ether'],
  frostia: ['potion', 'hipotion', 'ether', 'antidote', 'feather'],
  sandora: ['potion', 'hipotion', 'ether', 'antidote', 'feather'],
};

const NPCS = {
  lumina_elder: {
    name: '村長', look: 'elder',
    async talk() {
      const n = G.crystals.length;
      if (!G.flags.metElder) {
        G.flags.metElder = 1;
        await UI.say([
          'おお、アリアや。よく来てくれた。',
          '昨夜、湖の魔王城から 禍々しい光が立ちのぼった。\n魔王ノクスが目覚めたのじゃ…',
          '城へ渡る橋には 強力な封印がかかっておる。\n封印を解くには 大陸に散った\n4つの「封印の水晶」が必要じゃ。',
          '風・大地・水・炎…水晶はそれぞれの神殿に眠っておる。\nどこから向かうかは お前の自由じゃ。',
          'そうじゃ、村の「召喚の祠」へ行くとよい。\n星晶石を捧げれば、心強い仲間が応えてくれるはずじゃ。',
        ], { name: this.name });
        if (!G.flags.elderGift) { G.flags.elderGift = 1; G.stones += 250; Sound.play('chest'); Game.hud(); await UI.say('村長から 星晶石×250 を受け取った!'); }
        return;
      }
      const lines = [
        '水晶は 風の神殿(西の森)から集めるのがよいじゃろう。\n森の魔物は手ごわいが、仲間がいれば大丈夫じゃ。',
        `水晶は ${n} つ集まったか。見事じゃ!\n南東の砂漠に 砂の遺跡がある。謎解きが得意な者が向いておる。`,
        `${n} つ目の水晶…!あと少しじゃ。\n北の雪山の洞窟は暗い。足元に気をつけるのじゃぞ。`,
        '残るは東の火山じゃ!炎の竜は力をためて大技を放つ。\nブロックの準備を忘れるでないぞ。',
        '4つの水晶がそろった…!\n湖の橋へ行き、封印を解くのじゃ!',
      ];
      await UI.say(G.flags.cleared ? 'アリアや、ありがとう。世界に星の光が戻った…!' : lines[Math.min(n, 4)], { name: this.name });
    },
  },
  lumina_shop: { name: '道具屋のミルカ', look: NL('#8a5a3a', '#3f8f5e', 'bob', 'ribbon', '#ffffff', '#3a7a3a'), async talk() { await Story.shop('lumina', this); } },
  lumina_girl: {
    name: '村娘のリン', look: NL('#e8893a', '#c0473a', 'twin', 'ribbon', '#ffe66d'),
    async talk() {
      await UI.say(['おばあちゃんが言ってたの。\n村には昔の冒険者が隠した 宝が眠ってるって!', WORLD.hint1 + '\n…って、古い日記に書いてあったんだ。'], { name: this.name, look: this.look });
    },
  },
  lumina_miko: {
    name: '召喚の巫女セラ', look: NL('#f4f8ff', '#ffffff', 'long', 'flower', '#e43b44', '#e43b44'),
    async talk() {
      await UI.say(['ようこそ、召喚の祠へ。', '奥の祭壇に「星晶石」を捧げれば、\n異界の少女たちがあなたの呼びかけに応えます。', '10連召喚なら ★4以上が必ず1人!\n同じ子が来てくれたら「限界突破」で もっと強くなりますよ。', '星晶石は 宝箱、パズルの解決、ボスの討伐、\nそれに毎日のログインボーナスで手に入ります。'], { name: this.name, look: this.look });
      const c = await UI.ask('召喚しますか?', ['召喚する', 'やめる'], { name: this.name, look: this.look });
      if (c === 0) await Gacha.open();
    },
  },
  lumina_kid: {
    name: 'こどものミミ', look: NL('#f6a2c0', '#5a8ad8', 'twin', 'ribbon', '#ffffff'),
    async talk() { await UI.say(['ねえねえ、知ってる?\n戦いはカードで決まるんだって!\n毎ターン5枚引いて、エナジー3つで使うの。', '敵の頭の上に「攻撃」って出てたら、ブロックで守ってね!\n毒は少しずつ効くから、ボスに強いよ!'], { name: this.name, look: this.look }); },
  },
  lumina_guard: {
    name: '見張りのエマ', look: NL('#5a3a2a', '#8a92a6', 'pony', 'band', '#e43b44'),
    async talk() {
      await UI.say(G.seal ? '封印が解けたのね…!気をつけて、アリア。' : ['北の湖に浮かぶのが 魔王城よ。', '橋には紫の封印がかかってて、誰も渡れないの。\n4つの水晶を集めれば…きっと!', '外の魔物は姿が見えるから、避けて進むこともできるわ。\nBボタン(X/Shift)を押しながら歩くと走れるよ。'], { name: this.name, look: this.look });
    },
  },
  frost_shop: { name: '道具屋のスノウ', look: NL('#c8d8f0', '#3a6ed8', 'long', 'hairpin', '#7ac8f0', '#3a7ad8'), async talk() { await Story.shop('frostia', this); } },
  frost_girl: {
    name: '雪国の少女ルル', look: NL('#f4f8ff', '#a8303a', 'bob', 'cat', '#f6757a', '#5a3a8a'),
    async talk() { await UI.say(['東の雪山にある氷の洞窟は、床が崩れてて大きな穴があるの。', '岩を押して穴を埋めれば渡れるけど…\n穴が深いところは 2つ埋めないとダメなんだって。', '洞窟の中は真っ暗だから、迷わないでね。'], { name: this.name, look: this.look }); },
  },
  frost_sage: {
    name: '賢者マーリン', look: 'elder',
    async talk() {
      const h = WORLD.hint2;
      await UI.say(['ふぉっふぉ、旅の者か。', '東の火山地帯に、三本の枯れ木が\n「コ」の字に寄り添う場所がある。', 'その真ん中の灰の下に、古の宝が眠っておるそうな。\n地図で探してみるがよい。'], { name: this.name });
    },
  },
  frost_mother: {
    name: '宿屋のおかみ', look: NL('#d8352a', '#e8dcc0', 'pony', 'ribbon', '#ffffff', '#3a7a3a'),
    async talk() {
      if (!G.flags.frostGift) { G.flags.frostGift = 1; addItem('hipotion', 2); Sound.play('chest'); await UI.say(['寒かったでしょう!これを持っておいき。', 'ハイポーション×2 をもらった!'], { name: this.name, look: this.look }); return; }
      await UI.say('雪の町は寒いけど、心はあったかいのよ。', { name: this.name, look: this.look });
    },
  },
  frost_kid: { name: 'こどものユキナ', look: NL('#7ac8f0', '#f4f8ff', 'twin', 'ribbon', '#3da5ff'), async talk() { await UI.say('雪だるま作ってるの!\n…魔物の雪だるまじゃないよ!', { name: this.name, look: this.look }); } },
  sand_shop: { name: '道具屋のサラ', look: NL('#2a1a10', '#e8b83a', 'long', 'flower', '#e43b44', '#8a5a2a'), async talk() { await Story.shop('sandora', this); } },
  sand_dancer: {
    name: '踊り子のジャスミン', look: NL('#5a2a6a', '#f6757a', 'pony', 'hairpin', '#f5c542', '#e8a020'),
    async talk() { await UI.say(['東の砂の遺跡には「スフィンクスの謎かけ」があるの。', '「朝は四本足、昼は二本足、夜は三本足」…\nふふ、答えは わかるかしら?', '遺跡の奥の扉は 3つの石碑の数字が鍵よ。\n石碑は罠の向こうにあるから気をつけて。'], { name: this.name, look: this.look }); },
  },
  sand_oldman: {
    name: '砂漠の古老', look: 'elder',
    async talk() { await UI.say(['わしの爺さまが言っておった…', WORLD.hint3 || '…忘れてしもうた。'], { name: this.name }); },
  },
  sand_kid: { name: 'こどものナナ', look: NL('#e8893a', '#ffffff', 'bob', 'hairpin', '#3da5ff'), async talk() { await UI.say('オアシスの水はとってもきれいなの!\nサソリには気をつけてね。毒があるよ!', { name: this.name, look: this.look }); } },
  snow_hunter: {
    name: '狩人のアイラ', look: NL('#8a5a3a', '#6a4a2a', 'pony', 'band', '#3f8f5e', '#3a5a2a'),
    async talk() {
      if (!G.flags.hunter) { G.flags.hunter = 1; G.stones += 100; Sound.play('chest'); Game.hud(); await UI.say(['こんな雪の中までようこそ。\nこれ、山で拾ったの。あげる!', '星晶石×100 を受け取った!'], { name: this.name, look: this.look }); return; }
      await UI.say(['雪原のオオカミは群れで来るわ。\n敵全体を攻撃できるカードがあると楽よ。', '東の雪山を越えると氷の洞窟。\n入口の前にクリスタルがあるから、触れておくと便利よ。'], { name: this.name, look: this.look });
    },
  },
  desert_nomad: {
    name: '旅商人のファティマ', look: NL('#2a1a10', '#d9a441', 'long', 'hairpin', '#3da5ff', '#8a5a2a'),
    async talk() {
      if (!G.flags.nomad) { G.flags.nomad = 1; addItem('feather', 1); addItem('ether', 2); Sound.play('chest'); await UI.say(['砂漠で迷子?ふふ、これで元気を出して。', '天使の羽×1 と エーテル×2 をもらった!'], { name: this.name, look: this.look }); return; }
      await UI.say(['この大陸は広いでしょう?\n各地のクリスタルに触れておけば、一瞬で戻れるわ。', 'メニューの「ちず」で、行ったことのない場所を探してみて。'], { name: this.name, look: this.look });
    },
  },
  volc_smith: {
    name: '鍛冶屋のガーネット', look: NL('#d8352a', '#5a4a4a', 'twin', 'band', '#f5c542', '#f5c542'),
    async talk() {
      if (!G.flags.smith) { G.flags.smith = 1; const t = grant({ card: 'c_spike' }); Sound.play('chest'); await UI.say(['火山の熱で鍛えた技を、カードに込めておいたわ!\n持っていきなさい!', `${t} を受け取った!`], { name: this.name, look: this.look }); return; }
      await UI.say('炎の竜は筋力をためてくるわ。\n脱力のカードで力を削ぐといいわよ!', { name: this.name, look: this.look });
    },
  },
  lighthouse: {
    name: '灯台守のマリン', look: NL('#3da5ff', '#ffffff', 'bob', 'ribbon', '#3a6ed8', '#2a6ad8'),
    async talk() {
      if (!G.flags.lighthouse) { G.flags.lighthouse = 1; G.stones += 150; Sound.play('chest'); Game.hud(); await UI.say(['東の端まで来るなんて、すごい冒険家さん!', '海で拾った 星晶石×150 をあげる!'], { name: this.name, look: this.look }); return; }
      await UI.say('夜の海に星が映ると、とってもきれいなの。', { name: this.name, look: this.look });
    },
  },
  arena_master: {
    name: '闘技場の主レイラ', look: NL('#e8b83a', '#a8303a', 'pony', 'tiara', '#f5c542', '#e8a020'),
    async talk() { await Story.arena(this); },
  },
  hermit: {
    name: '森の隠者', look: 'elder',
    async talk() {
      if (!G.flags.hermit) {
        G.flags.hermit = 1; G.stones += 100; Sound.play('chest'); Game.hud();
        await UI.say(['…ほう、こんな森の奥まで客とは珍しい。', '星晶石を少し分けてやろう。\n星晶石×100 を受け取った!'], { name: this.name });
      }
      await UI.say(['風の神殿は西にある。木々に覆われた古い神殿じゃ。', '中には岩を使った仕掛けがある。\n岩を押しすぎて動かせなくなったら、\n光る紋様を踏むとよい。元に戻るぞ。', '扉の謎は、壁に刻まれた「風の歌」が答えじゃ。'], { name: this.name });
    },
  },
};

const Story = {
  async intro() {
    await UI.fade('#000', 10, 0, 600, async () => { });
    await UI.say([
      '――遥か昔。\n星の女神は 世界に「星晶石」を遺した。',
      'その輝きは 異界の少女たちを呼び寄せ、\n人々と共に 闇を退けてきたという。',
      'そして今――\n湖の魔王城に、魔王ノクスが再び目覚めた。',
      'ルミナ村の少女アリアは、\n星晶石の声に導かれ、旅立ちを決意する。',
    ]);
    await UI.say(['(村長の家は 村の北西にあるよ)', '操作: 十字キーで移動、Aで調べる・話す、\nBを押しながら移動でダッシュ、MENUでメニュー。'], { name: 'ガイド' });
    const c = await UI.ask('まずは「はじめての召喚」で仲間を呼びましょう!\n(10連が半額、★4以上1枠確定)', ['召喚する!', 'あとで']);
    if (c === 0) await Gacha.open('beginner');
  },
  async login() {
    const t = U.today();
    if (G.login === t) return;
    G.login = t;
    G.stones += 100;
    Game.hud();
    Sound.play('chest');
    await UI.say('★ ログインボーナス ★\n星晶石×100 を受け取った!');
  },
  objective() {
    if (G.flags.cleared) return '魔王ノクスを倒した!世界中の宝箱や仲間集めを楽しもう。';
    const n = G.crystals.length;
    if (!G.flags.metElder) return 'ルミナ村の村長の家を訪ねよう。';
    if (n === 0) return '封印の水晶を集めよう。おすすめは西の森にある「風の神殿」。';
    if (n < 4) {
      const left = Object.keys(CRYSTAL_INFO).filter(k => !G.crystals.includes(k)).map(k => CRYSTAL_INFO[k].where);
      return `残りの水晶: ${left.join(' / ')}`;
    }
    if (!G.seal) return '4つの水晶がそろった!湖の橋の封印を解こう。';
    return '魔王城の奥で 魔王ノクスを倒そう!';
  },
  async shop(id, npc) {
    const list = SHOPS[id];
    await UI.say('いらっしゃいませ!なにを お求めですか?', { name: npc.name, look: npc.look });
    for (; ;) {
      const c = await UI.ask(`所持金 ${G.gold} G`, list.map(k => `${ITEMS[k].n}  ${ITEMS[k].price}G  (所持${G.items[k] || 0})`).concat(['やめる']), { name: npc.name, look: npc.look });
      if (c < 0 || c >= list.length) break;
      const it = ITEMS[list[c]];
      const qs = [1, 3, 5, 10].filter(q => q * it.price <= G.gold);
      if (!qs.length) { Sound.play('buzz'); await UI.say('お金が足りないみたい…', { name: npc.name, look: npc.look }); continue; }
      const q = await UI.ask(`${it.n} (${it.desc})\nいくつ買いますか?`, qs.map(q => `${q}個  ${q * it.price}G`));
      if (q < 0) continue;
      G.gold -= qs[q] * it.price; addItem(list[c], qs[q]);
      Sound.play('chest');
      Game.hud();
    }
    await UI.say('ありがとうございました!また来てね!', { name: npc.name, look: npc.look });
  },
  async saveCrystal(o) {
    const first = !G.saves[o.id];
    G.saves[o.id] = 1;
    healAll();
    Sound.play('save');
    Game.hud();
    if (first) await UI.say(`クリスタルに触れた。\n「${o.name}」が転移先に登録された!`);
    Game.autoSave(true);
    const c = await UI.ask('クリスタルの光が仲間の傷を癒した。\n(冒険は自動でセーブされています)\nどうしますか?', ['セーブする', '転移する', 'やめる']);
    if (c === 0) {
      G.lastSave = { x: Field.p.x, y: Field.p.y };
      if (saveGame()) { Sound.play('ok'); await UI.say('冒険の記録をセーブしました。'); }
      else await UI.say('セーブに失敗しました…(ブラウザの保存領域を確認してください)');
    } else if (c === 1) {
      const s = await Menu.teleport(o.id);
      if (!s) return;
      Sound.play('magic');
      await UI.fade('#fff', 300, 100, 300, () => {
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (Field.walkable(s.x + dx, s.y + dy)) { Field.teleport(s.x + dx, s.y + dy, 'u'); break; }
      });
    }
  },
  // 英雄の闘技場: 倒したボスと再戦 (通常・強化・極)
  async arena(npc) {
    const bosses = DUNGEONS.filter(d => G.bosses[d.id]).map(d => ({ id: d.id, enemy: d.boss.enemy, area: d.area, name: d.name, lv: d.lv }));
    if (!bosses.length) { await UI.say(['ようこそ、英雄の闘技場へ!', 'ここでは一度倒したボスと、もう一度戦えるの。\n強化版を倒せば、星晶石のご褒美もあるわよ。', 'まずはどこかのボスを倒してきてね!'], { name: npc.name, look: npc.look }); return; }
    await UI.say('ようこそ、英雄の闘技場へ!\n戦う前に、みんなの傷は治しておくわね。', { name: npc.name, look: npc.look });
    healAll();
    G.rematch = G.rematch || {};
    for (; ;) {
      const bi = await UI.ask('どのボスと戦う?', bosses.map(b => `${ENEMIES[b.enemy].n} (${b.name}) ${REMATCH_TIERS.slice(1).map(t => G.rematch[b.enemy + ':' + t.id] ? '★' : '☆').join('')}`).concat(['やめる']), { name: npc.name, look: npc.look });
      if (bi < 0 || bi >= bosses.length) break;
      const b = bosses[bi];
      const ti = await UI.ask(`${ENEMIES[b.enemy].n}\nどの強さで戦う?(推奨Lv${b.lv})`, REMATCH_TIERS.map(t => `${t.n}${t.mul > 1 ? ` (強さ×${t.mul})` : ''}${t.reward ? (G.rematch[b.enemy + ':' + t.id] ? ' 撃破済み' : ` 初回 星晶石${t.reward}`) : ''}`), { name: npc.name, look: npc.look });
      if (ti < 0) continue;
      const t = REMATCH_TIERS[ti];
      const r = await Battle.start([b.enemy], { bg: AREAS[b.area] ? AREAS[b.area].bg : 'castle', boss: true, mul: t.mul, tag: t.mul > 1 ? `【${t.n}】` : '', rematch: true, arena: true });
      healAll();
      if (r === 'win') {
        const k = b.enemy + ':' + t.id;
        if (t.reward && !G.rematch[k]) { G.rematch[k] = 1; G.stones += t.reward; Sound.play('star5'); Game.hud(); await UI.say(`見事!初めての${t.n}撃破ボーナス\n星晶石×${t.reward} を受け取った!`, { name: npc.name, look: npc.look }); }
        else await UI.say('いい戦いだったわ!', { name: npc.name, look: npc.look });
      } else if (r === 'lose') await UI.say('惜しかったわね…医務室で手当てしておいたわ。\n(闘技場で負けても冒険には影響しません)', { name: npc.name, look: npc.look });
      Game.autoSave();
    }
  },
  async riddle(d) {
    const r = d.riddle;
    let ok = false;
    if (r.type === 'choice') { const c = await UI.ask(r.prompt, r.options); if (c < 0) return; ok = c === r.answer; }
    else if (r.type === 'code') { const v = await UI.code(r.prompt, r.digits); if (v === null) return; ok = v === r.answer; }
    else if (r.type === 'seq') { const v = await UI.seq(r.prompt, r.options, r.answer.length); if (!v) return; ok = v.join() === r.answer.join(); }
    if (ok) {
      G.rdoors[d.id] = 1;
      Field.setFloor(d.x, d.y, d.struct);
      G.stones += 100;
      Sound.play('puzzle');
      setTimeout(() => Sound.play('gate'), 450);
      Game.hud();
      await UI.say('正解だ!\n重い扉が音を立てて開いた!\n(謎解きボーナス: 星晶石×100)');
      Game.autoSave();
    } else {
      Sound.play('buzz');
      await UI.say('……何も起こらない。\n答えが違うようだ。ヒントを探そう。');
    }
  },
  async altar() {
    const c = await UI.ask('召喚の祭壇だ。\n星晶石を捧げて 仲間を呼びますか?', ['召喚する', 'やめる']);
    if (c === 0) await Gacha.open();
  },
  async seal() {
    const n = G.crystals.length;
    if (n < 4) { await UI.say(`橋に紫色の結界が張られている…\n封印を解くには 4つの封印の水晶が必要だ。\n(現在 ${n}/4)`); return; }
    await UI.say('4つの水晶が 強く輝きはじめた――!');
    Sound.play('star5');
    await UI.fade('#fff', 500, 300, 700, () => { G.seal = true; WORLD.tiles[WORLD.seal.y * MW + WORLD.seal.x] = T.BRIDGE; });
    await UI.say('封印が砕け散った!\n魔王城への道が開かれた!');
    Game.autoSave();
  },
  async bossDefeated(o) {
    if (o.sub) {
      const r = o.reward || { stones: 200 };
      const t = grant(r);
      Sound.play('star5');
      Game.hud();
      await UI.say([`${ENEMIES[o.enemy].n} を倒した!`, `討伐報酬: ${t}\n奥の宝箱も忘れずに!`]);
      Game.autoSave();
      return;
    }
    if (o.crystal) {
      G.crystals.push(o.crystal);
      G.stones += 300;
      Sound.play('star5');
      Game.hud();
      const ci = CRYSTAL_INFO[o.crystal];
      await UI.say([`${ci.n} を手に入れた!\n(討伐ボーナス: 星晶石×300)`, `封印の水晶 ${G.crystals.length}/4`]);
      if (G.crystals.length === 2) await UI.say('水晶が共鳴している…\n【限定召喚「星詠みの姫君」】が解放された!\n(メニュー → ガチャ)');
      if (G.crystals.length === 4) await UI.say('4つの水晶がそろった!\n湖の魔王城へ続く橋へ向かおう!');
      Game.autoSave();
      // 入口近くのクリスタルへ戻すか尋ねる
      const st = WORLD.dunInfo[o.struct];
      const c = await UI.ask('ダンジョンの入口へ戻りますか?', ['戻る', 'このまま']);
      if (c === 0 && st) await UI.fade('#fff', 250, 100, 250, () => Field.teleport(st.entrance.x, st.entrance.y + 1, 'd'));
    } else {
      await this.ending();
    }
  },
  async ending() {
    G.flags.cleared = 1;
    G.stones += 1000;
    Sound.jingle('fanfare', 'title');
    await UI.say(['魔王ノクスは 光の中に消えていった――', '湖を覆っていた闇は晴れ、\n大陸に再び 星の光が降りそそぐ。', 'アリアと少女たちの冒険は、\nこうして 伝説となった。']);
    const el = U.el('div', 'layer credits');
    el.innerHTML = `<div class="cr-in"><h1>星晶のクロニクル</h1><p>〜 THE END 〜</p><p>Thank you for playing!</p><p class="sm">クリア特典: 星晶石×1000<br>クリア後も冒険を続けられます。</p><div class="crp">${Object.keys(G.roster).map(k => `<img src="${portraitURL(CHARS[k].look)}">`).join('')}</div></div>`;
    await new Promise(r => { const l = { el, handle: k => { if (k === 'a') { UI.pop(l); r(); } } }; el.onclick = () => { UI.pop(l); r(); }; UI.push(l); });
    Field.updateLoc(true);
  },
};
