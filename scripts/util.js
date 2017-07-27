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

Util.fixedCharCodeAt = function(str, idx) {
    idx = idx || 0;
    var code = str.charCodeAt(idx);
    var hi, low;

    // High surrogate (could change last hex to 0xDB7F
    // to treat high private surrogates 
    // as single characters)
    if (0xD800 <= code && code <= 0xDBFF) {
        hi = code;
        low = str.charCodeAt(idx + 1);
        if (isNaN(low)) {
            return false;
        }

        var highCode = (hi - 0xD800) << 10;
        var lowCode = (low - 0xDC00) & 0x3FF;
        return highCode + lowCode + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
        // We return false to allow loops to skip
        // this iteration since should have already handled
        // high surrogate above in the previous iteration
        return false;
        // hi = str.charCodeAt(idx - 1);
        // low = code;
        // return ((hi - 0xD800) * 0x400) +
        //   (low - 0xDC00) + 0x10000;
    }
    return code;
}

module.exports = Util;
