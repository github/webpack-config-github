/* @flow */

const fs = require('fs')
const path = require('path')

const CleanWebpackPlugin = require('clean-webpack-plugin')

/*::
type Options = {|
  entries?: string[],
  srcRoot?: string,
  outputPath?: string,
|}
*/

module.exports = (env /*: string */ = 'development', options /*: Options */) => {
  const cwd = process.cwd()

  if (!options.entries) options.entries = []
  options.srcRoot = './src'
  options.outputPath = './dist'

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
    path: path.resolve(cwd, options.outputPath || '')
  }

  config.devtool = env === 'production' ? 'source-map' : 'inline-source-map'

  config.plugins = [new CleanWebpackPlugin([path.resolve(cwd, options.outputPath || '')], {root: cwd})]

  return config
}
