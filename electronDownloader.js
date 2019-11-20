const { downloadArtifact } = require('@electron/get');
const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const execa = require('execa');

module.exports = (version, arch, libPath) => {
    const electronTemplatePath = path.join(__dirname, 'template', 'electron');

    return new Promise(async (resolve, reject) => {

        const execTemplate = async (electronExtractedPath) => {
            try {
                const libPathTemplate = electronTemplatePath;
                // const libPathTemplate = path.join(electronTemplatePath, 'lib');
                shelljs.mkdir(libPath);
                console.log(`From ${libPath} to ${libPathTemplate}`);
                shelljs.cp('-R', libPath, libPathTemplate);

                console.log('Exec-ing');
                const electronBinary = path.join(electronExtractedPath, `electron${process.platform === 'win32' ? '.exe' : ''}`);
                shelljs.chmod('+x', electronBinary);
                const out = await execa(electronBinary, [electronTemplatePath],
                );
                resolve(out);
            } catch (e) {
                console.error(e);
                reject(e);
                process.exit(1);
            }
        };

        const zipFilePath = await downloadArtifact({
            version,
            arch,
            artifactName: 'electron',
            platform: os.platform(),
        });

        const electronExtractedPath = path.join(__dirname, 'zip', 'electron', version);

        if (!fs.existsSync(electronExtractedPath)) {
            shelljs.mkdir('-p', electronExtractedPath);
            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: electronExtractedPath }))
                .on('close', async () => {
                    await execTemplate(electronExtractedPath);
                });
        } else {
            console.log('Skip download');
            await execTemplate(electronExtractedPath);
        }
    })
};
