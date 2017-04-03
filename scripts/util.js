const readline = require('readline');

var Util = function(){};

Util.refreshConsole = function(){
  process.stdout.write('\033c');
};

Util.overwriteConsole = function(){
  readline.cursorTo(process.stdout, 0, 0);
};

module.exports = Util;
