#!/usr/bin/env node
// usage: webpack-docker-server
//
// Test production compiled assets served via Docker container.

/* @flow */

const {spawn} = require('child_process')

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit'})
    child.on('exit', code => {
      if (code !== 0) {
        process.exit(code)
        reject(new Error('command failed'))
      } else {
        resolve()
      }
    })
  })
}

;(async function() {
  const port = 8081
  const tagName = 'webpack-docker-server'
  await run('webpack', ['--env', 'production'])
  await run('docker', ['build', '--tag', tagName, process.cwd()])
  await run('docker', ['run', '--rm', '--interactive', '--tty', '--publish', `${port}:80`, tagName])
})()
