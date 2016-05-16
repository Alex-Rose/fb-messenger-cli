var Login = require('./login.js');
var prompt = require('prompt');

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
      
        var foo = new run_cmd(
            'phantomjs', ['phantom.js', result.email, result.password],
            function () { 
                
            }
        );
  });

function run_cmd(cmd, args, cb) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    child.stdout.on('data', function (buffer) { console.log(buffer.toString());});
    child.stdout.on('end', cb);
}
