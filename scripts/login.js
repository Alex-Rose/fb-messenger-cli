var request = require('request'); // For making HTTP requests
var cheerio = require('cheerio');
var driver = require('node-phantom-simple');

var Login = function() {
    this.url = 'https://www.messenger.com';
    this.login_path = '/login/password/';
    this.default_timezone = '240';
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
    this.cookies = [];
    this.cookie_string = '';
};

Login.prototype.getCookie = function(email, password) {
    var login = this;
   
    driver.create({ path: require('phantomjs').path }, function (err, browser) {
        return browser.createPage(function (err, page) {
            return page.open(login.url, function (err,status) {
                console.log("opened site? ", status);
                page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function (err) {
                    // jQuery Loaded.
                    // Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
                    setTimeout(function () {
                        
                        
                        // page.render('messenger.png');
                        return page.evaluate(function () {
                            //Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
                            var params = {};

                            $('input[type=hidden]').each(function () { 
                                params[$(this).attr('name')] = $(this).val();
                                
                            });


                            return params;
                        }, function (err,result) {
                            
                            page.get('cookies', function( err, cookies ){
                                result['email'] = email;
                                result['pass'] = password;
                                result['login'] = '1';
                                login.post_headers['cookie'] = cookies[0]['name'] + '=' + cookies[0]['value'];
                                //console.log(login.post_headers);
                                login.executeLogin(result);
                                browser.exit();
                            });
                            
                            // console.log(result);
                        });
                    }, 5000);
                });
            });
        });
    });
}

Login.prototype.executeLogin = function(formData) {
    var login = this;
   
    var options = {
      url: login.url + login.login_path,
      //url: 'http://nova.polymtl.ca/~alexrose/dump.php',
      headers: login.post_headers,
      form: formData,
      gzip: true
    };
    
    console.log('executing login at ' + options.url);
    // console.log('with form data');
    // console.log(JSON.stringify(formData));
    
    request.post(options, function(err, httpResponse, body) {
        console.log(httpResponse.statusCode);
        // console.log(httpResponse);
        //console.log(body);
        // console.log(httpResponse.headers);
        // console.log(httpResponse.headers['set-cookie']);
        cookies = httpResponse.headers['set-cookie'];
        for (i = 0; i < cookies.length; ++i) {
            c = cookies[i].split(';')[0];
            login.cookie_string += c + ';';
            
            // parts = c.split('=');
            // name = parts[0];
            // val = parts[1]l
            // login.cookies.push({parts[0]: parts[1]]});
        }
        
        console.log(login.cookie_string);
    });
    
}

module.exports = Login;
