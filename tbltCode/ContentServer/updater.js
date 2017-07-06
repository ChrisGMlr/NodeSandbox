const path = require('path');
const util = require('util');
const assert = require('assert');
const childProcess = require('child_process');

const Promise = require('bluebird');
const request = require('request-promise-native');
const fs = Promise.promisifyAll(require('fs-extra'));
const touch = require('touch');
const later = require('later');

class Updater {
  constructor(
    outputDir = path.join(__dirname, '../app/cmscontent'),
    poiType = 'CE',
    baseUrl = 'http://www.constellation.com',
    schedule = '*/15 * * * *') {
    this._poiType = poiType;
    this._baseUrl = baseUrl;
    this._outputDir = outputDir;
    this._schedule = schedule;

    // Handle running outside of the test environment.
    if (!global.log) {
      if (global.logger) {
        // Use ampm's logger.
        global.log = global.logger;
      } else {
        // Placeholder log object.
        global.log = {
          info: () => {},
          debug: () => {},
          error: () => {},
        };
      }
    }
  }

  // Sort POIs by ID and then by sort order, because the API returns them in random order (?!)
  sortPois(a, b) {
    const o1 = parseInt(a.poiId, 10);
    const o2 = parseInt(b.poiId, 10);

    const p1 = parseInt(a.poiSortOrder, 10);
    const p2 = parseInt(b.poiSortOrder, 10);

    if (o1 < o2) return -1;
    if (o1 > o2) return 1;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
    return 0;
  }

  // Main entry point
  update(callback) {
    this._updateCallback = callback;

    const start = Date.now();
    let oldData = {};
    let newData = {};
    let changesFound = false;

    return fs.ensureDirAsync(this._outputDir)

    // Load previous data.
    .then(() => {
      log.info('Loading existing POIs');
      const file = path.join(this._outputDir, 'pois.json');
      return fs.accessAsync(file)
        .then(() => fs.readFileAsync(file))
        .then(data => (oldData = JSON.parse(data)))
        .catch(err => {});
    })

    // Download current data.
    .then(() => {
      log.info('Loading new POIs');
      return request(`${this._baseUrl}/exelonapi/fetchpoi`)
        .then(body => {
          newData = JSON.parse(body);
          newData.PoIList = newData.PoIList.filter(poi => poi.poiType === this._poiType);
          newData.PoIList.sort(this.sortPois);
          try {
            assert.deepEqual(oldData, newData);
          } catch (e) {
            changesFound = true;
          }
        })
        .catch(err => {
          log.error(err.error);
        });
    })

    // Download media.
    .then(() => {
      if (!changesFound) {
        return Promise.resolve();
      }

      // Collect information about each download job that needs to be done.
      log.info('Downloading media');
      const downloads = [];
      newData.PoIList.forEach(newItem => {
        newItem.casestudy.imagesCE.forEach(file => {
          downloads.push(file.image.imageCE);
        });

        newItem.casestudy.videosCE.forEach(file => {
          downloads.push(file.video.videoCE);
          downloads.push(file.video.posterCE);
        });

        newItem.imagesTF.forEach(file => {
          downloads.push(file.image.imageTF);
        });

        newItem.videosTF.forEach(file => {
          downloads.push(file.video.videoTF);
          downloads.push(file.video.posterTF);
        });
      });

      // Run the downloads in parallel.
      return Promise.map(downloads.filter(d => d), download => {
        log.info(`Downloading ${download}`);
        return fs.ensureDirAsync(path.join(this._outputDir, path.parse(download).dir))
          .then(() => request(`${this._baseUrl}${download}`, {
            encoding: null,
          }))
          .then(data => {
            log.info(`Downloaded ${download}`);
            return fs.writeFileAsync(path.join(this._outputDir, download), data);
          }).catch(err => {
            log.error(download);
          });
      }, {
        concurrency: 8,
      });
    })

    // Write data to disk.
    .then(() => {
      if (!changesFound) {
        return Promise.resolve();
      }

      log.info('Saving POIs');
      const file = path.join(this._outputDir, 'pois.json');
      const data = JSON.stringify(newData, null, 2);
      return fs.writeFileAsync(file, data)
        .then(() => {
          log.info('Restarting app');
          return new Promise((resolve, reject) => {
            touch(path.join(__dirname, '../ampm-restart.json'), {}, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
    })

    .then(() => {
      // Notify if there are changes.
      log.info(changesFound ? 'Changes found' : 'No changes found');
      if (this._updateCallback) {
        this._updateCallback(changesFound);
      }

      // Set up next update.
      later.setTimeout(
        () => this.update(this._updateCallback),
        later.parse.cron(this._schedule));

      const elapsed = Date.now() - start;
      log.info(`Completed in ${elapsed}ms`);
    })

    .catch(err => {
      log.error(err);
    });
  }
}

module.exports = Updater;
