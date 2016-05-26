// Settings is used to store options on the user's environment
// All settings are used in memory and should be persisted to disk
// with save function

var fs = require('fs');

var instance;

Settings = function() {
    instance = this;
    this.filename = '.settings';
    this.properties = {};
};

// Get singleton instance
Settings.getInstance = function (){
  if (instance === undefined) {
    instance = new Settings();
  }
  return instance;
};

// Save the current properties dictionary on disk
// This method is synchronous
Settings.prototype.save = function(){
  var settings = this;

  fs.writeFileSync(settings.filename, JSON.stringify(settings.properties));
};

// Load previously saved properties from disk
// callback(error, properties), where properties is a dictionary
Settings.prototype.load = function(callback){
    var settings = this;
    
    if (Object.keys(settings.properties).length === 0) {
      fs.readFile(settings.filename, function(err, data) {
          if(!err) {
            try {
              settings.properties = JSON.parse(data.toString());  
            } catch (except) {
              err = except;
            }
          }
          callback(err, settings.properties);
      });
    } else {
      callback(undefined, settings.properties);
    }
};

// Delete properties from disk and wipe dictionary in memory
Settings.prototype.flush = function() {
  var settings = this;
  fs.unlink(settings.filename);
  settings.properties = {};
};

module.exports = Settings;
