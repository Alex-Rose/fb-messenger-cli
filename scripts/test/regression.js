/* jshint expr: true */

const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const Crypt = require('../crypt.js');
const Messenger = require('../messenger.js');
const Settings = require('../settings.js');
const path = require('path');

describe('Crypt', () => {
    it('getInstance() should create a new singleton object', () => {
        const crypt = Crypt.getInstance();
        expect(crypt).to.not.equal(undefined);
    });

    it('getInstance() always returns the same instance', () => {
        let crypt = Crypt.getInstance();
        crypt.password = 'test123_%';
        crypt = Crypt.getInstance();
        expect(crypt.password).to.equal('test123_%');
    });

    it('encrypt() and decrypt() should return original data', () => {
        const data = "{some: 'things', are: 'not equal'}";
        const crypt = Crypt.getInstance();
        const encrypted = crypt.encrypt(data);
        const decrypted = crypt.decrypt(encrypted);
        expect(decrypted).to.equal(data);
    });

    it('save() and load()', (done) => {
        const crypt = Crypt.getInstance();
        const file = '.test_kryptonite';
        const data = JSON.stringify({theTest: 'data', is: 5012344});

        crypt.filename = file;
        crypt.save(data);

        crypt.load((err, result) => {
            expect(result).to.equal(data);
            done();
        });

    });
});

describe('Messenger', () => {
    let json;
    let messenger;

    it('Load cookie', (done) => {
    // Reset crypt
        const crypt = new Crypt();
        crypt.filename = '.kryptonite';

        crypt.load((err, result) => {

            expect(() => {JSON.parse(result);}).not.throw(Error);

            json = JSON.parse(result);
            expect(json.cookie).to.not.equal.undefined;
            expect(json.fb_dtsg).to.not.equal.undefined;
            expect(json.c_user).to.not.equal.undefined;
            done();
        });
    });

    it('Create Messenger', () => {
        messenger = new Messenger(json.cookie, json.c_user, json.fb_dtsg);
    });

    it('Send message', function(done) {
    // Allow more time for network calls
        this.timeout(5000);

        messenger.sendMessage('ar.alexandre.rose', '731419306', 'Running tests - Send message', done);
    });

    it('GetLastMessage', function(done) {
    // Allow more time for network calls
        this.timeout(5000);

        messenger.getMessages('ar.alexandre.rose', '731419306', 10, (err, messages) => {
            expect(messages.length).is.equal(10);
            done();
        });
    });

    it('Get threads', function(done) {
    // Allow more time for network calls
        this.timeout(5000);

        messenger.getThreads(true, done);
    });
});

describe('Settings', () => {
    it('getInstance() should create a new singleton object', () => {
        const settings = Settings.getInstance();
        expect(settings).to.not.equal(undefined);
    });

    it('getInstance() always returns the same instance', () => {
        let settings = Settings.getInstance();
        settings.filename = 'test123_%';
        settings = Settings.getInstance();
        expect(settings.filename).to.equal('test123_%');
    });

    it('save() and load()', (done) => {
        const options = {'lights': 'on', 'engine': 'on', 'fuel_pump': 'on', 'running': true};
        const settings = Settings.getInstance();
        const file = '.test_settings';

        settings.properties = options;
        settings.filename = file;
        settings.save();

        settings.load((err, result) => {
            expect(result).to.deep.equal(options);
            done();
        });

    });
});
