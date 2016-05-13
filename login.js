var request = require('request'); // For making HTTP requests
var cheerio = require('cheerio');
var prompt = require('prompt');

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
    console.log('  password: ' + result.password);
  });

///////

var url = 'https://messenger.com';
var options = {
  url: url,
  headers: {
    'origin': 'https://www.messenger.com',
    'accept-encoding': 'gzip, deflate',
    'x-msgr-region': 'ATN',
    'accept-language': 'en-US,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': '*/*',
    'authority': 'www.messenger.com'
  },
  gzip: true
};

request.get(options, function(err, httpResponse, body) {
    if (err) {
        return console.error('get failed:', err);
    }
    
    var $ = cheerio.load(body);
    hidden = $('input[type=hidden]');
    
    // Form data needed for post
    data = {};
    
    for (var i = 0; i < hidden.length; ++i){
        input = $(hidden[i]);
        name = input.attr('name');
        val = input.val();
        
        if (val == '') {
           // Known issue
           // I guess we don't request the page as it should
           if (name === 'timezone') {
               val = '240'; 
           } else if (name === 'lgndim') {
               val = 'eyJ3IjoxMjgwLCJoIjo4NTMsImF3IjoxMjgwLCJhaCI6ODUzLCJjIjoyNH0=';
           }
           else { 
                console.error('Error getting login form data');
           }
        }
        
        data[name] = val;
    }
    
    // Add login button to form data
    button = $('#loginbutton');
    data[button.attr('name')] = 1;
});

