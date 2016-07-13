var Crypt = require('./crypt.js');
var phantomjs = require('phantomjs-prebuilt');
var readline = require('readline');
var phantom;

Login = function() { };

Login.prototype.execute = function(callback) {
  var login = this;

  var result = {
    email: '',
    password: ''
  };

  var namePrompt = 'Facebook username: ';
  var pwPrompt = 'Facebook password: ';

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(namePrompt, function(name) {
    result.email = name;

    rl.question(pwPrompt, function(pw) {
      result.password = pw;
      var path = phantomjs.path; // Path where npm install the prebuilt .exe
      var arguments = ['scripts/phantom.js', result.email, result.password];

      phantom = new login.run_cmd( path, arguments, function () {
        var Messenger = require('./messenger.js');

        if(phantom.data){
          // Save data in the vault
          crypt = new Crypt(result.password);

          // Add save time to the data
          var objData = JSON.parse(phantom.data);
          objData.saveTime = new Date().getTime();

          crypt.save(JSON.stringify(objData));

          callback(false, result);
        } else {
          // Erase last 3 lines in stdout
          readline.moveCursor(rl.output, 0, -3);
          readline.clearScreenDown(rl.output);
          console.log('Bad Facebook Login, (Please try again)');
          callback(true, null);
        }
      });
      rl.close();
    });
    process.stdout.end();
  });
};

Login.prototype.run_cmd = function(cmd, args, cb) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var me = this;
    var data = '';

    child.stdout.on('data', function (buffer) {
        if (me.data === undefined) {
            me.data = buffer.toString();
        } else {
            me.data += buffer.toString();
        }
    });
    child.stdout.on('end', cb);
};

module.exports = Login;
