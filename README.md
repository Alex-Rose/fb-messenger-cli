# fb-messenger-cli
## Facebook Messenger Command line client
Use your Facebook account to chat with your friends sneakily in the command line, it's as easy as logging in, choosing a convo and chatting away.

*V2.0.0 Now with Google Chrome's Puppeteer for login*

![npm](https://nodei.co/npm/fb-messenger-cli.png?downloads=true)
#### Install
``npm install -g fb-messenger-cli``
Then ``fb-messenger-cli`` from anywhere

### Choose a friend
 - Pick from a list of recent conversations
 - Use /search to find other friends
 - Easily switch between conversations with /switch
 
![Selection](http://puu.sh/pSNkL/7d82e4d9f2.png)

### Chat away
 - Get responses instantly in real-time
 - See when your friends are typing *NEW*
 
![Chat](http://puu.sh/pSNNb/e7e08ca16e.png)

### Helpful settings and commands
 - Toggle timestamps on/off
 - Color coded people in group chats 
 - Load an unlimited number of conversations
 - Use custom nicknames
 - Stay logged in forever *almost
 
> /help

> /b /back /menu .... Get back to conversation selection

> /q /exit /quit .... Quit the application

> /logout ........... Exit and flush credentials

> /s /switch [#] .... Quick switch to conversation number #

> /search [query] ... Search your friends to chat

> /v /view [#] ...... View the attachment by the number given after the type

> /r /refresh ....... Refresh the current converation

> /timestamp ........ Toggle timestamp for messages

> /help ............. Print this message

### Notes
- 2FA is not currently supported
- Requires a node version that supports most ES6 feautres (i.e node 6.x)

### Dev install instructions
1. Run ``npm install`` for dependencies
3. Run ``node cli``
4. Develop away

### Running tests
1. ``cd`` into the test directory
2. Mocha should be installed with the dev dependencies
3. Run ``mocha regression.js``**

** Make sure you've logged in to the cli at least once before running the tests. Regression.js uses your log-in to test the sending and receiving features

