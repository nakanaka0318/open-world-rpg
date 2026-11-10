'use strict';
// ===== ワールドマップ (1枚のシームレスな大陸) =====
const MW = 512, MH = 512;

// ---------- 建物の設計図 ----------
const HOUSE_BP = {
  home: [
    '############',
    '#B........K#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '###w##D#w###',
  ],
  elder: [
    '#########',
    '#K..N..K#',
    '#.......#',
    '#B.....B#',
    '#...T...#',
    '#.......#',
    '##w#D#w##',
  ],
  shop: [
    '########',
    '#KK.NKK#',
    '#.CCCC.#',
    '#......#',
    '#p....p#',
    '#w#D##w#',
  ],
  house: [
    '#######',
    '#B.K.B#',
    '#.....#',
    '#..T..#',
    '#.N...#',
    '#w#D#w#',
  ],
  house2: [
    '#######',
    '#K.B.K#',
    '#..N..#',
    '#.T...#',
    '#p...p#',
    '#w#D#w#',
  ],
  arena: [
    '#########',
    '#^.....^#',
    '#.......#',
    '#...N...#',
    '#^.....^#',
    '#.......#',
    '##w#D#w##',
  ],
  shrine: [
    '#######',
    '#^.Y.^#',
    '#.ccc.#',
    '#Nccc.#',
    '#.ccc.#',
    '##wDw##',
  ],
};

