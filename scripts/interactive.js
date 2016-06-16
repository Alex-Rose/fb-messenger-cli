var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');
var util = require('./util.js');
var Pull = require('./pull.js');
var Search = require('./search.js');
var Listeners = require('./listeners.js');
var Heading = require('./heading.js');

var colors = require('colors');
var events = require('events');
var stdin = process.openStdin();
var stdout = process.stdout;
var crypt = new Crypt('password');
//var options = {};
var recipientId = '';

// 0 is select conversation, 1 is send message
var action = 0;
var current_userId;

// Initialize our listeners
var emitter = new events.EventEmitter();
var heading = new Heading();
var listeners = new Listeners();

function InteractiveCli(){
  this.pull = new Pull();
  this.pull.on('message', readPullMessage);
  this.pull.execute();
}

// var getInitialThreadMessagesListener = function(nb, searchId) {
//   var id = options[nb];
//   if(searchId){
//     id = searchId;
//   }
//   initializeConversationViewFromFbid(id);
// };

var currentConversationId;
var initializeConversationViewFromFbid = function(id) {
  var user = messenger.users[id];
  currentConversationId = id;

  // Unread messages in heading
  heading.clearUnread();
  // for (var i in heading) {
  //   if (heading[i].fbid == id) {
  //     heading[i].unread = 0;
  //   }
  // }

  messenger.getLastMessage(user.vanity, id, process.stdout.rows - 1, function(err, messages) {
    recipientId = id;
    threadHistory = [];
    util.refreshConsole();
    for (var i in messages) {
      var message = messages[i];
      var authorString = message.author;

      if (authorString.indexOf('fbid:') === 0) authorString = authorString.substr('fbid:'.length);


      var author = messenger.users[authorString];

      var msg = '';
      if (author.id != messenger.userId) {
        msg = author.name.green;
      } else {
        msg = author.name;
      }

      msg += " : " + message.body;
      threadHistory.push(msg);
    }
    printThread();
  });
};

// var getConversationsListener = function() {
//   messenger.getThreads(function(err,threads) {
//     util.refreshConsole();
//     options = {};
//     var headingNb = 1;
//     for (var i = 0; i < threads.length; ++i) {
//         console.log('[' + i.toString().cyan + '] ' + threads[i].name.green + ' : ' + threads[i].snippet);
//         options[i] = threads[i].thread_fbid;
//
//         if (threads[i].thread_fbid == current_userId) {
//           continue;
//         }
//         heading[i] = {fbid: threads[i].thread_fbid, name: threads[i].name, unread: 0};
//         headingNb++;
//     }
//
//     stdout.write("Select conversation : ");
//   });
//   action = 0;
// };

// var sendMessageListener = function(m) {
//   messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, m, function(err) {
//     if(err) {
//       console.log('Message did not send properly');
//     }
//   });
// };

var readPullMessage = function(message) {
  var author = messenger.users[message.author];

  if (author === undefined || message.threadId != recipientId || action === 0) {
    // Don't warn for current user messages (from another device)
    if (author.id != messenger.userId) {
      var headingData = heading.getData();
      console.log('Heading data' + headingData);
      for (var i in headingData) {
        if (headingData[i].fbid == message.threadId) {
          headingData[i].unread++;
          printThread();
        }
      }
    }
    return;
  }

  var msg = '';
  if (author.id != messenger.userId) {
    msg = author.name.green;
  } else {
    msg = author.name;
  }

  msg += " : " + message.body;
  threadHistory.push(msg);
  printThread();
};

// var printed = false;
// var searchListener = function(searchStr, choice) {
//   if(!printed) { // On first loop of search print choices
//     search.run(searchStr);
//     printed = true;
//   } else { // On second loop of search select the right person
//     var id = search.selectConvo(choice);
//     if(id) {
//       emitter.emit('getMessages', null, id);
//       action = 1;
//     } else { // On invalid id or empty search
//       emitter.emit('getConvos');
//     }
//     printed = false;
//   }
// };

