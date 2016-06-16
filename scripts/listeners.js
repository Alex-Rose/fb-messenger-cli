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

Listeners.prototype.getConversationsListener = function(userId, heading, cb) {
    messenger.getThreads(function(err,threads) {
    util.refreshConsole();
    options = {};
    for (var i = 0; i < threads.length; ++i) {
        console.log('[' + i.toString().cyan + '] ' + threads[i].name.green + ' : ' + threads[i].snippet);
        options[i] = threads[i].thread_fbid;

        if (threads[i].thread_fbid == userId) {
          continue;
        }
        heading[i] = {fbid: threads[i].thread_fbid, name: threads[i].name, unread: 0};
    }

    process.stdout.write("Select conversation : ");
  });

  // Change state (action) in the callback
  cb(0);
};

Listeners.prototype.sendMessageListener = function(m, recipientId) {
  messenger.sendMessage(messenger.users[recipientId].vanity, recipientId, m, function(err) {
    if(err) {
      console.log('Message did not send properly');
    }
  });
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
