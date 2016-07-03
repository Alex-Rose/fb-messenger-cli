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

// 0 is select conversation, 1 is send message
var action = 0;
var recipientId = '';
var current_userId;
var group = false;

// Initialize our listeners
var emitter = new events.EventEmitter();
var heading = new Heading();
var listeners = new Listeners();

function InteractiveCli(){
  this.pull = new Pull();
  this.pull.on('message', this.readPullMessage);
  this.pull.execute();

  this.threadHistory = [];
  this.currentConversationId = undefined;
}

InteractiveCli.prototype.initializeConversationViewFromFbid = function(id) {
  var user = messenger.users[id];
  this.currentConversationId = id;

  // Unread messages in heading
  heading.clearUnread();

  var recipientUrl;
  if (group) { recipientUrl = id; } else { recipientUrl = user.vanity; }

  messenger.getLastMessage(recipientUrl, id, process.stdout.rows - 1, function(err, messages) {
    recipientId = id;
    interactive.threadHistory = [];
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
      interactive.threadHistory.push(msg);
    }
    interactive.printThread();
    group = false;
  });
};

InteractiveCli.prototype.readPullMessage = function(message) {
  var author = messenger.users[message.author];

  if (author === undefined || message.threadId != recipientId || action === 0) {
    // Don't warn for current user messages (from another device)
    if (author.id != messenger.userId) {
      var headingData = heading.getData();
      console.log('Heading data' + headingData);
      for (var i in headingData) {
        if (headingData[i].fbid == message.threadId) {
          headingData[i].unread++;
          interactive.printThread();
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
  interactive.threadHistory.push(msg);
  interactive.printThread();
};

InteractiveCli.prototype.printThread = function(){
  util.refreshConsole();
  var w = process.stdout.columns - 1;
  var lines = [];

  for (var i = 0; i < interactive.threadHistory.length; ++i) {
    var ln = interactive.threadHistory[i].match(new RegExp('.{1,' + w + '}', 'g'));
    for (var j in ln) {
      lines.push(ln[j]);
    }
  }

  var x = 0;
  if (lines.length > process.stdout.rows) {
    x = lines.length + 1 + 1 /*header*/ + 3 /*some space*/ - process.stdout.rows;
  }

  // Draw the header
  heading.writeHeader(this.currentConversationId);

  for (; x < lines.length; ++x) {
    console.log(lines[x]);
  }
};

// TODO : remove early returns, use some sort of pattern
InteractiveCli.prototype.handler = function(choice) {
  var value = choice.toString().trim();
  var convoChoice = null;

  // this works for now
  if(value.toLowerCase() === '/menu' || value.toLowerCase() === '/back'){
    console.log('Bringing you back to the friend selection screen...'.cyan);
    emitter.emit('getConvos', current_userId, heading.getData(), function(a){
      action = a;
    });
    return;
  }

  if(value.indexOf('/group') === 0) {
    console.log('Showing you group conversations...'.cyan);
    emitter.emit('getGroupConvos', current_userId, heading.getData(), function(a) {
      action = a;
      group = true;
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
      interactive.initializeConversationViewFromFbid(id);
    }
    return;
  }

  if(value.toLowerCase() === '/exit' || value.toLowerCase() === '/q'){
    interactive.exit();
  }

  if(value.toLowerCase() === '/logout'){
    interactive.exit(true);
  }

  if (value.indexOf('/help') === 0) {
    console.log('/back or /menu .... Get back to conversation selection'.cyan);
    console.log('/exit ............. Quit the application'.cyan);
    console.log('/logout ........... Exit and flush credentials'.cyan);
    console.log('/groups ........... Bring up your goup conversations'.cyan);
    console.log('/s[witch] # ....... Quick switch to conversation number #'.cyan);
    console.log('/search [query] ... Search your friends to chat'.cyan);
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
      interactive.initializeConversationViewFromFbid(id);
    });
    action = 1;
  } else if(action === 1) {
    emitter.emit('sendMessage', value, recipientId);
  } else if(action == 2){ // search
    emitter.emit('startSearch', null, value, function(a, searchId){
      if(a === 1){
        action = 1;
        emitter.emit('getMessages', null, searchId, function(id){
          interactive.initializeConversationViewFromFbid(id);
        });
      } else {
        emitter.emit('getConvos', current_userId, heading.getData(), function(a) {
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
      search = new Search(messenger);

      // register our listeners
      emitter.on('getConvos', listeners.getConversationsListener);
      emitter.on('getGroupConvos', listeners.getGroupConversationsListener);
      emitter.on('sendMessage', listeners.sendMessageListener);
      emitter.on('getMessages', listeners.getMessagesListener);
      emitter.on('startSearch', listeners.searchListener);

      messenger.getFriends(function(friends) {
        var entry = {};

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

      stdin.addListener("data", interactive.handler);
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
