/* jshint sub: true */

// Messenger is handling regular network calls to servers
// for all messaging functions
//
// Login calls are executed differently (see login.js and phantom.js)
// Comet style calls (receive live data) are handled in pull.js

const request = require('request'); // For making HTTP requests
const Settings = require('./settings');

function getThreadName(thread, participant) {
    if (!Settings.properties.useCustomNicknames) {
        return participant.name;
    }

    const nicknames = thread['custom_nickname'];
    return (nicknames && nicknames[participant['fbid']]) || participant.name;
}

class Messenger {

    constructor(cookie, userId, fbdtsg) {
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
    }

    // Facebook prepend jsonp with infinite for loop.
    // We remove it when present.
    cleanJson(body) {
        if (body && body.indexOf('for (;;);') === 0) {
            body = body.substr('for (;;);'.length);
        } else {
            return '';
        }
        return body;
    }

    cleanGraphQl(body) {
        // Response contains two json objects, we want the first one only
        const pos = body.lastIndexOf('{');
        body = body.slice(0, pos - 1);

        try {
            return JSON.parse(body);
        } catch (e) {
            return {};
        }
    }

    // Parses a list of conversation participants into users
    // Useful for adding users that are not "friends" to our database
    saveParticipantsAsFriends(participants) {
        if (participants && participants.nodes) {
            for (const participant of participants.nodes) {
                // Add only the ones we don't already have
                if (!participant.messaging_actor.is_viewer_friend) {
                    const user = participant.messaging_actor;
                    this.saveFriend({
                        id: user.id,
                        firstName: user.short_name,
                        name: user.name,
                        vanity: user.name
                    });
                }
            }
        }
    }

    // Send a message in a thread
    //   recipient: Url name of recipient, also called vanity (eg: alexandre.rose)
    //   recipientId : Facebook numeric id of recipient. Can be a person or a thread
    //   body : Content of the message
    // callback(err) does not get any data
    sendMessage(recipient, recipientId, body, callback) {
        const recipientUrl = `${this.baseUrl  }/t/${  recipient}`; // Your recipient;
        const utcTimestamp = new Date().getTime();
        const localTime = new Date().toLocaleTimeString().replace(/\s+/g, '').toLowerCase();
        const messageId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

        request.post("https://www.messenger.com/messaging/send/?dpr=1", {
            headers: {
                'origin': 'https://www.messenger.com',
                'accept-encoding': 'gzip, deflate',
                'x-msgr-region': 'ATN',
                'accept-language': 'en-US,en;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
                'content-type': 'application/x-www-form-urlencoded',
                'accept': '*/*',
                'referer': recipientUrl,
                'cookie': this.cookie,
                'authority': 'www.messenger.com'
            },
            formData: {
                'action_type': 'ma-type:user-generated-message',
                'author': `fbid:${this.userId}`,
                'timestamp': utcTimestamp,
                'timestamp_absolute': 'Today',
                'timestamp_relative': localTime,
                'timestamp_time_passed': '0',
                'is_unread': 'false',
                'is_forward': 'false',
                'is_filtered_content': 'false',
                'is_filtered_content_bh': 'false',
                'is_filtered_content_account': 'false',
                'is_filtered_content_quasar': 'false',
                'is_filtered_content_invalid_app': 'false',
                'is_spoof_warning': 'false',
                'source': 'source:messenger:web',
                'body': body,
                'has_attachment': 'false',
                'html_body': 'false',
                'specific_to_list][0]': `fbid:${recipientId}`,
                'specific_to_list[1]': `fbid:${this.userId}`,
                'status': '0',
                'offline_threading_id': messageId,
                'message_id': messageId,
                'ephemeral_ttl_mode': '0',
                'manual_retry_cnt': '0',
                'other_user_fbid': recipientId,
                'client': 'mercury',
                '__user': this.userId,
                '__a': '1',
                '__req': '2q',
                '__be': '0',
                '__pc': 'EXP1:messengerdotcom_pkg',
                'fb_dtsg': this.fbdtsg,
                'ttstamp': '265817073691196867855211811758658172458277511215256110114',
                '__rev': '2335431'
            }
        }, (err) => {
            if (err) {
                callback(err);
            }
            callback();
        });
    }

