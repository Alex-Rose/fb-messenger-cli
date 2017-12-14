const Settings = require('./settings.js');
const readline = require('readline');

function refreshConsole () {
    if (Settings.properties.preventMessageFlicker) {
        readline.cursorTo(process.stdout, 0, 0);
    } else {
        process.stdout.write('\033c');
    }
}

module.exports = {
    refreshConsole
};
