import fs from 'fs'
import path from 'path'

export function getWebsiteRoot() {
  const currentDir = process.cwd()
  const nestedWebsiteDir = path.join(currentDir, 'website')

  const currentLooksLikeWebsite =
    fs.existsSync(path.join(currentDir, 'app')) &&
    fs.existsSync(path.join(currentDir, 'package.json'))

  const nestedLooksLikeWebsite =
    fs.existsSync(path.join(nestedWebsiteDir, 'app')) &&
    fs.existsSync(path.join(nestedWebsiteDir, 'package.json'))

  if (nestedLooksLikeWebsite) {
    return nestedWebsiteDir
  }

  if (currentLooksLikeWebsite) {
    return currentDir
  }

  return currentDir
}

export function resolveWebsitePath(...segments: string[]) {
  return path.join(getWebsiteRoot(), ...segments)
}
