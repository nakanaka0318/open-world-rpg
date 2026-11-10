// 絆Lv1→11の通しテスト (パーティにいるキャラを本棚の「仲間と話す」から)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.homeIntro = 1; obtainChar('seres'); G.party = ['aria', 'seres']; G.gold = 99999;
    Field.init(); Game.scene = 'field'; for (let i = 0; i < 200; i++) Bond.gain('seres', 10, true); });
  console.log('lv', await p.evaluate(() => JSON.stringify(G.roster.seres.bond)));
  const choose = async (label) => { await p.waitForFunction(l => [...document.querySelectorAll('#ui .li')].some(e => e.textContent.includes(l)), label, { timeout: 5000 }); await p.evaluate(l => { [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes(l)).click(); }, label); await p.waitForTimeout(250); };
  const z = async n => { for (let i = 0; i < n; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(200); } };
  const closeAll = () => p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); });
  for (let k = 0; k < 3; k++) {
    await p.evaluate(() => { Home.menu(); });
    await choose('仲間と話す');
    await p.waitForTimeout(300);
    await p.evaluate(() => { const el = [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes('セレス')); el.click(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const el = [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes('セレス')); if (el) el.click(); });
    await z(8);
    await closeAll();
    console.log('ep', await p.evaluate(() => G.roster.seres.bond.ep));
  }
  // 指輪を買って渡す
  await p.evaluate(() => { G.gifts.ring = 1; Home.talk('seres'); });
  await p.waitForTimeout(300); await z(1);
  await choose('プレゼント'); await choose('約束の指輪'); await z(10);
  console.log('final', await p.evaluate(() => JSON.stringify(G.roster.seres.bond) + ' ' + Object.keys(G.skins).join(',')));
  await b.close();
})();
