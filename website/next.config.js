const path = require('path')

const distDir = process.env.NODE_ENV === 'production' ? '.next-build' : '.next-dev'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '..'),
  distDir,
}

module.exports = nextConfig