// ---------- ダンジョン ----------
const DUNGEONS = [
  {
    id: 'shrine', name: '風の神殿', x: 66, y: 240, style: 'stone', roof: 'canopy', dark: false, area: 'shrine', lv: 5,
    bp: [
      '#####################',
      '#...#...........#...#',
      '#.$.#.....Z.....#.$.#',
      '#...#...........#...#',
      '#...#...........#...#',
      '#...######R######...#',
      '#...#...........#...#',
      '#...#..!..S..!..#...#',
      '#...#...........#...#',
      '##.#######a#######.##',
      '#.......#...#.......#',
      '#..O.O..#...#...!...#',
      '#.......#.e.#.......#',
      '#.1...1.#...#.......#',
      '#.....X.#...#....$..#',
      '####.####...####.####',
      '#...e...............#',
      '#.......!.........e.#',
      '##########E##########',
    ],
    chests: [{ stones: 150 }, { card: 'c_whirl' }, { item: 'hipotion', n: 2 }],
    tablets: [
      '扉の前の碑:\n「風の通り道を示せ。さすれば扉は開かれん」',
      'この先、風の大精霊の間。\n心せよ、旅人よ。',
      '壁に古い歌が刻まれている。\n『風は 東より生まれ 南を巡り\n　西に眠りて 北に目覚める』',
      'ここは風の神殿。\n重き岩を光なき紋様に乗せよ。\n誤りし時は、光る紋様を踏むべし。',
    ],
    riddles: {
      R: { type: 'seq', prompt: '扉に四つの紋章が刻まれている。\n風の巡る順に触れよ。', options: ['東', '西', '南', '北'], answer: ['東', '南', '西', '北'] },
    },
    boss: { enemy: 'treant', crystal: 'wind' },
  },
  {
    id: 'ruins', name: '砂の遺跡', x: 259, y: 339, style: 'sand', roof: 'pyramid', dark: true, area: 'ruins', lv: 9,
    bp: [
      '#########################',
      '#######...........#######',
      '#######.....Z.....#######',
      '#######...........#######',
      '############Q############',
      '#######...........#######',
      '#######..!..S..$..#######',
      '#######...........#######',
      '############R############',
      '#...H...#.......#...#...#',
      '#.!.H...#.....!.#.3.c.!.#',
      '#...H.O.#.e.....#.O.#...#',
      '#...H...#.......#...#####',
      '######.#####.#####.######',
      '#.......................#',
      '#..$...................$#',
      '#..^.....^.....^.....^..#',
      '#......!.....S.....X....#',
      '#..e...............e....#',
      '#.......................#',
      '############E############',
    ],
    chests: [{ stones: 200 }, { card: 'c_bash' }, { item: 'hipotion', n: 3 }],
    tablets: [
      'スフィンクスの扉。\n「我が問いに答えし者のみ、王の間へ進め」',
      '【一の碑】\n最初の数は、天に輝くものの数。\n太陽、月、そして星。',
      '【二の碑】\n二番目の数は、蜘蛛の脚の数。',
      '【三の碑】\n最後の数は、片手の指の数。',
      'この遺跡の扉は、三つの碑が示す数を求める。\n一の碑は西に、二の碑は中央に、\n三の碑は東に眠る。',
    ],
    riddles: {
      R: { type: 'code', prompt: '扉に三つの数字盤がある。\n三つの碑が示す数を合わせよ。', digits: 3, answer: '385' },
      Q: { type: 'choice', prompt: 'スフィンクスの声が響く。\n「朝は四本足、昼は二本足、夜は三本足。\n　これは何か?」', options: ['獣', '人間', '鳥', '魔物'], answer: 1 },
    },
    boss: { enemy: 'golemk', crystal: 'earth' },
  },
  {
    id: 'icecave', name: '氷の洞窟', x: 289, y: 66, style: 'ice', roof: 'snowmtn', dark: true, area: 'icecave', lv: 12,
    bp: [
      '#######################',
      '######...........######',
      '######.....Z.....######',
      '######...........######',
      '######...........######',
      '###########b###########',
      '#.....................#',
      '#.2.......###.......2.#',
      '#...O..............O..#',
      '#......#.......#......#',
      '#..........O.........$#',
      '#.....2..............S#',
      '#########HHHHH#########',
      '#########HHHHH#########',
      '#.....................#',
      '#..$......O.O.........#',
      '#.e.............O...S.#',
      '#...!.......X......e..#',
      '###########E###########',
    ],
    chests: [{ stones: 200 }, { card: 'c_bless' }],
    tablets: [
      '崩れた床は、岩で埋めれば渡れる。\n深い穴は、二つ埋めねば越えられぬ。\n誤れば、光る紋様を踏め。',
    ],
    riddles: {},
    boss: { enemy: 'frostd', crystal: 'water' },
  },
  {
    id: 'volccave', name: '炎の火山', x: 340, y: 195, style: 'volc', roof: 'volc', dark: false, area: 'volccave', lv: 15,
    bp: [
      '#######################',
      '#####.............#####',
      '#####VV....Z....VV#####',
      '#####.............#####',
      '###########R###########',
      '#$..................!.#',
      '#VVVVVVVVV...VVVVVVVVV#',
      '#.........#a#.........#',
      '#....................S#',
      '#.1...VVV.....VVV...1.#',
      '#.....VVV.....VVV.....#',
      '#..O....O..........O..#',
      '#.....VVV.....VVV.....#',
      '#.....VVV..1..VVV.....#',
      '#.....................#',
      '#VVVVVV.........VVVVVV#',
      '#..$...............$..#',
      '#.........X...........#',
      '#....!..........S.....#',
      '#..e...............e..#',
      '###########E###########',
    ],
    chests: [{ stones: 250 }, { stones: 150 }, { card: 'c_heavy' }],
    tablets: [
      '竜の間の扉。\n属性の理を知る者のみ通れる。',
      '炎の竜イグニスは力をためてから\n大きな一撃を放つ。予告を見逃すな。\n溶岩に岩を落とすことはできぬ。三つの紋様に、三つの岩を。',
    ],
    riddles: {
      R: { type: 'choice', prompt: '扉に文字が浮かぶ。\n「水は火を消し、火は風を焼き、\n　風は土を削り、土は水を堰き止める。\n　火を制するものを、制するものは何か」', options: ['火', '水', '風', '土'], answer: 3 },
    },
    boss: { enemy: 'flamed', crystal: 'fire' },
  },
  {
    id: 'castle', name: '魔王城', x: 212, y: 172, style: 'castle', roof: 'castle', dark: false, area: 'castle', lv: 20,
    bp: [
      '#################',
      '#$.....^.^.....$#',
      '#.......Z.......#',
      '#...............#',
      '#..^.........^..#',
      '#...............#',
      '########R########',
      '#..!.........!..#',
      '#...........S...#',
      '######HHHHH######',
      '######HHHHH######',
      '#...............#',
      '#..O....O....O..#',
      '#.X.......!.....#',
      '########E########',
    ],
    chests: [{ item: 'elixir', n: 2 }, { stones: 300 }],
    tablets: [
      '夜空を見上げよ。\n闇が深いほど、我らは強く輝く。',
      '魔王ノクスは光を恐れる。\n光の力を持つ者を連れて行け。',
      '魔王城。\n闇の深淵へ至る道は崩れ落ちている。',
    ],
    riddles: {
      R: { type: 'choice', prompt: '扉の魔法陣が問いかける。\n「光の中では見えず、\n　闇の中でのみ輝くものは何か」', options: ['月', '星', '炎', '影'], answer: 1 },
    },
    boss: { enemy: 'demon', crystal: null },
  },
  // ---------- サブダンジョン (中ボスとレア報酬) ----------
  {
    id: 'oldruin', name: '忘れられた遺構', x: 80, y: 150, style: 'stone', roof: 'canopy', dark: false, area: 'subruin', lv: 8, sub: true, reward: { stones: 200 },
    bp: [
      '#################',
      '#$.....Z.....$..#',
      '#...............#',
      '#######R#########',
      '#...............#',
      '#..!.........!..#',
      '#...............#',
      '#....e.....e....#',
      '########E########',
    ],
    chests: [{ card: 'c_rage' }, { stones: 200 }],
    tablets: ['光あるところに、必ずついてくるもの。\n触れることはできず、足音もない。', '朝と夕に長く伸び、真昼に縮む。'],
    riddles: { R: { type: 'choice', prompt: '扉に刻まれた問い。\n「光が強いほど濃くなり、\n　光がなければ存在しないもの」', options: ['霧', '影', '露', '虹'], answer: 1 } },
    boss: { enemy: 'ancient', crystal: null },
  },
  {
    id: 'seacave', name: '潮騒の洞窟', x: 362, y: 436, style: 'cave', roof: 'mountain', dark: true, area: 'subsea', lv: 14, sub: true, reward: { stones: 300 },
    bp: [
      '###################',
      '#WW$....Z....$..WW#',
      '#WW.............WW#',
      '#######HHHHH#######',
      '#######HHHHH#######',
      '#WW......O......WW#',
      '#W...O.......O...W#',
      '#W...............W#',
      '#WW.....X.....!.WW#',
      '#WWW....e..e...WWW#',
      '#########E#########',
    ],
    chests: [{ card: 'c_thousand' }, { stones: 300 }],
    tablets: ['深い裂け目だ。岩を二つ重ねれば渡れるだろう。\n誤れば光る紋様を踏め。'],
    riddles: {},
    boss: { enemy: 'serpent', crystal: null },
  },
  {
    id: 'crylab', name: '結晶の迷宮', x: 436, y: 150, style: 'ice', roof: 'cryroof', dark: false, area: 'subcrys', lv: 24, sub: true, reward: { stones: 500 },
    bp: [
      '###################',
      '#$.......Z.......$#',
      '#.................#',
      '#########a#########',
      '#.................#',
      '#..O..#.....#..O..#',
      '#.....#.1.1.#.....#',
      '#.................#',
      '#..X..............#',
      '#.....e.....e.....#',
      '#............!....#',
      '#########E#########',
    ],
    chests: [{ card: 'c_star' }, { card: 'c_hourglass' }],
    tablets: ['二つの紋様に二つの結晶岩を。\n道を誤れば、光る紋様が時を戻す。'],
    riddles: {},
    boss: { enemy: 'crygolem', crystal: null },
  },
  // ===== 第2章: 空の大陸 =====
  {
    id: 'galetower', name: '嵐の塔', x: 40, y: 446, style: 'sky', roof: 'sky', dark: false, area: 'galetower', lv: 42, ch2: true,
    bp: [
      '#####################',
      '#.........Z.........#',
      '#...................#',
      '#^.........!.....^..#',
      '#########a###########',
      '#...#.........S.#...#',
      '#.$.#..O.....O..#.$.#',
      '#...#...........#...#',
      '#...#..1.....1..#...#',
      '#...#.......X...#...#',
      '##.###.........###.##',
      '#.......!...........#',
      '#..e............e...#',
      '#...................#',
      '##########R##########',
      '#...................#',
      '#..!.....e.......$..#',
      '#...................#',
      '##########E##########',
    ],
    chests: [{ stones: 300 }, { card: 'c_storm' }, { item: 'elixir', n: 1 }],
    tablets: [
      'この先、嵐の王の間。\n空の門番は、三つの紋章のひとつを守っている。',
      '重き岩を、ふたつの紋様へ。\n誤りし時は、光る紋様を踏むべし。',
      '壁に古い言葉が刻まれている。\n『風が雲を呼び、雲が雨を降らせ、\n　雨のあとに雷が落ちる』',
    ],
    riddles: { R: { type: 'seq', prompt: '扉に四つの紋章が刻まれている。\n嵐の生まれる順に触れよ。', options: ['雲', '風', '雨', '雷'], answer: ['風', '雲', '雨', '雷'] } },
    boss: { enemy: 'galeking', emblem: 'gale' },
  },
  {
    id: 'thunderruin', name: '雷の遺跡', x: 238, y: 448, style: 'sky', roof: 'skygold', dark: false, area: 'thunderruin', lv: 46, ch2: true,
    bp: [
      '#######################',
      '#.........!Z!.........#',
      '#.....................#',
      '#..^......S......^....#',
      '###########Q###########',
      '#.......#.!...#.......#',
      '#..$....#.....#....$..#',
      '#.......#.....#.......#',
      '####.######H######.####',
      '#.....................#',
      '#..e.......O.......e..#',
      '#.....................#',
      '#..!......X...........#',
      '#.....................#',
      '###########E###########',
    ],
    chests: [{ stones: 300 }, { card: 'c_meteor' }],
    tablets: [
      '雷の王はここに眠る。\n空の紋章のひとつを抱いて。',
      '扉の数字は、雷の言葉で記されている。',
      '奥の扉の暗号:\n「雷は 三度 光り、七度 鳴り、一度 落ちる」',
      '床の割れ目の向こうに部屋がある。\n下から岩を押し込めば、渡れそうだ。',
    ],
    riddles: { Q: { type: 'code', prompt: '扉に3桁の数字を入れる仕掛けがある。', digits: 3, answer: '371' } },
    boss: { enemy: 'thunderdragon', emblem: 'thunder' },
  },
  {
    id: 'starchapel', name: '星の聖堂', x: 92, y: 474, style: 'sky', roof: 'sky', dark: false, area: 'starchapel', lv: 50, ch2: true,
    bp: [
      '#######################',
      '#..........Z..........#',
      '#.....................#',
      '#..^...........S...^..#',
      '###########b###########',
      '#.....#.........#.....#',
      '#..$..#..O...O..#..$..#',
      '#.....#....O....#.....#',
      '#.....#..2.2.2..#.....#',
      '#.....#.......X.#.....#',
      '##.########.########.##',
      '#.....................#',
      '#..e......!......e....#',
      '#.....................#',
      '###########R###########',
      '#.....................#',
      '#..!...........$......#',
      '#........e............#',
      '###########E###########',
    ],
    chests: [{ stones: 400 }, { card: 'c_sanctuary' }, { item: 'elixir', n: 2 }],
    tablets: [
      '三つの岩を三つの紋様へ。\n星の並びがそろうとき、道は開かれる。',
      '聖堂の碑:\n「夜にだけ姿を見せ、朝には消える。\n　数えきれないほど空にあるもの」',
    ],
    riddles: { R: { type: 'choice', prompt: '扉に問いが刻まれている。\n「夜にだけ姿を見せ、朝には消える。\n数えきれないほど空にあるもの」とは?', options: ['月', '星', '夢', '影'], answer: 1 } },
    boss: { enemy: 'skycolossus', emblem: 'star' },
  },
  {
    id: 'skypalace', name: '天空城', x: 190, y: 470, style: 'sky', roof: 'skygold', dark: false, area: 'skypalace', lv: 55, ch2: true,
    bp: [
      '#########################',
      '#...........Z...........#',
      '#.......................#',
      '#..^.......!.!.......^..#',
      '#.......................#',
      '#..^.......S.........^..#',
      '############R############',
      '#.......................#',
      '#..e.......!........e...#',
      '#..^.................^..#',
      '#.......................#',
      '############E############',
    ],
    chests: [],
    tablets: [
      '玉座の間。\n魔王を操っていた者が、この奥で待っている。',
      '「地上の王は、わたしの影にすぎなかった」\n…玉座に刻まれた言葉だ。',
      '三つの紋章をそろえし者のみ、\nこの扉をくぐることを許される。',
    ],
    riddles: { R: { type: 'emblem' } },
    boss: { enemy: 'skyking' },
  },
];

