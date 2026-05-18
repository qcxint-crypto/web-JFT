import fs from 'fs'
import path from 'path'

export function getWebsiteRoot() {
  const currentDir = process.cwd()
  const nestedWebsiteDir = path.join(currentDir, 'website')

  // Primary: check for data output directory (present in Vercel deployment and dev)
  // Avoids relying on TypeScript source files (app/) which are absent in builds
  if (fs.existsSync(path.join(nestedWebsiteDir, 'output'))) {
    return nestedWebsiteDir
  }

  if (fs.existsSync(path.join(currentDir, 'output'))) {
    return currentDir
  }

  // Fallback: source-tree detection (local dev without pre-built data)
  if (
    fs.existsSync(path.join(nestedWebsiteDir, 'app')) &&
    fs.existsSync(path.join(nestedWebsiteDir, 'package.json'))
  ) {
    return nestedWebsiteDir
  }

  if (
    fs.existsSync(path.join(currentDir, 'app')) &&
    fs.existsSync(path.join(currentDir, 'package.json'))
  ) {
    return currentDir
  }

  return currentDir
}

export function resolveWebsitePath(...segments: string[]) {
  return path.join(getWebsiteRoot(), ...segments)
}
