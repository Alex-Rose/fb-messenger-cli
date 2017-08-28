const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Crypt {
  constructor() {
    this.algorithm = 'aes-256-ctr';
    this.filename = '.kryptonite';
    this.data = undefined;
    this.password = 'password';
  }

  setPassword(pw) {
    this.password = pw;
  }

  encrypt(text) {
    let cipher = crypto.createCipher(this.algorithm, this.password);
    let crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  decrypt(text) {
    let decipher = crypto.createDecipher(this.algorithm, this.password);
    let dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  save(data) {
    let encrypted = this.encrypt(data);
    let savePath = path.resolve(__dirname, '../', this.filename);
    fs.writeFileSync(savePath, encrypted);
  }

  load(callback) {
    if (!this.data) {
      fs.readFile(path.resolve(__dirname, '../', this.filename), (err, data) => {
        if(err) {
          // Unessecairy console.log, we know the file is missing.
          console.log('Can\'t find the .kryptonite file, we\'ll make a new one');
          callback(err);
        } else {
          this.data = this.decrypt(data.toString());
          callback(undefined, this.data);
        }
      });
    } else {
      callback(undefined, this.data);
    }
  }

  flush() {
    this.data = undefined;
    fs.unlink(path.resolve(__dirname, '../', this.filename));
  }
}

module.exports = new Crypt();
