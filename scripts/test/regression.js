var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var Crypt = require('../crypt.js');

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