    sendGroupMessage(recipientId, body, callback) {
        const recipientUrl = `${this.baseUrl  }/t/${  recipientId}`; // Your recipient;
        const utcTimestamp = new Date().getTime();
        const messageId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

        request.post("https://www.messenger.com/messaging/send/?dpr=1", {
            headers: {
                'origin': 'https://www.messenger.com',
                'accept-encoding': 'gzip, deflate',
                'x-msgr-region': 'ATN',
                'accept-language': 'en-US,en;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
                'content-type': 'application/x-www-form-urlencoded',
                'accept': '*/*',
                'referer': recipientUrl,
                'cookie': this.cookie,
                'authority': 'www.messenger.com'
            },
            formData: {
                'action_type': 'ma-type:user-generated-message',
                'author': `fbid:${this.userId}`,
                'timestamp': utcTimestamp,
                'source': 'source:messenger:web',
                'body': body,
                'has_attachment': 'false',
                'status': '0',
                'offline_threading_id': messageId,
                'message_id': messageId,
                'thread_fbid': recipientId,
                '__user': this.userId,
                '__a': '1',
                '__req': '2q',
                '__be': '0',
                '__pc': 'EXP1:messengerdotcom_pkg',
                'fb_dtsg': this.fbdtsg,
                'ttstamp': '265817073691196867855211811758658172458277511215256110114',
                '__rev': '2335431'
            }
        }, (err) => {
            if (err) {
                callback(err);
            }
            callback();
        });
    }

    getMessages(recipient, recipientId, count, callback) {
        const recipientUrl = `${this.baseUrl  }/t/${  recipient}`;
        let offSetString, limitString;

        // If recipient == id, then we're chatting to a group
        if (recipient === recipientId) {
            offSetString = `messages[thread_fbids][${  recipientId  }][offset]`;
            limitString = `messages[thread_fbids][${  recipientId  }][limit]`;
        } else {
            offSetString = `messages[user_ids][${  recipientId  }][offset]`;
            limitString = `messages[user_ids][${  recipientId  }][limit]`;
        }

        const options = {
            url: 'https://www.messenger.com/ajax/mercury/thread_info.php?dpr=1',
            headers: this.headers,
            formData: {
                'client': 'mercury',
                '__user': this.userId,
                '__a': '1',
                '__req': '6',
                '__dyn': '7AzkXh8Z398jgDxKy1l0BwRyaF3oyfJLFwgoqwWhEoyUnwgU9GGEcVovkwy3eE99XDG4UiwExW14DwPxSFEW2O9xicG4EnwkUC9z8Kew',
                '__be': '0',
                '__pc': 'EXP1:messengerdotcom_pkg',
                'ttstamp': '265817076671037767104101908958658169691168682107102105117104',
                'fb_dtsg': this.fbdtsg,
                '__rev': '2336846'
            },
            gzip: true,
        };

        options.headers.referer = recipientUrl;
        options.formData[offSetString] = '0';
        options.formData[limitString] = count;

        request.post(options, (err, response, body) => {
            if (!body) {
                return callback(err, []);
            }

            try {
                body = this.cleanJson(body);
                const json = JSON.parse(body);
                const payload = json['payload'];
                let msg;
                if (payload !== undefined) {
                    msg = payload['actions'];
                }

                const data = [];

                if (msg !== undefined) {
                    for (let i = 0; i < msg.length; ++i) {
                        const m = msg[i];
                        const obj = {
                            'author': m.author,
                            'body': m.body,
                            'other_user_fbid': m.other_user_fbid,
                            'thread_fbid': m.thread_fbid,
                            'timestamp': m.timestamp,
                            'timestamp_datetime': m.timestamp_datetime,
                            'action_type': m.action_type,
                            'log_message_body': m.log_message_body
                        };

                        if (m.has_attachment)
                            obj.attachmentsLegacy = m.attachments;

                        data.push(obj);
                    }
                }
            } catch (error) {
                // When using Graph API the response for this call won't be JSON
                // therefore things will throw.
                return callback(error, []);
            }

            return callback(err);
        });
    }

