const { downloadArtifact } = require('@electron/get');
const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const execa = require('execa');

// TODO mind the paths, it's a mess !
module.exports = (version, arch, libPath) => {
    const electronTemplatePath = path.join(__dirname, 'template', 'electron');
    return new Promise(async (resolve, reject) => {

        const execTemplate = async () => {
            try {
                console.log('Copying built files (libs)');
                const libPathTemplate = path.join(electronTemplatePath, 'lib');
                shelljs.mkdir(libPath);
                shelljs.cp(libPath, libPathTemplate);

                console.log('Exec-ing');
                // TODO chmod electron on linux
                const out = await execa(
                    path.join(extracted, `electron${process.platform === 'win32' ? '.exe' : ''}`),
                    [electronTemplatePath],
                );
                resolve(out);
            } catch (e) {
                console.error(e);
                reject(e);
                process.exit(1);
            }
        };

        console.log('version', version);
        const zipFilePath = await downloadArtifact({
            version,
            arch,
            artifactName: 'electron',
            platform: os.platform(),
        });

        const extracted = path.join(__dirname, 'zip', 'electron', version);

        if (!fs.existsSync(extracted)) {
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
