var Messenger = require('./messenger.js');

// Fill this out
var cookie = "";
var recipient = "";
var recipientId = "";
var userId = "";

var messenger = new Messenger(recipient, recipientId, cookie, userId);
messenger.sendMessage(process.argv[2]);
