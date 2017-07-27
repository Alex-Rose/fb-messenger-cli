const Settings = require('./settings.js');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');

const filename = 'emoji_cache.txt';
const filepath = path.resolve(__dirname, '../', filename);
var map = null;

var Emoji = function (callback) {
    var emoji = this;
    if (map === null) {
        map = {};
        if (!fs.existsSync(filepath)) {
            emoji.save(callback);
        } else {
            fs.readFile(filepath, function (err, data) {
                if (!err) {
                    try {
                        map = JSON.parse(data.toString());
                    } catch (except) {
                        err = except;
                    }
                }
                if (err) {
                    map = {};
                    emoji.save(callback);
                } else {
                    callback();
                }
            });
        }
    }
};

Emoji.prototype.findFromDecCodePoint = function (codePoint, callback) {
    var emoji = this;
    if (map[codePoint]) {
        console.log('from map' + map[codePoint]);
        callback(map[codePoint]);
    } else {
        var hex = codePoint.toString(16);
        var url = "http://emojipedia.org/search/?q=" + hex;
        request(url, function (error, response, body) {
            try {
                var $ = cheerio.load(body);
                var a = $('ol.search-results>li>h2>a');
                var emojiUrl = "http://emojipedia.org" + a.attr('href');

                request(emojiUrl, function (error, response, body) {
                    try {
                        var $ = cheerio.load(body);
                        var li = $('ul.shortcodes>li');
                        if (li.text()[0] == ':') {
                            map[codePoint] = li.text();
                            emoji.save();

                            callback(map[codePoint]);
                            console.log(li.text());
                        }
                    } catch (Exception) {
                        console.log('error2');
                    }
                });
            } catch (Exception) {
                console.log('error');
            }
        });
    }
};

Emoji.prototype.save = function (callback)
{
    fs.writeFile(filepath, JSON.stringify(map, null, '  '), (err, res) => {
        if (!err) {
            console.log('Settings have been saved');
        } else {
            console.log('Error saving .settings file');
        }

        if (callback) callback(err);
    });
};

module.exports = Emoji;

var e = new Emoji((err) => {
    if (err) {
        console.log(err);
    }
    e.findFromDecCodePoint(128525, () => { });
});
