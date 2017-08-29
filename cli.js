#!/usr/bin/env node

(function () {
  const Login = require('./scripts/login.js');
  const crypt = require('./scripts/crypt.js');
  const Settings = require('./scripts/settings.js');
  const colors = require('colors');

  function executeCompleteLogin(callback) {
    console.log('Facebook credentials:');
    const login = new Login();
    login.execute(callback);
  }

  function verifyLogon(callback) {
    crypt.load((err, data) => {
      if (!err) {
        Settings.read((loadErr) => {
          if (!loadErr) {
            let loginInfo;
            try {
              loginInfo = JSON.parse(data);
            } catch(cryptErr) {
              return callback(cryptErr);
            }

            let curTime = new Date().getTime();
            console.log('Last logon time: ' + new Date(loginInfo.saveTime));

            // If we've been logged on for too long
            // Do an other login to refresh the cookie
            if (loginInfo.saveTime + Settings.getLogonTimeout() < curTime) {
              return callback(new Error('Login time expired'));
            } else
              return callback();
          } else
            return callback(loadErr);
        });
      } else
        return callback(err);
    });
  }

  function launchApp(err) {
    if (err) {
      console.log(`Login verification failed: ${err}`.yellow);
      executeCompleteLogin(launchApp);
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

        setTimeout(function() {
          console.log('Launching app...'.cyan);
          require('./scripts/interactive.js');
        }, delay);
      });
    }
  }

  function initSignalListeners(){
    process.on("SIGINT", function () {
      console.log('Thanks for using fb-messenger-cli'.cyan);
      console.log('Bye!'.cyan);
      process.exit(0);
    });

    process.on("SIGTERM", function () {
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
