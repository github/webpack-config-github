const fs = require('fs')
const path = require('path')

module.exports = () => {
  const cwd = process.cwd()

  const indexEntry = ['./index.js', './src/index.js']
    .map(entry => path.resolve(cwd, entry))
    .find(filename => fs.existsSync(filename))

  return {
    entry: {
      index: indexEntry
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(cwd, 'dist')
    }
  }
}
