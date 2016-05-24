var Messenger = require('./messenger.js');
var util = require('./util.js');

var prompt = require('prompt');
var colors = require('colors');

var Search = function(messenger){
  this.messenger = messenger;
  this.friends = [];
  this.filtered = [];
};

Search.prototype.run = function(searchString) {
  var search = this;
  search.parseFriendsList(searchString, function() {
    util.refreshConsole();
    search.printChoices();
  });
};

Search.prototype.selectConvo = function(choice) {
  var search = this;
  for(var i=0; i < search.filtered.length; i++){
    if(search.filtered[i].position == choice.toLowerCase().trim()){
      console.log('Sending message to: ' + search.filtered[i].name);
      result = search.filtered[i].id;
      search.filterFriends = [];
      return result;
    }
  }
  return null;
};

Search.prototype.parseFriendsList = function(searchString, callback) {
  var search = this;
    search.messenger.getFriends(function(friends){
      for(var id in friends){
        search.friends.push(friends[id]);
      }
      search.filterFriends(searchString);
      callback();
    });
};

Search.prototype.filterFriends = function(searchString) {
  var friends = this.friends;
  this.filtered = friends.filter(function(friend) {
      return friend.name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1;
  });
};

Search.prototype.printChoices = function() {
  for(var i=0; i < this.filtered.length; i++){
    this.filtered[i].position = i;
    console.log('[' + i.toString().cyan + '] ' + this.filtered[i].name.green);
  }
};

module.exports = Search;
