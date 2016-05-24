var Crypt = require('./crypt.js');
var Messenger = require('./messenger.js');
var util = require('./util.js');
var Pull = require('./pull.js');
var Search = require('./search.js');

var colors = require('colors');
var events = require('events');
var stdin = process.openStdin();
var stdout = process.stdout;
var emitter = new events.EventEmitter();
var crypt = new Crypt('password');
var options = {};
var recipientId = '';
var heading = {};
// 0 is select conversation, 1 is send message
var action = 0;

function InteractiveCli(){
  this.pull = new Pull();
  this.pull.on('message', receiveMessageListener);
  this.pull.execute();
}

var getInitialThreadMessagesListener = function(nb, searchId) {
  var id = options[nb];
  if(searchId){
    id = searchId;
  }
  var user = messenger.users[id];

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

var getConversationsListener = function() {
  messenger.getThreads(function(err,threads) {
    util.refreshConsole();
    options = {};
    for (i = 0; i < threads.length; ++i) {
        console.log('[' + i.toString().cyan + '] ' + threads[i].name.green + ' : ' + threads[i].snippet);
        options[i] = threads[i].thread_fbid;
        heading[i] = {fbid: threads[i].thread_fbid, name: threads[i].name};
    }

    stdout.write("Select conversation : ");
  });
  action = 0;
};

var sendMessageListener = function(m) {
  messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, m, function(err) {
    if(err) {
      console.log('Message did not send properly');
    }
  });
};

var receiveMessageListener = function(message) {
  var author = messenger.users[message.author];

  if (author === undefined || message.threadId != recipientId || action === 0) return;

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

var printed = false;
var searchListener = function(searchStr, choice) {
  if(!printed) {
    search.run(searchStr);
    printed = true;
  } else {
    var id = search.selectConvo(choice);
    emitter.emit('getMessages', null, id);
    printed = false;
    action = 1;
  }
};

var threadHistory = [];
var printThread = function(){
  util.refreshConsole();
  // var x = 0;
  // if (threadHistory.length > process.stdout.rows) {
    // x = threadHistory.length + 1 - process.stdout.rows;
  // }
  // var x = Math.min(0, process.stdout.rows - 1 - threadHistory.length);

  // for(; x < threadHistory.length; x++){
    // console.log(threadHistory[x]);
  // }

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

  // Write header
  var head = '';
  for (var i = 0; i < 3; ++i) {
    if (i != 0) {
      head += ' - ';
    }
    head += '[' + i + '] ' + heading[i].name;
  }

  for (var i = head.length; i < w; ++i) {
    head += ' ';
  }

  console.log(head.bgBlue);

  for (; x < lines.length; ++x) {
    console.log(lines[x]);
  }
};

var convoChoice = null;
var handler = function(choice) {
  var value = choice.toString().trim();

  // this works for now
  if(value.toLowerCase() === '/menu' || value.toLowerCase() === '/back'){
    console.log('Bringing you back to the friend selection screen...'.cyan);
    emitter.emit('getConvos');
    return;
  }

  if(value.toLowerCase() === '/exit'){
    exit();
  }

  if(value.toLowerCase() === '/logout'){
    exit(true);
  }

  if(value.toLowerCase().indexOf('/search') != -1){
    // Start a new search
    action = 2;
    // Take value on first space
    var searchStr = value.substr(value.indexOf(' ')+1);
    if(searchStr !== '/search') { // If there was no value after
      emitter.emit('startSearch', searchStr);
    }
    return;
  }

  if(action === 0) {
    convoChoice = value;
    emitter.emit('getMessages', value);
    action = 1;
  } else if(action === 1) {
    emitter.emit('sendMessage', value);
  } else if(action == 2){ // search
    emitter.emit('startSearch', null, value);
  }
};

var exit = function(logout){
  if(logout){
    crypt.flush();
    console.log('Logged out!'.cyan);
  }
  console.log('Thanks for using fb-messenger-cli'.cyan);
  console.log('Bye!'.cyan);
  process.exit(0);
};

InteractiveCli.prototype.run = function(){
    crypt.load(function(err, data) {
      json = JSON.parse(data);
      var cookie = json.cookie;
      var fbdtsg = json.fb_dtsg;
      var userId = json.c_user;

      // Globals
      messenger = new Messenger(cookie, userId, fbdtsg);
      search = new Search(messenger);


      // register our listeners
      emitter.on('getConvos', getConversationsListener);
      emitter.on('sendMessage', sendMessageListener);
      emitter.on('getMessages', getInitialThreadMessagesListener);
      emitter.on('startSearch', searchListener);

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
};

var interactive = new InteractiveCli();
interactive.run();

module.exports = InteractiveCli;
