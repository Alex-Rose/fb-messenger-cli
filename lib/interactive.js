const crypt = require('./crypt.js');
const Messenger = require('./messenger.js');
const { refreshConsole } = require('./util.js');
const Pull = require('./pull.js');
const search = require('./search.js');
const Listeners = require('./listeners.js');
const heading = require('./heading.js');
const Settings = require('./settings.js');
const open = require('opn');

const colors = require('colors');
const safeColors = require('colors/safe');
const events = require('events');
const path = require('path');
const notifier = require('node-notifier');
const readline = require('readline');

let messenger;

// 0 is select conversation, 1 is send message
let action = 0;
let currentThreadCount = 0;
let recipientId = '';
let current_userId;
let currentConversation;

// Initialize our listeners
const emitter = new events.EventEmitter();
const listeners = new Listeners();

let atts = [];
let attsNo = 0;

// Milliseconds in a day
const msInADay = 86400000; // 60 * 60 * 24 * 1000

const rlInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

const colorList = [
    safeColors.green,
    safeColors.cyan,
    safeColors.red,
    safeColors.blue,
    safeColors.magenta,
    safeColors.yellow
];

function InteractiveCli() {
    Pull.execute(this.readPullMessage);
    this.threadHistory = [];
}

function getDisplayName(author) {
    let colorPosition = 0;

    if(!author) author = { name: 'unknown' };

    if(currentConversation && Settings.properties.groupColors) {
        if (currentConversation.isGroup)
            colorPosition = author.name.length % colorList.length; 
        else if (author.id === messenger.userId)
                colorPosition = 1;
    }
	
    let displayName;	
    if (!Settings.properties.useCustomNicknames) {
        displayName = author.name;
    } else displayName = author.custom_nickname || author.name;
  
    return colorList[colorPosition](displayName);
}

function renderMessage(author, message) {
    let msg = `${getDisplayName(author)}: `;
  
    if (Settings.properties.showTimestamps) {
    
        const timeDifference = Date.now() - message.timestamp;
        const daysAgo = Math.round(timeDifference / msInADay);

        let dateString;
        if (daysAgo < 1) {

            // Less than a day, show time
            const locale = Settings.properties.timestampLocale;
            const options = Settings.properties.timestampOptions;
            dateString = new Date(+message.timestamp).toLocaleTimeString(locale, options);

        } else if (daysAgo === 1) {
            dateString = "Yesterday";
        } else {
            dateString = `${daysAgo} days ago`;
        }

        msg = `${dateString} - ${msg}`;
    }

    if (message.body !== undefined && message.body !== "")
        msg += message.body;

    if (message.sticker) {
        const x = `${attsNo}`;

        const label = message.sticker.label
            ? message.sticker.label
            : 'sticker';

        msg += `${' [ '.red + label } ${  x.cyan  }${' ]'.red}`;
        attsNo++;
    }

    if (message.attachmentsLegacy) {
        for (let i = 0; i < message.attachmentsLegacy.length; i++) {
            const a = message.attachmentsLegacy[i];
            let attType;
            if (a.attach_type === 'sticker' || a.attach_type === 'video') {
                atts[attsNo] = a.url;
                attType = a.attach_type;
            }
            else if (a.attach_type === 'share') {
                if (a.share.target && a.share.target.live_location_id) {
                    if (a.share.target.is_expired) {
                        msg += 'shared a live location (ended)';
                        continue;
                    } else {
                        atts[attsNo] = a.share.uri;
                        attType = `live location - ${  a.share.description}`;
                    }
                } else {
                    atts[attsNo] = a.share.uri;
                    attType = a.attach_type;
                }
            }
            else if (a.attach_type === 'photo') {
                atts[attsNo] = a.large_preview_url;
                attType = a.attach_type;
            }
            else if (a.attach_type === 'animated_image') {
                atts[attsNo] = a.preview_url;
                attType = 'gif';
            }
            else if (a.attach_type === 'file') {
                atts[attsNo] = a.url;
                if (a.name.startsWith("audioclip")) {
                    attType = 'audio clip';
                } else {
                    attType = 'file';
                }
            }
            const x = `${attsNo}`;
            msg += `${'[ '.red + attType  } ${  x.cyan  }${' ]'.red}`;
            attsNo++;
        }
    }

    // New GraphQl call attachements
    if (message.attachment) {
        const a = message.attachment;
        let uri;
        if (a.preview && a.preview.uri) {
            uri = a.preview.uri;      
        } else if (a.preview_image && a.preview_image.uri) {
            uri = a.preview_image.uri; 
        }
    
        if (uri) {
            atts[attsNo] = uri;
            const x = `${attsNo}`;
            msg += `${'[ '.red  }link` + ` ${  x.cyan  }${' ]'.red}`;
            attsNo++;
        }
    }

    if (message.storyAttachment) {
        const a = message.storyAttachment;
        atts[attsNo] = a.url;

        const x = `${attsNo}`;
        msg += `${'[ '.red  }preview` + ` ${  x.cyan  }${' ]'.red}`;
        attsNo++;
    }

    if (message.action_type === 'ma-type:log-message') {
        if (message.log_message_body !== undefined) {
            msg += message.log_message_body;
        }
    }

    return msg;
}

