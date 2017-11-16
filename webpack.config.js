const fs = require('fs')
const path = require('path')

module.exports = (env, options) => {
  const cwd = process.cwd()

  if (!options) options = {}
  if (!options.entries) options.entries = []
  options.srcRoot = './src'

  const entry = {}

  for (const name of options.entries) {
    entry[name] = path.resolve(cwd, options.srcRoot, `${name}.js`)
  }

  const indexEntry = ['./index.js', `${options.srcRoot}/index.js`]
    .map(entry => path.resolve(cwd, entry))
    .find(filename => fs.existsSync(filename))
  if (indexEntry) entry.index = indexEntry

  return {
    entry,
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(cwd, 'dist')
    }
  }
}
