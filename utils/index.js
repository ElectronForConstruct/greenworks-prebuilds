const path = require('path');
const shelljs = require('shelljs');
const unzipper = require('unzipper');
const tar = require('tar');
const execa = require('execa');
const fs = require('fs');

const getLibPath = () => {
    return path.join(process.cwd(), 'greenworks', 'lib');
};

const extractTar = async (from, to) => {
    shelljs.mkdir('-p', to);

    console.log('all files with be outputted to ', to);

    return tar.extract({
        file: from,
        cwd: to
    });
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

const extractArchive = async (from, to) => {
    const type = path.extname(from);

    console.log('archive of type', type);

    if (type === '.tar.gz' || type === '.gz') {
        return extractTar(from, to);
    } else if (type === '.zip') {
        return extractZip(from, to);
    } else {
        console.log('File type not recognized!');
    }
};

const execTemplate = async (binary, libPath, templatePath, flags = []) => {
    console.log('Content of binary path parent directory');
    shelljs.ls('-R', path.dirname(binary)).forEach(function (file) {
        console.log('file', file);
    });

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
    extractTar,
    extractArchive,
    execTemplate
};
