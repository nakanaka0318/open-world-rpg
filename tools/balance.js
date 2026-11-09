const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 400, height: 800 } })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => { UI.pop(UI.stack[0]); buildWorld(); newGame(); Field.init(); Game.scene = 'field'; for (const k of ['seres', 'shizuku', 'lily']) obtainChar(k); Sound.enabled = false; });
  const cases = process.env.CASES ? JSON.parse(process.env.CASES) : [[1, ['slime', 'slime']], [2, ['slime', 'mush']], [5, ['wolf', 'mush2']], [5, ['treant']], [9, ['scorp', 'sandslime']], [9, ['golemk']], [12, ['snowwolf', 'iceghost']], [12, ['frostd']], [15, ['hellhound', 'wisp']], [15, ['flamed']], [20, ['dknight', 'darkghost']], [22, ['demon']]];
  for (const [lv, grp] of cases) {
    const runs = [];
    for (let k = 0; k < 2; k++) {
      const r = await p.evaluate(async ([lv, grp]) => {
        for (const id in G.roster) { const c = G.roster[id]; c.lv = lv; c.exp = 0; fullHeal(c); }
        Battle.auto = true; Battle.fast = true;
        const origWait = Battle.wait; Battle.wait = () => Promise.resolve();
        const origCut = Battle.cutin; Battle.cutin = async () => { };
        const pr = Battle.start(grp, { bg: 'meadow', boss: ENEMIES[grp[0]].boss });
        const t0 = Date.now();
        let res;
        await new Promise(ok => { const iv = setInterval(() => { if (Battle.onAny) Battle.onAny(); if (Battle.turn > 60) { Battle.P.hp = 0; Battle.checkEnd(); } }, 50); pr.then(x => { res = x; clearInterval(iv); ok(); }); });
        Battle.wait = origWait; Battle.cutin = origCut;
        for (const l of UI.stack.slice()) UI.pop(l);
        const P = partyChars().reduce((a, c) => a + c.hp, 0), M = partyChars().reduce((a, c) => a + charStats(c).hp, 0);
        return `${res} t${Battle.turn} hp${Math.round(100 * P / M)}%`;
      }, [lv, grp]);
      runs.push(r);
    }
    console.log('Lv' + lv, grp.join('+'), '=>', runs.join(' | '));
  }
  await b.close();
})();
