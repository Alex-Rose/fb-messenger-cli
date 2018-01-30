#!/usr/bin/env node

(function () {
    const Login = require('./scripts/login.js');
    const crypt = require('./scripts/crypt.js');
    const Settings = require('./scripts/settings.js');
    const colors = require('colors');

    function executeCompleteLogin(callback, options) {
        console.log('Facebook credentials:');
        Login.execute(callback, options);
    }

    function verifyLogon(callback) {
        crypt.load((cryptLoadErr, data) => {
            // Load settings before performing any other actions
            Settings.read((readSettingsErr) => {
                if (readSettingsErr) {
                    callback(readSettingsErr);
                }

                const options = {
                    twoFactor: Settings.properties.twoFactorAuth,
                    headless: Settings.properties.headlessLogin
                };

                // Check if we have a profile
                if (!cryptLoadErr) {
                    let loginInfo;
                    try {
                        loginInfo = JSON.parse(data);
                    } catch(cryptErr) {
                        return callback(cryptErr, options);
                    }

                    const curTime = new Date().getTime();
                    console.log(`Last logon time: ${  new Date(loginInfo.saveTime)}`);

                    // If we've been logged on for too long
                    // Do an other login to refresh the cookie
                    if (loginInfo.saveTime + Settings.getLogonTimeout() < curTime) {
                        return callback(new Error('Login time expired'), options);
                    } else {
                        return callback(null, options);
                    }
                } else
                    return callback(cryptLoadErr, options);
            });
        });
    }

    function launchApp(err, options) {
        if (err) {
            console.log(`Login verification failed: ${err}`.yellow);
            executeCompleteLogin(launchApp, options);
        } else {
            Settings.read((err) => {
                let delay = 0;
                if (!err) {
                    if (Settings.properties.disableColors) {
                        colors.enabled = false;
                    }
                } else {
                    delay = 2000;
                    console.log(err.yellow);
                }

                setTimeout(() => {
                    console.log('Launching app...'.cyan);
                    require('./scripts/interactive.js');
                }, delay);
            });
        }
    }

    function initSignalListeners(){
        process.on("SIGINT", () => {
            console.log('Thanks for using fb-messenger-cli'.cyan);
            console.log('Bye!'.cyan);
            process.exit(0);
        });

        process.on("SIGTERM", () => {
            console.log('Thanks for using fb-messenger-cli'.cyan);
            console.log('Bye!'.cyan);
            process.exit(0);
        });
    }

    // First check if current cookie is still valid
    try {
        initSignalListeners();
        verifyLogon(launchApp);
    } catch (err) {
        console.log('You need to login');
        executeCompleteLogin(launchApp);
    }
}());
