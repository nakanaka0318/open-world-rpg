// Node 用: ブラウザ用スクリプトをグローバルに読み込む
const fs = require('fs'), vm = require('vm'), path = require('path');
global.window = global;
global.document = { createElement: () => ({ getContext: () => ({}) }) };
module.exports = function load(files) {
  let src = files.map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n;\n');
  // const/let をグローバルに出すため var へ (トップレベルのみ簡易置換)
  src = src.replace(/^(const|let) /gm, 'var ');
  vm.runInThisContext(src);
};
