var util = require('./util.js');

Listeners = function() {};

Listeners.prototype.setMessenger = function(messenger) {
  this.messenger = messenger;
}
Listeners.prototype.getMessagesListener = function(nb, searchId, callback) {
  var id = this.options[nb];
  if(searchId) {
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

Listeners.prototype.conversationsListener = function(userId, heading, callback, isGroup = false) {
  this.messenger.getThreads((err, threads) => {
    if (err) {
      console.error('Found error while fetching conversations.', err);
      return;
    }

    util.refreshConsole();
    this.options = {};

    threads.sort((a, b) => b.timestamp - a.timestamp);
    for (let i = 0; i < threads.length; ++i) {
      const thread = threads[i];
      printThreadSnippet(thread, i, isGroup);
      this.options[i] = thread.thread_fbid;
      if (thread.thread_fbid !== userId) {
        heading[i] = { fbid: thread.thread_fbid, name: thread.name, unread: 0};
      }
    }

    console.log("Select conversation :");
    callback({ action: 0, threadCount: threads.length });
  });
}

Listeners.prototype.getConversationsListener = function(userId, heading, cb) {
  this.conversationsListener(userId, heading, cb);
};

Listeners.prototype.getGroupConversationsListener = function(userId, heading, cb) {
  this.conversationsListener(userId, heading, cb, true);
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

Listeners.prototype.searchListener = function(searchStr, callback) {
  var parts =  searchStr.split(' ');

  // If there was no value after
  if (parts.length === 1 && parts[0].toLowerCase() === '/search') {
    console.log('Try adding a search string after! (/search <query>)'.cyan);
  } else if (parts.length > 1 && parts[0].toLowerCase() === '/search') {
    parts.shift();
    search.run(parts.join(' '));
  } else {
    // On conversation selection
    var id = search.selectConvo(searchStr);
    if (id) {
      // Return the action and the id we found with our search
      callback(1, id);
    } else { // On invalid id or empty search
      callback(-1);
    }
  }
};

module.exports = Listeners;
