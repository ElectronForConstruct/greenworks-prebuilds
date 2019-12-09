const gh = require('ghreleases');
const got = require('got');
const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const auth = {
  token: process.env.GH_TOKEN,
  user: 'armaldio',
};

const createRelease = async (data) => new Promise((resolve, reject) => {
  gh.create(auth, 'ElectronForConstruct', 'greenworks-prebuilds', data, (err, release) => {
    if (err) reject(err);
    resolve(release);
  });
});

const listReleases = async () => new Promise((resolve, reject) => {
  gh.list(auth, 'ElectronForConstruct', 'greenworks-prebuilds', (err, list) => {
    if (err) reject(err);
    resolve(list);
  });
});

const deleteAsset = async (url) => got.delete(url, {
  headers: {
    Authorization: `token ${process.env.GH_TOKEN}`,
  },
});

const uploadAsset = async (filePath, assetLabel, release) => {
  const releaseURL = `https://uploads.github.com/repos/ElectronForConstruct/greenworks-prebuilds/releases/${release.id}/assets?name=${assetLabel}`;

  const file = fs.readFileSync(filePath);

  return got.post(releaseURL, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': Buffer.byteLength(file),
    },
    body: file,
  });
};

module.exports = {
  deleteAsset,
  createRelease,
  listReleases,
  uploadAsset,
};
