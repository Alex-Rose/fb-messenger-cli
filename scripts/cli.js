var Login = require('./login.js');
var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');

function executeCompleteLogin(callback) {
  console.log('Facebook credentials');
  var login = new Login();
  login.execute(function(err, creds) {            
    var crypt = Crypt.getInstance();
    console.log('we be good');
  });
}

function askPassword(callback) {
  
}

function verifyLogon(password, callback) {
  var crypt = Crypt.getInstance(password);

  crypt.load(function(err, data) {
      json = JSON.parse(data);
      var cookie = json.cookie;
      var fbdtsg = json.fb_dtsg;
      var userId = json.c_user;

      var messenger = new Messenger(cookie, userId, fbdtsg);
              
      messenger.getThreads(function(err, threads) {
        callback(err);
      });
  });  
}

function launchApp(err) {
  if (err) {
    executeCompleteLogin(launchApp);
  } else {
    console.log('launching app');
  }
}

// First check if current cookie is still valid
try {
  verifyLogon('pass', launchApp);
} catch (err) {
  executeCompleteLogin(launchApp);
}