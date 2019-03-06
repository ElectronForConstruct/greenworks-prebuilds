const prebuild = require('prebuild');
const nodeAbi  = require('node-abi');
const execa    = require('execa');
const fs       = require('fs');

const dir = 'greenworks';

console.log(`Building in ${dir}`);

const prebuildVersion = async ({ runtime, abi }) => {
  return new Promise(async (resolve) => {
    try {
      console.log(`Building ${runtime}@v${abi}`);
      const { stdout } = await execa('npx prebuild', [ '-r', runtime, '-t', abi ], {
        cwd: dir,
      });
      console.log(stdout);
      resolve({
        error  : false,
        message: {
          runtime,
          abi,
        },
      });
    } catch (e) {
      console.log(e);
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
  const futureTargets     = nodeAbi.futureTargets;

  const everything = supportedTargets.concat(additionalTargets).concat(futureTargets);

  const pms = [];
  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];

    const ret = await prebuildVersion(version);

    if (ret.error) console.error(ret.error);
    else console.log(ret.message);
  }

};

run().then(() => {
  console.log('done.');
});
