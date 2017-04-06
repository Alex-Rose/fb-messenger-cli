const Settings = require('./settings.js');
const readline = require('readline');

var Util = function(){};

Util.refreshConsole = function(){
  process.stdout.write('\033c');
};

Util.overwriteConsole = function(){
  if (Settings.getInstance().properties['preventMessageFlicker']) {
    readline.cursorTo(process.stdout, 0, 0);
  } else {
    process.stdout.write('\033c');
  }
};

module.exports = Util;
