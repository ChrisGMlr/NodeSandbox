const fs = require('fs-extra');
const path = require('path');
const log = require('winston');

const Updater = require('./updater');

// Set up logging.
const logDir = path.join(__dirname, 'logs');
fs.ensureDirSync(logDir);

log.add(log.transports.File, {
  filename: path.join(logDir, 'updater.log'),
  json: false,
  maxsize: 1024 * 1000,
  maxFiles: 10,
  tailable: true,
});

log.remove(log.transports.Console);
log.add(log.transports.Console, {
  timestamp: true,
  colorize: true,
});

log.level = 'debug';

global.log = log;

// Start updater.
let outputDir = path.join(__dirname, '../app/cmscontent');
if (process.argv[2] && (fs.existsSync(process.argv[2]) || fs.ensureDirSync(process.argv[2]))) {
  outputDir = process.argv[2];
}

new Updater(outputDir).update(changesFound => {
  log.debug(changesFound);
});
