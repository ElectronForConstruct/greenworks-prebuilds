const {downloadArtifact} = require('@electron/get');
const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const execa = require('execa');

module.exports = (version, arch) => {
    return new Promise(async (resolve, reject) => {

    console.log('version', version);
    const zipFilePath = await downloadArtifact({
        version,
        arch,
        artifactName: 'electron',
        platform: os.platform(),
    });

    console.log('zipFilePath', zipFilePath);
    const extracted = path.join(__dirname, 'zip', 'electron');
    shelljs.rm('-rf', extracted);
    shelljs.mkdir('-p', extracted);
    fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({path: extracted}))
        .on('close', async () => {
            try {
                const out = await execa(
                    path.join(extracted, `electron${process.platform === 'win32' ? '.exe' : ''}`),
                    [path.join(__dirname, 'template', 'electron')],
                );
                resolve(out);
            } catch (e) {
                process.exit(1);
                console.error(e);
                reject(e);
            }
        });
    })
};
