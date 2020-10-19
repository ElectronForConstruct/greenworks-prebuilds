/* eslint-disable no-await-in-loop */
import execa from 'execa'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import abis from 'modules-abi'
// const electronDownload = import './electronDownloader')
// const nwjsDownloader = import './nwjsDownloader')

require('dotenv').config()
// eslint-disable-next-line
require('source-map-support').install()

const GREENWORKS_ROOT = path.join(__dirname, '..', 'greenworks')
const ARTIFACTS_ROOT = path.join(__dirname, '..', 'artifacts')

const getUnique = (versions: MbaVersion[], key: keyof MbaVersion): MbaVersion[] => versions
  .map((e) => e[key])
  .map((e, i, final) => final.indexOf(e) === i && i)
  // @ts-ignore
  .filter((e) => versions[e])
  // @ts-ignore
  .map((e) => versions[e])

function getBinaryName(arch: 'ia32' | 'x64'): string {
  let name = 'greenworks-'

  switch (os.platform()) {
    case 'win32':
      name += 'win'
      break
    case 'darwin':
      name += 'osx'
      break
    case 'linux':
      name += 'linux'
      break
    default:
      break
  }

  name += `${arch === 'ia32' ? '32' : '64'}.node`
  return path.resolve(path.join(GREENWORKS_ROOT, 'build', 'Release', name))
}

/**
 * Get release or create one based on the branch and the version from the package.json
 */
/* const getRelease = async (): Promise<Release> => {
  const releases = await listReleases();

  let branch: string;
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

  console.log(`Release not found, creating ${tagName} ...`);
  const data = {
    tag_name: tagName,
    name: tagName,
    draft: true,
    prerelease: false,
  };

  return createRelease(data);
}; */

/* const upload = async (assetLabel, release, arch) => {
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
}; */

const electronRebuild = async (
  target: string,
  arch: Archs,
): Promise<void> => {
  const { stderr, stdout } = await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os.platform() === 'win32' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${target}`,
      `--arch=${arch}`,
      '--dist-url=https://electronjs.org/headers',
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nodeRebuild = async (
  target: string,
  arch: Archs,
): Promise<void> => {
  await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os.platform() === 'win32' ? '.cmd' : ''}`),
    ),
    ['rebuild', '--release', `--target=${target}`, `--arch=${arch}`],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nwjsRebuild = async (
  target: string,
  arch: Archs,
): Promise<void> => {
  await execa(
    path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', `nw-gyp${os.platform() === 'win32' ? '.cmd' : ''}`)),
    ['rebuild', '--release', `--target=${target}`, `--arch=${arch}`],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const build = async (module: MbaVersion, arch: Archs): Promise<void> => {
  const { version, abi, runtime } = module

  console.log(`
**************
*
*   v${version}@${abi} - ${runtime} - ${arch}
*
* ---`)

  const assetLabel = `greenworks-${runtime}-v${abi}-${os.platform()}-${arch}.node`

  switch (runtime) {
    case 'electron':
      await electronRebuild(version, arch)
      break

    case 'nw.js':
      await nwjsRebuild(version, arch)
      break

    case 'node':
      await nodeRebuild(version, arch)
      break

    default:
      console.log('Unsupported runtime, use one of electron, node-webkit, node')
      return
  }

  const filePath = getBinaryName(arch)

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`)
    return
  }

  const dest = path.join(ARTIFACTS_ROOT, assetLabel)

  fs.copy(filePath, dest)

  console.log(`
* ---
*
*   v${version}@${abi} - ${runtime} - ${arch}
*
**************


`)
}

enum Archs {
  x86 = 'ia32',
  x64 = 'x64',
}

const run = async (/* release: Release */): Promise<void> => {
  let everything = await abis.getAll()

  const electronTargets = getUnique(
    everything.filter((entry) => entry.runtime === 'electron'),
    'abi',
  )
  const nwjsTargets = getUnique(
    everything.filter((entry) => entry && entry.runtime === 'nw.js'),
    'abi',
  )
  const nodeTargets = getUnique(
    everything.filter((entry) => entry.runtime === 'node'),
    'abi',
  )

  everything = electronTargets.concat(nwjsTargets).concat(nodeTargets)

  for (let i = 0; i < everything.length; i += 1) {
    const version = everything[i]

    if (version.abi < 70) {
      // eslint-disable-next-line
      continue
    }

    console.log(`${version.runtime}@v${version.abi}: `)
    console.log('Building...')

    try {
      await build(version, Archs.x64)

      /* -- Filtering -- */
      if (version.runtime === 'electron' && version.abi > 64 && os.platform() === 'linux') {
        console.warn('Electron deprecated 32bits builds for version > 3.1 on linux. Skipping')
      } else {
        await build(version, Archs.x86)
      }
    } catch (e) {
      console.log('travis_fold:start:error')
      console.log('Unable to build for this version:', e.stdout)
      console.log(e)
      console.log('travis_fold:end:error')
    }

    console.log()
  }
};
(async (): Promise<void> => {
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'bin')))
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'build')))
  await fs.ensureDir(ARTIFACTS_ROOT)

  try {
    await run()
    console.log('Done')
  } catch (e) {
    console.log('Error during build', e)
  }
})()
