// 家具を置く操作・セーブ/ロードのテスト
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field';
    const s = Home.st(); Field.teleport(s.x + 6, s.y + 7, 'u'); });
  // 家に入る → 紹介イベント
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(500);
  for (let i = 0; i < 6; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(300); }
  console.log('intro', await p.evaluate(() => [G.flags.homeIntro, JSON.stringify(G.home.owned), UI.stack.length, Field.p.x - Home.st().x, Field.p.y - Home.st().y]));
  // 本棚の前へ
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); const s = Home.st(); Field.teleport(s.x + 10, s.y + 2, 'u'); });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(400);
  console.log('menu', await p.evaluate(() => document.querySelector('.choice') && document.querySelector('.choice').innerText.replace(/\n/g, '|')));
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(500); // 家具を置く
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(500); // 1つめ
  console.log('carry', await p.evaluate(() => Home.carrying));
  await p.evaluate(() => { const s = Home.st(); Field.teleport(s.x + 5, s.y + 4, 'u'); });
  await p.keyboard.press('KeyZ'); await p.waitForTimeout(500);
  console.log('placed', await p.evaluate(() => JSON.stringify(G.home.placed) + ' carry=' + Home.carrying));
  // セーブ/ロード
  await p.evaluate(() => { G.skins['aria@swim'] = 1; G.roster.aria.skin = 'aria@swim'; Bond.gain('aria', 50, true); saveGame(); });
  const ok = await p.evaluate(() => { G = null; return loadGame() && JSON.stringify([G.home.placed.length, G.roster.aria.skin, G.roster.aria.bond, Object.keys(G.skins)]); });
  console.log('load', ok);
  await b.close();
})();
