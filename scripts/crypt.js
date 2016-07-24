var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var unlock = true;
var instance;

Crypt = function(password) {
    instance = this;
    this.algorithm = 'aes-256-ctr';
    this.password = password;
    this.filename = '.kryptonite';
    this.data = undefined;
    if (unlock === true) {
        this.password = 'password';
    }
};

Crypt.getInstance = function (password){
  if (instance === undefined && unlock) {
    new Crypt(password);
  }
  return instance;
};

Crypt.prototype.encrypt = function (text){
  crypt = this;
  var cipher = crypto.createCipher(crypt.algorithm, crypt.password);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
};

Crypt.prototype.decrypt = function (text){
  crypt = this;
  var decipher = crypto.createDecipher(crypt.algorithm, crypt.password);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
};

Crypt.prototype.save = function(data){
  crypt = this;
  encrypted = crypt.encrypt(data);
  var savePath = path.resolve(__dirname, '../', crypt.filename);
  fs.writeFileSync(savePath, encrypted);
};

Crypt.prototype.load = function(cb){
    crypt = this;

    if (crypt.data === undefined) {
      fs.readFile(path.resolve(__dirname, '../', crypt.filename), function(err, data) {
          if(err) {
            // Unessecairy console.log, we know the file is missing.
            console.log('Can\'t find the .kryptonite file, we\'ll make a new one');
            cb(err);
          }
          else {
            decrypted = crypt.decrypt(data.toString());
            crypt.data = decrypted;
            cb(undefined, decrypted);
          }
      });
    } else {
      cb(undefined, crypt.data);
    }
};

Crypt.prototype.flush = function() {
  crypt = this;
  crypt.data = undefined;
  fs.unlink(path.resolve(__dirname, '../', crypt.filename));
};

module.exports = Crypt;
