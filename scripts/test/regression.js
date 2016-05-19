var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var Crypt = require('../crypt.js');
var Messenger = require('../messenger.js');

describe('Crypt', function() {
  it('getInstance() should create a new singleton object', function() {
    var crypt = Crypt.getInstance();
    expect(crypt).to.not.equal(undefined);
  });
  
  it('getInstance() always returns the same instance', function() {
    var crypt = Crypt.getInstance();
    crypt.password = 'test123_%';
    crypt = Crypt.getInstance();
    expect(crypt.password).to.equal('test123_%');
  });
  
  it('encrypt() and decrypt() should return original data', function() {
    var data = "{some: 'things', are: 'not equal'}";
    var crypt = Crypt.getInstance();
    var encrypted = crypt.encrypt(data);
    var decrypted = crypt.decrypt(encrypted);
    expect(decrypted).to.equal(data);
  });
  
  it('save() and load()', function(done) {
    var crypt = Crypt.getInstance();
    var file = '.kryptonite_test';
    var data = JSON.stringify({theTest: 'data', is: 5012344});
    
    crypt.filename = file;
    crypt.save(data);

    crypt.load(function(err, result) {
      expect(result).to.equal(data);
      done();
    });
    
  });
});

describe('Messenger', function() {
  var json;
  var messenger;
  
  it('Load cookie', function(done){
    // Reset crypt
    var crypt = new Crypt();
    crypt.filename = '../.kryptonite';
    
    crypt.load(function(err, result) {
      
      expect(function(){JSON.parse(result)}).not.throw(Error);
      
      json = JSON.parse(result);
      expect(json.cookie).to.not.equal.undefined;
      expect(json.fb_dtsg).to.not.equal.undefined;
      expect(json.c_user).to.not.equal.undefined;
      done();
    });
  });
  
  it('Create Messenger', function() {
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
    
    messenger.getLastMessage('ar.alexandre.rose', '731419306', 10, function(err, messages) {
      expect(messages.length).is.equal(10);
      done();
    });
  });
});