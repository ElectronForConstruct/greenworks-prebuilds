const { downloadArtifact } = require('@electron/get');
const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const execa = require('execa');

module.exports = (version, arch) => {
    return new Promise(async (resolve, reject) => {

        const execTemplate = async () => {
            try {
                console.log('Execing')
                // TODO chmod electron on linux
                const out = await execa(
                    path.join(extracted, `electron${process.platform === 'win32' ? '.exe' : ''}`),
                    [path.join(__dirname, 'template', 'electron')],
                );
                console.log('out', out)
                resolve(out);
            } catch (e) {
                console.error(e);
                reject(e);
                process.exit(1);
            }
        }

        console.log('version', version);
        const zipFilePath = await downloadArtifact({
            version,
            arch,
            artifactName: 'electron',
            platform: os.platform(),
        });

        console.log('zipFilePath', zipFilePath);
        const extracted = path.join(__dirname, 'zip', 'electron', version);

        if (!fs.existsSync(extracted)) {
            shelljs.rm('-rf', extracted);
            shelljs.mkdir('-p', extracted);
            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: extracted }))
                .on('close', async () => {
                    await execTemplate(extracted);
                });
        } else {
            console.log('Skip dowload')
            await execTemplate(extracted);
        }
    })
};
