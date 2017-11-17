#!/usr/bin/env node
// usage: webpack-nginx-server
//
// Test production compiled assets served via nginx.

/* @flow */

const {spawn} = require('child_process')
const {resolve} = require('path')

function spawnStream(command, args, options) {
  return new Promise(resolve => {
    const child = spawn(command, args, options)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
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

  const conf = resolve(__dirname, 'nginx.conf')
  code = await spawnStream('nginx', ['-p', process.cwd(), '-c', conf])
  process.exit(code)
})()
