const fs = require('fs')
const path = require('path')

module.exports = () => {
  const cwd = process.cwd()

  const entry = ['./index.js', './src/index.js']
    .map(entry => path.resolve(cwd, entry))
    .find(filename => fs.existsSync(filename))

  return {
    entry,
    output: {
      filename: 'dist/bundle.js'
    }
  }
}