// ---------- 町 ----------
const TOWNS = [
  {
    id: 'lumina', name: 'ルミナ村', x: 206, y: 258, w: 28, h: 22, ground: 'grass', gates: ['n', 's', 'w', 'e'], road: { row: 10, col: 13 },
    houses: [
      { bp: 'elder', dx: 2, dy: 2, roof: 'red', npcs: ['lumina_elder'] },
      { bp: 'shop', dx: 18, dy: 2, roof: 'green', npcs: ['lumina_shop'] },
      { bp: 'house', dx: 2, dy: 13, roof: 'red', npcs: ['lumina_girl'] },
      { bp: 'shrine', dx: 19, dy: 13, roof: 'blue', npcs: ['lumina_miko'] },
    ],
    decor: [['well', 16, 5], ['save', 11, 7, 'ルミナ村']],
    npcs: [['lumina_kid', 7, 11], ['lumina_guard', 15, 19], ['sky_engineer', 22, 10]],
    signs: [[12, 1, '【ルミナ村】\n北:王都跡と魔王城の湖\n西:風の森 ／ 東:火山地帯\n南:砂漠 ／ 北の果て:雪原']],
  },
  {
    id: 'frostia', name: '雪の町フロスティア', x: 120, y: 75, w: 22, h: 20, ground: 'snow', gates: ['s', 'e'], road: { row: 9, col: 10 },
    houses: [
      { bp: 'shop', dx: 2, dy: 2, roof: 'blue', npcs: ['frost_shop'] },
      { bp: 'house', dx: 13, dy: 2, roof: 'blue', npcs: ['frost_girl'] },
      { bp: 'house2', dx: 2, dy: 12, roof: 'purple', npcs: ['frost_sage'] },
      { bp: 'house', dx: 13, dy: 12, roof: 'blue', npcs: ['frost_mother'] },
    ],
    decor: [['save', 12, 11, 'フロスティア']],
    npcs: [['frost_kid', 6, 10]],
    signs: [[9, 17, '【雪の町フロスティア】\n東の雪山に、氷の洞窟あり。']],
  },
  {
    id: 'sandora', name: 'オアシスの町サンドラ', x: 88, y: 339, w: 24, h: 20, ground: 'sandg', gates: ['n', 'e'], road: { row: 9, col: 11 },
    houses: [
      { bp: 'shop', dx: 2, dy: 2, roof: 'sand', npcs: ['sand_shop'] },
      { bp: 'house2', dx: 15, dy: 2, roof: 'sand', npcs: ['sand_dancer'] },
      { bp: 'house', dx: 2, dy: 12, roof: 'sand', npcs: ['sand_oldman'] },
    ],
    pool: [14, 13, 7, 4],
    decor: [['save', 13, 11, 'サンドラ']],
    npcs: [['sand_kid', 17, 11]],
    signs: [[9, 1, '【オアシスの町サンドラ】\n東の砂の海に、古の遺跡が眠る。']],
  },
];

// 森の隠者の小屋
// 第2章の町 (空の大陸)
TOWNS.push({
  id: 'aeria', name: '天空都市エアリア', x: 139, y: 447, w: 26, h: 18, ground: 'skyg', gates: ['n', 's', 'e', 'w'], road: { row: 8, col: 12 }, ch2: true,
  houses: [
    { bp: 'elder', dx: 2, dy: 1, roof: 'sky', npcs: ['aeria_elder'] },
    { bp: 'shop', dx: 16, dy: 1, roof: 'skygold', npcs: ['aeria_shop'] },
    { bp: 'house', dx: 2, dy: 11, roof: 'sky', npcs: ['aeria_sage'] },
    { bp: 'house2', dx: 17, dy: 11, roof: 'skygold', npcs: ['aeria_girl'] },
  ],
  decor: [['save', 11, 6, '天空都市エアリア']],
  npcs: [['aeria_kid', 7, 9], ['aeria_guard', 15, 15]],
  signs: [[11, 1, '【天空都市エアリア】\n西:嵐の塔 ／ 東:雷の遺跡\n南西:星の聖堂 ／ 南東:天空城']],
});
// 空の大陸の範囲 (この四角の中で、陸地以外はすべて雲海になる)
const SKY = { x0: 10, y0: 420, x1: 292, y1: 506, cx: 152, cy: 463, rx: 128, ry: 36 };

const EXTRA_HOUSES = [
  { id: 'hermit', name: '森の隠者の小屋', bp: 'house2', x: 114, y: 216, roof: 'green', npcs: ['hermit'], ground: 'grass', from: 'L.w' },
  { id: 'snowhut', name: '狩人の小屋', bp: 'house', x: 192, y: 92, roof: 'blue', npcs: ['snow_hunter'], ground: 'snow', from: 'F.e' },
  { id: 'deserthut', name: '旅商人のテント', bp: 'house2', x: 174, y: 350, roof: 'sand', npcs: ['desert_nomad'], ground: 'sandg', from: 'S.e' },
  { id: 'smithy', name: '鍛冶屋の工房', bp: 'house', x: 294, y: 264, roof: 'red', npcs: ['volc_smith'], ground: 'grass', from: 'L.e' },
  { id: 'arena', name: '英雄の闘技場', bp: 'arena', x: 246, y: 247, roof: 'purple', npcs: ['arena_master'], ground: 'grass', from: 'L.e' },
  { id: 'myhome', name: 'マイホーム', bp: 'home', x: 222, y: 285, roof: 'red', npcs: [], ground: 'grass', from: 'L.s' },
  { id: 'seahut', name: '灯台守の家', bp: 'house2', x: 351, y: 302, roof: 'blue', npcs: ['lighthouse'], ground: 'grass', from: 'L.e' },
];

// 南国の島々 [中心x, 中心y, 半径]
const ISLANDS = [[372, 446, 34], [440, 472, 24], [482, 422, 20], [458, 372, 18], [318, 482, 18]];

