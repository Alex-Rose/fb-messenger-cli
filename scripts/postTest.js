var Messenger = require('./messenger.js');
var Crypt = require('./crypt.js');
var prompt = require('prompt');

var schema = {
    properties: {
        password: {
            hidden: true
        }
    }
};

prompt.start();

prompt.get(schema, function (err, result) {
    var crypt = new Crypt(result.password);
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

