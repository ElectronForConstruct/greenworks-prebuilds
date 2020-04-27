import got from 'got'
import * as fs from 'fs'
import stream from 'stream'
import { promisify } from 'util'
import { Release } from '../models/github'

const pipeline = promisify(stream.pipeline)

const getRepoInfos = () => {
  // @ts-ignore
  const [username, repo] = process.env.TRAVIS_REPO_SLUG.split('/')
  return { username, repo }
}

const auth = () => ({
  token: process.env.GH_TOKEN,
  user: 'armaldio',
})

const createRelease = async (data: any): Promise<Release> => {
  // return new Promise((resolve, reject) => {
  //     gh.create(auth(), getRepoInfos().username, getRepoInfos().repo, data, (err, release) => {
  //         if (err) reject(err)
  //         resolve(release)
  //     })
  // })
  console.log('data', data)
  const releasesURL = `https://api.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/releases`
  return got
    .post(releasesURL, {
      headers: {
        Authorization: `token ${process.env.GH_TOKEN}`,
      },
      body: JSON.stringify(data),
    })
    .json()
}

const listReleases = async (): Promise<Release[]> => {
  const releasesURL = `https://api.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/releases`
  return got(releasesURL).json()
}

const deleteAsset = async (url: string): Promise<any> => got
  .delete(url, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
    },
  })
  .json()

const uploadAsset = async (filePath: string, assetLabel: string, release: Release) => {
  const releaseURL = `https://uploads.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/releases/${release.id}/assets?name=${assetLabel}`

  const file = fs.readFileSync(filePath)

  return got.post(releaseURL, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      // @ts-ignore
      'Content-Length': Buffer.byteLength(file),
    },
    body: file,
  })
}

export {
  deleteAsset, createRelease, listReleases, uploadAsset,
}
