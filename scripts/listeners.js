var util = require('./util.js');
var Messenger = require('./messenger.js');

Listeners = function() {};

Listeners.prototype.getMessagesListener = function(nb, searchId, callback) {
  var id = options[nb];
  if(searchId){
    id = searchId;
  }
  callback(id);
};

function printThreadSnippet(thread, idx, isGroup) {
  var line = '[' + idx.toString().cyan + '] ' + thread.name.green + ' : ';
  if (thread.snippet !== '')
    line += thread.snippet + ' ';

  if (!isGroup) { 	
    for(var j = 0; j < thread.attachments.length; j++) {
      var a = thread.attachments[j];
      line += '[ '.red + a.attach_type + ' ]'.red;
    }
  }

  console.log(line);
}

Listeners.prototype.getConversationsListener = function(userId, heading, cb) {

  messenger.getThreads(function(err,threads) {
    util.refreshConsole();
    options = {};
    for (var i = 0; i < threads.length; ++i) {
        var thread = threads[i];
        printThreadSnippet(thread, i);

        options[i] = thread.thread_fbid;

        if (thread.thread_fbid == userId) {
          continue;
        }
        heading[i] = {fbid: thread.thread_fbid, name: thread.name, unread: 0};
    }

    var data = {
      action: 0,
      threadCount: threads.length
    };

    console.log("Select conversation :");
    cb(data);
  });
};

Listeners.prototype.getGroupConversationsListener = function(userId, heading, cb) {
    messenger.getGroupThreads(function(err,threads) {
    util.refreshConsole();
    options = {};
    for (var i = 0; i < threads.length; ++i) {
        var thread = threads[i];
        printThreadSnippet(thread, i, true);

        options[i] = thread.thread_fbid;

        if (thread.thread_fbid == userId) {
          continue;
        }
        heading[i] = {fbid: thread.thread_fbid, name: thread.name, unread: 0};
    }

    console.log("Select conversation :");

    var data = {
      action: 0,
      threadCount: threads.length
    };

    // Change state (action) in the callback
    cb(data);
  });

};

Listeners.prototype.sendMessageListener = function(m, recipientId) {
  if(messenger.users[recipientId] !== undefined) {
    messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, m, function(err) {
      if(err) {
        console.log('Message did not send properly');
      }
    });
  } else {
    // This is a group and not a single user
    messenger.sendGroupMessage(recipientId, m, function(err) {
      if(err) {
        console.log('Message did not send properly');
      }
    });
  }



};

var printed = false;
Listeners.prototype.searchListener = function(searchStr, choice, callback) {
  if(!printed) { // On first loop of search print choices
    search.run(searchStr);
    printed = true;
  } else { // On second loop of search select the right person
    var id = search.selectConvo(choice);
    if(id) {
      // Return the action and the id we found with our search
      callback(1, id);
    } else { // On invalid id or empty search
      callback(-1);
    }
    printed = false;
  }
};

module.exports = Listeners;
