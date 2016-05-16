var Messenger = require('./messenger.js');
var Crypt = require('./crypt.js');
var Ask = require('./ask.js');

// var prompt = new Prompt();

Ask.prototype.password(function (password) {
    var crypt = new Crypt(password);
    crypt.load(function(data) {
        json = JSON.parse(data);
        var cookie = json.cookie;
        var fbdtsg = json.fb_dtsg;
        var userId = json.c_user;
        var recipient = "samuel.bergeron";
        var recipientId = "512556997";

        var messenger = new Messenger(recipient, recipientId, cookie, userId, fbdtsg);
        messenger.sendMessage(process.argv[2]);
    });

});