var threadHistory = [];
var printThread = function(){
  util.refreshConsole();
  var w = process.stdout.columns - 1;
  var lines = [];

  for (var i = 0; i < threadHistory.length; ++i) {
    var ln = threadHistory[i].match(new RegExp('.{1,' + w + '}', 'g'));
    for (var j in ln) {
      lines.push(ln[j]);
    }
  }

  var x = 0;
  if (lines.length > process.stdout.rows) {
    x = lines.length + 1 + 1 /*header*/ + 3 /*some space*/ - process.stdout.rows;
  }

  // Draw the header
  heading.writeHeader(currentConversationId);

  for (; x < lines.length; ++x) {
    console.log(lines[x]);
  }
};

var convoChoice = null;
// TODO : remove early returns, use some sort of pattern
var handler = function(choice) {
  var value = choice.toString().trim();

  // this works for now
  if(value.toLowerCase() === '/menu' || value.toLowerCase() === '/back'){
    console.log('Bringing you back to the friend selection screen...'.cyan);
    emitter.emit('getConvos', current_userId, heading.getData(), function(a){
      action = a;
    });
    return;
  }

  if(value.indexOf('/s ') === 0 || value.indexOf('/switch ') === 0){
    var nb = value.split(' ')[1];

    if (!isNaN(nb)) {
      nb = parseInt(nb);
      console.log('Switching conversation...'.cyan);
      //var id = heading[nb].fbid;
      var id = heading.getFbid(nb);
      initializeConversationViewFromFbid(id);
    }
    return;
  }

  if(value.toLowerCase() === '/exit'){
    interactive.exit();
  }

  if(value.toLowerCase() === '/logout'){
    interactive.exit(true);
  }

  if (value.indexOf('/help') === 0) {
    console.log('/back or /menu .... Get back to conversation selection'.cyan);
    console.log('/exit ............. Quit the application'.cyan);
    console.log('/logout ........... Exit and flush credentials'.cyan);
    console.log('/s[witch] # ....... Quick switch to conversation number #'.cyan);
    console.log('/help ............. Print this message'.cyan);
    return;
  }

  if(value.toLowerCase().indexOf('/search') != -1){
    // Start a new search
    action = 2;
    // Take value on first space
    var searchStr = value.substr(value.indexOf(' ')+1);
    // If there was no value after
    if(searchStr === '/search') {
      console.log('Try adding a search string after! (/search <query>)'.cyan);
      return;
    }
    emitter.emit('startSearch', searchStr);
    return;
  }

  if (value.indexOf('/') === 0) {
    console.log('Unknown command. Type /help for commands.'.cyan);
    return;
  }

  if(action === 0) {
    convoChoice = value;
    emitter.emit('getMessages', value, null, function(id){
      initializeConversationViewFromFbid(id);
    });
    action = 1;
  } else if(action === 1) {
    emitter.emit('sendMessage', value, recipientId);
  } else if(action == 2){ // search
    emitter.emit('startSearch', null, value, function(a, searchId){
      if(a === 1){
        action = 1;
        emitter.emit('getMessages', null, searchId, function(id){
          initializeConversationViewFromFbid(id);
        });
      } else {
        emitter.emit('getConvos', heading.getData(), function(a) {
          action = a;
        });
      }
    });
  }
};

InteractiveCli.prototype.run = function(){
    crypt.load(function(err, data) {
      json = JSON.parse(data);
      var cookie = json.cookie;
      var fbdtsg = json.fb_dtsg;
      var userId = json.c_user;

      current_userId = userId;

      // Globals
      messenger = new Messenger(cookie, userId, fbdtsg);
      //listeners.setMessenger(messenger);
      search = new Search(messenger);


      // register our listeners
      emitter.on('getConvos', listeners.getConversationsListener);
      emitter.on('sendMessage', listeners.sendMessageListener);
      emitter.on('getMessages', listeners.getMessagesListener);
      emitter.on('startSearch', listeners.searchListener);

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
      emitter.emit('getConvos', current_userId, heading.getData(), function(a){
        action = a;
      });

      stdin.addListener("data", handler);
    // });
  });
};

InteractiveCli.prototype.exit = function(logout){
  if(logout){
    crypt.flush();
    console.log('Logged out!'.cyan);
  }
  console.log('Thanks for using fb-messenger-cli'.cyan);
  console.log('Bye!'.cyan);
  process.exit(0);
};

var interactive = new InteractiveCli();
interactive.run();

module.exports = InteractiveCli;
