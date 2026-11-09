const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(500);
  await p.evaluate(async () => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Game.hud(); G.stones = 5000; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/L_field.png' });
  // セーブ→ロード
  const r = await p.evaluate(() => { G.gold = 1234; G.chests.c0 = 1; G.boulders.shrine_b0 = [1, 2]; Field.teleport(60, 70); return saveGame(); });
  await p.evaluate(() => Game.title());
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/L_title.png' });
  await p.evaluate(() => { Game.continueGame(); });
  await p.waitForTimeout(1500);
  console.log('save', r, await p.evaluate(() => [G.gold, G.chests.c0, Field.p.x, Field.p.y, G.explored.reduce((a, v) => a + v, 0), Game.scene, UI.stack.length].join(',')));
  for (let i = 0; i < 3; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(200); }
  // 10連 → 演出
  await p.evaluate(() => { Gacha.open('pickup'); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/L_gacha.png' });
  await p.evaluate(async () => { const res = Gacha.roll(getBanners(G)[0], 10); res[3].rar = 5; res[3].id = 'stella'; Gacha.summon(res); });
  await p.waitForTimeout(3200);
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(250); }
  await p.screenshot({ path: SP + '/L_reveal.png' });
  for (let i = 0; i < 10; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(400); }
  await p.screenshot({ path: SP + '/L_grid.png' });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyX'); await p.waitForTimeout(300); }
  // ボス戦 (ドラゴン)
  await p.evaluate(() => { for (const k in G.roster) { G.roster[k].lv = 20; fullHeal(G.roster[k]); } Battle.start(['flamed'], { bg: 'lava', boss: true }); });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: SP + '/L_boss.png' });
  await b.close();
})();
