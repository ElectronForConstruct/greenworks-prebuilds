import { downloadArtifact } from '@electron/get'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { execTemplate, extractZip, getLibPath } from './utils'

export default async function (version, arch) {
    // Where is my template
    const electronTemplatePath = path.join(__dirname, 'template', 'electron')
    console.log('electronTemplatePath', electronTemplatePath)

    // Where is extracted the runtime
    const electronExtractedPath = path.join(__dirname, 'zip', 'electron', version)
    console.log('electronExtractedPath', electronExtractedPath)

    const electronBinary = path.join(electronExtractedPath, `electron${process.platform === 'win32' ? '.exe' : ''}`)
    console.log('electronBinary', electronBinary)

    if (!fs.existsSync(electronBinary)) {
        // Download the zip binary
        const zipFilePath = await downloadArtifact({
            version,
            arch,
            artifactName: 'electron',
            platform: os.platform(),
        })

        // Extract it
        await extractZip(zipFilePath, electronExtractedPath)
    }

    const libPath = getLibPath()

    // Test it
    return execTemplate(electronBinary, libPath, electronTemplatePath)
}