    getMessagesGraphQl(recipient, recipientId, count, callback) {

        const queries = {
            "o0": {
                "doc_id": "1619982624699019",
                "query_params": {
                    "id": recipientId,
                    "message_limit": count,
                    "load_messages": 1,
                    "load_read_receipts": false,
                    "before": null
                }
            }
        };

        const options = {
            url: 'https://www.messenger.com/api/graphqlbatch/',
            headers: this.headers,
            formData: {
                '__user': 512556997,
                '__a': 1,
                '__dyn': '7AgNeS-aF34UjgDxKy1l0BwRAKGgS8zXrWo466EeAq2i5U4e2CGwEyFojyR88wPGi7VXDG4XzEa8iyU4ium2S4oK9zEkxu7EOEixu1tyrhUaUhxGbwYUmC-Ujyk6ErK2q267EmyE9VQ7827Dx6qUpCzpoiGm8xC1vzVolyoK2y5ubxy',
                '__af': 'iw',
                '__req': 'q',
                '__be': -1,
                '__pc': 'PHASED:messengerdotcom_pkg',
                '__rev': 3105978,
                'fb_dtsg': this.fbdtsg,
                'jazoest': 265817088869867988410911111258658171711011025683521076783,
                'queries': JSON.stringify(queries)
            },
            gzip: true
        };

        request.post(options, (err, response, body) => {
            if (err) return callback(err);

            if (body) {
                const results = this.cleanGraphQl(body);

                // Check we actually have messages
                if (!results.o0)
                    return callback(new Error('No messages found'), []);
                const thread = results.o0.data.message_thread;
                const messages = thread.messages.nodes;

                const data = [];
                if (messages !== undefined) {
                    for (const message in messages) {
                        const m = messages[message];

                        const obj = {
                            'author': m.message_sender.id,
                            'body': m.message ? m.message.text : m.snippet,
                            'other_user_fbid': thread.thread_key.other_user_fbid,
                            'thread_fbid': thread.thread_key.thread_fbid,
                            'timestamp': m.timestamp_precise
                        };

                        if (m.extensible_attachment)
                            obj.storyAttachment = m.extensible_attachment.story_attachment;

                        if (m.blob_attachments) {
                            obj.attachment = m.blob_attachments[0];
                        }
                        data.push(obj);
                    }
                }
                return callback(err, data);
            }

            callback(new Error('Could not fetch thread messages'));
        });
    }

    parseRawBody(body) {
        const cleanBody = this.cleanJson(body);
        const json = JSON.parse(cleanBody);
        if (json.error) {
            if (json.errorSummary) {
                throw new Error(`Error happened getting resource. Inner message : ${json.errorSummary}`);
            } else {
                throw new Error('An unknown error happened while getting resource');
            }
        }
        return json;
    }

    // Sets the custom nickname for the friend with the given facebook id
    setCustomNickname(fbId, custom_nickname) {
        this.saveFriend({id: fbId, custom_nickname});
    }

    // Updates the given friend with the new data in the provided object
    // friend (Object): {
    //   id: string [required]
    // }
    saveFriend(friend) {
        const user = this.users[friend.id] || {};
        this.users[friend.id] = Object.assign(user, friend);
    }

    getThreadNameFromParticipants(thread) {
        // Get name from convo participants
        const participants = thread.all_participants.nodes;
        let threadName = '';
        for (let i=0; i < 3; i++) {
            threadName += `${participants[i].messaging_actor.short_name}, `;
        }
        threadName = threadName.slice(0, -2);

        if (participants.length > 3)
            threadName += '...';

        return threadName;
    }

