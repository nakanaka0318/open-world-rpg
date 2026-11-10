// 衣装ガチャと着替えのテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    for (const k of ['luka', 'yumeno', 'fuuri', 'mokomo', 'seres', 'noa']) obtainChar(k);
    G.party = ['yumeno', 'luka', 'fuuri', 'mokomo']; G.stones = 5000; G.gacha.beginnerDone = true; });
  await p.evaluate(() => { Gacha.open('skin'); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: SP + '/S_banner.png' });
  const res = await p.evaluate(() => { const b = getBanners(G).find(x => x.id === 'skin'); return Gacha.roll(b, 10).map(r => r.id + ':' + r.rar + ':' + r.res.text); });
  console.log(res.join(' '));
  await p.evaluate(() => { const b = getBanners(G).find(x => x.id === 'skin'); Gacha.summon(Gacha.roll(b, 10), b); });
  await p.waitForTimeout(800); await p.mouse.click(200, 300); await p.waitForTimeout(2500);
  await p.screenshot({ path: SP + '/S_result.png' });
  for (let i = 0; i < 6; i++) { await p.mouse.click(200, 300); await p.waitForTimeout(400); }
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); G.skins['yumeno@swim'] = 1; G.skins['yumeno@dress'] = 1; G.skins['yumeno@uniform'] = 1; Menu.status('yumeno'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('[data-sk="yumeno@uniform"]').click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const el = document.querySelector('.skin-grid'); el.scrollIntoView(); });
  await p.screenshot({ path: SP + '/S_status.png' });
  console.log('skin', await p.evaluate(() => G.roster.yumeno.skin));
  await b.close();
})();
