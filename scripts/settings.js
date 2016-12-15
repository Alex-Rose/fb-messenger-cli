// Settings is used to store options on the user's environment
// All settings are used in memory and should be persisted to disk
// with save function

var fs = require('fs');
var path = require('path');

var instance;

Settings = function () {
    instance = this;
    this.filename = '.settings';
    this.properties = {
        disableColors: false
    };
};

// Get singleton instance
Settings.getInstance = function () {
    if (instance === undefined) {
        instance = new Settings();
    }
    return instance;
};

// Save the current properties dictionary on disk
// This method is synchronous
Settings.prototype.save = function () {
    var settings = this;
    var savePath = path.resolve(__dirname, '../', settings.filename);
    fs.writeFileSync(savePath, JSON.stringify(settings.properties));
};

// Load previously saved properties from disk
// callback(error, properties), where properties is a dictionary
Settings.prototype.load = function (callback) {
    var settings = this;

    fs.readFile(path.resolve(__dirname, '../', settings.filename), function (err, data) {
        if (!err) {
            try {
                settings.properties = JSON.parse(data.toString());
            } catch (except) {
                err = except;
            }
        } else {
            console.log('Warning : settings not found, lets try to create default'.yellow);
            try {
                settings.save();
                err = undefined;
            } catch (Exception) {
                err = Exception;
            }
        }
        callback(err, settings.properties);
    });
};

// Delete properties from disk and wipe dictionary in memory
Settings.prototype.flush = function () {
    var settings = this;
    fs.unlink(settings.filename);
    settings.properties = {};
};

module.exports = Settings;
