require('./load')(['js/util.js', 'js/sprites.js', 'js/data.js', 'js/map.js']);
const t0 = Date.now();
const Wd = buildWorld();
console.log('build ms', Date.now() - t0);
const { W, H, tiles, region, biome, objs, structs } = Wd;
let ok = true;
const fail = m => { ok = false; console.log('FAIL', m); };
for (const s of structs) {
  for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (!biome[y * W + x] && s.id !== 'castle') { fail('struct in ocean ' + s.id + ' ' + x + ',' + y); y = 999; break; }
}
// BFS: 動的ギミックは通行可能とみなす
const pass = new Set([T.SEAL, T.GATE, T.RDOOR, T.HOLE]);
const objBlock = new Set();
for (const k of ['chests', 'saves', 'bosses', 'npcs']) for (const o of objs[k]) objBlock.add(o.y * W + o.x);
const seen = new Uint8Array(W * H);
const q = [Wd.start.y * W + Wd.start.x]; seen[q[0]] = 1;
while (q.length) {
  const i = q.pop(), x = i % W, y = (i / W) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const j = (y + dy) * W + x + dx;
    if (seen[j]) continue;
    const t = tiles[j];
    if (TILE_DEFS[t].solid && !pass.has(t)) continue;
    if (objBlock.has(j)) continue;
    seen[j] = 1; q.push(j);
  }
}
const adj = (o) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(o.y + dy) * W + o.x + dx] || (TILE_DEFS[tiles[(o.y + dy) * W + o.x + dx]].counter && seen[(o.y + 2 * dy) * W + o.x + 2 * dx]));
for (const k of ['chests', 'saves', 'bosses', 'npcs', 'tablets', 'signs', 'altars', 'rdoors']) for (const o of objs[k]) if (!adj(o)) fail('unreachable ' + k + ' ' + (o.id || '') + ' ' + o.x + ',' + o.y);
for (const o of objs.hidden) if (!seen[o.y * W + o.x]) fail('hidden unreachable ' + o.id);
console.log('chests', objs.chests.length, 'spawns', objs.spawns.length, 'npcs', objs.npcs.length, 'hidden', objs.hidden.map(h => h.id + '@' + h.x + ',' + h.y).join(' '));
console.log('seal', Wd.seal, 'start', Wd.start, 'hint3', Wd.hint3, 'hint2', Wd.hint2);
console.log(Wd.hint1);

// 倉庫番ソルバ (部分パズルごと)
const SUBS = {
  shrine: [{ start: [4, 14], goal: 'g1' }],
  ruins: [{ start: [18, 12], goal: 'g3' }, { start: [6, 12], goal: (r) => r.has(3 * 100 + 11) }],
  icecave: [{ start: [11, 17], only: (x, y) => y > 13, goal: (r) => [9, 10, 11, 12, 13].some(x => r.has(x * 100 + 11)) }, { start: [10, 11], only: (x, y) => x === 11 && y === 10, goal: (r, b) => b.includes(611) }, { start: [10, 11], only: (x, y) => x === 4 && y === 8, goal: (r, b) => b.includes(207) }, { start: [10, 11], only: (x, y) => x === 19 && y === 8, goal: (r, b) => b.includes(2007) }],
  volccave: [{ start: [11, 14], goal: 'g1' }],
  castle: [{ start: [8, 13], goal: (r) => [...r].some(p => p % 100 <= 8) }],
  crylab: [{ start: [9, 10], goal: 'g1' }],
  seacave: [{ start: [9, 9], goal: (r) => [...r].some(p => p % 100 <= 2) }],
};
for (const dg of DUNGEONS) {
  const bp = dg.bp, w = bp[0].length, h = bp.length;
  const wall = (x, y) => { const c = bp[y] && bp[y][x]; return !c || '#VWTKBC^!$SZRQabcE'.includes(c); };
  for (const sub of SUBS[dg.id] || []) {
    const boulders = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (bp[y][x] === 'O' && (!sub.only || sub.only(x, y))) boulders.push(x * 100 + y);
    let goal = sub.goal;
    if (typeof goal === 'string') { const g = goal[1]; const sws = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (bp[y][x] === g) sws.push(x * 100 + y); goal = (r, b) => sws.every(p => b.includes(p)); }
    const reachOf = (p, bs, filled) => {
      const r = new Set([p]); const st = [p];
      while (st.length) { const c = st.pop(), x = (c / 100) | 0, y = c % 100;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx * 100 + ny;
          if (r.has(k) || ny >= h - 1 || wall(nx, ny) || bs.includes(k)) continue;
          if (bp[ny][nx] === 'H' && !filled.includes(k)) continue;
          r.add(k); st.push(k); } }
      return r;
    };
    const seen = new Set(); const Q = [{ b: boulders, f: [], p: sub.start[0] * 100 + sub.start[1] }]; let qi = 0, found = false;
    while (qi < Q.length && qi < 400000) {
      const s = Q[qi++]; const r = reachOf(s.p, s.b, s.f);
      let mn = 1e9; for (const v of r) if (v < mn) mn = v;
      const key = [...s.b].sort((a, b) => a - b).join(',') + '|' + [...s.f].sort().join(',') + '|' + mn;
      if (seen.has(key)) continue; seen.add(key);
      if (goal(r, s.b)) { found = true; break; }
      s.b.forEach((bb, bi) => { const bx = (bb / 100) | 0, by = bb % 100;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const pp = (bx - dx) * 100 + by - dy, tx = bx + dx, ty = by + dy, tk = tx * 100 + ty;
          if (!r.has(pp) || ty >= h - 1 || wall(tx, ty) || s.b.includes(tk)) continue;
          const nb = s.b.slice(), nf = s.f.slice();
          if (bp[ty][tx] === 'H' && !s.f.includes(tk)) { nb.splice(bi, 1); nf.push(tk); } else nb[bi] = tk;
          Q.push({ b: nb, f: nf, p: bb });
        } });
    }
    console.log(dg.id, JSON.stringify(sub.start), found ? 'SOLVABLE' : 'NOT SOLVED', 'states', qi);
    if (!found) ok = false;
  }
}
console.log(ok ? 'ALL OK' : 'PROBLEMS');
