import path from 'path'
import unzipper from 'unzipper'
import tar from 'tar'
import { execa } from 'execa'
import fs from 'fs-extra'
import os from 'os'

const getLibPath = (): string => path.join(process.cwd(), 'greenworks', 'lib')

const extractTar = async (from: string, to: string): Promise<any> => {
  await fs.ensureDir(to)

  console.log('all files with be outputted to ', to)

  return tar.extract({
    file: from,
    cwd: to,
  })
}

const extractZip = async (from: string, to: string): Promise<any> => new Promise((resolve) => {
  fs.ensureDirSync(to)
  fs.createReadStream(from)
    .pipe(unzipper.Extract({ path: to }))
    // eslint-disable-next-line
    // @ts-ignore
    .on('close', async () => resolve(to))
})

const extractArchive = async (from: string, to: string): Promise<any> => {
  const type = path.extname(from)

  console.log('archive of type', type)

  if (type === '.tar.gz' || type === '.gz') {
    return extractTar(from, to)
  }
  if (type === '.zip') {
    return extractZip(from, to)
  }
  console.log('File type not recognized!')
  return null
}

const execTemplate = async (
  binary: string,
  libPath: string,
  templatePath: string,
  flags: string[] = [],
): Promise<any> => {
  console.log('Content of binary path parent directory')
  //   if (os.platform() === 'darwin') {
  //     shelljs.ls('-R', path.dirname(binary)).forEach((file) => {
  //       console.log('file', file)
  //     })
  //   }

  if (!fs.existsSync(libPath)) {
    console.log(`Creating ${libPath}`)
    await fs.ensureDir(libPath)
  }
  console.log(`Creating ${libPath} to ${templatePath}`)
  await fs.copy(libPath, templatePath)

  console.log(`Chmod ${binary}`)
  await fs.chmod(binary, '755')
  console.log(`Executing ${binary} [${templatePath}, ${flags.join(', ')}]`)
  return execa(binary, [templatePath, ...flags])
}

export {
  getLibPath, extractZip, extractTar, extractArchive, execTemplate,
}
