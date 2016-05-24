var Login = require('./login.js');
var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');
var Settings = require('./settings.js');
var colors = require('colors');

function executeCompleteLogin(callback) {
  console.log('Facebook credentials');
  var login = new Login();
  login.execute(function(err, creds) {
    var crypt = Crypt.getInstance();
    // Return callback with no error
    callback(err);
  });
}

function askPassword(callback) {

}

function verifyLogon(password, callback) {
  var crypt = Crypt.getInstance(password);

  crypt.load(function(err, data) {
    if(!err) {
      json = JSON.parse(data);
      var cookie = json.cookie;
      var fbdtsg = json.fb_dtsg;
      var userId = json.c_user;

      var messenger = new Messenger(cookie, userId, fbdtsg);

      messenger.getThreads(function(err, threads) {
        callback(err);
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
    var settings = Settings.getInstance();
    settings.load(function(err, data) {
      var delay = 0;
      if (!err && data !== undefined) {
        if (data.disableColors) {
          colors.enabled = false;  
        }        
      } else {
        console.log(err);
        delay = 2000;
        console.log('Warning : settings can\'t be read'.yellow);
      }
      
      setTimeout(function() {
        console.log('Launching app...'.cyan);
        require('./interactive.js');      
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
