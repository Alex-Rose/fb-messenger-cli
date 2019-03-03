const request = require('request');
const crypt = require('./crypt.js');
const EventEmitter = require('events').EventEmitter;

class Pull extends EventEmitter {
    constructor() {
        super();
        this.seq = 1;
        this.hadIncrement = false;
        this.clientId = '484aed';
        this.connection = undefined;
        this.sticky = '66';
        this.stickyPool = 'atn1c09_chat-proxy';
        this.retry = 0;
    }

    execute(readFunction) {
        this.on('message', readFunction);
        crypt.load((err, data) => {
            if (!err) {
                const json = JSON.parse(data);
                this.cookie = json.cookie;
                this.fbdtsg = json.fb_dtsg;
                this.userId = json.c_user;

                this.sendRequest();
            }
        });
    }

    sendRequest() {
        let url = 'https://3-edge-chat.messenger.com/pull?';
        url += `channel=p_${this.userId}`;
        url += `&seq=${this.seq}`;
        url += '&partition=-2';
        url += `&clientid=${this.clientId}`;
        url += '&cb=70md';
        url += '&idle=101';
        url += '&qp=y';
        url += '&cap=8';
        url += '&pws=fresh'; // Fresh is better :P
        url += '&isq=199552'; // This magic number is worthy of projet 3
        url += '&msgs_recv=0';
        url += `&uid=${this.userId}`;
        url += `&viewer_uid${this.userId}`;
        url += `&sticky_token=${this.sticky}`; // At some point, this gets invalidated and a message is sent to reset value
        url += `&sticky_pool=${this.stickyPool}`; // At some point, this gets invalidated and a message is sent to reset value
        url += '&state=offline';
        url += '&mode=stream';
        url += '&format=json';

        const options = {
            url: url,
            headers: {
                'origin': 'https://www.messenger.com',
                'accept-encoding': 'gzip, deflate',
                'x-msgr-region': 'ATN',
                'accept-language': 'en-US,en;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
                'content-type': 'application/x-www-form-urlencoded',
                'accept': '*/*',
                'cache-control': 'max-age=0',
                'authority': 'www.messenger.com',
                'cookie': this.cookie,
                'referer': 'https://www.messenger.com'
            },
            gzip: true,
        };

        try {
            this.connection = request.get(options);
        } catch (err) {
            console.log('Could not establish initial connection'.red);
            this.retry += 5000;
            const delay = Math.min(this.retry, 60000);
            setTimeout(() => {
                this.sendRequest();
            }, delay);
        }
        this.connection.on('data', (chunk) => {

            let data = chunk.toString('utf8');
            if (data.indexOf('for (;;);') === 0) {
                data = data.substr('for (;;);'.length);
            }

            try {
                if (data.length > 0) {
                    const json = JSON.parse(data);
                    let type;
                    if (json.hasOwnProperty('t')) {
                        type = json.t;

                        if (type === 'msg') {
                            const message = json;
                            // if (message.seq > pull.seq + 1) {
                            // console.log('missing a message current :' + pull.seq + ' vs message ' + message.seq);
                            // }
                            this.seq = message.seq;
                            this.hadIncrement = true;
                            // console.log('Got seq ' + message.seq);

                            for (const j in message.ms) {
                                const ms = message.ms[j];
                                if (ms.type === 'delta' && ms.delta !== undefined) {
                                    if (ms.delta.class === 'NewMessage') {
                                        if (ms.delta.body !== undefined) {
                                            this.emit('message', {
                                                type: 'msg',
                                                author: ms.delta.messageMetadata.actorFbId,
                                                body: ms.delta.body,
                                                otherUserId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                                threadId: ms.delta.messageMetadata.threadKey.threadFbId,
                                                timestamp: ms.delta.messageMetadata.timestamp
                                            });
                                        } else if (ms.delta.attachments !== undefined) {
                                            const att = ms.delta.attachments[0];
                                            if (att.mercury.attach_type === 'animated_image') {
                                                this.emit('message', {
                                                    type: 'msg',
                                                    author: ms.delta.messageMetadata.actorFbId,
                                                    body: 'sent a gif',
                                                    otherUserId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                                    threadId: ms.delta.messageMetadata.threadKey.threadFbId,
                                                    timestamp: ms.delta.messageMetadata.timestamp
                                                });
                                            } else if (ms.delta.stickerId !== undefined) {
                                                let text = 'Sent a sticker.';
                                                if (att.mercury.metadata !== undefined && att.mercury.metadata.accessibilityLabel !== undefined) {
                                                    body += `: ${  att.mercury.metadata.accessibilityLabel}`;
                                                }
                                                this.emit('message', {
                                                    type: 'msg',
                                                    author: ms.delta.messageMetadata.actorFbId,
                                                    body: text,
                                                    sticker: ms.delta.attachments[0].mercury.sticker_attachment,
                                                    otherUserId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                                    threadId: ms.delta.messageMetadata.threadKey.threadFbId,
                                                    timestamp: ms.delta.messageMetadata.timestamp
                                                });
                                            } else if (att.mercury.attach_type === 'share') {
                                                if (att.mercury.share !== undefined) {
                                                    const share = att.mercury.share;
                                                    if (share.target !== undefined && share.target.live_location_id !== undefined) {
                                                        const body = 'shared a live location';
                                                        this.emit('message', {
                                                            type: 'msg',
                                                            author: ms.delta.messageMetadata.actorFbId,
                                                            body: body,
                                                            otherUserId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                                            threadId: ms.delta.messageMetadata.threadKey.threadFbId,
                                                            timestamp: ms.delta.messageMetadata.timestamp
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    } else if (ms.delta.class === 'AdminTextMessage') {
                                        this.emit('message', {
                                            type: 'msg',
                                            author: ms.delta.messageMetadata.actorFbId,
                                            body: ms.delta.messageMetadata.adminText,
                                            otherUserId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                            threadId: ms.delta.messageMetadata.threadKey.otherUserFbId,
                                            timestamp: ms.delta.messageMetadata.timestamp
                                        });
                                    }
                                } else if (ms.type === 'typ') {
                                    this.emit('message', {
                                        type: ms.type,
                                        st: ms.st,
                                        from: ms.from,
                                        to: ms.to
                                    });
                                }
                            }

                            this.retry = 0;

                        } else if (type === 'heartbeat') {
                            if (this.hadIncrement) {
                                this.seq++;
                                this.hadIncrement = false;
                            }

                        } else if (type === 'fullReload') {
                            this.seq = json.seq;
                            this.hadIncrement = false;
                        } else if (type === 'lb') {
                            this.sticky = json.lb_info.sticky;
                            this.stickyPool = json.lb_info.pool;
                        }
                    }
                }
            } catch (err) {
                // Don't break on parse errors
                // console.error(err);
                // console.log('Chunk was : ' + chunk);
            }
        });


        this.connection.on('end', () => {
            // console.log('CONNECTION HAS ENDED!!!');
            this.sendRequest();
        });
    }
}

module.exports = new Pull();
