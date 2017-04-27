const Crypt = require('./crypt.js');
const Messenger = require('./messenger.js');
const util = require('./util.js');
const Pull = require('./pull.js');
const Search = require('./search.js');
const Listeners = require('./listeners.js');
const Heading = require('./heading.js');
const Settings = require('./settings.js');
const open = require('open');

const colors = require('colors');
const events = require('events');
const crypt = new Crypt('password');
const path = require('path');
const notifier = require('node-notifier');
const readline = require('readline');

const stdin = process.openStdin();
const stdout = process.stdout;

// 0 is select conversation, 1 is send message
var action = 0;
var currentThreadCount = 0;
var recipientId = '';
var current_userId;
var group = false;

// Initialize our listeners
var emitter = new events.EventEmitter();
var heading = new Heading();
var listeners = new Listeners();

var atts = 0;
var attsNo = [];

const rlInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

function InteractiveCli(){
  this.pull = new Pull();
  this.pull.on('message', this.readPullMessage);
  this.pull.execute();

  this.threadHistory = [];
  this.currentConversationId = undefined;
}

function renderMessage(userId, author, message) {
  var msg;

  if (author.id != messenger.userId) {
    msg = author.name.green;
  } else {
    msg = author.name;
  }

  msg += " : ";

  if (message.body !== "")
    msg += message.body + " ";

  if (message.attachments) {
    for (var i = 0; i < message.attachments.length; i++) {
      var a = message.attachments[i];
      var attType;
      if (a.attach_type == 'sticker' || a.attach_type == 'video') {
        atts[attsNo] = a.url;
        attType = a.attach_type;
      }
      else if (a.attach_type == 'share') {
        atts[attsNo] = a.share.uri;
        attType = a.attach_type;
      }
      else if (a.attach_type == 'photo') {
        atts[attsNo] = a.large_preview_url;
        attType = a.attach_type;
      }
      else if (a.attach_type == 'animated_image') {
        atts[attsNo] = a.preview_url;
        attType = 'gif'
      }
      else if (a.attach_type == 'file') {
        atts[attsNo] = a.url;
        if (a.name.startsWith("audioclip")) {
          attType = 'audio clip'
        } else {
          attType = 'file'
        }
      }
      x = '' + attsNo
      msg += '[ '.red + attType + " " + x.cyan + ' ]'.red;
      attsNo++;
    }
  }

  return msg;
}

InteractiveCli.prototype.initializeConversationViewFromFbid = function(id) {
  var user = messenger.users[id];
  this.currentConversationId = id;

  // Unread messages in heading
  heading.clearUnread(id);

  var recipientUrl;
  if (group) { recipientUrl = id; } else { recipientUrl = user.vanity; }

  messenger.getLastMessage(recipientUrl, id, process.stdout.rows - 1, function(err, messages) {
    recipientId = id;
    interactive.threadHistory = [];
    util.overwriteConsole();
    attsNo = 0;
    atts = [];
    for (var i in messages) {
      var message = messages[i];
      var authorString = message.author;

      if (authorString.indexOf('fbid:') === 0)
        authorString = authorString.substr('fbid:'.length);

      var author = messenger.users[authorString];
      var msg = renderMessage(messenger.userId, author, message);

      interactive.threadHistory.push(msg);
    }
    interactive.printThread();
    //group = false;
  });
};

InteractiveCli.prototype.readPullMessage = function(message) {
  var author = messenger.users[message.author];

  if (Settings.getInstance().properties['desktopNotifications']) {
    try {
      if (author !== undefined && author.id != messenger.userId && message.threadId != recipientId) {
        notifier.notify({
          title: author.name,
          message: message.body,
          icon: path.join(__dirname, '../resources/logo.png')
        });
      }
    } catch (err) {
      // Don't break over notifications
    }
  }

  if (author === undefined || message.otherUserId != recipientId || action === 0) {
    // Extra check for groups
    if (message.threadId != recipientId) {
      // Don't warn for current user messages (from another device)
      if (author.id != messenger.userId) {
        var headingData = heading.getData();
        for (var i in headingData) {
          // Doesn't work when it's a group
          if (headingData[i].fbid == message.otherUserId || headingData[i].fbid == message.threadId) {
            headingData[i].unread++;
          }
        }
        // Moved this out of the for, in case we get a message from someone
        // not in the heading, we still need to refresh
        // ...but don't refresh if in the menu
        if (recipientId != '') {
          interactive.printThread();
        }
      }
      return;
    }
  }

  var msg = renderMessage(messenger.userId, author, message);

  interactive.threadHistory.push(msg);
  interactive.printThread();
};

