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

    crypt.load(function(err, data) {

      const logonTimeout = 43200000; // 12hrs in ms

      if(!err) {
        const json = JSON.parse(data);
        let lastSave = json.saveTime;
        let curTime = new Date().getTime();
        console.log('Last logon time: ' + new Date(lastSave));

        // If we've been logged on for too long
        // Do an other login to refresh the cookie
        if(lastSave + logonTimeout < curTime){
          console.log('Your logged in time has expired'.yellow);
          callback(true);
        } else {
          require('./scripts/interactive.js');
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
      settings.load(function(err, data) {
        var delay = 0;
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
