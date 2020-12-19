/* eslint-disable no-await-in-loop */
import fs from 'fs'
import path from 'path'
//
const Archs = ['ia32', 'x64']

const Runtimes = ['nw.js', 'electron', 'node']

const OSs = ['macos-latest', 'ubuntu-latest', 'windows-latest']

const run = async (/* release: Release */): Promise<void> => {
  /* let everything = await abis.getAll()

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
          if (
            (version.runtime === 'electron' && os === 'macos-latest' && arch === 'ia32')
          ) {
            // console.log('pass')
          } else {
            matrix.push({
              runtime: version.runtime,
              abi: version.abi,
              version: version.version,
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
  } */

  const json: any = {}
  const matrix: any[] = []

  OSs.forEach((os) => {
    Runtimes.forEach((runtime) => {
      Archs.forEach((arch) => {
        matrix.push({
          runtime,
          arch,
          os,
        })
      })
    })
  })

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
