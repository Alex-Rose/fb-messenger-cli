#!/usr/bin/env node

(function () {
    var Login = require('./scripts/login.js');
    var Crypt = require('./scripts/crypt.js');
    var Messenger = require('./scripts/messenger.js');
    var Settings = require('./scripts/settings.js');
    var colors = require('colors');

    function executeCompleteLogin(callback) {
        console.log('Facebook credentials');
        var login = new Login();
        login.execute(function (err, creds) {
            var crypt = Crypt.getInstance();
            // Return callback with no error
            callback(err);
        });
    }

    function verifyLogon(password, callback) {
        var crypt = Crypt.getInstance(password);

        crypt.load(function (err, data) {

            var logonTimeout = 43200000; // 12hrs in ms

            if (!err) {
                json = JSON.parse(data);
                var cookie = json.cookie;
                var fbdtsg = json.fb_dtsg;
                var userId = json.c_user;
                var lastSave = json.saveTime;
                var curTime = new Date().getTime();
                console.log('Last logon time: ' + new Date(lastSave));

                // If we've been logged on for too long
                // Do an other login to refresh the cookie
                if (lastSave + logonTimeout < curTime) {
                    console.log('Your logged in time has expired'.yellow);
                    callback(true);
                } else {
                    var messenger = new Messenger(cookie, userId, fbdtsg);

                    messenger.getThreads(function (err, threads) {
                        callback(err);
                    });
                }
            } else {
                callback(err);
            }
        });
    }

    function launchApp(err) {
        if (err) {
            executeCompleteLogin(launchApp);
        } else {
            var settings = Settings.getInstance();
            settings.load(function (err, data) {
                var delay = 0;
                if (!err && data !== undefined) {
                    if (data.disableColors) {
                        colors.enabled = false;
                    }
                } else {
                    delay = 2000;
                    console.log('Warning : settings can\'t be read'.yellow);
                }

                setTimeout(function () {
                    console.log('Launching app...'.cyan);
                    require('./scripts/interactive.js');
                }, delay);
            });
        }
    }

    // First check if current cookie is still valid
    try {
        verifyLogon('pass', launchApp);
    } catch (err) {
        console.log('You need to logon');
        executeCompleteLogin(launchApp);
    }
}());
