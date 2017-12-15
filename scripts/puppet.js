const puppeteer = require('puppeteer');

class Puppet {
    constructor(username, password) {
        this.user = username;
        this.pass = password;
    }

    executeAndGetCookie() {
        let page;
        return puppeteer.launch({headless: false}).then(browser => {
            return browser.newPage();
        }).then(promisedPage => {
            page = promisedPage;
            return page.goto("https://www.messenger.com/login");
        }).then(response => {
            if (!response.ok) throw new Error(`Could not navigate to messenger login page. Error:${status}`);

            return page.evaluate((user, pass) => {
                document.getElementById("email").value = user;
                document.getElementById("pass").value = pass;
            }, this.user, this.pass);
        }).then(() => {
            // Futile attempt to remove creds from memory
            this.user = "asdf";
            this.user = null;
            this.password = "asdff";
            this.password = null;
            return page.click('#loginbutton');
        }).then(() => {
            // Login button has been clicked, wait for page to load
            return page.waitForNavigation({
                timeout: 30000,
                waitUntil: 'load'
            });
        }).then(() => {
            // Look for a wrong passord error message
            return page.evaluate(() => {
                return new Promise((resolve, reject) => {
                    let errorElements = document.getElementsByClassName('_3403 _3404');
                    if (errorElements.length > 0) {
                        reject(new Error(errorElements[0].children[0].innerHTML));
                    } else {
                        resolve(true);
                    }
                });
            });
        }).then(() => {
            return page.cookies();
        }).then(cookies => {
            return new Promise((resolve, reject) => {
                for (let i = 0; i < cookies.length; i++) {
                    if (cookies[i].name === 'c_user') {
                        resolve(`${cookies[i].name}=${cookies[i].value}`);
                        return;
                    }
                }

                reject(new Error(`Cookie was not found. Here are the available cookies: \r\n ${JSON.stringify(cookies)}`));
            });
        }).catch(err => {
            console.log(`Error while logging in ${err}`);
            return Promise.reject(err);
        });
    }
}

module.exports = Puppet;