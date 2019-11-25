const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const got = require('got');
const {getLibPath, extractZip, execTemplate} = require('./utils');


const download = async (version, arch, os) => {
    console.log(version, arch, os);

    const assoc = {
        win32: 'win',
        darwin: 'osx',
        linux: 'linux'
    };

    return new Promise(async (resolve, reject) => {
        const nwjsTempZip = path.join(process.cwd(), `nwjs-sdk-v${version}-${assoc[os]}-${arch}.zip`);

        if (fs.existsSync(nwjsTempZip)) {
            console.log('zip already exist');
            return resolve(nwjsTempZip);
        }

        try {
            const file = fs.createWriteStream(nwjsTempZip);
            const endpoint = `https://dl.nwjs.io/v${version}/nwjs-sdk-v${version}-${assoc[os]}-${arch}.zip`;
            const response = got.stream(endpoint);
            // .on('downloadProgress', (progress) => {
            //     console.log('Progress:', progress.percent * 100);
            // });
            // console.log('response', response);
            response.pipe(file);
            response.on('end', () => {
                console.log('resolving');
                return resolve(nwjsTempZip);
            });
        }catch (e) {
            reject(e);
        }
    });
};

module.exports = async (version, arch) => {
    const assoc = {
        win32: 'win',
        darwin: 'osx',
        linux: 'linux'
    };

    // Where is my template
    const nwjsTemplatePath = path.join(__dirname, 'template', 'nwjs');
    console.log('nwjsTemplatePath', nwjsTemplatePath);

    // Where is extracted the runtime
    const nwjsExtractedPath = path.join(__dirname, 'zip', 'nwjs', version);
    console.log('nwjsExtractedPath', nwjsExtractedPath);

    const nwjsBinary = path.join(nwjsExtractedPath, `nwjs-sdk-v${version}-${assoc[os.platform()]}-${arch}`, `nw${process.platform === 'win32' ? '.exe' : ''}`);
    console.log('nwjsBinary', nwjsBinary);

    if (!fs.existsSync(nwjsBinary)) {

        // Download the zip binary
        const zipFilePath = await download(version, arch, os.platform());

        console.log('zipFilePath', zipFilePath);

        // Extract it
        await extractZip(zipFilePath, nwjsExtractedPath);

        const nwjsExtractedRoot = path.join(nwjsExtractedPath, path.basename(zipFilePath, '.zip'));
        console.log('nwjsExtractedRoot', nwjsExtractedRoot);
    }

    const libPath = getLibPath();

    // Test it
    return execTemplate(nwjsBinary, libPath, nwjsTemplatePath, ['--enable-logging=stderr']);
};
