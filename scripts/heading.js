Heading = function(){
  this.data = {};
};

Heading.prototype.getData = function() {
  return this.data;
};

Heading.prototype.clearUnread = function (id) {
  for (var i in this.data) {
    if (this.data[i].fbid == id) {
      this.data[i].unread = 0;
    }
  }
};

Heading.prototype.getFbid = function(nb) {
  var item = this.data[nb];
  if (item !== undefined)
    return this.data[nb].fbid;
  else return -1;
};

Heading.prototype.writeHeader = function (convoId) {
  var head = '';
  var roomLeft = true;
  var first = true;
  var columns = process.stdout.columns - 1;

  for (var i in this.data) {
    if (this.data[i].fbid == convoId) {
      continue;
    }

    var entry = '';
    if (!first) {
      entry += ' - ';
    }
    entry += '[' + i + '] ' + this.data[i].name + (this.data[i].unread > 0 ? '*' : '');
    if (head.length + entry.length < columns) {
      if (this.data[i].unread > 0) {
        head += entry.bold;
      } else {
        head += entry;
      }
    } else {
      break;
    }

    first = false;
  }

  for (var j = head.length; j < columns; ++j) {
    head += ' ';
  }

  console.log(head.bgBlue);

};

module.exports = Heading;
