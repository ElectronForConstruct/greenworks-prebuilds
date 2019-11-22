const os = require('os');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const got = require('got');
const execa = require('execa');

 const execTemplate = async (extractedPath) => {
    try {
        const libPathTemplate = electronTemplatePath;
        // const libPathTemplate = path.join(electronTemplatePath, 'lib');
        shelljs.mkdir(libPath);
        console.log(`From ${libPath} to ${libPathTemplate}`);
        shelljs.cp('-R', libPath, libPathTemplate);

        console.log('Exec-ing');
        const binaryPath = path.join(extractedPath, `nw${process.platform === 'win32' ? '.exe' : ''}`);
        shelljs.chmod('+x', binaryPath);
        const out = await execa(binaryPath, [electronTemplatePath],
        );
        resolve(out);
    } catch (e) {
        console.error(e);
        reject(e);
        process.exit(1);
    }
};

const download = async (version, arch, os) => {
    return new Promise(async (resolve, reject) => {
        const nwjsExtractedPath = path.join(__dirname, 'zip', 'nwjs', version);

        const file = fs.createWriteStream(`nwjs-sdk-v${version}-${os}-${arch}.zip`);
        const endpoint = `https://dl.nwjs.io/v${version}/nwjs-sdk-v${version}-${os}-${arch}.zip`;
        const response = await got.stream(endpoint).on('downloadProgress', (progress) => {
            console.log('Progress:', progress.percent * 100);
        });
        // console.log('reponse', response);
        response.pipe(file);
        response.on('end', () => {
            if (!fs.existsSync(nwjsExtractedPath)) {
                shelljs.mkdir('-p', nwjsExtractedPath);
                fs.createReadStream(zipFilePath)
                    .pipe(unzipper.Extract({ path: nwjsExtractedPath }))
                    .on('close', async () => {
                        await execTemplate(nwjsExtractedPath);
                        resolve();
                    });
            } else {
                console.log('Skip download');
                await execTemplate(nwjsExtractedPath);
            }


            resolve();
        })
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
    //             const binaryPath = path.join(electronExtractedPath, `electron${process.platform === 'win32' ? '.exe' : ''}`);
    //             shelljs.chmod('+x', binaryPath);
    //             const out = await execa(binaryPath, [electronTemplatePath],
    //             );
    //             resolve(out);
    //         } catch (e) {
    //             console.error(e);
    //             reject(e);
    //             process.exit(1);
    //         }
    //     };
    //
    return download('0.42.0', 'x64', 'win');
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
