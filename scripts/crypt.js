var crypto = require('crypto');
var fs = require('fs');

Crypt = function(password) {
    this.algorithm = 'aes-256-ctr';
    this.password = password;
    this.filename = '.kryptonite';
    this.unlock = true;
    if (this.unlock === true) {
        this.password = 'password';
    }
};

Crypt.prototype.encrypt = function (text){
    crypt = this;
    var cipher = crypto.createCipher(crypt.algorithm, crypt.password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
};
 
Crypt.prototype.decrypt = function (text){
    crypt = this;
    var decipher = crypto.createDecipher(crypt.algorithm, crypt.password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
};

Crypt.prototype.save = function(data){
    crypt = this;
    encrypted = crypt.encrypt(data);
    
    fs.writeFileSync(crypt.filename, encrypted);
}

Crypt.prototype.load = function(cb){
    crypt = this;
    
    fs.readFile(crypt.filename, function(err, data) {
        if(err) { 
            console.log(err); 
        }
        else { 
            decrypted = crypt.decrypt(data.toString());
            cb(decrypted) 
        };
    });
}

module.exports = Crypt;