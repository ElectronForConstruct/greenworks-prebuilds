/* eslint-disable no-await-in-loop */
const execa = require('execa');
// const rebuild = require('electron-rebuild').default;
const path = require('path');
const os = require('os');
const fs = require('fs');
const shelljs = require('shelljs');
// const semver = require('semver');
const abis = require('modules-abi');
const pkg = require('./package');
// const electronDownload = require('./electronDownloader');
const nwjsDownloader = require('./nwjsDownloader');
const {
  uploadAsset, listReleases, createRelease, deleteAsset,
} = require('./utils/gh');

const greenworks = path.join(__dirname, 'greenworks');

shelljs.rm('-rf', path.resolve(path.join(greenworks, 'bin')));
shelljs.rm('-rf', path.resolve(path.join(greenworks, 'build')));

const getUnique = (arr, comp) => arr
  .map((e) => e[comp])
  .map((e, i, final) => final.indexOf(e) === i && i)
  .filter((e) => arr[e]).map((e) => arr[e]);

function getBinaryName(arch) {
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
    default:
      break;
  }

  name += `${arch === 'ia32' ? '32' : '64'}.node`;
  return path.resolve(path.join(greenworks, 'build', 'Release', name));
}

/**
 * Get release or create one based on the branch and the version from the package.json
 * @return {Promise<unknown>}
 */
const getRelease = async () => {
  const releases = await listReleases();

  let branch;
  if (process.env.APPVEYOR_REPO_BRANCH) {
    branch = process.env.APPVEYOR_REPO_BRANCH;
  } else if (process.env.TRAVIS_BRANCH) {
    branch = process.env.TRAVIS_BRANCH;
  } else {
    branch = 'unknown';
  }

  const tagName = `v${pkg.version}${branch === 'master' ? '' : `-${branch}`}`;
  const release = releases.find((r) => r.tag_name === tagName);

  if (release) {
    console.log('Release exist, skipping');
    return release;
  }

  console.log('Release not found, creating...');
  const data = {
    tag_name: tagName,
    name: tagName,
    draft: true,
    prerelease: false,
  };

  return createRelease(data);
};

