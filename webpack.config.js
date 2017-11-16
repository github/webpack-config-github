const fs = require('fs')
const path = require('path')

module.exports = (env = 'development', options = {}) => {
  const cwd = process.cwd()

  if (!options.entries) options.entries = []
  options.srcRoot = './src'

  const config = {}

  config.entry = {}

  for (const name of options.entries) {
    config.entry[name] = path.resolve(cwd, options.srcRoot, `${name}.js`)
  }

  const indexEntry = ['./index.js', `${options.srcRoot}/index.js`]
    .map(entry => path.resolve(cwd, entry))
    .find(filename => fs.existsSync(filename))
  if (indexEntry) config.entry.index = indexEntry

  config.output = {
    filename: '[name].bundle.js',
    path: path.resolve(cwd, 'dist')
  }

  config.devtool = env === 'production' ? 'source-map' : 'inline-source-map'

  return config
}
