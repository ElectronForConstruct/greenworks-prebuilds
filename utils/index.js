const path = require('path');
const shelljs = require('shelljs');
const unzipper = require('unzipper');
const execa = require('execa');
const fs = require('fs');

const getLibPath = () => {
    return path.join(process.cwd(), 'greenworks', 'lib');
};

const extractZip = async (from, to) => {
    return new Promise((resolve, reject) => {
        shelljs.mkdir('-p', to);
        fs.createReadStream(from)
            .pipe(unzipper.Extract({path: to}))
            .on('close', async () => {
                return resolve(to);
            });
    });
};

const execTemplate = async (binary, libPath, templatePath, flags = []) => {
    if (!fs.existsSync(libPath)) {
        console.log(`Creating ${libPath}`);
        shelljs.mkdir(libPath);
    }
    console.log(`Creating ${libPath} to ${templatePath}`);
    shelljs.cp('-R', libPath, templatePath);

    console.log(`Chmod ${binary}`);
    shelljs.chmod('+x', binary);
    console.log(`Executing ${binary} [${templatePath}]`);
    return execa(binary, [templatePath, ...flags]);
};

module.exports = {
    getLibPath,
    extractZip,
    execTemplate
};
