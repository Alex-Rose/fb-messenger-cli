var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');
var util = require('./util.js');

var colors = require('colors');
var events = require('events');
var stdin = process.openStdin();
var stdout = process.stdout;

var crypt = new Crypt('password');
messenger = undefined;

var emitter = new events.EventEmitter();
var options = {};
var recipientId = '';
// 0 is select conversation, 1 is send message
var action = 0;


// var handlers = [
//   // 0 - select conversation
//   function(nb) {
//     var id = options[nb];
//     var user = messenger.users[id];
//
//     messenger.getLastMessage(user.vanity, id, function(messages) {
//       recipientId = id;
//       for (var i in messages) {
//         var message = messages[i];
//         var authorString = message.author;
//
//         if (authorString.indexOf('fbid:') === 0) authorString = authorString.substr('fbid:'.length);
//
//
//         var author = messenger.users[authorString];
//
//         if (author.id != messenger.userId) {
//           stdout.write(author.name.green);
//         } else {
//           stdout.write(author.name);
//         }
//
//         console.log(" : " + message.body);
//       }
//
//       options = {};
//       nextAction = 1;
//     });
//   },
//   // 1 - Send message
//   function(text) {
//     messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, text, function(err) {
//     });
//     console.log('Me : ' + text);
//   }
// ];

var getLastMessageListener = function(nb) {
  var id = options[nb];
  var user = messenger.users[id];

  messenger.getLastMessage(user.vanity, id, function(messages) {
    recipientId = id;
    util.refreshConsole();
    for (var i in messages) {
      var message = messages[i];
      var authorString = message.author;

      if (authorString.indexOf('fbid:') === 0) authorString = authorString.substr('fbid:'.length);


      var author = messenger.users[authorString];

      if (author.id != messenger.userId) {
        stdout.write(author.name.green);
      } else {
        stdout.write(author.name);
      }

      console.log(" : " + message.body);
    }
  });
};

var getConversationsListener = function() {
  messenger.getThreads(function(threads) {
    util.refreshConsole();
    options = {};
    for (i = 0; i < threads.length; ++i) {
        console.log('[' + i + '] ' + threads[i].name + ' : ' + threads[i].snippet);
        options[i] = threads[i].thread_fbid;
    }

    stdout.write("Select conversation : ");
  });
  action = 0;
};

var sendMessageListener = function(m) {
  messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, m, function(err) {
  });
};

var convoChoice = null;
var handler = function(choice) {
  var value = choice.toString().trim();

  // this works for now
  if(value.toLowerCase() === 'menu'){
    console.log('Bringing you back to the friend selection screen...'.cyan);
    emitter.emit('getConvos');
    return;
  }

  if(value.toLowerCase() === 'exit'){
    console.log('Thanks for using fb-messenger-cli'.cyan);
    console.log('Bye!'.cyan);
    process.exit(0);
  }

  if(action === 0) {
    convoChoice = value;
    emitter.emit('getMessages', value);
    action = 1;
  } else if(action === 1) {
    emitter.emit('sendMessage', value);

    // Wait a little to reprint or we won't see our own message
    setTimeout(function() {
      emitter.emit('getMessages', convoChoice);
    }, 500);
  }
};

// var stdinListener = function(d) {
//   value = d.toString().trim();
//
//   handlers[nextAction](value);
// };

crypt.load(function(data) {
    json = JSON.parse(data);
    var cookie = json.cookie;
    var fbdtsg = json.fb_dtsg;
    var userId = json.c_user;

    messenger = new Messenger(cookie, userId, fbdtsg);

    // register our listeners
    emitter.on('getConvos', getConversationsListener);
    emitter.on('sendMessage', sendMessageListener);
    emitter.on('getMessages', getLastMessageListener);

    messenger.getFriends(function(friends) {
      var entry = {};

      // My linter was complaining that this wasn't dot notation... sorry
      entry.id = userId;
      entry.firstName = "Me";
      entry.name = "Me";
      entry.vanity = "unknown";
      messenger.users[userId] = entry;
    });

    // Print the list for the first times
    emitter.emit('getConvos');

    stdin.addListener("data", handler);
  // });
});
