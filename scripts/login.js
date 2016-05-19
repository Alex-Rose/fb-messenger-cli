var Crypt = require('./crypt.js');
var prompt = require('prompt');
var phantom;

Login = function() { };

Login.prototype.execute = function() {
  var login = this;
  var schema = {
      properties: {
        email: {
          required: true
        },
        password: {
          hidden: true
        }
      }
    };


  prompt.start();

  prompt.get(schema, function (err, result) {
      var command = 'phantomjs';
      var arguments = ['phantom.js', result.email, result.password];
      
      phantom = new login.run_cmd( command, arguments, function () { 
        var Messenger = require('./messenger.js');

        // Save data in the vault
        crypt = new Crypt(result.password);
        crypt.save(phantom.data);
      });
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