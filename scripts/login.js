const crypt = require('./crypt.js');
const Puppet = require('./puppet.js');
const readlineSync = require('readline-sync');

Login = function() { };

Login.prototype.execute = function(callback) {
    const login = this;
    const result = {};

    result.email = readlineSync.question('Email: ');
    result.password = readlineSync.question('Password: ', {hideEchoBack: true});

    console.log("Attempting login...");

    
    const puppet = new Puppet(result.email, result.password);
    puppet.executeAndGetCookie().then( data => {
        
        for (let i = 0; i < data.cookie.length; ++i) {
            if (data.cookie[i].name === 'c_user') {
                data.c_user = data.cookie[i].value;
            }
        }

        let cookie = '';
        for (let i = 0; i < data.cookie.length; ++i){
            if (i > 0) {
                cookie += '; ';
            }

            cookie += `${data.cookie[i].name}=${data.cookie[i].value}`;

            if (data.cookie[i].name === 'c_user') {
                data.c_user = data.cookie[i].value;
            }
        }

        // Replace cookie object with cookie string for HTTP header
        data.cookie = cookie;
        
        // Add save time to data
        data.saveTime = new Date().getTime();
        
        // Save user data to file for next login
        crypt.save(JSON.stringify(data));
        console.log(`Saving to crypt ${JSON.stringify(data)}`);
        

        callback();
    }).catch(error => {
        callback(error);
    });
};

module.exports = Login;
