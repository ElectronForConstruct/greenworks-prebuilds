/* eslint-disable no-await-in-loop */
import execa from 'execa'
import path from 'path'
import fs from 'fs-extra'
import mri from 'mri'
// const electronDownload = import './electronDownloader')
// const nwjsDownloader = import './nwjsDownloader')

// eslint-disable-next-line
require('dotenv').config()
// eslint-disable-next-line
require('source-map-support').install()

interface Args {
  abi: string;
  os: string;
  runtime: string;
  arch: string;
  version: string;
  python: string;
}

const GREENWORKS_ROOT = path.join(__dirname, '..', 'greenworks')
const ARTIFACTS_ROOT = path.join(__dirname, '..', 'artifacts')

const argv = process.argv.slice(2)
const args = mri(argv)

const association = {
  'ubuntu-latest': 'linux',
  'windows-latest': 'windows',
  'macos-latest': 'macos',
}

const {
  abi, os, runtime, arch, version, python,
}: any = args

const pythonPath = path.join(python, 'bin/python')

function getBinaryName(arch: 'ia32' | 'x64'): string {
  let name = 'greenworks-'

  switch (os) {
    case 'windows-latest':
      name += 'win'
      break
    case 'macos-latest':
      name += 'osx'
      break
    case 'ubuntu-latest':
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

const electronRebuild = async (): Promise<void> => {
  const { stderr, stdout } = await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${version}`,
      `--arch=${arch}`,
      '--dist-url=https://electronjs.org/headers',
      `--python=${pythonPath}`,
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nodeRebuild = async (): Promise<void> => {
  await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    ['rebuild', '--release', `--target=${version}`, `--arch=${arch}`, `--python=${pythonPath}`, '--build_v8_with_gn=false'],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nwjsRebuild = async (): Promise<void> => {
  await execa(
    path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', `nw-gyp${os === 'windows-latest' ? '.cmd' : ''}`)),
    ['rebuild', '--release', `--target=${version}`, `--arch=${arch}`, `--python=${pythonPath}`],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const build = async (): Promise<void> => {
  console.log(`v${version}@${abi} - ${runtime} - ${arch}`)

  // @ts-ignore
  const assetLabel = `greenworks-${runtime}-v${abi}-${association[os]}-${arch}.node`

  switch (runtime) {
    case 'electron':
      await electronRebuild()
      break

    case 'nw.js':
      await nwjsRebuild()
      break

    case 'node':
      await nodeRebuild()
      break

    default:
      console.log('Unsupported runtime, use one of electron, node-webkit, node')
      return
  }

  const filePath = getBinaryName(arch)

  console.log('filePath', filePath)

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`)
    return
  }

  const dest = path.join(ARTIFACTS_ROOT, assetLabel)

  console.log('dest', dest)

  await fs.copy(filePath, dest)
}

(async (): Promise<void> => {
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'bin')))
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'build')))
  await fs.ensureDir(ARTIFACTS_ROOT)

  try {
    await build()
    console.log('Done')
  } catch (e) {
    console.log('Error during build', e)
    process.exit(1)
  }
})()
