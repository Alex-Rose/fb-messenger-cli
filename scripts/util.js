var Util = function(){};

Util.refreshConsole = function(){
  // var lines = process.stdout.getWindowSize()[1];
  // for(var i = 0; i < lines; i++) {
  //     console.log('\r\n');
  // }
  process.stdout.write('\033c');
};

module.exports = Util;
