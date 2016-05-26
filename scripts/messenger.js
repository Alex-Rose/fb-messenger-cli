/* jshint sub: true */

// Messenger is handling regular network calls to servers
// for all messaging functions
//
// Login calls are executed differently (see login.js and phantom.js)
// Comet style calls (receive live data) are handled in pull.js

var request = require('request'); // For making HTTP requests
var vm = require('vm');

var Messenger = function(cookie, userId, fbdtsg) {
  this.baseUrl = 'https://www.messenger.com';
  this.cookie = cookie; // Your cookie;
  this.userId = userId; // Your userID;
  this.fbdtsg = fbdtsg;
  this.users = {};
  this.headers = {
    'origin': this.baseUrl,
    'accept-encoding': 'gzip, deflate',
    'x-msgr-region': 'ATN',
    'accept-language': 'en-US,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': '*/*',
    'cache-control': 'max-age=0',
    'authority': 'www.messenger.com',
    'cookie': this.cookie,
    'referer': this.baseUrl
  };
};

// Facebook prepend jsonp with infinite for loop. 
// We remove it when present.
Messenger.prototype.cleanJson = function (body) {
  if (body.indexOf('for (;;);') === 0) {
    body = body.substr('for (;;);'.length);
  }

  return body;
};

// Send a message in a thread
//   recipient: Url name of recipient, also called vanity (eg: alexandre.rose)
//   recipientId : Facebook numeric id of recipient. Can be a person or a thread
//   body : Content of the message
// callback(err) does not get any data
Messenger.prototype.sendMessage = function(recipient, recipientId, body, callback) {
  var recipientUrl = this.baseUrl + "/t/" + recipient; // Your recipient;
  var messenger = this;
  var utcTimestamp = new Date().getTime();
  var localTime = new Date().toLocaleTimeString().replace(/\s+/g, '').toLowerCase();

  request.post("https://www.messenger.com/ajax/mercury/send_messages.php?dpr=1", {
    headers: {
      'origin': 'https://www.messenger.com',
      'accept-encoding': 'gzip, deflate',
      'x-msgr-region': 'ATN',
      'accept-language': 'en-US,en;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
      'content-type': 'application/x-www-form-urlencoded',
      'accept': '*/*',
      'referer': recipientUrl,
      'cookie': messenger.cookie,
      'authority': 'www.messenger.com'
    },
    formData: {
      'message_batch[0][action_type]':'ma-type:user-generated-message',
      'message_batch[0][author]':'fbid:' + messenger.userId,
      'message_batch[0][timestamp]': utcTimestamp,
      'message_batch[0][timestamp_absolute]':'Today',
      'message_batch[0][timestamp_relative]': localTime,
      'message_batch[0][timestamp_time_passed]':'0',
      'message_batch[0][is_unread]':'false',
      'message_batch[0][is_forward]':'false',
      'message_batch[0][is_filtered_content]':'false',
      'message_batch[0][is_filtered_content_bh]':'false',
      'message_batch[0][is_filtered_content_account]':'false',
      'message_batch[0][is_filtered_content_quasar]':'false',
      'message_batch[0][is_filtered_content_invalid_app]':'false',
      'message_batch[0][is_spoof_warning]':'false',
      'message_batch[0][source]':'source:messenger:web',
      'message_batch[0][body]': body,
      'message_batch[0][has_attachment]':'false',
      'message_batch[0][html_body]':'false',
      'message_batch[0][specific_to_list][0]':'fbid:' + recipientId,
      'message_batch[0][specific_to_list][1]':'fbid:' + messenger.userId,
      'message_batch[0][status]':'0',
      //'message_batch[0][offline_threading_id]': messageId,
      //'message_batch[0][message_id]': messageId,
      'message_batch[0][ephemeral_ttl_mode]':'0',
      'message_batch[0][manual_retry_cnt]':'0',
      'message_batch[0][other_user_fbid]': recipientId,
      'client':'mercury',
      '__user': messenger.userId,
      '__a':'1',
      '__req':'2q',
      '__be':'0',
      '__pc':'EXP1:messengerdotcom_pkg',
      'fb_dtsg': messenger.fbdtsg,
      'ttstamp':'265817073691196867855211811758658172458277511215256110114',
      '__rev':'2335431'
    }
  }, function(err, httpResponse, body) {
    if (err) {
      callback(err);
    }
    callback();
  });
};

