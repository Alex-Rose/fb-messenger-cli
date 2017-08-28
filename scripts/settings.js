// Settings is used to store options on the user's environment
// All settings are used in memory and should be persisted to disk
// with save function

const fs = require('fs');
const path = require('path');

class Settings {
  constructor () {
    this.filename = '.settings';
    this.path = path.resolve(__dirname, '../', this.filename);
    this.properties = {
      disableColors: false,
      conversationsToLoad: 15,
      preventMessageFlicker: false,
      desktopNotifications: false,
      showTimestamps: false,
      useCustomNicknames: true,
      timestampLocale: "en-US",
      timestampOptions: {},
      logonTimeout: 43200000 // 12hrs in ms
    };
  }

  // Save the current properties dictionary on disk
  save() {
    fs.writeFile(this.path, JSON.stringify(this.properties, null, '  '), (err) => {
      if (!err) {
        console.log('Settings have been saved');
      } else {
        console.log('Error saving .settings file');
      }
    });
  }

  // Load previously saved properties from disk
  // callback(error, properties), where properties is a dictionary
  load(callback) {
    fs.readFile(path.resolve(__dirname, '../', this.filename), (err, data) => {
      if (!err) {
        try {
          this.properties = JSON.parse(data.toString());
        } catch (parseErr) {
          return callback(parseErr)
        }
      } else {
        console.log('Warning : settings not found, lets try to create default'.yellow);
        this.save();
      }
      callback();
    });
  }

  // Delete properties from disk and wipe dictionary in memory
  flush() {
    fs.unlink(this.filename);
    this.properties = {};
  };

  getLogonTimeout() {
    if (!this.properties.logonTimeout) {
      this.properties.logonTimeout = 43200000; // 12hrs in ms
      this.save();
    }

    return this.properties.logonTimeout;
  };

}

module.exports = new Settings();
