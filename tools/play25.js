// 衣装の全身プレビューのテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    obtainChar('yumeno'); G.skins['yumeno@uniform'] = 1; G.skins['yumeno@yukata'] = 1; Menu.status('yumeno'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('[data-sk="yumeno@yukata"]').click());
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.fb-wrap').scrollIntoView());
  await p.screenshot({ path: SP + '/F_status.png' });
  await p.evaluate(() => document.querySelector('[data-wear]').click());
  await p.waitForTimeout(200);
  console.log('skin', await p.evaluate(() => G.roster.yumeno.skin));
  await p.evaluate(() => document.querySelector('[data-sk="yumeno@dress"]').click());
  await p.waitForTimeout(200);
  console.log('locked preview', await p.evaluate(() => document.querySelector('.fb-info').innerText.replace(/\n/g, ' ')));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); G.stones = 9999; const bn = getBanners(G).find(x => x.id === 'skin'); const res = [{ kind: 'skin', id: 'yumeno@dress', rar: 5, res: { isNew: true } }]; Gacha.summon(res, bn); });
  await p.waitForTimeout(500); await p.mouse.click(200, 300); await p.waitForTimeout(1200);
  await p.screenshot({ path: SP + '/F_reveal.png' });
  await b.close();
})();
