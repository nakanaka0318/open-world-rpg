const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; for (const k of ['noa', 'homura']) obtainChar(k); for (const k of ['c_star', 'c_whirl', 'c_venom', 'c_twin']) obtainCard(k); obtainCard('c_star'); G.stones = 3000; Field.busy = true; });
  const sh = n => p.screenshot({ path: `${SP}/D_${n}.png` });
  await p.evaluate(() => { Menu.deckEdit(); }); await p.waitForTimeout(400); await sh('deck');
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400); await sh('deckpick');
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Menu.status('noa'); }); await p.waitForTimeout(400); await sh('status');
  await p.evaluate(() => { for (const l of UI.stack.slice()) UI.pop(l); Gacha.open('card'); }); await p.waitForTimeout(400); await sh('cardgacha');
  await p.evaluate(() => { const r = Gacha.roll(getBanners(G).find(b => b.id === 'card'), 10); r[2].rar = 5; r[2].id = 'c_thousand'; Gacha.summon(r); });
  await p.waitForTimeout(3300); for (let i = 0; i < 3; i++) await p.waitForTimeout(300); await sh('cardsummon');
  for (let i = 0; i < 8; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(300); } await sh('cardgrid');
  await b.close();
})();
