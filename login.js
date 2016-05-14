var request = require('request'); // For making HTTP requests
var cheerio = require('cheerio');

var Login = function() {
    this.url = 'https://www.messenger.com';
    this.login_path = '/login/password/';
    this.default_lgndim = 'eyJ3IjoxMjgwLCJoIjo4NTMsImF3IjoxMjgwLCJhaCI6ODUzLCJjIjoyNH0=';
    this.default_timezone = '240';
    this.get_headers = {
        'origin': 'https://www.messenger.com',
        'accept-encoding': 'gzip, deflate',
        'x-msgr-region': 'ATN',
        'accept-language': 'en-US,en;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
        'accept': '*/*',
        'authority': 'www.messenger.com'
      };  
    this.post_headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'en-US,en;q=0.8',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://www.messenger.com',
        'referer': 'https://www.messenger.com/?_rdr',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
        //'authority': 'www.messenger.com',
        //cookie:datr=jCo2V-NeTsVkMPIp15VgMyGw
      };
};

Login.prototype.getCookie = function(email, password) {
    var login = this;
    
    var options = {
      url: login.url,
      headers: login.get_headers,
      gzip: true
    };
    
    request.get(options, function(err, httpResponse, body) {
        if (err) {
            return console.error('GET login page failed:', err);
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
                   val = login.default_timezone; 
               } else if (name === 'lgndim') {
                   val = encodeURIComponent(login.default_lgndim);
               }
               else { 
                    console.error('Error getting login form data');
               }
            }
            
            data[name] = encodeURIComponent(val);
        }
        
        // Add login button to form data
        button = $('#loginbutton');
        data[button.attr('name')] = 1;
        
        // Add email/password to form data
        data['email'] = encodeURIComponent(email);
        data['pass'] = encodeURIComponent(password);
        
        login.executeLogin(data);
    });
}

Login.prototype.executeLogin = function(formData) {
    var login = this;
    
    
    
    var op = {
      url: 'https://www.messenger.com/ajax/bz',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'en-US,en;q=0.8',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://www.messenger.com',
        'referer': 'https://www.messenger.com/?_rdr',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
        //'authority': 'www.messenger.com',
        //cookie:datr=jCo2V-NeTsVkMPIp15VgMyGw
      },
      gzip: true,
      form: {
            '__a': '1',
            '__be':'0',
            '__dyn':'7xeU6Ci3S3mbx67e-C1swgE98nwgU6C7UW3e3eaxe1qwh8eU88lwIwHwaa6E',
            '__pc':'EXP1%3Amessengerdotcom_pkg',
            '__req':'1',
            '__rev':'2335772',
            '__user':'0',
            'lsd':formData['lsd'],
            'ph':'V3',
            'q':'%5B%7B%22user%22%3A%220%22%2C%22page_id%22%3A%226o6yod%22%2C%22posts%22%3A%5B%5B%22script_path_change%22%2C%7B%22source_path%22%3A%22XMessengerDotComRootController%22%2C%22source_token%22%3A%2255daef24%22%2C%22dest_path%22%3A%22XMessengerDotComRootController%22%2C%22dest_token%22%3A%2255daef24%22%2C%22impression_id%22%3A%2268fef617%22%2C%22cause%22%3A%22load%22%2C%22source_restored%22%3Atrue%7D%2C1463170285157%2C0%5D%2C%5B%22logger%3AMarketingLoggerConfig%22%2C%7B%22event%22%3A%22page_load%22%2C%22is_mobile%22%3Afalse%2C%22controller_name%22%3A%22XMessengerDotComRootController%22%2C%22session_id%22%3A%2220ee3e9a-d8c9-43bb-9513-46425f88bba7%22%7D%2C1463170285191%2C0%5D%2C%5B%22time_spent_bit_array%22%2C%7B%22tos_id%22%3A%226o6yod%22%2C%22start_time%22%3A1463170285%2C%22tos_array%22%3A%5B1%2C0%5D%2C%22tos_len%22%3A9%2C%22tos_seq%22%3A0%2C%22tos_cum%22%3A1%7D%2C1463170293283%2C0%5D%2C%5B%22ods%3Ams.time_spent.qa.www%22%2C%7B%22time_spent.bits.js_initialized%22%3A%5B1%5D%7D%2C1463170293294%2C0%5D%5D%2C%22trigger%22%3A%22ods%3Ams.time_spent.qa.www%22%7D%5D',
            'ts': new Date().getTime()
      }
    };
    
    request.get(op, function(err, httpResponse, body) {
        var options = {
      url: login.url + login.login_path,
      //url: 'http://nova.polymtl.ca/~alexrose/dump.php',
      headers: login.post_headers,
      form: formData,
      gzip: true
    };
    
    console.log('executing login at ' + options.url);
    console.log('with form data');
    console.log(JSON.stringify(formData));
    
    request.post(options, function(err, httpResponse, body) {
        console.log(httpResponse.statusCode);
        // console.log(httpResponse);
        console.log(body);
        console.log(httpResponse.headers);
        console.log(httpResponse.headers['set-cookie']);
    });
    });
    
    
    
    
    
    
    
    
}

module.exports = Login;
