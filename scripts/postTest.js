var Messenger = require('./messenger.js');

var cookie = "datr=9O04V7WwRgh_kfKy3cfsAuMv; sb=bPk4V_BRJu82XWN_8MRfpn4K; c_user=731419306; xs=103%3APCvNW1wqGaFi4w%3A2%3A1463351660%3A11863; csm=2; s=Aa4IsthLMxuNktjn.BXOPlt; lu=RhqXEa0bDQzxBJdt_dhrLrVw; p=-2; presence=EDvF3EtimeF1463352390EuserFA2731419306A2EstateFDutF1463352390707CEchFDp_5f731419306F45CC; wd=400x300";
var recipient = "samuel.bergeron";
var recipientId = "512556997";
var userId = "731419306";

var messenger = new Messenger(recipient, recipientId, cookie, userId);
messenger.sendMessage(process.argv[2]);
