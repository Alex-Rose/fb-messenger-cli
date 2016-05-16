var Login = require('./login.js');
var Crypt = require('./crypt.js');
var prompt = require('prompt');
var phantom = undefined;

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

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: email, password
//
prompt.get(schema, function (err, result) {
  
    phantom = new run_cmd(
        'phantomjs', ['phantom.js', result.email, result.password],
        function () { 
            var Messenger = require('./messenger.js');

            // Save data in the vault
            crypt = new Crypt(result.password);
            crypt.save(phantom.data);
        }
    );
});

function run_cmd(cmd, args, cb) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
        var data = '';
    child.stdout.on('data', function (buffer) { 
        if (me.data == undefined) { 
            me.data = buffer.toString();
        } else {
            me.data += buffer.toString()   
        }
    });
    child.stdout.on('end', cb);
}