const upload = async (assetLabel, release, arch) => {
  console.log(`Done ${assetLabel}`);

  const filePath = getBinaryName(arch);
  shelljs.ls(path.dirname(filePath));

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`);
    return undefined;
  }

  try {
    const assetExist = release.assets.find((asset) => asset.name === assetLabel);
    if (assetExist) {
      console.log('Asset already exists !\nDeleting');
      await deleteAsset(assetExist.url);
    }
  } catch (e) {
    console.log('Error while deleting asset:');
    const json = JSON.parse(e.body);

    console.log('travis_fold:start:error');
    console.log(json);
    console.log('travis_fold:end:error');
  }

  try {
    await uploadAsset(filePath, assetLabel, release);
    console.log('Upload done');
  } catch (e) {
    console.log('Error while uploading asset:');
    console.log(e);
    console.log(e.response.body);
    console.log(e.response.error);
    const json = JSON.parse(e.body);
    if (json.errors && json.errors[0] && json.errors[0].code === 'already_exists') {
      console.log('Asset already exists');
    } else {
      console.log('travis_fold:start:error');
      console.log(json);
      console.log('travis_fold:end:error');
    }
  }

  return true;
};

const electronRebuild = async (target, arch, assetLabel, release) => {
  await execa(
    path.resolve(
      path.join(
        __dirname, 'node_modules', '.bin', `node-gyp${os.platform() === 'win32' ? '.cmd' : ''}`,
      ),
    ),
    [
      'rebuild',
      '--release',
      `--target=${target}`,
      `--arch=${arch}`,
      '--dist-url=https://electronjs.org/headers',
      '-j',
    ], {
      cwd: greenworks,
    },
  );

  // const out = await electronDownload(target, arch);
  // if (!out.stdout.includes(
  // 'Error on initializing steam API. Error: Steam initialization failed. Steam is not running.')
  // ) {
  //     console.log('Test failed!');
  //     console.log(out.stdout);
  // } else {
  //     await upload(assetLabel, release, arch);
  // }
  await upload(assetLabel, release, arch);
};

const nodeRebuild = async (target, arch, assetLabel, release) => {
  await execa(
    path.resolve(
      path.join(
        __dirname, 'node_modules', '.bin', `node-gyp${os.platform() === 'win32' ? '.cmd' : ''}`,
      ),
    ),
    [
      'rebuild',
      '--release',
      `--target=${target}`,
      `--arch=${arch}`,
      '-j',
    ], {
      cwd: greenworks,
    },
  );

  await upload(assetLabel, release, arch);
};

const nwjsRebuild = async (target, arch, assetLabel, release) => {
  await execa(
    path.resolve(
      path.join(
        __dirname, 'node_modules', '.bin', `nw-gyp${os.platform() === 'win32' ? '.cmd' : ''}`,
      ),
    ),
    [
      'rebuild',
      '--release',
      `--target=${target}`,
      `--arch=${arch}`,
      '-j',
    ], {
      cwd: greenworks,
    },
  );


  const out = await nwjsDownloader(target, arch);
  if (
    out.stderr.includes(
      'Error on initializing steam API. Error: Steam initialization failed. Steam is not running.',
    )
      || out.ok
  ) {
    await upload(assetLabel, release, arch);
  } else {
    console.log('Test failed!');
    console.log(out.stderr);
  }
  // await upload(assetLabel, release, arch);
};

const build = async (module, release, arch) => {
  const { version, abi, runtime } = module;

  console.log(`
**************
*
*   v${version}@${abi} - ${runtime} - ${arch}
*
* ---`);

  const assetLabel = `greenworks-${runtime}-v${abi}-${os.platform()}-${arch}.node`;

  switch (runtime) {
    case 'electron':
      await electronRebuild(version, arch, assetLabel, release);
      break;

    case 'nw.js':
      await nwjsRebuild(version, arch, assetLabel, release);
      break;

    case 'node':
      await nodeRebuild(version, arch, assetLabel, release);
      break;

    default:
      console.log('Unsupported runtime, use one of electron, node-webkit, node');
      return;
  }

  console.log(`
* ---
*
*   v${version}@${abi} - ${runtime} - ${arch}
*
**************


`);
};

const run = async (release) => {
  let everything = await abis.getAll();

  const electronTargets = getUnique(everything.filter((entry) => entry.runtime === 'electron'), 'abi');
  const nwjsTargets = getUnique(everything.filter((entry) => entry && entry.runtime === 'nw.js'), 'abi');
  const nodeTargets = getUnique(everything.filter((entry) => entry.runtime === 'node'), 'abi');

  everything = electronTargets.concat(nwjsTargets).concat(nodeTargets);

  for (let i = 0; i < everything.length; i += 1) {
    const version = everything[i];

    if (version.abi < 57) {
      // eslint-disable-next-line
            continue;
    }

    console.log(`${version.runtime}@v${version.abi}: `);
    console.log('Building...');

    const archs = ['x64', 'ia32'];

    for (let j = 0; j < archs.length; j += 1) {
      const arch = archs[j];

      /* -- Filtering -- */
      if (version.runtime === 'electron' && version.abi > 64 && arch === 'ia32') {
        console.warn('Electron deprecated 32bits builds for version > 3.1. Skipping');
        // eslint-disable-next-line
        continue;
      }

      // / if (version.runtime !== 'nw.js') {
      //     continue;
      // }
      //
      // if (version.abi !== 77) {
      //     continue;
      // }
      /* -- Filtering -- */

      try {
        await build(version, release, arch);
      } catch (e) {
        console.log('travis_fold:start:error');
        console.log('Unable to build for this version:', e.stdout);
        console.log('travis_fold:end:error');
      }
    }

    console.log();
  }
};

(async () => {
  let release;
  try {
    console.log('Jobs available:', process.env.JOBS);
    release = await getRelease();
  } catch (e) {
    console.log('Error getting release', e);
  }

  try {
    await run(release);
    console.log('Done');
  } catch (e) {
    console.log('Error during build', e);
  }
})();
