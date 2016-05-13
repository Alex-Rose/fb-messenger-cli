# send_messages.php

## Curl command
```
curl
'https://www.messenger.com/ajax/mercury/send_messages.php?dpr=1'
-H
'origin: https://www.messenger.com'
-H
'accept-encoding: gzip, deflate'
-H
'x-msgr-region: ATN'
-H
'accept-language: en-US,en;q=0.8'
-H
'user-agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
-H
'content-type: application/x-www-form-urlencoded'
-H
'accept: */*'
-H
'referer: https://www.messenger.com/t/samuel.bergeron'
-H
'authority: www.messenger.com'
-H
'cookie: <YOUR_COOKIE_DATA>'
--data
'
message_batch[0][action_type]=ma-type: user-generated-message
message_batch[0][thread_id]
message_batch[0][author]=fbid: 731419306 #SENDER
message_batch[0][author_email]
message_batch[0][timestamp]=1463100018777 #TIMESTAMP IN MILLISECOND
message_batch[0][timestamp_absolute]=Today
message_batch[0][timestamp_relative]=20: 40
message_batch[0][timestamp_time_passed]=0
message_batch[0][is_unread]=false
message_batch[0][is_forward]=false
message_batch[0][is_filtered_content]=false
message_batch[0][is_filtered_content_bh]=false
message_batch[0][is_filtered_content_account]=false
message_batch[0][is_filtered_content_quasar]=false
message_batch[0][is_filtered_content_invalid_app]=false
message_batch[0][is_spoof_warning]=false
message_batch[0][source]=source: messenger: web
message_batch[0][body]=test3 #MESSAGE BODY
message_batch[0][has_attachment]=false
message_batch[0][html_body]=false
message_batch[0][specific_to_list][0]=fbid: 512556997 #DEST 
message_batch[0][specific_to_list][1]=fbid: 731419306 #SENDER
message_batch[0][status]=0
message_batch[0][offline_threading_id]=6136686259922146391 #HAS TO BE SAME A message_id
message_batch[0][message_id]=6136686259922146391
message_batch[0][ephemeral_ttl_mode]=0
message_batch[0][manual_retry_cnt]=0
message_batch[0][other_user_fbid]=512556997 #DEST
client=mercury
__user=731419306 #SENDER
__a=1
__dyn=7AzkXh8Z398jgDxKy1l0BwRyaF3oyfJLFwgoqwWhEoyUnwgU9GGEcVovkwy3eE99XDG4UiwExW14DwPxSFEW2O7EOEixu1jyoCcyUW
__req=s
__be=0
__pc=EXP1: messengerdotcom_pkg
fb_dtsg=AQE1XB83BDVF: AQGQZqeudSSv
ttstamp=26581694988665651666886705865817181901131011171008383118
__rev=2334383'
--compressed
```

*message_id* can be randomly set to higher value