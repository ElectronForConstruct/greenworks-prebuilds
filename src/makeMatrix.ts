/* eslint-disable no-await-in-loop */
import os from 'os'
import abis from 'modules-abi'

enum Archs {
  x86 = 'ia32',
  x64 = 'x64',
}

const getUnique = (versions: MbaVersion[], key: keyof MbaVersion): MbaVersion[] => versions
  .map((e) => e[key])
  .map((e, i, final) => final.indexOf(e) === i && i)
  // @ts-ignore
  .filter((e) => versions[e])
  // @ts-ignore
  .map((e) => versions[e])

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

  const matrix = []
  for (let i = 0; i < everything.length; i += 1) {
    const version = everything[i]

    if (version.abi < 70) {
      // eslint-disable-next-line
      continue
    }

    try {
      // await build(version, Archs.x64)
      matrix.push({
        runtime: version.runtime,
        abi: version.abi,
        arch: Archs.x64,
      })

      /* -- Filtering -- */
      if (version.runtime === 'electron' && version.abi > 64 && os.platform() === 'linux') {
        console.warn('Electron deprecated 32bits builds for version > 3.1 on linux. Skipping')
      } else {
        matrix.push({
          runtime: version.runtime,
          abi: version.abi,
          arch: Archs.x86,
        })
        // await build(version, Archs.x86)
      }
    } catch (e) {
      console.log('Unable to build for this version:', e.stdout)
      console.log(e)
    }
  }

  console.log(matrix)
}

try {
  await run()
  console.log('Done')
} catch (e) {
  console.log('Error during build', e)
}
