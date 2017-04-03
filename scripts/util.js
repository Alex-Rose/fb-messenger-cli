const Settings = require('./settings.js');
const readline = require('readline');

var Util = function(){};

Util.refreshConsole = function(){
  process.stdout.write('\033c');
};

Util.overwriteConsole = function(){
  if (Settings.getInstance().properties['disableColors']) {
    process.stdout.write('\033c');
  } else {
    readline.cursorTo(process.stdout, 0, 0);
  }
};

module.exports = Util;
