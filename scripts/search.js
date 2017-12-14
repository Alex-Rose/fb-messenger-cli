const { refreshConsole } = require('./util.js');
const colors = require('colors');

class Search {
    constructor() {
        this.friends = [];
        this.filtered = [];
    }

    initMessenger(messenger) {
        this.messenger = messenger;
    }

    run(searchString) {
        this.parseFriendsList(searchString, (err) => {
            refreshConsole();
            if (err)
                console.log(`Error occured while fetching friends list: ${err}`);
            this.printChoices();
        });
    }

    selectConvo(choice) {
        for (let i = 0; i < this.filtered.length; i++) {
            if (this.filtered[i].position === parseInt(choice.toLowerCase().trim())) {
                console.log(`Sending message to: ${this.filtered[i].name}`);
                return this.filtered[i].id;
            }
        }
        console.log('No conversation has that number'.cyan);
        console.log('Bringing you back to friend selection screen...'.cyan);
        return null;
    }

    parseFriendsList(searchString, callback) {
        this.messenger.getFriends((err, friends) => {
            if (this.friends.length <= 0) {
                for (const id in friends) {
                    this.friends.push(friends[id]);
                }
            }
            this.filterFriends(searchString);
            return callback(err);
        });
    }

    filterFriends(searchString) {
        this.filtered = this.friends.filter((friend) => {
            return friend.name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1;
        });
    }

    printChoices() {
        if (this.filtered.length === 0) {
            console.log('Looks like we didn\'t find anything!'.cyan);
            console.log('Bringing you back to the friend selection screen...'.cyan);
            console.log('Press Enter to continue'.cyan);
        } else {
            for (let i = 0; i < this.filtered.length; i++) {
                this.filtered[i].position = i;
                console.log(`[${i.toString().cyan}] ${this.filtered[i].name.green}`);
            }
        }
    }
}

module.exports = new Search();
