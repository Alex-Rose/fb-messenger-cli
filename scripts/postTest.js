var Messenger = require('./messenger.js');

var cookie = "datr=Agw1V9d_8BmmeorcPYRBXvso; lu=gAJUWY8szjNLQb_UyPnycqbg; c_user=512556997; xs=58%3AlCwZPdZBVmLGug%3A2%3A1463094278%3A3609; csm=2; s=Aa6USszVzI7qEWRq; sb=Bgw1VzrCC4G25vt28rlg5eHw; p=-2; act=1463161642186%2F11; presence=EDvF3EtimeF1463162784EuserFA2512556997A2EstateFDutF1463162784238CEchFDp_5f512556997F317CC; wd=913x643";
var recipient = "ar.alexandre.rose";
var recipientId = "731419306";
var userId = "512556997";
var dtsg = "AQGXavCd-7ML:AQFlZ64DIVja";

var messenger = new Messenger(recipient, recipientId, cookie, userId, dtsg);
messenger.sendMessage(process.argv[2], function(res){
  console.log(res);
});
