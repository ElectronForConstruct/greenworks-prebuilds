const gh = require('ghreleases');

const auth = {
    token: process.env.GH_TOKEN,
    user: 'armaldio',
};

const createRelease = async (data) => {
    return new Promise((resolve, reject) => {
        gh.create(auth, 'ElectronForConstruct', 'greenworks-prebuilds', data, (err, release) => {
            if (err) reject(err);
            resolve(release);
        });
    });
};

const listReleases = async () => {
    return new Promise((resolve, reject) => {
        gh.list(auth, 'ElectronForConstruct', 'greenworks-prebuilds', (err, list) => {
            if (err) reject(err);
            resolve(list);
        });
    });
};

const deleteAsset = async (url) => {
    const response = await got.delete(url, {
        headers: {
            'Authorization': `token ${process.env.GH_TOKEN}`,
        },
    });
    return response;
};

const uploadAsset = async (filePath, assetLabel, release) => {
    const stream = fs.readFileSync(filePath);

    await got.post(`https://uploads.github.com/repos/ElectronForConstruct/greenworks-prebuilds/releases/${release.id}/assets?name=${assetLabel}`, {
        headers: {
            'Authorization': `token ${process.env.GH_TOKEN}`,
            'Content-Type': 'application/octet-stream',
        },
        body: stream,
    });
};

module.exports = {
    deleteAsset,
    createRelease,
    listReleases,
    uploadAsset
};
