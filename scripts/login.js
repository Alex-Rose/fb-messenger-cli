const crypt = require('./crypt.js');
const readlineSync = require('readline-sync');
const puppeteer = require('puppeteer');

class Login {
    constructor(username, password) {
        this.user = username;
        this.pass = password;
        this.twoFactor = false;
        this.headless = true;
    }

    execute(callback, options) {
        // Check pupeteer options
        if (options) {
            this.twoFactor = options.twoFactor;
            this.headless = options.headless;
        }

        // Fetch login info from console
        this.user = readlineSync.question('Email: ');
        this.pass = readlineSync.question('Password: ', {hideEchoBack: true});
        console.log("Attempting login...");

        this.getCookie().then(data => {
            this._fetchedCookieCallback(data, callback);
        }).catch(error => {
            callback(error);
        });
    }

    getCookie() {
        let page;
        return puppeteer.launch({headless: this.headless}).then(browser => {
            this.browser = browser;
            return this.browser.pages();
        }).then(promisedPage => {
            page = promisedPage[0];
            return page.goto("https://www.messenger.com/login");
        }).then(response => {
            if (!response.ok) throw new Error(`Could not navigate to messenger login page. Error:${response.status}`);

            return page.evaluate((user, pass) => {
                document.getElementById("email").value = user;
                document.getElementById("pass").value = pass;
            }, this.user, this.pass);
        }).then(() => {
            this.authPromise = new Promise((resolve, reject) => {
                let attempt = 0;
                const interval = setInterval(() => {
                    if (this.cookie && this.fb_dtsg) {
                        resolve({
                            cookie: this.cookie,
                            fb_dtsg: this.fb_dtsg
                        });
                        clearInterval(interval);
                    } else if (attempt++ >= 40) {
                        reject(`Could not login in time`);
                        clearInterval(interval);
                    } else if (this.authError) {
                        reject(this.authError);
                        clearInterval(interval);
                    }
                }, 500);
            });

            const pageLoadCallback = this._onPageLoad.bind(this, this.twoFactor);
            page.on('load', pageLoadCallback);

            const pageRequestCallback = this._onPageRequest.bind(this);
            page.on('request', pageRequestCallback);

            return page.evaluate(() => {
                document.querySelector('#loginbutton').click();
            });
        }).then(() => {
            console.log(`Waiting 20 seconds for login page`);
            return this.authPromise;
        }).then(result => {
            return this.browser.close().then(() => {
                return Promise.resolve(result);
            }).catch(() => {
                return Promise.resolve(result);
            });
        }).catch(err => {
            console.log(`Error while logging in ${err}`);
            return this.browser.close().then(() => {
                return Promise.reject(err);
            }).catch(err => {
                return Promise.reject(err);
            });
        });
    }

    executeAndGetCookie2FA() {
        let page;
        return puppeteer.launch({headless: false}).then(browser => {
            this.browser = browser;
            return this.browser.pages();
        }).then(promisedPage => {
            page = promisedPage[0];
            return page.goto("https://www.messenger.com/login");
        }).then(response => {
            if (!response.ok) throw new Error(`Could not navigate to messenger login page. Error:${response.status}`);

            return page.evaluate((user, pass) => {
                document.getElementById("email").value = user;
                document.getElementById("pass").value = pass;
            }, this.user, this.pass);
        }).then(() => {
            this.authPromise = new Promise((resolve, reject) => {
                let attempt = 0;
                setInterval(() => {
                    if (this.cookie) {
                        resolve(this.cookie);
                    } else if (attempt++ >= 240) {
                        reject(`Could not complete 2FA`);
                    }
                }, 500);
            });

            const pageLoadCallback = this._onPageLoad.bind(this, this.twoFactor);
            page.on('load', pageLoadCallback);

            const pageRequestCallback = this._onPageRequest.bind(this);
            page.on('request', pageRequestCallback);

            return page.evaluate(() => {
                document.querySelector('#loginbutton').click();
            });
        }).then(() => {
            console.log(`You have 120 seconds to complete 2FA`);
            return this.authPromise;
        }).then(result => {
            return this.browser.close().then(() => {
                return Promise.resolve(result);
            }).catch(() => {
                return Promise.resolve(result);
            });
        }).catch(err => {
            console.log(`Error while logging in ${err}`);
            return this.browser.close().then(() => {
                return Promise.reject(err);
            }).catch(err => {
                return Promise.reject(err);
            });
        });
    }

    _getAuthCookie(cookies) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < cookies.length; i++) {
                if (cookies[i].name === 'c_user') {
                    resolve(cookies);
                    return;
                }
            }

            resolve(null);
        });
    }

    _onPageLoad(is2FA) {
        return this.browser.pages().then(pages => {
            const page = pages[0];
            return page.cookies();
        }).then(cookies => {
            return this._getAuthCookie(cookies);
        }).then(cookie => {
            if (cookie) {
                this.cookie = cookie;
                return Promise.resolve(this.cookie);
            } else {
                // Check if failure is because of wrong password
                return page.evaluate(() => {
                    return new Promise((resolve, reject) => {
                        const errorElements = document.getElementsByClassName('_3403 _3404');
                        if (errorElements.length > 0) {
                            reject(new Error(errorElements[0].children[0].innerHTML));
                        } else {
                            reject("Cookie not found. Cause unknown.");
                        }
                    });
                });
            }
        }).catch(err => {
            if (is2FA) {
                console.log(`Waiting for user to complete 2FA flow`);
            } else {
                this.authError = err;
            }
        });
    }

    _onPageRequest(request) {
        const postData = request.postData;

        if (postData) {
            const post = postData.split('&');
            const search = 'fb_dtsg=';
            for (let i = 0; i < post.length; ++i) {
                if (post[i].indexOf(search) === 0) {
                    this.fb_dtsg = decodeURIComponent(post[i].substr(search.length));
                    break;
                }
            }
        }
    }

    _fetchedCookieCallback(data, callback) {
        for (let i = 0; i < data.cookie.length; ++i) {
            if (data.cookie[i].name === 'c_user') {
                data.c_user = data.cookie[i].value;
            }
        }

        let cookie = '';
        for (let i = 0; i < data.cookie.length; ++i) {
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

    }
}

module.exports = new Login();
