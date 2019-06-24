# Greenworks prebuilds

I'm providing automated builds for greenworks including a combination of Electron, Node.js, NW.js, Mac, Linux and Windows.
Most common versions/abi are built.

# Editing build process
1. Edit [index.js](/index.js) (You should not have to, proceed with caution)
2. Edit either [.travis.yml](/.travis.yml) (Linux/Mac) or [appveyor.yml](/appveyor.yml) (Windows)
3. Bump [package.json](/package.json) with a new version
4. Commit & Push
5. See logs at [Travis](https://travis-ci.com/ElectronForConstruct/greenworks-prebuilds) and [AppVeyor](https://ci.appveyor.com/project/armaldio/greenworks-prebuilds)
6. If you are not satisfied with the result, delete the release and start from `1.`
7. If you are satisfied with the release, publish it from `draft` to `pre-release` or `release` 

## Caution
Not all builds are tested. They may crash or be unavailable.

## Infos
| | |
| - | - |
| Steam SDK version | 1.42 |
| OS | Windows, Mac, Linux |
| Arch | x64 |
| Engine | NW.js, Electron, Node |
| Abi | > 57 |