InteractiveCli.prototype.printThread = function(){
  util.overwriteConsole();
  var w = process.stdout.columns - 1;
  var lines = [];

  for (var i = 0; i < interactive.threadHistory.length; ++i) {
    var ln = interactive.threadHistory[i].match(new RegExp('.{1,' + w + '}', 'g'));
    for (var j in ln) {
      lines.push(ln[j]);
    }
  }

  var x = Math.max(0, lines.length - process.stdout.rows + 4);

  // Draw the header
  heading.writeHeader(this.currentConversationId);

  // just show most recent visible lines
  var linesToWrite = lines.slice(x);

  if (Settings.getInstance().properties['preventMessageFlicker']) {
    // erase content on the line from before
    linesToWrite = linesToWrite.map(ln => "\x1b[K" + ln)
  }

  console.log(linesToWrite.join('\n'));
  rlInterface.prompt(true);
};

InteractiveCli.prototype.handleCommands = function(command) {
  command = command.toLowerCase().trim();
  let options = command.split(' ');

  switch (options[0]) {
    case '/menu':
      group = false;
    // Fallthrough
    case '/back':
      let listener;
      if (group) {
        console.log('Back to group conversations...'.cyan);
        listener = 'getGroupConvos';
      } else {
        console.log('Bringing you back to the friend selection screen...'.cyan);
        listener = 'getConvos';
      }
      emitter.emit(listener, current_userId, heading.getData(), function(data){
        action = data.action;
        currentThreadCount = data.threadCount;
        rlInterface.prompt(true);
        recipientId = '';
      });
      break;

    case '/group':
    case '/groups':
      console.log('Showing you group conversations...'.cyan);
      emitter.emit('getGroupConvos', current_userId, heading.getData(), function(data) {
        action = data.action;
        currentThreadCount = data.threadCount;
        group = true;
        rlInterface.prompt(true);
        recipientId = '';
      });
      break;

    case '/s':
    case '/switch':
      let convo = options[1];

      if (!isNaN(convo)) {
        convo = parseInt(convo);
        let id = heading.getFbid(convo);
        if (id !== -1) {
          console.log('Switching conversation...'.cyan);
          interactive.initializeConversationViewFromFbid(id);
          return;
        }
      }
      console.log('Invalid switch, please try again'.cyan);
      break;

    case '/view':
      let att = options[1];

      if (!isNaN(att)) {
        att = parseInt(att);
        if (att >= 0 && att < attsNo) {
          let url = atts[att];
          console.log('Attachment now open in browser');
          open(url);
          return;
        }
      }
      console.log('Invalid attachment number, please try again'.cyan);
      break;

    case '/logout':
      interactive.exit(true);
      break;

    case '/q':
    case '/quit':
    case '/exit':
      interactive.exit();
      break;

    case '/help':
      console.log('/back or /menu .... Get back to conversation selection'.cyan);
      console.log('/exit or /quit .... Quit the application'.cyan);
      console.log('/logout ........... Exit and flush credentials'.cyan);
      console.log('/groups ........... Bring up your goup conversations'.cyan);
      console.log('/s[witch] # ....... Quick switch to conversation number #'.cyan);
      console.log('/search [query] ... Search your friends to chat'.cyan);
      console.log('/view # ........... View the attachment by the number given after the type'.cyan);
      console.log('/help ............. Print this message'.cyan);
      break;

    case '/search':
      // Start a new search
      action = 2;
      // Start the search with the entire string
      emitter.emit('startSearch', command);
      break;

    default:
      console.log('Unknown command. Type /help for commands.'.cyan);
  }
};

InteractiveCli.prototype.handler = function(value) {
  let text = value.toString();
  value = value.toLowerCase().trim();

  if (value.indexOf('/') === 0) {
    interactive.handleCommands(text);
  } else {
    if (action === 0) {
      let selection = parseInt(value);
      if (!isNaN(selection)) {
        if (selection >= 0 && selection < currentThreadCount) {
          emitter.emit('getMessages', selection, null, function (id) {
            interactive.initializeConversationViewFromFbid(id);
          });
          action = 1;
        } else {
          console.log('Warning: Input is out of bounds'.yellow);
        }
      } else {
        console.log('Warning: Input is not a valid number'.yellow);
      }
    } else if (action === 1) {
      emitter.emit('sendMessage', text, recipientId);
    } else if (action == 2) { // search
      emitter.emit('startSearch', value, function (a, searchId) {
        if (a === 1) {
          action = 1;
          emitter.emit('getMessages', null, searchId, function (id) {
            interactive.initializeConversationViewFromFbid(id);
          });
        } else {
          emitter.emit('getConvos', current_userId, heading.getData(), function (data) {
            action = data.action;
            currentThreadCount = data.threadCount;
            rlInterface.prompt(true);
          });
        }
      });
    }
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
      emitter.emit('getConvos', current_userId, heading.getData(), function(data){
        action = data.action;
        currentThreadCount = data.threadCount;
        rlInterface.prompt(true);
      });

      rlInterface.on("line", interactive.handler);
      rlInterface.on("close", interactive.exit);
      rlInterface.prompt(true);
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
