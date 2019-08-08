/* jshint expr: true */

const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const Crypt = require('../crypt.js');
const Messenger = require('../messenger.js');
const Settings = require('../settings.js');
const path = require('path');
const oldCryptFilename = Crypt.filename;
const oldCryptFilepath = Crypt.filepath;

describe('Crypt', () => {
    before(() => {
        const filename = 'test.fbmessenger.enc';
        Crypt.filename = filename;
        Crypt.filepath = path.resolve('.', filename);
    });

    afterEach(() => {
        Crypt.data = undefined;
    });

    after(() => {
        Crypt.filename = oldCryptFilename;
        Crypt.filepath = oldCryptFilepath;
    });

    it('encrypt() and decrypt() should return original data', () => {
        const data = "{some: 'things', are: 'not equal'}";
        const encrypted = Crypt.encrypt(data);
        Crypt.decrypt(encrypted, (_err, decrypted) => {
            expect(decrypted).to.equal(data);
        });
    });

    it('save() and load()', (done) => {
        const data = JSON.stringify({theTest: 'data', is: 5012344});

        Crypt.save(data);

        Crypt.load((err, result) => {
            expect(result).to.equal(data);
            done();
        });

    });
});

describe('Messenger', () => {
    let json;
    let messenger;

    afterEach(() => {
        Crypt.data = undefined;
    });

    it('Load cookie', (done) => {
        // Reset crypt
        Crypt.load((err, result) => {
            expect(() => {JSON.parse(result);}).not.throw(Error);
            json = JSON.parse(result);
            expect(json.cookie).to.not.equal.undefined;
            expect(json.fb_dtsg).to.not.equal.undefined;
            expect(json.c_user).to.not.equal.undefined;
            done();
        });
    });

    describe('when data is loaded from the cookie', () => {
        beforeEach(() => {
            Crypt.load((err, data) => {
                json = JSON.parse(data);
            });
        });

        it('Create Messenger', () => {
            messenger = new Messenger(json.cookie, json.c_user, json.fb_dtsg);
        });

        it('getFriends', function(done) {
            // Set a higher timeout for network calls
            this.timeout(5000);
            messenger.getFriends((_err, friends) => {
                const friendIds = Object.keys(friends);
                expect(friendIds.length).to.be.above(1);
                done();
            });
        });

        it('Get threads', function (done) {
            // Allow more time for network calls
            this.timeout(5000);

            messenger.getThreads((_err, messages) => {
                expect(messages.length).to.be.above(1);
                done();
            });
        });

        describe('interacting with friends', () => {
            it('Send message', function (done) {
                // Allow more time for network calls
                this.timeout(5000);

                messenger.getFriends((_, friends) => {
                    const myself = friends[json.c_user];
                    messenger.sendMessage(myself.vanity, myself.id, 'Running tests - Send message', done);
                });
            });

            it('GetLastMessage', function (done) {
                // Set a higher timeout for network calls
                this.timeout(5000);
                messenger.getFriends((_, friends) => {
                    const myself = friends[json.c_user];

                    messenger.getMessagesGraphQl(myself.vanity, myself.id, 10, (_err, messages) => {
                        expect(messages.length).to.be.equal(10);
                        done();
                    });
                });
            });
        });
    });
});

describe('Settings', () => {
    beforeEach(() => {
        const filename = 'test.fbmessengerrc';
        Settings.filename = filename;
        Settings.filepath = path.resolve('.', filename);
    });

    it('save() and load()', (done) => {
        const options = {'lights': 'on', 'engine': 'on', 'fuel_pump': 'on', 'running': true};
        const settings = Settings;

        settings.properties = options;
        settings.save();

        settings.read((err, result) => {
            expect(result).to.deep.equal(options);
            done();
        });
    });
});