InteractiveCli.prototype.initializeConversationViewFromFbid = function(id) {
    const user = messenger.users[id];

    listeners.getThreadInfo(id, (err, threadInfo) => {
        if (err) {
            console.log(err);
            console.log('Looking up conversation with id only');
            currentConversation = undefined;
            this.currentConversationId = id;
        } else {
            currentConversation = threadInfo;
            this.currentConversationId = threadInfo.thread_fbid;
        }

        // Unread messages in heading
        heading.clearUnread(id);

        let recipientUrl;
        if (user) {
            recipientUrl = user.vanity;
        } else {
            recipientUrl = id;
        }

        const printMessages = (messages) => {
            recipientId = id;
            interactive.threadHistory = [];
            refreshConsole();
            attsNo = 0;
            atts = [];
            for (const i in messages) {
                const message = messages[i];
                let authorString = message.author;

                if (authorString.indexOf('fbid:') === 0)
                    authorString = authorString.substr('fbid:'.length);

                const author = messenger.users[authorString];
                const msg = renderMessage(author, message);

                interactive.threadHistory.push(msg);
            }
            interactive.printThread();
        };

        messenger.getMessages(recipientUrl, id, process.stdout.rows - 1, (err, messages) => {
        // TODO: deal with errors
            if (messages.length > 0 && !err)
                printMessages(messages);
            else {
                // Nothing found, must be using GraphQl
                messenger.getMessagesGraphQl(recipientUrl, id, process.stdout.rows - 1, (err2, qlMessages) => {
                    printMessages(qlMessages);
                });
            }
        });
    });
};

InteractiveCli.prototype.readPullMessage = function(message) {
    if (message.type === 'msg') {
        const author = messenger.users[message.author];
        if (Settings.properties.desktopNotifications) {
            try {
                if (author !== undefined && author.id !== messenger.userId && message.threadId !== recipientId) {
                    notifier.notify({
                        title: getDisplayName(author),
                        message: message.body,
                        icon: path.join(__dirname, '../resources/logo.png')
                    });
                }
            } catch (err) {
                // Don't break over notifications
            }
        }

        if (action === 0) {
            const listener = 'getConvos';
            emitter.emit(listener, current_userId, (data) => {
                action = data.action;
                currentThreadCount = data.threadCount;
                rlInterface.prompt(true);
            });
            return;
        } else if (author === undefined || message.otherUserId !== recipientId) {
            // Extra check for groups
            if (message.threadId !== recipientId) {
                // Don't warn for current user messages (from another device)
                if (author.id !== messenger.userId) {
                    for (const entry of heading.data) {
                        // Doesn't work when it's a group
                        if (entry.fbid === message.otherUserId || entry.fbid === message.threadId) {
                            entry.unread++;
                        }
                    }
                    // Moved this out of the for, in case we get a message from someone
                    // not in the heading, we still need to refresh
                    // ...but don't refresh if in the menu
                    if (recipientId !== '') {
                        interactive.printThread();
                    }
                }
                return;
            }
        }

        const msg = renderMessage(author, message);

        interactive.threadHistory.push(msg);
        interactive.printThread();

    } else if (message.type === 'typ' && message.st && this.currentConversation && !this.currentConversation.isGroup) {
        // Someone is typing
        if (message.to === parseInt(current_userId) && message.from === parseInt(recipientId)) {
            // st === 1 is started typing
            if (message.st) {
                interactive.printThread();
                console.log(`\n${messenger.users[recipientId].name} started typing...`);
                rlInterface.prompt(true);
            } else {
                // Clear the message if he stopped typing
                interactive.printThread();
            }
        }
    }
};

