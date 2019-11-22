const { downloadArtifact } = require('@electron/get');
const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const execa = require('execa');

const extractZip = async (extractPath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(extractPath)) {
            shelljs.mkdir('-p', extractPath);
            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: extractPath }))
                .on('close', async () => {
                    resolve(extractPath)
                });
        } else {
            console.log('Skip download');
            resolve(extractPath);
        }
    })
}

const execTemplate = async (extractedPath, libPath, templatePath) => {
    shelljs.mkdir(libPath);
    shelljs.cp('-R', libPath, templatePath);

    const electronBinary = path.join(extractedPath, `electron${process.platform === 'win32' ? '.exe' : ''}`);
    shelljs.chmod('+x', electronBinary);
    return execa(electronBinary, [templatePath]);
}

module.exports = async (version, arch, libPath) => {
    // Where is my template
    const electronTemplatePath = path.join(__dirname, 'template', 'electron');

    // Where is extracted the runtime
    const electronExtractedPath = path.join(__dirname, 'zip', 'electron', version);

    if (fs.existsSync(electronExtractedPath)) {
        // Download the zip binary
        const zipFilePath = await downloadArtifact({
            version,
            arch,
            artifactName: 'electron',
            platform: os.platform(),
        });
            
        // Extract it
        await extractZip(electronExtractedPath);
    }

    // Test it
    return execTemplate(electronExtractedPath, libPath, electronTemplatePath);
};