// 野外の転移クリスタル。ここに1行足すだけで増やせます。
//  at: 置きたい場所のおおよその座標 (近くの道ばたに自動で置かれます)
const WAYPOINTS = [
  { id: 'wp_bridge', name: '湖畔の橋たもと', at: [229, 220] },
  { id: 'wp_westriver', name: '西の川の渡し', at: [133, 196] },
  { id: 'wp_snowpass', name: '雪原の峠', at: [220, 106] },
  { id: 'wp_volcroad', name: '火山への街道', at: [313, 238] },
  { id: 'wp_dunes', name: '砂丘の休憩所', at: [172, 322] },
  { id: 'wp_forest', name: '森の分かれ道', at: [106, 280] },
  { id: 'wp_lumina_e', name: '東の草原', at: [270, 255] },
  { id: 'wp_snow_w', name: '雪原の西端', at: [60, 120] },
  { id: 'wp_desert_s', name: '南の砂丘', at: [200, 390] },
  { id: 'wp_crystal_n', name: '水晶の荒野 北', at: [440, 90] },
  { id: 'wp_crystal_s', name: '水晶の荒野 南', at: [430, 260] },
  { id: 'wp_island', name: '南国の渡し', at: [345, 415] },
  { id: 'wp_island2', name: 'ヤシの浜辺', at: [440, 450] },
];

// ---------- ビルダー ----------
const WORLD = {};