InteractiveCli.prototype.printThread = function(){
    refreshConsole();
    const w = process.stdout.columns - 1;
    const lines = [];

    const totalLines = interactive.threadHistory.length;
    const linesToShow = Settings.properties.threadLineLimit > 0
        ? Math.min(totalLines, Settings.properties.threadLineLimit)
        : totalLines;

    for (let i = totalLines - linesToShow; i < totalLines; ++i) {
        const ln = interactive.threadHistory[i].match(new RegExp(`.{1,${  w  }}`, 'g'));
        for (const j in ln) {
            lines.push(ln[j]);
        }
    }

    const x = Math.max(0, lines.length - process.stdout.rows + 4);

    // Draw the header
    heading.writeHeader(this.currentConversationId);

    // just show most recent visible lines
    let linesToWrite = lines.slice(x);

    if (Settings.properties.preventMessageFlicker) {
    // erase content on the line from before
        linesToWrite = linesToWrite.map(ln => `\x1b[K${  ln}`);
    }

    console.log(linesToWrite.join('\n'));
    rlInterface.prompt(true);
};

InteractiveCli.prototype.handleCommands = function(command) {
    command = command.toLowerCase().trim();
    const options = command.split(' ');

    switch (options[0]) {
        case '/home':
        case '/m':
        case '/menu':
        case '/b':
        case '/back': {
            const listener = 'getConvos';
            console.log('Bringing you back to the conversation selection screen...'.cyan);
            emitter.emit(listener, current_userId, (data) => {
                action = data.action;
                currentThreadCount = data.threadCount;
                rlInterface.prompt(true);
                recipientId = '';
            });
            break;
        }

        case '/s':
        case '/switch': {
            let convo = options[1];

            if (!isNaN(convo)) {
                convo = parseInt(convo);
                const id = heading.getFbid(convo);
                if (id !== -1) {
                    console.log('Switching conversation...'.cyan);
                    interactive.initializeConversationViewFromFbid(id);
                    action = 1;
                    return;
                }
            }
            console.log('Invalid switch, please try again'.cyan);
            rlInterface.prompt(true);
            break;
        }

        case '/v':
        case '/view': {
            let att = options[1];

            if (!isNaN(att)) {
                att = parseInt(att);
                if (att >= 0 && att < attsNo) {
                    const url = atts[att];
                    if (url) {
                        open(url);
                        console.log('Attachment now open in browser');
                    } else {
                        console.log('Couldn\'t open attachment in browser');
                    }
                    rlInterface.prompt(true);
                    break;
                }
            }
            console.log('Invalid attachment number, please try again'.cyan);
            rlInterface.prompt(true);
            break;
        }

        case '/logout':
            interactive.handleExit(true);
            break;

        case '/q':
        case '/quit':
        case '/exit':
            interactive.handleExit(false);
            break;

        case '/h':
        case '/?':
        case '/help':
            console.log('/b /back /menu .... Get back to conversation selection'.cyan);
            console.log('/q /exit /quit .... Quit the application'.cyan);
            console.log('/logout ........... Exit and flush credentials'.cyan);
            console.log('/s /switch [#] .... Quick switch to conversation number #'.cyan);
            console.log('/search [query] ... Search your friends to chat'.cyan);
            console.log('/v /view [#] ...... View the attachment by the number given after the type'.cyan);
            console.log('/r /refresh ....... Refresh the current converation'.cyan);
            console.log('/timestamp ........ Toggle timestamp for messages'.cyan);
            console.log('/linelimit [#] .... Set max number of messages to display in a conversation'.cyan);
            console.log('/nolimit .......... Unset a line limit, display all available messages'.cyan);
            console.log('/help ............. Print this message'.cyan);
            rlInterface.prompt(true);
            break;

        case '/r':
        case '/refresh':
            if (action === 1) {
                interactive.initializeConversationViewFromFbid(this.currentConversationId);
            } else {
                interactive.handleCommands("/back");
            }
            break;

        case '/search':
            // Start a new search
            action = 2;
            // Start the search with the entire string
            emitter.emit('startSearch', command);
            break;

        case '/timestamp':
        case '/timestamps':
            Settings.properties.showTimestamps = !Settings.properties.showTimestamps;
            Settings.save();
            console.log('Changed the timestamp settings!'.cyan);

            interactive.handleCommands("/refresh");
            break;
        case '/linelimit':
            let lim = options[1];

            if (!isNaN(lim)) {
                lim = parseInt(lim);
                if (lim >= 0) {
                    Settings.properties.threadLineLimit = lim;
                    Settings.save();
                    console.log('Changed the line limit settings!'.cyan);
                    rlInterface.prompt(true);
                    if (action === 1) {
                        interactive.handleCommands("/refresh");
                    }
                    break;
                }
            }
            console.log('Invalid line limit setting, please try again'.cyan);
            rlInterface.prompt(true);
            break;
        case '/nolimit':
            Settings.properties.threadLineLimit = -1;
            Settings.save();
            console.log('Unset the line limit setting!'.cyan);
            rlInterface.prompt(true);
            if (action === 1) {
                interactive.handleCommands("/refresh");
            }
            break;

        default:
            console.log('Unknown command. Type /help for commands.'.cyan);
            rlInterface.prompt(true);
    }
};

