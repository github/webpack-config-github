const fs = require('fs')
const path = require('path')

module.exports = () => {
  const cwd = process.cwd()

  const entry = ['./index.js', './src/index.js']
    .map(entry => {
      return path.resolve(cwd, entry)
    })
    .find(filename => {
      return fs.existsSync(filename)
    })

  return {
    entry,
    output: {
      filename: 'dist/bundle.js'
    }
  }
}
