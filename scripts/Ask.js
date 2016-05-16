var prompt = require('prompt');

Ask = function() {

};

Ask.prototype.password = function(cb) {
    var schema = {
        properties: {
            password: {
                hidden: true
            }
        }
    };
    
    prompt.start();
    
    prompt.get(schema, function (err, result) {
        if (err) console.log(err);
        cb(result.password);
    });
};

module.exports = Ask;