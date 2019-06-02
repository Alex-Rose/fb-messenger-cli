const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Crypt {
    constructor() {
        this.algorithm = 'aes-256-ctr';
        this.filename = '.kryptonite';
        this.data = undefined;
        this.password = 'password';
        this.confDir = process.env.XDG_CONFIG_HOME || path.resolve(process.env.HOME, '.config')
        this.confDir = path.resolve(this.confDir, 'fb-messenger-cli')
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
        const savePath = path.resolve(this.confDir, this.filename);
        if (!fs.existsSync(this.confDir)){
            fs.mkdirSync(this.confDir);
        }
        fs.writeFileSync(savePath, encrypted);
    }

    load(callback) {
        if (!this.data) {
            fs.readFile(path.resolve(this.confDir, this.filename), (err, data) => {
                if(err) {
                    callback('No saved profile, please login');
                } else {
                    this.decrypt(data.toString(), (err, dec) => {
                        if (err)
                            callback(err);
                        else {
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
        fs.unlink(path.resolve(this.confDir, this.filename), (err) => {
            err('Error while logging out')
        });
    }
}

module.exports = new Crypt();
