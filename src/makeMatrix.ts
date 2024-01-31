/* eslint-disable no-await-in-loop */
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Arch, Os, Runtime } from './models'

const __dirname = dirname(fileURLToPath(import.meta.url))
//
const Archs: Array<Arch> = ['ia32', 'x64', 'arm64']

const Runtimes: Array<Runtime> = ['nw.js', 'electron', 'node']

const OSs: Array<Os> = ['macos-14', 'ubuntu-latest', 'windows-2019']

const run = async (/* release: Release */): Promise<void> => {
  const json: any = {}
  const matrix: any[] = []

  OSs.forEach((os) => {
    Runtimes.forEach((runtime) => {
      Archs.forEach((arch) => {
        if (
          // no 32bits build on mac
          !((os === 'macos-14') && arch === 'ia32')
          // no arm build on linux and windows
          && !((os !== 'macos-14') && arch === 'arm64')
        ) {
          matrix.push({
            runtime,
            arch,
            os,
          })
        }
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
