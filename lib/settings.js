// Settings is used to store options on the user's environment
// All settings are used in memory and should be persisted to disk
// with save function

const fs = require('fs');
const path = require('path');
const { getDataDirectory } = require('./data_directory');

class Settings {
    constructor () {
        this.filename = '.fbmessengerrc';
        this.filepath = path.resolve(getDataDirectory(), this.filename);
        this.properties = {
            disableColors: false,
            groupColors: true,
            conversationsToLoad: 15,
            preventMessageFlicker: false,
            desktopNotifications: false,
            showTimestamps: false,
            threadLineLimit: -1,
            useCustomNicknames: true,
            timestampLocale: "en-US",
            timestampOptions: {},
            twoFactorAuth: false,
            headlessLogin: true,
            noSandbox: true,
            logonTimeout: 86400000 // 24hrs in ms
        };
    }

    // Save the current properties dictionary on disk
    save() {
        fs.writeFile(this.filepath, JSON.stringify(this.properties, null, '  '), (err) => {
            if (!err) {
                console.log('Settings have been saved');
            } else {
                console.log(`Error saving ${this.filepath} file: ${err}`);
            }
        });
    }

    // Load previously saved properties from disk
    // callback(error, properties), where properties is a dictionary
    read(callback) {
        fs.readFile(this.filepath, (err, data) => {
            if (!err) {
                try {
                    const fileProperties = JSON.parse(data.toString());

                    // Compare with defaults
                    let diff = false;
                    Object.keys(this.properties).forEach((prop) => {
                        if(prop in fileProperties)
                            this.properties[prop] = fileProperties[prop];
                        else diff = true;
                    });

                    if (diff) {
                        this.save();
                    }

                    return callback(null, fileProperties);
                } catch (parseErr) {
                    this.save();
                    return callback('Warning: Settings are invalid, saving default values');
                }
            } else {
                this.save();
                return callback('Warning: Settings not found, saving default values');
            }
        });
    }

    // Delete properties from disk and wipe dictionary in memory
    flush() {
        fs.unlink(this.filepath);
        this.properties = {};
    }

    getLogonTimeout() {
        if (!this.properties.logonTimeout) {
            this.properties.logonTimeout = 43200000; // 12hrs in ms
            this.save();
        }

        return this.properties.logonTimeout;
    }

}

module.exports = new Settings();