function buildWorld() {
  const W = MW, H = MH;
  const tiles = new Uint8Array(W * H).fill(T.OCEAN);
  const region = new Uint16Array(W * H);
  const style = new Uint8Array(W * H);
  const biome = new Uint8Array(W * H); // 0 ocean 1 grass 2 forest 3 desert 4 snow 5 volcano 6 island
  const reserved = new Uint8Array(W * H);
  const idx = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const rnd = U.rng(20261109);
  const SEED = 777;
  const BIOME_GROUND = [T.OCEAN, T.GRASS, T.GRASS, T.SAND, T.SNOW, T.ASH, T.DARKGRASS, T.CRYG, T.GRASS, T.SKYG];
  const BIOME_STYLE = ['grass', 'grass', 'grass', 'sandg', 'snowg', 'ashg', 'dgrass', 'cryg', 'grass', 'skyg'];
  const inSky = (x, y) => x >= SKY.x0 && y >= SKY.y0 && x <= SKY.x1 && y <= SKY.y1;
  const SI = s => STYLE_LIST.indexOf(s);

  // 1. 大陸の形
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x <= 2 || y <= 2 || x >= W - 3 || y >= H - 3) continue;
    const nx = (x - 220) / 180, ny = (y - 220) / 180;
    const d = Math.max(Math.abs(nx), Math.abs(ny)) * 0.85 + Math.sqrt(nx * nx + ny * ny) * 0.2;
    const n = U.fbm(x, y, 0.025, SEED);
    const main = d + (n - 0.5) * 0.42 < 1.0 || d < 0.84;
    // 東の水晶の荒野
    const cx = (x - 445) / 62, cy = (y - 175) / 140;
    const cry = Math.sqrt(cx * cx + cy * cy) + (U.fbm(x, y, 0.03, SEED + 9) - 0.5) * 0.5 < 1;
    // 南東の南国の島々
    let isl = false;
    for (const [ix, iy, ir] of ISLANDS) { const dx = (x - ix) / ir, dy = (y - iy) / ir; if (Math.sqrt(dx * dx + dy * dy) + (U.fbm(x, y, 0.08, SEED + 11) - 0.5) * 0.6 < 1) { isl = true; break; } }
    if (main || cry || isl) {
      const j = (U.fbm(x, y, 0.04, SEED + 5) - 0.5) * 33;
      let b = 1;
      if (cry && x + j > 390) b = 7;
      else if (!main && isl) b = 8;
      else if (y + j < 130) b = 4;
      else if (y + j > 313) b = 3;
      else if (x + j < 142) b = 2;
      else if (x + j > 307) b = 5;
      biome[idx(x, y)] = b;
    }
    // 空の大陸 (第2章)
    if (inSky(x, y)) {
      const sx = (x - SKY.cx) / SKY.rx, sy = (y - SKY.cy) / SKY.ry;
      if (Math.sqrt(sx * sx + sy * sy) + (U.fbm(x, y, 0.05, SEED + 91) - 0.5) * 0.45 < 1) biome[idx(x, y)] = 9;
    }
  }
  // 2. 地形
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), b = biome[i];
    if (!b) continue;
    style[i] = SI(BIOME_STYLE[b]);
    const n1 = U.fbm(x, y, 0.065, SEED + 21), n2 = U.fbm(x, y, 0.04, SEED + 33), r = U.hash2(x, y, 99);
    let t = BIOME_GROUND[b];
    if (b === 1) {
      if (n2 > 0.72) t = T.MOUNTAIN; else if (n1 > 0.66) t = T.TREE; else if (r < 0.05) t = T.FLOWERS; else if (r < 0.065) t = T.TREE;
    } else if (b === 2) {
      if (n2 > 0.76) t = T.MOUNTAIN; else if (n1 > 0.47) t = T.TREE; else if (r < 0.04) t = T.FLOWERS; else if (r < 0.1) t = T.TREE;
    } else if (b === 3) {
      if (n2 > 0.78) t = T.MOUNTAIN; else if (r < 0.025) t = T.CACTUS;
    } else if (b === 4) {
      if (n2 > 0.7) t = T.SNOWMTN; else if (n1 > 0.6) t = T.PINE; else if (r < 0.05) t = T.PINE;
    } else if (b === 5) {
      if (n2 > 0.72) t = T.VMOUNTAIN; else if (n1 > 0.7) t = T.LAVA; else if (r < 0.03) t = T.DEADTREE;
    } else if (b === 7) {
      if (n2 > 0.73) t = T.CRYMTN; else if (n1 > 0.63) t = T.CRYSPIRE; else if (r < 0.04) t = T.CRYSPIRE;
    } else if (b === 8) {
      if (n1 > 0.62) t = T.PALM; else if (r < 0.05) t = T.FLOWERS; else if (r < 0.09) t = T.PALM;
    } else if (b === 9) {
      if (n2 > 0.74) t = T.SKYROCK; else if (n1 > 0.64) t = T.SKYTREE; else if (r < 0.04) t = T.FLOWERS; else if (r < 0.06) t = T.SKYTREE;
    }
    tiles[i] = t;
  }
  // 海岸線を砂浜に
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = idx(x, y);
    if (!biome[i] || biome[i] === 4 || biome[i] === 5 || biome[i] === 7 || biome[i] === 9) continue;
    let coast = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!biome[idx(x + dx, y + dy)]) coast = true;
    if (coast) { tiles[i] = T.SAND; style[i] = SI('sandg'); }
  }
  // 空の大陸のまわりは雲海
  for (let y = SKY.y0; y <= SKY.y1; y++) for (let x = SKY.x0; x <= SKY.x1; x++) if (!biome[idx(x, y)]) tiles[idx(x, y)] = T.CLOUD;
  // 3. 中央の湖と島
  const LX = 220, LY = 178;
  for (let y = 120; y < 240; y++) for (let x = 150; x < 292; x++) {
    const dx = (x - LX) / 45, dy = (y - LY) / 31;
    const n = (U.fbm(x, y, 0.09, SEED + 50) - 0.5) * 0.35;
    const d = Math.sqrt(dx * dx + dy * dy) + n;
    const i = idx(x, y);
    if (d < 1) {
      const ix = (x - LX) / 11, iy = (y - LY - 1) / 9.5;
      if (Math.sqrt(ix * ix + iy * iy) < 1) { tiles[i] = T.DARKGRASS; biome[i] = 6; style[i] = SI('dgrass'); }
      else { tiles[i] = T.WATER; }
    } else if (d < 1.12 && tiles[i] !== T.WATER) {
      if (biome[i] === 1) tiles[i] = U.hash2(x, y, 3) < 0.3 ? T.FLOWERS : T.GRASS;
    }
  }
  // 北へ流れる川
  for (let y = 3; y < 152; y++) {
    const cx = Math.round(220 + Math.sin(y * 0.08) * 7 + Math.sin(y * 0.02) * 6);
    for (let x = cx - 1; x <= cx; x++) {
      const i = idx(x, y);
      if (biome[i] && biome[i] !== 6) tiles[i] = T.WATER;
    }
  }
  // 西へ流れる川 (湖 → 西の海)
  for (let x = 3; x < 180; x++) {
    const cy = Math.round(178 + (180 - x) * 0.18 + Math.sin(x * 0.06) * 7 + Math.sin(x * 0.016) * 5);
    for (let y = cy - 1; y <= cy; y++) {
      const i = idx(x, y);
      if (biome[i] && biome[i] !== 6) tiles[i] = T.WATER;
    }
  }
  // 島への橋 (南岸から)
  let bridgeTop = LY + 9, bridgeBot = bridgeTop;
  while (tiles[idx(LX, bridgeTop)] !== T.WATER) bridgeTop++;
  bridgeBot = bridgeTop;
  while (tiles[idx(LX, bridgeBot + 1)] === T.WATER) bridgeBot++;
  for (let y = bridgeTop; y <= bridgeBot; y++) { tiles[idx(LX, y)] = T.BRIDGE; reserved[idx(LX, y)] = 1; }
  tiles[idx(LX, bridgeBot)] = T.SEAL;
  const seal = { x: LX, y: bridgeBot };
  const bridgeLand = { x: LX, y: bridgeBot + 1 };

  const objs = { shards: [], chests: [], npcs: [], tablets: [], signs: [], saves: [], boulders: [], switches: [], gates: [], holes: [], runes: [], rdoors: [], bosses: [], altars: [], hidden: [], spawns: [] };
  const regions = [{ type: 'out' }];
  const structs = [];
  let chestId = 0;

  function clearArea(x0, y0, w, h, ground, gstyle, margin) {
    const bb = { [T.GRASS]: 1, [T.SAND]: 3, [T.SNOW]: 4, [T.ASH]: 5, [T.SKYG]: 9 }[ground] || 1;
    for (let y = y0 - margin - 2; y < y0 + h + margin + 2; y++) for (let x = x0 - margin - 2; x < x0 + w + margin + 2; x++) {
      if (!inb(x, y)) continue;
      const i = idx(x, y);
      if (!biome[i]) { biome[i] = bb; tiles[i] = bb === 9 ? T.SKYG : T.SAND; style[i] = SI(bb === 9 ? 'skyg' : 'sandg'); }
    }
    for (let y = y0 - margin; y < y0 + h + margin; y++) for (let x = x0 - margin; x < x0 + w + margin; x++) {
      if (!inb(x, y)) continue;
      const i = idx(x, y);
      tiles[i] = ground; style[i] = SI(gstyle); region[i] = 0;
      if (x >= x0 && y >= y0 && x < x0 + w && y < y0 + h) reserved[i] = 1;
    }
  }

  function stampHouse(bpName, x0, y0, roof, npcIds, ownerName) {
    const bp = HOUSE_BP[bpName];
    const rid = regions.length;
    regions.push({ type: 'house', roof, dark: false, name: ownerName || '' });
    let ni = 0;
    const doors = [];
    for (let y = 0; y < bp.length; y++) for (let x = 0; x < bp[y].length; x++) {
      const ch = bp[y][x], wx = x0 + x, wy = y0 + y, i = idx(wx, wy);
      reserved[i] = 1;
      const front = y === bp.length - 1;
      region[i] = front ? 0 : rid;
      style[i] = SI('wood');
      let t = T.WOODF;
      switch (ch) {
        case '#': t = T.HWALL; break;
        case 'w': t = T.HWIN; break;
        case 'D': t = T.DOOR; doors.push({ x: wx, y: wy }); break;
        case 'K': t = T.SHELF; break;
        case 'T': t = T.TABLE; break;
        case 'B': t = T.BED; break;
        case 'C': t = T.COUNTER; break;
        case 'p': t = T.POT; break;
        case 'c': t = T.CARPET; break;
        case '^': t = T.STATUE; style[i] = SI('wood'); break;
        case 'Y': t = T.ALTAR; objs.altars.push({ x: wx, y: wy }); break;
        case 'N': t = T.WOODF; if (npcIds && npcIds[ni]) objs.npcs.push({ id: npcIds[ni], x: wx, y: wy }); ni++; break;
      }
      tiles[i] = t;
    }
    return doors;
  }

  // 4. 町
  const townInfo = {};
  for (const tw of TOWNS) {
    const gT = { grass: T.GRASS, snow: T.SNOW, sandg: T.SAND, skyg: T.SKYG }[tw.ground];
    const gS = { grass: 'grass', snow: 'snowg', sandg: 'sandg', skyg: 'skyg' }[tw.ground];
    clearArea(tw.x, tw.y, tw.w, tw.h, gT, gS, 2);
    const info = { gates: {} };
    // 柵
    for (let x = 0; x < tw.w; x++) for (const y of [0, tw.h - 1]) tiles[idx(tw.x + x, tw.y + y)] = T.FENCE;
    for (let y = 0; y < tw.h; y++) for (const x of [0, tw.w - 1]) tiles[idx(tw.x + x, tw.y + y)] = T.FENCE;
    const R = tw.road;
    const P = (x, y) => { tiles[idx(tw.x + x, tw.y + y)] = T.PATH; };
    for (let x = 1; x < tw.w - 1; x++) { P(x, R.row); P(x, R.row + 1); }
    for (let y = 1; y < tw.h - 1; y++) { P(R.col, y); P(R.col + 1, y); }
    for (const g of tw.gates) {
      if (g === 'n') { P(R.col, 0); P(R.col + 1, 0); info.gates.n = { x: tw.x + R.col, y: tw.y - 1 }; }
      if (g === 's') { P(R.col, tw.h - 1); P(R.col + 1, tw.h - 1); info.gates.s = { x: tw.x + R.col, y: tw.y + tw.h }; }
      if (g === 'w') { P(0, R.row); P(0, R.row + 1); info.gates.w = { x: tw.x - 1, y: tw.y + R.row }; }
      if (g === 'e') { P(tw.w - 1, R.row); P(tw.w - 1, R.row + 1); info.gates.e = { x: tw.x + tw.w, y: tw.y + R.row }; }
    }
    if (tw.pool) {
      const [px, py, pw, ph] = tw.pool;
      for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) tiles[idx(tw.x + x, tw.y + y)] = T.WATER;
      for (let x = px - 1; x <= px + pw; x += pw + 1) { tiles[idx(tw.x + x, tw.y + py - 1)] = T.PALM; tiles[idx(tw.x + x, tw.y + py + ph)] = T.PALM; }
      info.pool = { x: tw.x + px, y: tw.y + py, w: pw, h: ph };
    }
    // 花
    for (let k = 0; k < 18; k++) {
      const x = 1 + Math.floor(rnd() * (tw.w - 2)), y = 1 + Math.floor(rnd() * (tw.h - 2));
      if (tiles[idx(tw.x + x, tw.y + y)] === T.GRASS) tiles[idx(tw.x + x, tw.y + y)] = T.FLOWERS;
    }
    for (const h of tw.houses) {
      const doors = stampHouse(h.bp, tw.x + h.dx, tw.y + h.dy, h.roof, h.npcs);
      // 扉から道へ
      for (const d of doors) {
        let x = d.x, y = d.y + 1;
        tiles[idx(x, y)] = T.PATH;
        const tx = tw.x + R.col + (x > tw.x + R.col ? 1 : 0);
        while (x !== tx) { x += Math.sign(tx - x); if (tiles[idx(x, y)] === T.PATH) break; tiles[idx(x, y)] = T.PATH; }
      }
    }
    for (const d of tw.decor) {
      const x = tw.x + d[1], y = tw.y + d[2];
      if (d[0] === 'well') { tiles[idx(x, y)] = T.WELL; info.well = { x, y }; }
      if (d[0] === 'save') { objs.saves.push({ id: tw.id, x, y, name: d[3], group: 'town' }); }
    }
    for (const n of tw.npcs) objs.npcs.push({ id: n[0], x: tw.x + n[1], y: tw.y + n[2], wander: true, home: { x: tw.x, y: tw.y, w: tw.w, h: tw.h } });
    for (const s of tw.signs) { tiles[idx(tw.x + s[0], tw.y + s[1])] = T.SIGN; objs.signs.push({ x: tw.x + s[0], y: tw.y + s[1], text: s[2] }); }
    townInfo[tw.id] = info;
    structs.push({ id: tw.id, name: tw.name, kind: 'town', x: tw.x, y: tw.y, w: tw.w, h: tw.h });
  }
  // 隠者の小屋
  const extraDoors = {};
  for (const eh of EXTRA_HOUSES) {
    const bp = HOUSE_BP[eh.bp];
    const gT = { grass: T.GRASS, snow: T.SNOW, sandg: T.SAND }[eh.ground];
    const gS = { grass: 'grass', snow: 'snowg', sandg: 'sandg' }[eh.ground];
    clearArea(eh.x, eh.y, bp[0].length, bp.length, gT, gS, 2);
    const doors = stampHouse(eh.bp, eh.x, eh.y, eh.roof, eh.npcs, eh.name);
    extraDoors[eh.id] = { x: doors[0].x, y: doors[0].y + 1 };
    tiles[idx(doors[0].x, doors[0].y + 1)] = T.PATH;
    structs.push({ id: eh.id, name: eh.name, kind: 'hut', x: eh.x, y: eh.y, w: bp[0].length, h: bp.length });
  }

  // 5. ダンジョン
  const dunInfo = {};
  for (const dg of DUNGEONS) {
    const bp = dg.bp, w = bp[0].length, h = bp.length;
    const fl = { stone: T.STONEF, sand: T.SANDF, ice: T.ICEF, volc: T.VOLCF, castle: T.CASTF, cave: T.CAVEF, sky: T.SKYF }[dg.style];
    const wl = { stone: T.STONEW, sand: T.SANDW, ice: T.ICEW, volc: T.VOLCW, castle: T.CASTW, cave: T.CAVEW, sky: T.SKYW }[dg.style];
    const isIsland = dg.id === 'castle';
    if (!isIsland) {
      const b = biome[idx(dg.x + (w >> 1), dg.y + (h >> 1))] || 1;
      clearArea(dg.x, dg.y, w, h, BIOME_GROUND[b], BIOME_STYLE[b], 2);
    } else {
      for (let y = dg.y; y < dg.y + h; y++) for (let x = dg.x; x < dg.x + w; x++) reserved[idx(x, y)] = 1;
    }
    const rid = regions.length;
    regions.push({ type: 'dungeon', roof: dg.roof, dark: dg.dark, name: dg.name, struct: dg.id, area: dg.area });
    const st = { id: dg.id, name: dg.name, kind: 'dungeon', x: dg.x, y: dg.y, w, h, region: rid, floor: fl, lv: dg.lv };
    structs.push(st);
    let ci = 0, ti = 0;
    const sidx = SI(dg.style);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = bp[y][x], wx = dg.x + x, wy = dg.y + y, i = idx(wx, wy);
      reserved[i] = 1;
      region[i] = rid;
      style[i] = sidx;
      let t = fl;
      switch (ch) {
        case '#': t = wl; break;
        case 'E': t = T.CAVEIN; region[i] = 0; dunInfo[dg.id] = { entrance: { x: wx, y: wy + 1 }, door: { x: wx, y: wy } }; break;
        case 'O': objs.boulders.push({ id: dg.id + '_b' + objs.boulders.length, x: wx, y: wy, sx: wx, sy: wy, struct: dg.id }); break;
        case '1': case '2': case '3': t = T.SWITCH; objs.switches.push({ x: wx, y: wy, struct: dg.id, group: ch }); break;
        case 'a': case 'b': case 'c': t = T.GATE; objs.gates.push({ x: wx, y: wy, struct: dg.id, group: String('abc'.indexOf(ch) + 1) }); break;
        case 'H': t = T.HOLE; objs.holes.push({ x: wx, y: wy, struct: dg.id }); break;
        case 'X': t = T.RUNE; objs.runes.push({ x: wx, y: wy, struct: dg.id }); break;
        case '$': objs.chests.push(Object.assign({ id: 'c' + (chestId++), x: wx, y: wy }, dg.chests[ci++] || { stones: 50 })); break;
        case 'S': objs.saves.push({ id: dg.id + (objs.saves.some(q => q.id === dg.id) ? '_2' : ''), x: wx, y: wy, name: dg.name + (objs.saves.some(q => q.id === dg.id) ? ' 奥' : ''), group: 'dungeon' }); break;
        case '!': t = T.TABLET; objs.tablets.push({ x: wx, y: wy, text: dg.tablets[ti++] || '…' }); break;
        case 'Z': objs.bosses.push({ id: dg.id, x: wx, y: wy, enemy: dg.boss.enemy, crystal: dg.boss.crystal, emblem: dg.boss.emblem, struct: dg.id, sub: !!dg.sub, reward: dg.reward }); break;
        case 'R': case 'Q': t = T.RDOOR; objs.rdoors.push({ id: dg.id + '_' + ch, x: wx, y: wy, riddle: dg.riddles[ch], struct: dg.id }); break;
        case 'V': t = T.LAVA; break;
        case 'W': t = T.WATER; break;
        case '^': t = T.STATUE; break;
        case 'e': objs.spawns.push({ x: wx, y: wy, area: dg.area, region: rid }); break;
      }
      tiles[i] = t;
    }
  }
  // ダンジョンの周りを森や山で囲んで、四角い輪郭をなじませる
  const RING = { oldruin: [T.TREE, T.TREE, T.TREE], crylab: [T.CRYSPIRE, T.CRYSPIRE, T.CRYMTN], seacave: [T.PALM, T.MOUNTAIN, T.MOUNTAIN], shrine: [T.TREE, T.TREE, T.MOUNTAIN], icecave: [T.SNOWMTN, T.SNOWMTN, T.PINE], volccave: [T.VMOUNTAIN, T.VMOUNTAIN, T.DEADTREE], ruins: [T.CACTUS, T.SAND, T.SAND], galetower: [T.SKYTREE, T.SKYROCK, T.SKYTREE], thunderruin: [T.SKYROCK, T.SKYROCK, T.SKYTREE], starchapel: [T.SKYTREE, T.SKYTREE, T.SKYROCK], skypalace: [T.SKYROCK, T.SKYTREE, T.SKYROCK] };
  for (const dg of DUNGEONS) {
    const set = RING[dg.id];
    if (!set) continue;
    const w = dg.bp[0].length, h = dg.bp.length, e = dunInfo[dg.id].entrance;
    for (let y = dg.y - 10; y < dg.y + h + 10; y++) for (let x = dg.x - 10; x < dg.x + w + 10; x++) {
      if (!inb(x, y)) continue;
      const i = idx(x, y);
      if (reserved[i] || region[i] || !biome[i] || tiles[i] === T.WATER) continue;
      const ddx = Math.max(dg.x - x, 0, x - (dg.x + w - 1)), ddy = Math.max(dg.y - y, 0, y - (dg.y + h - 1));
      const dist = Math.max(ddx, ddy);
      if (!dist) continue;
      const lim = 2 + U.fbm(x, y, 0.18, SEED + 77) * 9;
      if (dist > lim) continue;
      if (Math.abs(x - e.x) <= 2 && y >= e.y - 1) continue; // 入口前の通路
      const r = U.hash2(x, y, 31);
      tiles[i] = r < 0.6 ? set[0] : r < 0.85 ? set[1] : set[2];
    }
    // 入口前の転移クリスタル
    for (const [ox, oy] of [[2, 2], [-2, 2], [2, 3], [-2, 3], [2, 1], [-2, 1]]) {
      const x = e.x + ox, y = e.y + oy, i = idx(x, y);
      if (!TILE_DEFS[tiles[i]].solid && !region[i]) { objs.saves.push({ id: dg.id + '_out', x, y, name: dg.name + ' 入口', group: 'gate' }); reserved[i] = 1; break; }
    }
  }
  // 魔王城の入口から橋まで道を通す
  {
    const e = dunInfo.castle.entrance;
    for (let y = e.y; y < seal.y; y++) if (tiles[idx(e.x, y)] !== T.BRIDGE) tiles[idx(e.x, y)] = T.PATH;
    for (let y = e.y; y < bridgeTop; y++) reserved[idx(e.x, y)] = 1;
  }

  // 6. 道 (A*)
  const COST = new Float32Array(TILE_DEFS.length).fill(1);
  COST[T.OCEAN] = 60; COST[T.WATER] = 14; COST[T.LAVA] = 60; COST[T.TREE] = 2.5; COST[T.PINE] = 2.5; COST[T.CACTUS] = 2; COST[T.DEADTREE] = 2;
  COST[T.MOUNTAIN] = 7; COST[T.SNOWMTN] = 7; COST[T.VMOUNTAIN] = 7; COST[T.PATH] = 0.4; COST[T.BRIDGE] = 0.4; COST[T.FLOWERS] = 1;
  COST[T.CLOUD] = 1e9; COST[T.SKYTREE] = 2.5; COST[T.SKYROCK] = 7;
  function road(a, b) {
    const N = W * H;
    const g = new Float32Array(N).fill(1e12), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = [];
    const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const s = idx(a.x, a.y), t = idx(b.x, b.y);
    g[s] = 0; push(s, 0);
    while (heap.length) {
      const [, i] = pop();
      if (closed[i]) continue; closed[i] = 1;
      if (i === t) break;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny);
        if (closed[j]) continue;
        if (reserved[j] && j !== t) continue;
        const c = COST[tiles[j]] + (U.hash2(nx, ny, 5) * 0.3);
        if (c >= 1e9) continue;
        const ng = g[i] + c;
        if (ng < g[j]) { g[j] = ng; came[j] = i; push(j, ng + (Math.abs(nx - b.x) + Math.abs(ny - b.y)) * 0.4); }
      }
    }
    let i = t, guard = 0;
    while (i !== -1 && i !== s && guard++ < 20000) {
      const tt = tiles[i];
      if (tt === T.WATER || tt === T.LAVA || tt === T.OCEAN) { tiles[i] = T.BRIDGE; if (!biome[i]) biome[i] = 8; }
      else if (tt !== T.BRIDGE) tiles[i] = T.PATH;
      i = came[i];
    }
    tiles[s] = tiles[s] === T.WATER ? T.BRIDGE : T.PATH;
  }
  const L = townInfo.lumina.gates, F = townInfo.frostia.gates, S = townInfo.sandora.gates;
  const GATES = { L, F, S };
  const ROADS = [
    [L.w, dunInfo.shrine.entrance], [L.s, S.e], [L.s, dunInfo.ruins.entrance], [L.n, bridgeLand],
    [L.n, F.s], [F.e, dunInfo.icecave.entrance], [L.e, dunInfo.volccave.entrance], [S.n, dunInfo.shrine.entrance],
  ];
  for (const eh of EXTRA_HOUSES) { const [t, g] = eh.from.split('.'); ROADS.push([GATES[t][g], extraDoors[eh.id]]); }
  ROADS.push([L.w, dunInfo.oldruin.entrance], [dunInfo.ruins.entrance, dunInfo.seacave.entrance], [dunInfo.volccave.entrance, dunInfo.crylab.entrance]);
  // 島どうしを橋でつなぐ
  const landNear = (cx, cy) => { for (let r = 0; r < 12; r++) for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { if (!inb(x, y)) continue; const i = idx(x, y); if (biome[i] && !reserved[i] && !TILE_DEFS[tiles[i]].solid) return { x, y }; } return null; };
  for (let k = 1; k < ISLANDS.length; k++) { const a = landNear(ISLANDS[k][0], ISLANDS[k][1]), b = landNear(ISLANDS[0][0], ISLANDS[0][1] - 20); if (a && b) ROADS.push([a, b]); }
  // 空の大陸の道
  const A = townInfo.aeria.gates;
  ROADS.push([A.w, dunInfo.galetower.entrance], [A.e, dunInfo.thunderruin.entrance], [A.s, dunInfo.starchapel.entrance], [A.s, dunInfo.skypalace.entrance]);
  for (const [a, b] of ROADS) road(a, b);
  for (const k in dunInfo) { const d = dunInfo[k].door; }

  // 小屋の前と野外にも転移クリスタル
  const placeSave = (cx, cy, base) => {
    let best = null, bd = 1e9;
    for (let y = cy - 10; y <= cy + 10; y++) for (let x = cx - 10; x <= cx + 10; x++) {
      if (!inb(x, y)) continue;
      const i = idx(x, y);
      if (TILE_DEFS[tiles[i]].solid || reserved[i] || region[i] || tiles[i] === T.PATH || tiles[i] === T.BRIDGE) continue;
      const nearPath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tiles[idx(x + dx, y + dy)] === T.PATH);
      const d = Math.abs(x - cx) + Math.abs(y - cy) + (nearPath ? 0 : 12);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (best) { objs.saves.push(Object.assign({ x: best.x, y: best.y }, base)); reserved[idx(best.x, best.y)] = 1; }
  };
  for (const w of WAYPOINTS) placeSave(w.at[0], w.at[1], { id: w.id, name: w.name, group: 'field' });
  for (const eh of EXTRA_HOUSES) { const d = extraDoors[eh.id]; placeSave(d.x + 3, d.y + 1, { id: eh.id, name: eh.name, group: 'hut' }); }

  // 7. 野外の宝箱・隠し宝・石碑
  const walk = i => !TILE_DEFS[tiles[i]].solid;
  // 到達可能マップ
  const reach = new Uint8Array(W * H);
  {
    const st = L.s, st2 = townInfo.aeria.gates.s; const q = [idx(st.x, st.y), idx(st2.x, st2.y)]; reach[q[0]] = 1; reach[q[1]] = 1;
    while (q.length) {
      const i = q.pop(), x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const j = idx(nx, ny);
        if (reach[j] || region[j]) continue;
        if (!walk(j) && tiles[j] !== T.SEAL) continue;
        reach[j] = 1; q.push(j);
      }
    }
  }
  function farFromStructs(x, y, d) {
    for (const s of structs) if (x > s.x - d && x < s.x + s.w + d && y > s.y - d && y < s.y + s.h + d) return false;
    return true;
  }
  function findSpot(b, filter) {
    for (let k = 0; k < 12000; k++) {
      const x = 4 + Math.floor(rnd() * (W - 8)), y = 4 + Math.floor(rnd() * (H - 8)), i = idx(x, y);
      if (biome[i] !== b || !reach[i] || reserved[i] || tiles[i] === T.PATH || tiles[i] === T.BRIDGE) continue;
      if (!walk(i) || !farFromStructs(x, y, 3)) continue;
      if (filter && !filter(x, y)) continue;
      return { x, y };
    }
    return null;
  }
  const OW_CHESTS = [
    [1, { stones: 100 }], [1, { item: 'potion', n: 3 }], [1, { card: 'c_twin' }], [1, { gold: 200 }], [1, { stones: 50 }], [1, { item: 'ether', n: 1 }], [1, { stones: 100 }], [1, { card: 'c_trip' }],
    [2, { stones: 100 }], [2, { card: 'c_wall' }], [2, { item: 'ether', n: 2 }], [2, { stones: 150 }], [2, { gold: 300 }], [2, { item: 'potion', n: 5 }], [2, { stones: 100 }],
    [3, { stones: 150 }], [3, { card: 'c_aim' }], [3, { item: 'feather', n: 1 }], [3, { gold: 500 }], [3, { stones: 150 }], [3, { item: 'hipotion', n: 2 }],
    [4, { stones: 150 }], [4, { card: 'c_venom' }], [4, { item: 'hipotion', n: 2 }], [4, { stones: 150 }], [4, { gold: 600 }], [4, { item: 'feather', n: 2 }],
    [5, { stones: 200 }], [5, { item: 'elixir', n: 1 }], [5, { gold: 800 }], [5, { stones: 200 }], [5, { card: 'c_medit' }],
    [6, { stones: 100 }],
    [1, { stones: 100 }], [2, { card: 'c_bless' }], [3, { stones: 150 }], [4, { stones: 150 }], [5, { card: 'c_spike' }], [1, { gold: 400 }], [2, { stones: 100 }], [3, { item: 'hipotion', n: 3 }], [4, { gold: 700 }], [5, { stones: 200 }],
    [7, { stones: 300 }], [7, { card: 'c_miracle' }], [7, { stones: 250 }], [7, { item: 'elixir', n: 1 }], [7, { card: 'c_aegis' }], [7, { stones: 300 }],
    [8, { stones: 200 }], [8, { card: 'c_heavy' }], [8, { item: 'feather', n: 2 }], [8, { stones: 200 }], [8, { gold: 1000 }], [8, { card: 'c_medit' }],
    [9, { stones: 400 }], [9, { card: 'c_combo' }], [9, { item: 'elixir', n: 2 }], [9, { stones: 400 }], [9, { gold: 3000 }], [9, { card: 'c_vampire' }], [9, { stones: 500 }],
  ];
  const placed = [];
  for (const [b, c] of OW_CHESTS) {
    const p = findSpot(b, (x, y) => placed.every(q => Math.abs(q.x - x) + Math.abs(q.y - y) > 16));
    if (!p) continue;
    placed.push(p);
    objs.chests.push(Object.assign({ id: 'c' + (chestId++), x: p.x, y: p.y }, c));
    reserved[idx(p.x, p.y)] = 1;
  }
  // 隠し宝 1: ルミナ村 南門から
  {
    const g = L.s; let hx = g.x - 3, hy = g.y + 6;
    for (let k = 0; k < 20 && (!walk(idx(hx, hy)) || tiles[idx(hx, hy)] === T.PATH); k++) hx--;
    objs.hidden.push({ id: 'h1', x: hx, y: hy, reward: { stones: 300 } });
    const dx = g.x - hx, dy = hy - g.y + 1;
    objs.signs.push(null);
    WORLD.hint1 = `村の南門を出て、\nまっすぐ南へ${dy}歩、西へ${dx}歩。\nそこで足元を調べよ。`;
  }
  // 隠し宝 2: 火山の枯れ木
  {
    const p = findSpot(5, (x, y) => [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 2]].every(([dx, dy]) => reach[idx(x + dx, y + dy)] && !reserved[idx(x + dx, y + dy)] && tiles[idx(x + dx, y + dy)] !== T.PATH));
    if (p) {
      tiles[idx(p.x - 1, p.y)] = T.DEADTREE; tiles[idx(p.x + 1, p.y)] = T.DEADTREE; tiles[idx(p.x, p.y - 1)] = T.DEADTREE;
      tiles[idx(p.x, p.y)] = T.ASH; tiles[idx(p.x, p.y + 1)] = T.ASH;
      objs.hidden.push({ id: 'h2', x: p.x, y: p.y, reward: { stones: 300 } });
      WORLD.hint2 = { x: p.x, y: p.y };
    }
  }
  // 隠し宝 3: サンドラ東門から
  {
    const g = townInfo.sandora.gates.e;
    let best = null;
    for (let dy = 6; dy <= 12 && !best; dy++) for (let dx = 6; dx <= 14 && !best; dx++) {
      const x = g.x + dx, y = g.y + dy, i = idx(x, y);
      if (reach[i] && walk(i) && !reserved[i] && tiles[i] !== T.PATH && biome[i] === 3) best = { x, y, dx, dy };
    }
    if (best) {
      objs.hidden.push({ id: 'h3', x: best.x, y: best.y, reward: { stones: 300 } });
      WORLD.hint3 = `町の東門を出て、\n東へ${best.dx + 1}歩、南へ${best.dy}歩。\n砂の下に宝が眠るという。`;
    }
  }
  objs.signs = objs.signs.filter(Boolean);
  // 水晶の荒野に落ちている星晶石のかけら
  objs.shards = [];
  for (let k = 0; k < 36; k++) {
    const p = findSpot(7, (x, y) => objs.shards.every(q => Math.abs(q.x - x) + Math.abs(q.y - y) > 7));
    if (p) objs.shards.push({ id: 's' + k, x: p.x, y: p.y, n: 20 + Math.floor(rnd() * 4) * 10 });
  }

  // 8. 敵シンボルの出現地点
  const AREA_OF = [null, 'meadow', 'forest', 'desert', 'snow', 'volcano', null, 'crystal', 'island', 'sky'];
  for (let k = 0; k < 950; k++) {
    const b = k >= 850 ? 9 : [1, 2, 3, 4, 5, 7, 8][Math.floor(rnd() * 7)];
    const p = findSpot(b, (x, y) => {
      for (const t of TOWNS) if (Math.abs(x - (t.x + t.w / 2)) < t.w / 2 + 7 && Math.abs(y - (t.y + t.h / 2)) < t.h / 2 + 7) return false;
      return objs.spawns.every(s => Math.abs(s.x - x) + Math.abs(s.y - y) > 8);
    });
    if (p) objs.spawns.push({ x: p.x, y: p.y, area: AREA_OF[b], region: 0 });
  }

  Object.assign(WORLD, { W, H, tiles, region, style, biome, regions, structs, objs, seal, townInfo, dunInfo, reach });
  WORLD.start = { x: TOWNS[0].x + TOWNS[0].road.col, y: TOWNS[0].y + TOWNS[0].road.row + 2 };
  WORLD.lumina = townInfo.lumina;
  WORLD.skyStart = { x: townInfo.aeria.gates.s.x, y: townInfo.aeria.gates.s.y };
  {
    const g = L.e; let best = null, bd = 1e9;
    for (let y = g.y - 8; y <= g.y + 8; y++) for (let x = g.x + 3; x <= g.x + 14; x++) {
      const i = idx(x, y);
      if (TILE_DEFS[tiles[i]].solid || reserved[i] || region[i] || tiles[i] === T.PATH || !reach[i]) continue;
      if (objs.saves.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 2) || objs.spawns.some(o => o.x === x && o.y === y)) continue;
      const d = Math.abs(x - g.x - 6) + Math.abs(y - g.y - 3);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    WORLD.airDock = best;
  }
  return WORLD;
}

function biomeArea(x, y) {
  const b = WORLD.biome[y * MW + x];
  return [null, 'meadow', 'forest', 'desert', 'snow', 'volcano', 'meadow', 'crystal', 'island', 'sky'][b] || 'meadow';
}
