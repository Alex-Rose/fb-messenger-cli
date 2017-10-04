const { refreshConsole } = require('./util.js');
const colors = require('colors');

var Search = function(messenger){
  this.messenger = messenger;
  this.friends = [];
  this.filtered = [];
};

Search.prototype.run = function(searchString) {
  this.parseFriendsList(searchString, (err) => {
    refreshConsole();
    if (err)
      console.log(`Error occured while fetching friends list: ${err}`);	  
    this.printChoices();
  });
};

Search.prototype.selectConvo = function(choice) {
  for (var i=0; i < this.filtered.length; i++) {
    if (this.filtered[i].position == choice.toLowerCase().trim()){
      console.log('Sending message to: ' + this.filtered[i].name);
      return this.filtered[i].id;
    }
  }
  console.log('No conversation has that number'.cyan);
  console.log('Bringing you back to friend selection screen...'.cyan);
  return null;
};

Search.prototype.parseFriendsList = function(searchString, callback) {
  this.messenger.getFriends((err, friends) => {
    if (this.friends.length <= 0) {
      for (var id in friends){
        this.friends.push(friends[id]);
      }
    }
    this.filterFriends(searchString);
    return callback(err);
  });
};

Search.prototype.filterFriends = function(searchString) {
  this.filtered = this.friends.filter((friend) => {
    return friend.name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1;
  });
};

Search.prototype.printChoices = function() {
  if (this.filtered.length === 0) {
    console.log('Looks like we didn\'t find anything!'.cyan);
    console.log('Bringing you back to the friend selection screen...'.cyan);
    console.log('Press Enter to continue'.cyan);
  } else {
    for (var i=0; i < this.filtered.length; i++){
      this.filtered[i].position = i;
      console.log('[' + i.toString().cyan + '] ' + this.filtered[i].name.green);
    }
  }
};

module.exports = Search;
