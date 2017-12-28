const puppeteer = require('puppeteer');

class Puppet  {
    constructor(username, password) {
        this.user = username;
        this.pass = password;
        this.browser;
        this.cookie;
        this.authError;
        this.fb_value;
    }

    executeAndGetCookie() {
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
                const interval = setInterval(() => {
                    if (this.cookie && this.fb_value) {
                        resolve({
                            cookie: this.cookie,
                            fb_value: this.fb_value
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

            const pageLoadCallback = this._onPageLoad.bind(this, [false]);
            page.on('load', pageLoadCallback);

            const pageRequestCallback = this._onPageRequest.bind(this);
            page.on('request', pageRequestCallback);
            
            return page.click('#loginbutton');
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

            const pageLoadCallback = this._onPageLoad.bind(this, [true]);
            page.on('load', pageLoadCallback);

            const pageRequestCallback = this._onPageRequest.bind(this);
            page.on('request', pageRequestCallback);

            return page.click('#loginbutton');
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
            let post = postData.split('&');
            let search = 'fb_dtsg=';
            for (let i = 0; i < post.length; ++i) {
                if (post[i].indexOf(search) === 0) {
                    this.fb_value = decodeURIComponent(post[i].substr(search.length));
                    break;
                }
            }
        }
    }
}

module.exports = Puppet;