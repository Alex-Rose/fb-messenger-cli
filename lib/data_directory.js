const fs = require('fs');
const os = require('os');
const path = require('path');

const normalizeFilePath = filePath => {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof filePath}`);
  }

  const homeDirectory = os.homedir();

  if (homeDirectory) {
    return filePath.replace(/^~(?=$|\/|\\)/, homeDirectory);
  }

  return filePath;
};

const getDataDirectory = () => {
  const environmentDataDirectory = process.env.FB_MESSENGER_DATA_DIR;
  const homeDirectory = os.homedir();
  const thisDirectory = path.resolve(__dirname, '../');

  if (environmentDataDirectory) {
    return normalizeFilePath(environmentDataDirectory);
  }

  if (homeDirectory) {
    return homeDirectory;
  }

  return thisDirectory;
};

module.exports = {
  getDataDirectory,
};
