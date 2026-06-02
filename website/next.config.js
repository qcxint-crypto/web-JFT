/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    outputFileTracingExcludes: {
      '*': ['public/kosakata-kanji/**/*'],
    },
  },
}

module.exports = nextConfig
