const crypt = require('./crypt.js');
const readlineSync = require('readline-sync');
const phantomjs = require('phantomjs-prebuilt');
const path = require('path');
let phantom;
const DEBUG = true;

Login = function() { };

Login.prototype.execute = function(callback) {
    const login = this;
    const result = {};

    result.email = readlineSync.question('Email: ');
    result.password = readlineSync.question('Password: ', {hideEchoBack: true});

    console.log("Attempting login...");

    // This needs to stay "var" for phantomJS
    // TODO: change phantomJS to pupeteer
    var arguments = [path.resolve(__dirname, 'phantom.js'), result.email, result.password];

    phantom = new login.run_cmd( phantomjs.path, arguments, (err) => {
        if (err) return callback(err);

        if (phantom.data){
            let objData;
            try {
                objData = JSON.parse(phantom.data);
            } catch (parseErr) {
                console.log('Warning: Errors caught in return data'.yellow);
                if (phantom.data.indexOf('{') !== -1) {
                    const trimmed = phantom.data.substring(phantom.data.indexOf('{'));
                    try {
                        objData = JSON.parse(trimmed);
                    } catch (err2) {
                        return callback(err2);
                    }
                } else {
                    return callback(new Error('Invalid phantomJS data'));
                }
            }

            // Add save time to data
            objData.saveTime = new Date().getTime();

            // Save user data to file for next login
            crypt.save(JSON.stringify(objData));
            return callback();

        } else {
            return callback(new Error('Bad Facebook credentials'));
        }
    });
};

Login.prototype.run_cmd = function(cmd, args, cb) {
    const spawn = require('child_process').spawn;
    const child = spawn(cmd, args);
    const me = this;

    if (DEBUG) child.stdout.pipe(process.stdout);

    child.stderr.pipe(process.stderr);
    child.stdout.on('data', (buffer) => {
        if (me.data === undefined) {
            me.data = buffer.toString();
        } else {
            me.data += buffer.toString();
        }
    });
    child.stdout.on('end', cb);
};

module.exports = Login;
