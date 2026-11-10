// マイホームと絆のテスト
const { chromium, devices } = require('playwright');
const SP = process.env.SP || '.';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); G.flags.homeIntro = 1;
    for (const k of ['luka', 'yumeno', 'fuuri', 'mokomo', 'seres', 'noa', 'kanae']) obtainChar(k);
    G.party = ['aria', 'seres']; G.gold = 9999;
    G.home.owned = { plant: 1, sofa: 1, piano: 1, aquarium: 1, game: 1, fireplace: 1, star: 1, shelf: 1, plush: 1, table: 1, lamp: 1 };
    G.home.placed = [{ f: 'plant', x: 2, y: 1 }, { f: 'sofa', x: 4, y: 2 }, { f: 'piano', x: 8, y: 1 }, { f: 'aquarium', x: 9, y: 4 }, { f: 'game', x: 6, y: 1 }, { f: 'fireplace', x: 5, y: 1 }, { f: 'star', x: 1, y: 5 }, { f: 'plush', x: 3, y: 2 }, { f: 'table', x: 4, y: 4 }, { f: 'lamp', x: 7, y: 1 }];
    G.roster.yumeno.bond = { lv: 3, exp: 0, ep: 0 };
    Field.init(); Game.scene = 'field';
    const s = Home.st(); Field.teleport(s.x + 6, s.y + 5, 'u'); Home.refresh(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/H_room.png' });
  console.log(await p.evaluate(() => [Home.st(), Home.girls.map(g => g.homeGirl + '@' + g.x + ',' + g.y), Home.furn.length]));
  // 仲間と会話(エピソード)
  await p.evaluate(() => { Home.talk('yumeno'); });
  await p.waitForTimeout(500);
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(350); }
  await p.screenshot({ path: SP + '/H_ep.png' });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyZ'); await p.waitForTimeout(350); }
  console.log('bond', await p.evaluate(() => JSON.stringify(G.roster.yumeno.bond)));
  await p.evaluate(() => { while (UI.stack.length) UI.pop(UI.stack[UI.stack.length - 1]); for (let i = 0; i < 60; i++) Bond.gain('noa', 30, true); });
  console.log('noa', await p.evaluate(() => JSON.stringify(G.roster.noa.bond) + ' skin:' + !!G.skins['noa@bond'] + ' hp ' + charStats(G.roster.noa).hp + ' ult ' + cardDesc('ult_noa')));
  await p.evaluate(() => { Menu.status('noa'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('.bond').scrollIntoView(); });
  await p.screenshot({ path: SP + '/H_status.png' });
  await b.close();
})();
