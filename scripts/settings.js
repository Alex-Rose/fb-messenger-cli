var fs = require('fs');

var instance;

Settings = function() {
    instance = this;
    this.filename = '.settings';
    this.properties = {};
};

Settings.getInstance = function (){
  if (instance === undefined) {
    instance = new Settings();
  }
  return instance;
};

Settings.prototype.save = function(){
  var settings = this;

  fs.writeFileSync(settings.filename, JSON.stringify(settings.properties));
};

Settings.prototype.load = function(callback){
    var settings = this;

    if (Object.keys(settings.properties).length == 0) {
      fs.readFile(settings.filename, function(err, data) {
          if(err) {
            callback(err, {});
          }
          else {
            try {
              settings.properties = JSON.parse(data.toString());
              callback(undefined, settings.properties) ;  
            } catch (err) {
              callback(err, {});
            }
          }
      });
    } else {
      callback(undefined, settings.properties);
    }
};

Settings.prototype.flush = function() {
  var settings = this;
  fs.unlink(settings.filename);
};

module.exports = Settings;
