var system = require('system');
var page = new WebPage(), testindex = 0, loadInProgress = false, foundValue = false;
var fb_value = '';

var user = system.args[1];
var pass = system.args[2];

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.onLoadStarted = function() {
  loadInProgress = true;
  // console.log("load started");
};

page.onLoadFinished = function() {
  loadInProgress = false;
  // console.log("load finished");
};

page.onResourceRequested = function(requestData, networkRequest) {
  //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
  if (requestData.postData !== undefined) {
    post = requestData.postData.split('&');
    search = 'fb_dtsg=';
    for (i = 0; i < post.length; ++i) {
      if (post[i].indexOf(search) === 0) {
          foundValue = true;
          fb_value = decodeURIComponent(post[i].substr(search.length));
      }
    }
  }
};

var steps = [
  function() {
    //Load Login Page
    page.open("https://www.messenger.com/login");
  },
  function() {
    //Enter Credentials
    page.evaluate(function(user, pass) {
        document.getElementById("email").value = user;
        document.getElementById("pass").value = pass;
        return;
    }, user, pass);
  },
  function() {
    //Login
    page.evaluate(function() {
        var btn = document.getElementById("loginbutton");
        btn.click();
        return;
    });
  },
  function() {
    // Evaluate messenger home page
    page.evaluate(function() {

    });
  }
];

timeout = undefined;
interval = setInterval(function() {
    if (!loadInProgress && typeof steps[testindex] == "function") {
      steps[testindex]();
      testindex++;
    }
    if (typeof steps[testindex] != "function") {

        // Wait until we capture our secret value
        if (foundValue) {
            // Give it a little break, then quit.
            window.setTimeout(function(){
                json = {'fb_dtsg': fb_value};
                cookie = ''
                for (i = 0; i < phantom.cookies.length; ++i){
                    if (i > 0) {
                        cookie += '; ';
                    }

                    cookie += phantom.cookies[i].name + "=" + phantom.cookies[i].value;

                    if (phantom.cookies[i].name == 'c_user') {
                        json['c_user'] = phantom.cookies[i].value;
                    }
                }

                json['cookie'] = cookie;
                console.log(JSON.stringify(json));
                phantom.exit();
            }, 2000);
        }

        if (timeout === undefined) {
            // Allow max 15 seconds to get data
            timeout = window.setTimeout(function(){
                console.log('{"failed":"failed"}');
                phantom.exit();
            }, 15000);
        }
    }
}, 50);
