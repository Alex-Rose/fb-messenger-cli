var Login = require('./login.js');
var prompt = require('prompt');

login = new Login();


/////// TEST

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
    //
    // Log the results.
    //
    console.log('Command-line input received:');
    console.log('  name: ' + result.email);
    // console.log('  password: ' + result.password);
    
    login.getCookie(result.email, result.password);
  });

///////