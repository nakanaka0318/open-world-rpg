// 恋人(絆Lv11)・告白・デート・大人向け衣装のテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.homeIntro = 1;
    for (const k of ['seres', 'pico', 'viola']) obtainChar(k);
    G.roster.seres.bond = { lv: 10, exp: 0, ep: 3 }; G.gifts.ring = 2; G.party = ['aria'];
    Field.init(); Game.scene = 'field'; });
  console.log('pico skins', await p.evaluate(() => skinsOf('pico').map(k => SKINS[k].theme).join(',')), '/ seres', await p.evaluate(() => skinsOf('seres').map(k => SKINS[k].theme).join(',')));
  console.log('canConfess', await p.evaluate(() => [canConfess('seres'), canConfess('pico'), canConfess('viola')]));
  await p.evaluate(() => { Home.talk('seres'); });
  const press = async (n, ms = 300) => { for (let i = 0; i < n; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(ms); } };
  const choose = async (label) => { await p.waitForFunction(l => [...document.querySelectorAll('#ui .li')].some(e => e.textContent.includes(l)), label, { timeout: 5000 }); await p.evaluate(l => { [...document.querySelectorAll('#ui .li')].find(e => e.textContent.includes(l)).click(); }, label); await p.waitForTimeout(300); };
  await p.waitForTimeout(400); await press(1); // 最初のセリフ
  await choose('プレゼント');
  await choose('約束の指輪');
  await press(2);
  await p.screenshot({ path: SP + '/L_conf.png' });
  await press(4);
  console.log('after', await p.evaluate(() => [JSON.stringify(G.roster.seres.bond), G.gifts.ring, Object.keys(G.skins).join(','), bondUltMul('seres'), charStats(G.roster.seres).hp]));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Bond.date('seres'); });
  await press(1); await press(5);
  console.log('date', await p.evaluate(() => [JSON.stringify(G.roster.seres.dates), G.stones]));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); Menu.status('seres'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.skin-grid').scrollIntoView());
  await p.screenshot({ path: SP + '/L_status.png' });
  await b.close();
})();
