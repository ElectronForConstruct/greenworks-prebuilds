/* eslint-disable no-await-in-loop */
import abis from 'modules-abi'
import fs from 'fs'
import path from 'path'

const Archs = ['ia32', 'x64']

const OSs = ['macos-latest', 'ubuntu-latest']

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

  const json: any = {}
  const matrix: any[] = []
  for (let i = 0; i < everything.length; i += 1) {
    const version = everything[i]

    if (version.abi < 70) {
      // eslint-disable-next-line
      continue
    }

    try {
      OSs.forEach((os) => {
        Archs.forEach((arch) => {
          // add unless 64 bit build on linux
          if (!(version.runtime === 'electron' && version.abi > 64 && os === 'ubuntu-latest')) {
            matrix.push({
              runtime: version.runtime,
              abi: version.abi,
              version: version.version,
              python: '2.7',
              arch,
              os,
            })
          }
        })
      })
    } catch (e) {
      console.log('Unable to build for this version:', e.stdout)
      console.log(e)
    }
  }

  // eslint-disable-next-line
  json.include = matrix

  console.log(json)
  console.log(matrix.length)
  // eslint-disable-next-line
  fs.writeFileSync(path.join(__dirname, '..', 'matrix.json'), JSON.stringify(json), 'utf8')
}

// eslint-disable-next-line
(async () => {
  await run()
})()
