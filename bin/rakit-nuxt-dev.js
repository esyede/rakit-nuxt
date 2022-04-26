#!/usr/bin/env node
const { URL } = require('url')
const ON_DEATH = require('death')
const spawn = require('cross-spawn')
const program = require('commander')
const which = require('npm-which')(__dirname)
const utils = require('../src/utils')
const pkg = require('../package.json')

program
  .version(pkg.version)
  .description('Starts the application in development mode (hot-code reloading, error reporting, etc)')
  .option('-p, --port [port]', 'A port number on which to start the application', 8000)
  .option('-H, --hostname [hostname]', 'Hostname on which to start the application', '127.0.0.1')
  .option('--render-path [path]', 'URL path used to render the SPA', '/__rakit_nuxt__')
  .option('--rakit-path [path]', 'Path to rakit directory', process.cwd())
  .parse(process.argv)

const NUXT_PORT = parseInt(program.port)
const RAKIT_PORT = NUXT_PORT + 1

const renderUrl = new URL(program.renderPath, `http://${program.hostname}:${NUXT_PORT}`)

utils.validateConfig()

const nuxt = spawn(
  which.sync('nuxt'),
  ['dev', `-c=${utils.configPath}`, '--spa', `--port=${NUXT_PORT}`, `--hostname=${program.hostname}`],
  {
    env: {
      ...process.env,
      RAKIT_URL: `http://${program.hostname}:${RAKIT_PORT}`,
      RENDER_PATH: renderUrl.pathname
    },
    detached: true
  }
)

const rakit = spawn(
  'php',
  [ 'rakit', 'serve', `--host=${program.hostname}`, `--port=${RAKIT_PORT}`],
  {
    cwd: program.rakitPath,
    env: Object.assign({}, process.env, {
      NUXT_URL: renderUrl,
      APP_URL: `http://${program.hostname}:${NUXT_PORT}`
    }),
    detached: true
  }
)

utils.pipeStdio(nuxt, 'nuxt')
utils.pipeStdio(rakit, 'rakit')

const cleanUp = () => {
  utils.kill(nuxt)
  utils.kill(rakit)
}
utils.exitOnClose([nuxt, rakit], cleanUp)
ON_DEATH(() => {
  cleanUp()
})
