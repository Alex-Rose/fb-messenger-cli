const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getDataDirectory } = require('./data_directory');

class Crypt {
    constructor() {
        this.algorithm = 'aes-256-ctr';
        this.filename = '.fbmessenger.enc';
        this.filepath = path.resolve(getDataDirectory(), this.filename);
        this.data = undefined;
        this.password = 'password';
    }

    setPassword(pw) {
        this.password = pw;
    }

    encrypt(text) {
        const cipher = crypto.createCipher(this.algorithm, this.password);
        let crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    decrypt(text, callback) {
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.password);
            let dec = decipher.update(text, 'hex', 'utf8');
            dec += decipher.final('utf8');
            callback(null, dec);
        } catch (err) {
            callback(err);
        }
    }

    save(data) {
        const encrypted = this.encrypt(data);
        fs.writeFileSync(this.filepath, encrypted);
    }

    load(callback) {
        if (!this.data) {
            fs.readFile(this.filepath, (err, data) => {
                if (err) {
                    callback('No saved profile, please login');
                } else {
                    this.decrypt(data.toString(), (err, dec) => {
                        if (err) {
                            callback(err);
                        } else {
                            this.data = dec;
                            callback(null, this.data);
                        }
                    });
                }
            });
        } else {
            callback(null, this.data);
        }
    }

    flush() {
        this.data = undefined;
        fs.unlink(this.filepath, (err) => {
            err('Error while logging out')
        });
    }
}

module.exports = new Crypt();
