# fb-messenger-cli
#### A command line messenger tool
Use your Facebook account to chat with your friends sneakily in the command line, it's as easy as logging in, choosing a convo and chatting away.

### Features:
* Real time refreshing on new messages
* Ability to search for your friends and initiate conversations
* A header showing unread messages in recent convos
* Easy switching between conversations
* Support for group convos

### Install instructions
1. Make sure Node is installed
2. Run ``npm install``
3. Run ``node cli``
4. Chat away

### Running tests
1. ``cd`` into the test directory
2. Mocha should be installed with the dev dependencies
3. Run ``mocha regression.js``**

** Make sure you've logged in to the cli at least once before running the tests. Regression.js uses your log-in to test the sending and receiving features

[![master](https://orion.aep.polymtl.ca/~alexrose/spp/tests-current.svg?maxAge=60)]()
