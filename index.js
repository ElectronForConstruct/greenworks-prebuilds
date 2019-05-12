const nodeAbi = require('node-abi');
const execa   = require('execa');
const rebuild = require('electron-rebuild').default;
const path = require('path');
const shelljs = require('shelljs');
const os = require('os');

console.log(rebuild);

const dir = 'greenworks';

console.log(`Building in ${dir}`);

/*
const { stdout } = await execa('.\\node_modules\\.bin\\electron-rebuild', [ 'prebuild', '-r', runtime, '-t', abi ], {
    cwd: dir,
  });
 */

const greenworks = path.join(__dirname, 'greenworks');
const bin = path.join(__dirname, 'bin');

shelljs.mkdir('-p', bin);

async function buildElectron(version) {
  const { target, abi } = version;

  try {
    await rebuild({
      buildPath      : path.resolve(greenworks),
      electronVersion: target,
    });
    shelljs.cp(path.join(greenworks, 'build', 'Release', '*.node'), path.join(bin, `greenworks-${os.platform()}-${os.arch()}-v${abi}.node`))
    console.log(`Done greenworks-${os.platform()}-${os.arch()}-v${abi}.node`);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

const run = async () => {
  const supportedTargets  = nodeAbi.supportedTargets;
  const additionalTargets = nodeAbi.additionalTargets;
  const unofficialTargets = [
    // {runtime: 'electron', abi: '5.0.0-beta.6'}
  ];

  const everything = supportedTargets.concat(additionalTargets).concat(unofficialTargets);

  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];

    console.log(`${version.runtime}@v${version.abi}: `);
    try {
      switch (version.runtime) {
        case 'electron':
          await buildElectron(version);
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
      // const ret = await prebuildVersion(version);
      // if (ret.error) console.error(ret.message);
      /* else */
    } catch (e) {
      console.log('There was an error building ', version);
    }
    console.log();
  }
};

run().then(() => {
  console.log('done.');
});
