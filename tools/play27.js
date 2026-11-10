// 第2章: 飛空艇・空の大陸・紋章・ラスボス のテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.cleared = 1; G.flags.homeIntro = 1;
    for (const k of ['seres', 'noa', 'luka']) obtainChar(k); G.party = ['aria', 'seres', 'noa', 'luka'];
    for (const id in G.roster) G.roster[id].lv = 45; healAll(); Field.init(); Game.scene = 'field'; NPCS.sky_engineer.talk.call(NPCS.sky_engineer); });
  for (let i = 0; i < 14; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(220); }
  console.log('airship', await p.evaluate(() => [G.flags.airship, JSON.stringify(G.airship), JSON.stringify(WORLD.airDock)]));
  // 飛空艇の横へ行って乗る
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); const a = Field.airship; Field.teleport(a.x - 1, a.y, 'r'); });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400); await p.keyboard.press('KeyZ'); await p.waitForTimeout(500);
  console.log('flying', await p.evaluate(() => [Field.flying, Field.locInfo().name]));
  // 海の上を飛ぶ (南へ数歩)
  for (let i = 0; i < 6; i++) { await p.keyboard.down('ArrowDown'); await p.waitForTimeout(90); await p.keyboard.up('ArrowDown'); await p.waitForTimeout(40); }
  // 空の大陸の近くへ (テスト用に位置を移す)
  await p.evaluate(() => { const s = WORLD.skyStart; Field.p.x = Field.p.fx = s.x - 6; Field.p.y = Field.p.fy = 432; Field.reveal(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/C2_fly.png' });
  // 雲の上では着陸できない
  await p.evaluate(() => { Field.p.x = Field.p.fx = 60; Field.p.y = Field.p.fy = 424; });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  console.log('cloud land', await p.evaluate(() => [Field.flying, TILE_DEFS[Field.tile(Field.p.x, Field.p.y)].k]));
  // 町の門の前に着陸
  await p.evaluate(() => { const s = WORLD.skyStart; Field.p.x = Field.p.fx = s.x + 3; Field.p.y = Field.p.fy = s.y + 2; });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(500);
  console.log('landed', await p.evaluate(() => [Field.flying, Field.p.x, Field.p.y, JSON.stringify(G.airship), Field.locInfo().name]));
  await p.evaluate(() => { const s = WORLD.skyStart; Field.teleport(s.x, s.y - 3, 'u'); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: SP + '/C2_town.png' });
  // 長老
  await p.evaluate(() => { NPCS.aeria_elder.talk.call(NPCS.aeria_elder); });
  for (let i = 0; i < 8; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(220); }
  console.log('elder', await p.evaluate(() => [G.flags.metSkyElder, G.stones, Story.objective()]));
  // 戦闘 (空のフィールドの敵、Lv45)
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); window._r = Battle.start(['harpy', 'thunderbird'], { arena: true, bg: 'sky' }); });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: SP + '/C2_battle.png' });
  await p.evaluate(() => { Battle.toggleAuto(); Battle.fast = true; });
  console.log('battle', await p.evaluate(() => window._r), await p.evaluate(() => Battle.turn));
  // 紋章3つとボス撃破の流れ
  await p.evaluate(() => { G.emblems = ['gale', 'thunder']; Story.bossDefeated({ emblem: 'star', enemy: 'skycolossus', struct: 'starchapel' }); });
  for (let i = 0; i < 6; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(220); }
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('KeyZ'); await p.waitForTimeout(300);
  console.log('emblems', await p.evaluate(() => [G.emblems.join(','), Story.objective()]));
  // セーブ/ロード (飛空艇の位置)
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); saveGame(); G = null; loadGame(); Field.init(); });
  console.log('reload', await p.evaluate(() => [Field.flying, JSON.stringify(G.airship), !!Field.airship, G.emblems.length]));
  await b.close();
})();
