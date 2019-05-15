const nodeAbi = require('node-abi');
const execa   = require('execa');
const rebuild = require('electron-rebuild').default;
const path    = require('path');
const os      = require('os');
const fs      = require('fs');
const got     = require('got');
const pkg     = require('./package');
const gh      = require('ghreleases');
const shelljs = require('shelljs');

const greenworks = path.join(__dirname, 'greenworks');

shelljs.rm('-rf', path.resolve(path.join(greenworks, 'bin')));
shelljs.rm('-rf', path.resolve(path.join(greenworks, 'build')));

const auth = {
  token: process.env.GH_TOKEN,
  user : 'armaldio',
};

function getUnique(arr, comp) {

  const unique = arr
    .map(e => e[ comp ])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter(e => arr[ e ]).map(e => arr[ e ]);

  return unique;
}

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

const uploadAsset = async (filePath, assetLabel, release) => {
  const stream   = fs.readFileSync(filePath);

  await got.post(`https://uploads.github.com/repos/ElectronForConstruct/greenworks-prebuilds/releases/${release.id}/assets?name=${assetLabel}`, {
    headers: {
      'Authorization': `token ${process.env.GH_TOKEN}`,
      'Content-Type' : 'application/octet-stream',
    },
    body   : stream,
  });
};

const getRelease = async () => {
  const releases = await listReleases();
  const release  = releases.find(release => release.draft && release.tag_name === `v${pkg.version}`);

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

  return newRelease;
};

const electronRebuild = async (target) => {
  const { stdout } = await execa(
    path.resolve(
      path.join(
        __dirname, 'node_modules', '.bin', `node-gyp${os.platform() === 'win32' ? '.cmd' : ''}`,
      ),
    ),
    [
      'rebuild',
      '--release',
      `--target=${target}`,
      '--arch=x64',
      '--dist-url=https://atom.io/download/electron',
      '--build-from-source',
    ], {
      cwd: greenworks,
    });
};

const buildElectron = async (version, release) => {
  const { target, abi } = version;

  const assetLabel = `greenworks-${os.platform()}-${os.arch()}-v${abi}.node`;

  const assetExist = release.assets.find(asset => asset.name === assetLabel);
  if (assetExist) {
    console.log('Asset already exists, skipping');
    return;
  }

  await electronRebuild(target);

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
  const filePath        = path.resolve(path.join(greenworks, 'build', 'Release', name));

  if (!fs.existsSync(filePath))
  {
    console.log(`File ${filePath} not found!`);
    return;
  }

  // shelljs.mv(filePath, filePathRenamed);

  try {
    await uploadAsset(filePath, assetLabel, release);
    console.log('Upload done');
  } catch (e) {
    console.log('Error while uploading asset:');
    const json = JSON.parse(e.body);
    if (json.errors && json.errors[ 0 ] && json.errors[ 0 ].code === 'already_exists')
      console.log('Asset already exists');
    else
      console.log(json);
  }
};

const run = async (release) => {
  let everything = nodeAbi.supportedTargets.concat(nodeAbi.additionalTargets).concat([
    // {runtime: 'electron', abi: '5.0.0-beta.6'}
  ]);

  const electronTargets = getUnique(everything.filter(entry => entry.runtime === 'electron'), 'abi');
  const nodeTargets     = getUnique(everything.filter(entry => entry.runtime === 'node'), 'abi');
  const nwjsTargets     = getUnique(everything.filter(entry => entry.runtime === 'node-webkit'), 'abi');

  everything = electronTargets.concat(nodeTargets).concat(nwjsTargets);

  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];

    if (version.abi < 57)
      continue;

    console.log(`${version.runtime}@v${version.abi}: `);
    console.log('Building...');
    switch (version.runtime) {
      case 'electron':
        await buildElectron(version, release);
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
    console.log();
  }
};

console.log('Fetching releases...');
getRelease().then(async release => {
  console.log('Started building...');
  console.log();

  await run(release);
}).then(() => {
  console.log('Done');
}).catch(e => {
  console.log('There was an error', e);
});


