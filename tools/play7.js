const { chromium, devices } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const land = process.env.LAND === '1';
  const p = await (await b.newContext({ ...devices[land ? 'iPhone 13 landscape' : 'iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  const pf = land ? 'BL_' : 'B_';
  const sh = n => p.screenshot({ path: `${SP}/${pf}${n}.png` });
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Game.hud();
    for (const k of ['noa', 'homura', 'shizuku']) obtainChar(k); G.roster.noa.lb = 3; healAll(); });
  await p.evaluate(() => { Battle.start(['wolf', 'mush2', 'bee'], { bg: 'forest' }); });
  await p.waitForTimeout(2200);
  await sh('1_start');
  await p.locator('.cb-slot').first().click(); await p.waitForTimeout(250);
  await sh('2_sel');
  await p.locator('.cb-slot').first().click(); await p.waitForTimeout(300);
  await sh('3_target');
  await p.locator('.cb-en').nth(1).click(); await p.waitForTimeout(300);
  await sh('4_cutin');
  await p.waitForTimeout(1500);
  await p.locator('.cb-end').click(); await p.waitForTimeout(500); await sh('5_enemyturn');
  await p.waitForTimeout(3000);
  await p.locator('.cb-pile').nth(1).click(); await p.waitForTimeout(300); await sh('6_discard');
  await p.keyboard.press('KeyX'); await p.waitForTimeout(200);
  await p.evaluate(() => Battle.toggleAuto());
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.locator('.result').count()) { await sh('7_result'); break; } }
  console.log('after', await p.evaluate(() => Battle.P && Battle.P.hp + '/' + Battle.P.max + ' turn ' + Battle.turn));
  await p.waitForTimeout(2600);
  console.log(await p.evaluate(() => Game.scene + ' ' + partyChars().map(c => c.id + ':' + c.hp + '/' + charStats(c).hp).join(',')));
  // ボス戦をオートで
  await p.evaluate(() => { for (const k in G.roster) { G.roster[k].lv = 6; } healAll(); Battle.auto = true; Battle.fast = true; window._r = null; Battle.start(['treant'], { bg: 'shrine', boss: true }).then(r => window._r = r); });
  await p.waitForTimeout(3500); await sh('8_boss');
  for (let i = 0; i < 200; i++) { await p.waitForTimeout(500); const r = await p.evaluate(() => window._r || (Battle.onAny ? (Battle.onAny(), 'res') : null)); if (r && r !== 'res') { console.log('boss result', r, await p.evaluate(() => 'turns ' + Battle.turn)); break; } }
  await b.close();
})();
