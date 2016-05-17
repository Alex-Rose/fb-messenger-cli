var request = require('request');
var Crypt = require('./crypt.js');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

Pull = function() {
  this.seq = 1;
  // var clientId = 'a737aed';
  this.hadIncrement = false;
  this.clientId = '473aed';
  this.msgRecv = 0;
  this.connection = undefined;
};

util.inherits(Pull, EventEmitter);

Pull.prototype.execute = function() {
  var pull = this;
  var crypt = Crypt.getInstance();

  crypt.load(function(data) {
    json = JSON.parse(data);
    pull.cookie = json.cookie;
    pull.fbdtsg = json.fb_dtsg;
    pull.userId = json.c_user;

    pull.sendRequest();
    
      // function(err, response, body){
        // console.log(body);
      // });
  }); 

};

Pull.prototype.sendRequest = function() {
  var pull = this;

  var url = 'https://3-edge-chat.messenger.com/pull?';
  url += 'channel=p_' + pull.userId;
  url += '&seq=' + pull.seq;
  url += '&partition=-2';
  url += '&clientid=' + pull.clientId;
  url += '&cb=70md';
  url += '&idle=101';
  url += '&qp=y';
  url += '&cap=8';
  url += '&pws=fresh'; // Fresh is better :P
  url += '&isq=199552'; // This magic number is worthy of projet 3
  url += '&msgs_recv=0';
  url += '&uid=' + pull.userId;
  url += '&viewer_uid' + pull.userId;
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
      'cookie': pull.cookie,
      'referer': 'https://www.messenger.com'
    },
    gzip: true,
  };
  
  // console.log('requesting seq=' + seq);
  
  
  pull.connection = request.get(options);
  pull.connection.on('data', function(chunk){
    
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
            pull.seq = message.seq;
            pull.hadIncrement = true;
            // console.log('Got seq ' + message.seq);
            
            for (var j in message.ms) {
              var ms = message.ms[j];
              // console.log(ms.type);
              if (ms.type == 'delta' && ms.delta !== undefined && ms.delta.body !== undefined) {
                // console.log(ms.delta.body);
                pull.emit('message', ms.delta.body);
              }
              else if (ms.type == 'typ') {
                if (ms.st == '1') {
                  // console.log('Started typing');
                } else {
                  // console.log('Stop typing');
                }
              }
            }
            
          } else if (message.t == 'heartbeat') {
            // console.log('Got heartbeat... need to restart');
            if (hadIncrement) {
              pull.seq++;
              pull.hadIncrement = false;
            }
            pull.sendRequest();
            
          }
          else if (message.t == 'fullReload') {
            pul.seq = message.seq;
            pul.hadIncrement = false;
            pull.sendRequest();
          }
        }
      }
    } catch (err) {
      // console.error(err);
      // console.log('Chunk was : ' + chunk);
    }
  });
  
  
  pull.connection.on('end', function() {
    // console.log('CONNECTION HAS ENDED!!!');
  });
  
};

// pull = new Pull();
// pull.execute(function () {console.log('ssssssss')});

// pull.on('message', function(message) {
  // console.log('message : ' + message);
// });

module.exports = Pull;