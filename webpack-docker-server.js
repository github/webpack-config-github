#!/usr/bin/env node
// usage: webpack-docker-server
//
// Test production compiled assets served via Docker container.

/* @flow */

const {spawn} = require('child_process')

function spawnStream(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, {stdio: 'inherit'})
    child.on('exit', resolve)
  })
}

;(async function() {
  let code

  code = await spawnStream('webpack', ['--env', 'production'])
  if (code !== 0) {
    process.exit(code)
    return
  }

  code = await spawnStream('docker', ['build', '-t', 'webpack', process.cwd()])
  if (code !== 0) {
    process.exit(code)
    return
  }

  code = await spawnStream('docker', ['run', '--rm', '-it', '-p', '8081:80', 'webpack'])
  process.exit(code)
})()
