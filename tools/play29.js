// 秘密のパスワードで絆・衣装が解放されるかのテスト
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Menu.status('aria'); });
  await p.waitForTimeout(300);
  const chk = () => p.evaluate(() => [getBanners(G).some(b => b.kind === 'skin'), !!document.querySelector('.skin-grid'), !!document.querySelector('.bond')]);
  console.log('locked', await chk());
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Menu.settings(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes('パスワード')).click());
  await p.waitForTimeout(300);
  await p.fill('.pw-in', 'aaaa'); await p.press('.pw-in', 'Enter');
  await p.waitForTimeout(300);
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Menu.status('aria'); });
  await p.waitForTimeout(300);
  console.log('unlocked', G => 0, await chk(), await p.evaluate(() => G.flags.secret));
  await b.close();
})();
