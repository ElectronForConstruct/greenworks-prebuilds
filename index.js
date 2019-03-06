const prebuild = require('prebuild');
const nodeAbi  = require('node-abi');
const execa    = require('execa');

(async () => {

  const prebuildVersion = async ({ runtime, abi }) =>
    new Promise(async (resolve) => {
      try {
        const { stdout } = await execa('npx prebuild', [ '-r', runtime, '-t', abi ], {
          cwd: 'greenworks',
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
        resolve({
          error  : true,
          message: e,
        });
      }
    });

  const supportedTargets  = nodeAbi.supportedTargets;
  const additionalTargets = nodeAbi.additionalTargets;
  const futureTargets     = nodeAbi.futureTargets;

  const everything = supportedTargets.concat(additionalTargets).concat(futureTargets);

  const pms = [];
  for (let i = 0; i < everything.length; i++) {
    let version = everything[ i ];
    await prebuildVersion(version);
  }

})();
