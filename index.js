const nodeAbi  = require('node-abi');
const execa    = require('execa');

const dir = 'greenworks';

console.log(`Building in ${dir}`);

const prebuildVersion = async ({ runtime, abi }) => {
  return new Promise(async (resolve) => {
    try {
      console.log(`Building ${runtime}@v${abi}`);
      const { stdout } = await execa('npx', ['prebuild', '-r', runtime, '-t', abi, '--strip' ], {
        cwd: dir,
      });
      resolve({
        error  : false,
        message: 'ok',
      });
    } catch (e) {
      resolve({
        error  : true,
        message: e,
      });
    }
  })
};

const run = async () => {
  const supportedTargets  = nodeAbi.supportedTargets;
  const additionalTargets = nodeAbi.additionalTargets;

  const everything = supportedTargets.concat(additionalTargets);

  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];

    const ret = await prebuildVersion(version);

    if (ret.error) console.error(ret.message);
    else console.log(`${version.runtime}@v${version.abi}: ${ret.message}`);
  }

};

run().then(() => {
  console.log('done.');
});
