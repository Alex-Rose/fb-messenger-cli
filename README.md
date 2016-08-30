# fb-messenger-cli
#### A command line messenger tool
Use your Facebook account to chat with your friends sneakily in the command line, it's as easy as logging in, choosing a convo and chatting away.

#### Now on npm
``npm install -g fb-messenger-cli``
Then ``fb-messenger-cli`` from anywhere

### Choose a friend
![Selection](http://puu.sh/pSNkL/7d82e4d9f2.png)

### Chat away
![Chat](http://puu.sh/pSNNb/e7e08ca16e.png)

### Helpful options
![Options](http://puu.sh/pSNRM/07c6c51fff.png)

### Features:
* Real time refreshing on new messages
* Ability to search for your friends and initiate conversations
* A header showing unread messages in recent convos
* Easy switching between conversations
* Support for group convos

### Dev install instructions
1. Run ``npm install`` for dependencies
3. Run ``node cli``
4. Develop away

### Running tests
1. ``cd`` into the test directory
2. Mocha should be installed with the dev dependencies
3. Run ``mocha regression.js``**

** Make sure you've logged in to the cli at least once before running the tests. Regression.js uses your log-in to test the sending and receiving features