InteractiveCli.prototype.handler = function(value) {
    const text = value.toString();
    value = value.toLowerCase().trim();

    if (value.indexOf('/') === 0) {
        interactive.handleCommands(text);
    } else {
        if (action === 0) {
            const selection = parseInt(value);
            if (!isNaN(selection)) {
                if (selection >= 0 && selection < currentThreadCount) {
                    emitter.emit('getThreadId', selection, (id) => {
                        interactive.initializeConversationViewFromFbid(id);
                    });
                    action = 1;
                } else {
                    console.log('Warning: Input is out of bounds'.yellow);
                }
            } else {
                console.log('Warning: Input is not a valid number'.yellow);
            }
        } else if (action === 1) {
            emitter.emit('sendMessage', text, recipientId);
        } else if (action === 2) { // search
            emitter.emit('startSearch', value, (a, searchId) => {
                if (a === 1) {
                    action = 1;
                    interactive.initializeConversationViewFromFbid(searchId);
                } else {
                    emitter.emit('getConvos', current_userId, (data) => {
                        action = data.action;
                        currentThreadCount = data.threadCount;
                        rlInterface.prompt(true);
                    });
                }
            });
        }
    }
};

InteractiveCli.prototype.run = function(){
    crypt.load((err, data) => {
        const json = JSON.parse(data);
        const cookie = json.cookie;
        const fbdtsg = json.fb_dtsg;
        const userId = json.c_user;

        current_userId = userId;

        // Globals
        messenger = new Messenger(cookie, userId, fbdtsg);
        search.initMessenger(messenger);
        listeners.setMessenger(messenger);

        // register our listeners
        emitter.on('getConvos', listeners.getConversationsListener.bind(listeners));
        emitter.on('sendMessage', listeners.sendMessageListener.bind(listeners));
        emitter.on('getThreadId', listeners.getThreadIdListener.bind(listeners));
        emitter.on('startSearch', listeners.searchListener.bind(listeners));
	
        console.log("Fetching conversations...".cyan);	    	
        messenger.getFriends((err, friends) => {
            if (err) {
                console.log(`An error occured initially fetching friends list: ${err}`);
                console.log('Exiting...');
                process.exit(1);
            }

            const entry = {
                id: userId, 
                firstName: "Me",
                name: "Me",
                vanity: "unknown",
            };

            messenger.users[userId] = entry;

            // Print the list for the first times
            emitter.emit('getConvos', current_userId, (data) => {
                action = data.action;
                currentThreadCount = data.threadCount;
                rlInterface.prompt(true);
            });

            // Set up the line reader	      
            rlInterface.on("line", interactive.handler);
            rlInterface.on("close", interactive.exit);
            rlInterface.prompt(true);      
        });
    });
};

InteractiveCli.prototype.handleExit = function(logout){
    if (logout){
        crypt.flush();
        console.log('Logged out!'.cyan);
    }

    // rlInterface needs to be closed in order to cleanly release handles
    // to stdin and stdout. Calling close() will send a 'close' event.
    rlInterface.close();
}

InteractiveCli.prototype.exit = function(){
    console.log('Thanks for using fb-messenger-cli'.cyan);
    console.log('Bye!'.cyan);
    
    process.exit(0);
};

const interactive = new InteractiveCli();
interactive.run();

module.exports = InteractiveCli;
