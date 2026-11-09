// 自動プレイテスト
const { chromium } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +(process.env.W || 960), height: +(process.env.H || 600) } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.message, e.stack); });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/t1_title.png' });
  const key = async (k, n = 1, w = 120) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(w); } };
  await key('KeyZ'); // はじめから
  await p.waitForTimeout(700);
  for (let i = 0; i < 8; i++) { await key('KeyZ', 2, 150); }
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/t2_intro.png' });
  console.log('scene', await p.evaluate(() => Game.scene + ' stack=' + UI.stack.length));
  await b.close();
  console.log('errors', errs.length);
})();
