var request = require('request');
var Crypt = require('./crypt.js');
var stream = require('stream');

var crypt = Crypt.getInstance();

crypt.load(function(data) {
  json = JSON.parse(data);
  var cookie = json.cookie;
  var fbdtsg = json.fb_dtsg;
  var userId = json.c_user;

  var seq = 1;
  var hadIncrement = false;
  // var clientId = 'a737aed';
  var clientId = '472aed';
  var msgRecv = 0;

var f = function() {  
  var url = 'https://3-edge-chat.messenger.com/pull?';
  url += 'channel=p_' + userId;
  url += '&seq=' + seq;
  url += '&partition=-2';
  url += '&clientid=' + clientId;
  url += '&cb=70md';
  url += '&idle=101';
  url += '&qp=y';
  url += '&cap=8';
  url += '&pws=fresh'; // Fresh is better :P
  url += '&isq=199552'; // This magic number is worthy of projet 3
  url += '&msgs_recv=0';
  url += '&uid=' + userId;
  url += '&viewer_uid' + userId;
  url += '&sticky_token=54';
  url += '&sticky_pool=ash3c07_chat-proxy';
  url += '&state=offline';
  url += '&mode=stream';
  url += '&format=json';
  
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
        'cache-control': 'max-age=0',
        'authority': 'www.messenger.com',
        'cookie': cookie,
        'referer': 'https://www.messenger.com'
      },
      gzip: true,
    };
    
    // console.log('requesting seq=' + seq);
    var connection = request.get(options);
    connection.on('data', function(chunk){
      var data = chunk.toString('utf8');
      if (data.indexOf('for (;;);') === 0) {data = data.substr('for (;;);'.length);}
      
      try {
        if (data.length > 0) {
          // console.log(data);
          json = JSON.parse(data);
          
          if (!Array.isArray(json)) {
            json = [json];
          }
          
          for (var i in json) {
            var message = json[i];
            
            if (message.t == 'msg') {
              seq = message.seq;
              hadIncrement = true;
              // console.log('Got seq ' + message.seq);
              
              for (var j in message.ms) {
                var ms = message.ms[j];
                // console.log(ms.type);
                if (ms.type == 'delta' && ms.delta !== undefined && ms.delta.body !== undefined) {
                  console.log(ms.delta.body);
                }
                else if (ms.type == 'typ') {
                  if (ms.st == '1') {
                    console.log('Started typing');
                  } else {
                    console.log('Stop typing');
                  }
                }
              }
              
            } else if (message.t == 'heartbeat') {
              // console.log('Got heartbeat... need to restart');
              if (hadIncrement) {
                seq++;
                hadIncrement = false;
              }
              f();
            }
            else if (message.t == 'fullReload') {
              seq = message.seq;
              hadIncrement = false;
              f();
            }
          }
        }
      } catch (err) {
        console.error(err);
        console.log('Chunk was : ' + chunk);
      }
    });
    
    connection.on('end', function() {
      // console.log('CONNECTION HAS ENDED!!!');
    });
    
  };
  
  f();
    // function(err, response, body){
      // console.log(body);
    // });
}); 

