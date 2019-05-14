const nodeAbi = require('node-abi');
const execa   = require('execa');
const rebuild = require('electron-rebuild').default;
const path    = require('path');
const os      = require('os');
const fs      = require('fs');
const got     = require('gh-got');
const pkg     = require('./package');
const gh      = require('ghreleases');

const greenworks = path.join(__dirname, 'greenworks');
const auth       = {
  token: process.env.GH_TOKEN,
  user : 'armaldio',
};

/*
const { stdout } = await execa('.\\node_modules\\.bin\\electron-rebuild', [ 'prebuild', '-r', runtime, '-t', abi ], {
  cwd: dir,
});
*/

const createRelease = async (data) => {
  return new Promise((resolve, reject) => {
    gh.create(auth, 'ElectronForConstruct', 'greenworks-prebuilds', data, (err, release) => {
      if (err) reject(err);
      resolve(release);
    });
  });
};

const listReleases = async () => {
  return new Promise((resolve, reject) => {
    gh.list(auth, 'ElectronForConstruct', 'greenworks-prebuilds', (err, list) => {
      if (err) reject(err);
      resolve(list);
    });
  });
};

const uploadAsset = async (filePath, releaseId) => {
  return new Promise((resolve, reject) => {
    const files = [
      filePath,
    ];
    gh.uploadAssets(auth, 'ElectronForConstruct', 'greenworks-prebuilds', releaseId, files, (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getRelease = async () => {
  try {
    const releases = await listReleases();
    const release  = releases.find(release => release.draft && release.tag_name === `v${pkg.version}`);

    console.log(release);

    if (release) {
      console.log('Release exist, skipping');
      return release;
    }
    console.log('Release not found, creating...');
    const data = {
      'tag_name'  : `v${pkg.version}`,
      'name'      : `v${pkg.version}`,
      'draft'     : true,
      'prerelease': false,
    };

    const newRelease = await createRelease(data);
    console.log(newRelease);

    return newRelease;
  } catch (e) {
    console.log(e);
  }
};

async function buildElectron(version, release) {
  const { target, abi } = version;

  try {
    await rebuild({
      buildPath      : path.resolve(greenworks),
      electronVersion: target,
    });
    const assetLabel = `greenworks-${os.platform()}-${os.arch()}-v${abi}.node`;
    console.log(`Done ${assetLabel}`);

    let name = 'greenworks-';

    switch (os.platform()) {
      case 'win32':
        name += 'win';
        break;
      case 'darwin':
        name += 'osx';
        break;
      case 'linux':
        name += 'linux';
        break;
    }

    name += os.arch().slice(1) + '.node';
    const filePath        = path.join(greenworks, 'build', 'Release', name);
    const filePathRenamed = path.join(greenworks, 'build', 'Release', assetLabel);

    fs.renameSync(filePath, filePathRenamed);
    const upload = await uploadAsset(filePathRenamed, release.id);
    console.log('Upload done');
    return filePath;
  } catch (e) {
    console.log(e);
    throw e;
  }
}

const run = async (release) => {
  const supportedTargets  = nodeAbi.supportedTargets;
  const additionalTargets = nodeAbi.additionalTargets;
  const unofficialTargets = [
    // {runtime: 'electron', abi: '5.0.0-beta.6'}
  ];

  const everything = supportedTargets.concat(additionalTargets).concat(unofficialTargets);

  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];

    if (version.abi < 64)
      continue;

    console.log(`${version.runtime}@v${version.abi}: `);
    try {
      let filePath = '';

      switch (version.runtime) {
        case 'electron':
          filePath = await buildElectron(version, release);
          break;

        case 'node-webkit':
          console.log('NW.js is currently not supported');
          break;

        case 'node':
          console.log('Node.js is currently not supported');
          break;

        default:
          console.log('Unsupported runtime, use one of electron, node-webkit, node');
          break;
      }
    } catch (e) {
      console.log('There was an error building ', version);
    }
    console.log();
  }
};

getRelease().then(async release => {
  const r = await run(release);

  console.log('Done');
}).catch(e => {
  console.log(e);
});


