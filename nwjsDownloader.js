const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const got = require('got');
const execa = require('execa');

const download = async (version, arch, os) => {
    const file = fs.createWriteStream(`nwjs-sdk-v${version}-${os}-${arch}.zip`);
    const endpoint = `https://dl.nwjs.io/v${version}/nwjs-sdk-v${version}-${os}-${arch}.zip`;
    const response = await got.stream(endpoint).on('downloadProgress', (progress) => {
        console.log('Progress:', progress.percent * 100);
    });
    // console.log('reponse', response);
    response.pipe(file);
    response.on('exit', () => {
        console.log('exit')
    })
};

module.exports = async (version, arch, libPath) => {
    // const electronTemplatePath = path.join(__dirname, 'template', 'nwjs');
    //
    // return new Promise(async (resolve, reject) => {
    //
    //     const execTemplate = async (electronExtractedPath) => {
    //         try {
    //             const libPathTemplate = electronTemplatePath;
    //             // const libPathTemplate = path.join(electronTemplatePath, 'lib');
    //             shelljs.mkdir(libPath);
    //             console.log(`From ${libPath} to ${libPathTemplate}`);
    //             shelljs.cp('-R', libPath, libPathTemplate);
    //
    //             console.log('Exec-ing');
    //             const electronBinary = path.join(electronExtractedPath, `electron${process.platform === 'win32' ? '.exe' : ''}`);
    //             shelljs.chmod('+x', electronBinary);
    //             const out = await execa(electronBinary, [electronTemplatePath],
    //             );
    //             resolve(out);
    //         } catch (e) {
    //             console.error(e);
    //             reject(e);
    //             process.exit(1);
    //         }
    //     };
    //
    const file = await download('0.42.0', 'x64', 'win');
    //     const zipFilePath = await downloadArtifact({
    //         version,
    //         arch,
    //         artifactName: 'electron',
    //         platform: os.platform(),
    //     });
    //
    //     const electronExtractedPath = path.join(__dirname, 'zip', 'electron', version);
    //
    //     if (!fs.existsSync(electronExtractedPath)) {
    //         shelljs.mkdir('-p', electronExtractedPath);
    //         fs.createReadStream(zipFilePath)
    //             .pipe(unzipper.Extract({ path: electronExtractedPath }))
    //             .on('close', async () => {
    //                 await execTemplate(electronExtractedPath);
    //             });
    //     } else {
    //         console.log('Skip download');
    //         await execTemplate(electronExtractedPath);
    //     }
    // })
};
