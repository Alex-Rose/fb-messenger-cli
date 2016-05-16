var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');
var colors = require('colors');
var stdin = process.openStdin();
var stdout = process.stdout;

var crypt = new Crypt('password');
messenger = undefined;

var options = {};
var recipientId = '';
var nextAction = 0;
var handlers = [
  // 0 - select conversation
  function(nb) {
    var id = options[nb];
    var user = messenger.users[id];
    
    messenger.getLastMessage(user.vanity, id, function(messages) {
      recipientId = id;
      for (i in messages) {
        var message = messages[i];
        var authorString = message.author;
        
        if (authorString.indexOf('fbid:') == 0) authorString = authorString.substr('fbid:'.length);
        
        
        var author = messenger.users[authorString];
        
        if (author.id != messenger.userId) {
          stdout.write(author.name.green);
        } else {
          stdout.write(author.name);
        }
        
        console.log(" : " + message.body);
      }
      
      options = {};
      nextAction = 1;
    });
  },
  // 1 - Send message
  function(text) {
    messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, text, function(err) {
      
    });
  }
];


var stdinListener = function(d) {
  value = d.toString().trim();
  
  handlers[nextAction](value);
};

crypt.load(function(data) {
    json = JSON.parse(data);
    var cookie = json.cookie;
    var fbdtsg = json.fb_dtsg;
    var userId = json.c_user;
    
    var recipient = "samuel.bergeron";
    var recipientId = "512556997";

    messenger = new Messenger(cookie, userId, fbdtsg);
        
    messenger.getFriends(function(friends) {
      // for (id in friends) {
        // console.log(friends[id].name);
      // }
      var entry = {};
      entry['id'] = userId;
      entry['firstName'] = "Me";
      entry['name'] = "Me";
      entry['vanity'] = "unknown";
      messenger.users[userId] = entry;
    });
    
    messenger.getThreads(function(threads) {
      options = {};
      for (i = 0; i < threads.length; ++i) {
          console.log('[' + i + '] ' + threads[i].name + ' : ' + threads[i].snippet);
          options[i] = threads[i].thread_fbid;
      }
      
      stdout.write("Select conversation : ");
    });
    
    stdin.addListener("data", stdinListener);
    
  // });

    
});
