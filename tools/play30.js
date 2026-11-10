// 新★5の8人で戦闘してエラーがないか確かめる
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene === 'title' && UI.stack.length > 0);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; Sound.enabled = false;
    for (const k of ['nagisa', 'shion', 'koharu', 'sumire', 'tsumugi', 'rio', 'kuroha', 'seira']) obtainChar(k); for (const id in G.roster) G.roster[id].lv = 25; });
  for (const party of [['nagisa', 'shion', 'koharu', 'sumire'], ['tsumugi', 'rio', 'kuroha', 'seira']]) {
    const r = await p.evaluate(async (party) => {
      G.party = party; healAll();
      Battle.auto = true; Battle.fast = true;
      const ow = Battle.wait; Battle.wait = () => Promise.resolve(); const oc = Battle.cutin; Battle.cutin = async () => { };
      const pr = Battle.start(['crywolf', 'cryghost', 'crybat'], { arena: true, ultStart: 10 });
      let res; await new Promise(ok => { const iv = setInterval(() => { if (Battle.onAny) Battle.onAny(); if (Battle.turn > 40) { Battle.P.hp = 0; Battle.checkEnd(); } }, 40); pr.then(x => { res = x; clearInterval(iv); ok(); }); });
      Battle.wait = ow; Battle.cutin = oc;
      for (const l of UI.stack.slice()) UI.pop(l);
      return res + ' t' + Battle.turn + ' ' + JSON.stringify(Battle.P.st);
    }, party);
    console.log(party.join(','), r);
  }
  console.log(await p.evaluate(() => ['nagisa_4', 'shion_1', 'shion_3', 'koharu_3', 'sumire_2', 'tsumugi_0', 'rio_0', 'kuroha_0', 'seira_0', 'misuzu_4'].map(k => CARDS[k].n + ':' + cardDesc(k)).join('\n')));
  await b.close();
})();