    parseThreadData(threads = []) {

        return threads.map(thread => {
            const id = thread.thread_key.thread_fbid || thread.thread_key.other_user_id;
            const isGroup = thread.thread_type === 'GROUP';
            let name;

            if (isGroup) {
                name = thread.name || this.getThreadNameFromParticipants(thread);
            } else {
                // No nicknames for now
                for (const participant of thread.all_participants.nodes) {
                    if (participant.messaging_actor.id === id)
                        name = participant.messaging_actor.name;
                }
            }
            return {
                name,
                isGroup,
                'snippet': thread.last_message.nodes[0].snippet,
                'attachments': thread.last_message.nodes[0].blob_attachements,
                'thread_fbid': id,
                'timestamp': thread.last_message.nodes[0].timestamp_precise
            };
        });
    }

    getThreads(callback) {
        const convoCount = Settings.properties.conversationsToLoad;

        const query = {
            "o0": {
                "doc_id": "1349387578499440",
                "query_params": {
                    "limit": convoCount,
                    "before": null,
                    "tags": [],
                    "includeDeliveryReceipts": true,
                    "includeSeqID": false
                }
            }
        };

        const options = {
            url: 'https://www.messenger.com/api/graphqlbatch',
            headers: this.headers,
            formData: {
                'batch_name': 'MessengerGraphQLThreadlistFetcher',
                '__user': this.userId,
                '__a': '1',
                '__req': '8',
                '__be': '0',
                '__pc': 'PHASED:messengerdotcom_pkg',
                'ttstamp': '2658170878850518911395104515865817183457873106120677266',
                'fb_dtsg': this.fbdtsg,
                '__rev': '3584147',
                '__dyn': '7AgNeS-aFoGi4Q9UrEwlg9odpbGAdy8-S-C11xG3F6wAxu13wFGEa8Gm4UJi28rxuF98qDKuEjKewExail0h8S6Uhx6byoW58nxGUOEixu1tyrgcUhxGbwYUmCK5UB1G6XDwEwSxqawDDgsxm1NDx6qUpCwCGm8xC784afBxm9yUvy8lUF3bDwgUgoKcU-q48x5x6789E-bQ6e4obAumUlwPzp4h2osAAxC',
                'jazoest': '26581718469487545754573975865817111211670111110112906676',
                'queries': JSON.stringify(query)
            },
            gzip: true,
        };

        request.post(options, (err, response, body) => {
            if (err) callback(err);
            try {
                const results = this.cleanGraphQl(body);

                // threads is an array of graphQl conversation info, no messages
                const threads = results.o0.data.viewer.message_threads.nodes;

                if (!threads) {
                    return callback(new Error('Payload contained no threads'));
                }

                for (const thread of threads) {
                    this.saveParticipantsAsFriends(thread.all_participants);
                }

                // All threads are together (YAY)
                callback(null, this.parseThreadData(threads));

            } catch (e) {
                callback(e);
            }
        });
    }

    getFriends(callback) {
        const options = {
            url: `https://www.messenger.com/chat/user_info_all/?viewer=${this.userId}&dpr=1`,
            headers: this.headers,
            formData: {
                '__user': this.userId,
                '__a': '1',
                '__req': '8',
                '__be': '0',
                '__pc': 'EXP1:messengerdotcom_pkg',
                'ttstamp': '2658170878850518911395104515865817183457873106120677266',
                'fb_dtsg': this.fbdtsg,
                '__rev': '2338802'
            },
            gzip: true,
        };

        request.post(options, (err, response, body) => {
            if (err) return callback(err);

            if (body) {
                body = this.cleanJson(body);
                const json = JSON.parse(body);
                const users = json['payload'];
                for (const id in users) {
                    const friend = users[id];
                    this.saveFriend({
                        id,
                        firstName: friend['firstName'],
                        name: friend['name'],
                        vanity: friend['vanity']
                    });
                }
                return callback(null, this.users);
            } else
                callback(new Error('Error fetching friends from Messenger.com'));
        });

    }
}

module.exports = Messenger;
