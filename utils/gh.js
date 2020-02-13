const gh = require('ghreleases');
const got = require('got');
const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const getRepoInfos = () => {
  const [username, repo] = process.env.TRAVIS_REPO_SLUG.split('/');
  return { username, repo }
}

const auth = {
  token: process.env.GH_TOKEN,
  user: 'armaldio',
};

const createRelease = async (data) => new Promise((resolve, reject) => {
  gh.create(auth, getRepoInfos().username, getRepoInfos().repo, data, (err, release) => {
    if (err) reject(err);
    resolve(release);
  });
});

const listReleases = async () => new Promise((resolve, reject) => {
  gh.list(auth, getRepoInfos().username, getRepoInfos().repo, (err, list) => {
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
  const releaseURL = `https://uploads.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/releases/${release.id}/assets?name=${assetLabel}`;

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
