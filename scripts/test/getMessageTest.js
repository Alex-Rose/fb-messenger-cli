var Messenger = require('./messenger.js');
var Crypt = require('./crypt.js');

    var crypt = new Crypt('wtv');
    crypt.load(function(data) {
        json = JSON.parse(data);
        var cookie = json.cookie;
        var fbdtsg = json.fb_dtsg;
        var userId = json.c_user;
        var recipient = "samuel.bergeron";
        var recipientId = "512556997";

        var messenger = new Messenger(cookie, userId, fbdtsg);
        messenger.getMessages(recipient, recipientId, function(a) {
            console.log(a);
        });
    });
