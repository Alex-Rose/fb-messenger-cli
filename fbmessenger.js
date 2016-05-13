var request = require('request'); // For making HTTP requests

var recipientUrl = "https://www.messenger.com/t/" + null; // Your recipient;
var recipientId = null; // recipientId
var cookie = null; // Your cookie;
var userId = null; // Your userID;
var messageBody = process.argv[2];
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
    'cookie': cookie,
    'authority': 'www.messenger.com'
  },
  formData: {
    'message_batch[0][action_type]':'ma-type:user-generated-message',
    'message_batch[0][author]':'fbid:' + userId,
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
    'message_batch[0][body]': messageBody,
    'message_batch[0][has_attachment]':'false',
    'message_batch[0][html_body]':'false',
    'message_batch[0][specific_to_list][0]':'fbid:' + recipientId,
    'message_batch[0][specific_to_list][1]':'fbid:' + userId,
    'message_batch[0][status]':'0',
    //'message_batch[0][offline_threading_id]': messageId,
    //'message_batch[0][message_id]': messageId,
    'message_batch[0][ephemeral_ttl_mode]':'0',
    'message_batch[0][manual_retry_cnt]':'0',
    'message_batch[0][other_user_fbid]': recipientId,
    'client':'mercury',
    '__user': userId,
    '__a':'1',
    '__dyn':'7AzkXh8Z398jgDxKy1l0BwRyaF3oyfJLFwgoqwWhEoyUnwgU9GGEcVovkwy3eE99XDG4UiwExW14DwPxSFEW2O7EOEixu1jyoCcyUW',
    '__req':'2q',
    '__be':'0',
    '__pc':'EXP1:messengerdotcom_pkg',
    'fb_dtsg':'AQFIEwDCU4vu:AQH-RM3y48nr',
    'ttstamp':'265817073691196867855211811758658172458277511215256110114',
    '__rev':'2335431'
  }
}, function(err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err);
  }
  console.log('Post successful');
});
