#!/usr/bin/env node

(function () {
  const Login = require('./scripts/login.js');
  const Crypt = require('./scripts/crypt.js');
  const Settings = require('./scripts/settings.js');
  const colors = require('colors');

  function executeCompleteLogin(callback) {
    console.log('Facebook credentials');
    const login = new Login();
    login.execute(callback);
  }

  function verifyLogon(password, callback) {
    const crypt = Crypt.getInstance(password);

    crypt.load(function (err, data) {

      if (!err) {
        Settings.getInstance().load((err, settings) => {
          const loginInfo = JSON.parse(data);
          let curTime = new Date().getTime();
          console.log('Last logon time: ' + new Date(loginInfo.saveTime));

          // If we've been logged on for too long
          // Do an other login to refresh the cookie
          if (loginInfo.saveTime + settings.logonTimeout < curTime) {
            console.log('Your logged in time has expired'.yellow);
            callback(true);
          } else {
            require('./scripts/interactive');
          }
        });
      } else {
        callback(err);
      }
    });
  }

  function launchApp(err) {
    if (err) {
      executeCompleteLogin(launchApp);
    } else {
      const settings = Settings.getInstance();
      settings.load(function(err, data) {
        let delay = 0;
        if (!err && data !== undefined) {
          if (data.disableColors) {
            colors.enabled = false;
          }
        } else {
          delay = 2000;
          console.log('Warning : settings can\'t be read'.yellow);
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
    verifyLogon('pass', launchApp);
  } catch (err) {
    console.log('You need to logon');
    executeCompleteLogin(launchApp);
  }
}());