Messenger.prototype.getLastMessage = function(recipient, recipientId, count, callback) {
  var messenger = this;
  var recipientUrl = this.baseUrl + "/t/" + recipient;
  var offSetString = 'messages[user_ids][' + recipientId + '][offset]';
  var limitString = 'messages[user_ids][' + recipientId + '][limit]';
  var timestampString = 'messages[user_ids][' + recipientId + '][timestamp]';

  var options = {
    url: 'https://www.messenger.com/ajax/mercury/thread_info.php?dpr=1',
    headers: messenger.headers,
    formData: {
      'client':'mercury',
      '__user':messenger.userId,
      '__a':'1',
      '__req':'6',
      '__dyn':'7AzkXh8Z398jgDxKy1l0BwRyaF3oyfJLFwgoqwWhEoyUnwgU9GGEcVovkwy3eE99XDG4UiwExW14DwPxSFEW2O9xicG4EnwkUC9z8Kew',
      '__be':'0',
      '__pc':'EXP1:messengerdotcom_pkg',
      'ttstamp':'265817076671037767104101908958658169691168682107102105117104',
      'fb_dtsg': messenger.fbdtsg,
      '__rev':'2336846'
    },
    gzip: true,
  };

  options.headers.referer = recipientUrl;
  options.formData[offSetString] = '0';
  options.formData[limitString] = count;

  request.post(options, function(err, response, body){
        body = messenger.cleanJson(body);
        json = JSON.parse(body);
        msg = json['payload']['actions'];

        data = [];

        for (i = 0; i < msg.length; ++i) {
            m = msg[i];
            obj = {
                'author': m['author'],
                'body': m['body'],
                'other_user_fbid': m['other_user_fbid'],
                'thread_fbid': m['thread_fbid'],
                'timestamp': m['timestamp'],
                'timestamp_datetime': m['timestamp_datetime']
            };

            data.push(obj);
        }

        callback(err, data);
    });
};

Messenger.prototype.getThreads = function(callback) {
  var messenger = this;

  var options = {
    url: 'https://www.messenger.com/ajax/mercury/threadlist_info.php?dpr=1',
    headers: messenger.headers,
    formData: {
      'inbox[offset]': '0',
      'inbox[filter]' : '',
      'inbox[limit]' : '10',
      'client':'mercury',
      '__user':messenger.userId,
      '__a':'1',
      '__req':'8',
      '__be':'0',
      '__pc':'EXP1:messengerdotcom_pkg',
      'ttstamp':'2658170878850518911395104515865817183457873106120677266',
      'fb_dtsg': messenger.fbdtsg,
      '__rev':'2338802'
    },
    gzip: true,
  };

  request.post(options, function(err, response, body){
    var data;
    
    if (!err) {
      
      body = messenger.cleanJson(body);
      
      var json;
      try {
        json = JSON.parse(body);

        if (json.error !== undefined) {
          if (json.errorSummary !== undefined) {
            err = new Error('Error happened getting resource. Inner message : ' + json.errorSummary);
          } else {
            err = new Error('An unknown error happened while getting resource');
          }
        } else {
          participants = json['payload']['participants'];
          threads = json['payload']['threads'];

          data = [];

          for (i = 0; i < participants.length; ++i) {
            name = participants[i]['name'];

            for (j = 0; j < threads.length; ++j) {
              if (threads[j]['other_user_fbid'] == participants[i]['fbid']) {
                data.push({'name': name, 'snippet' : threads[j]['snippet'], 'thread_fbid': threads[j]['thread_fbid']});
                break;
              }
            }
          }          
        }

      } catch (except){
        err = except;
      } finally {
        callback(err, data);
      }
    }
  });
};

Messenger.prototype.getFriends = function(callback) {
  var messenger = this;

  var options = {
    url: 'https://www.messenger.com/chat/user_info_all/?viewer=' + messenger.userId + '&dpr=1',
    headers: messenger.headers,
    formData: {
      '__user':messenger.userId,
      '__a':'1',
      '__req':'8',
      '__be':'0',
      '__pc':'EXP1:messengerdotcom_pkg',
      'ttstamp':'2658170878850518911395104515865817183457873106120677266',
      'fb_dtsg': messenger.fbdtsg,
      '__rev':'2338802'
    },
    gzip: true,
  };

  request.post(options, function(err, response, body){
    body = messenger.cleanJson(body);
    json = JSON.parse(body);
    users = json['payload'];

    for (var id in users) {
      var entry = {};
      var user = users[id];

      entry['id'] = id;
      entry['firstName'] = user['firstName'];
      entry['name'] = user['name'];
      entry['vanity'] = user['vanity'];

      messenger.users[id] = entry;
    }
    callback(messenger.users);
  });

};
module.exports = Messenger;
