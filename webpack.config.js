/* @flow */

const fs = require('fs')
const path = require('path')

const {optimize} = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/*::
type Options = {|
  entries?: string[],
  srcRoot?: string,
  outputPath?: string,
  template?: string
|}
*/

/*::
type Opts = {|
  entries: string[],
  srcRoot: string,
  outputPath: string,
  template?: string
|}
*/

module.exports = (env /*: string */ = 'development', options /*: Options */) => {
  if (!options.entries) options.entries = []
  if (!options.srcRoot) options.srcRoot = './src'
  if (!options.outputPath) options.outputPath = './dist'

  // Flow hack: Forcibly cast Options to internal Opts type after
  // initializing default values.
  const untypedOptions /*: any */ = options
  const opts /*: Opts */ = untypedOptions

  const cwd = process.cwd()
  const commonChunkName = 'common'
  const config = {}

  config.entry = {}

  for (const name of opts.entries) {
    config.entry[name] = path.resolve(cwd, opts.srcRoot, `${name}.js`)
  }

  const indexEntry = ['./index.js', `${opts.srcRoot}/index.js`]
    .map(entry => path.resolve(cwd, entry))
    .find(filename => fs.existsSync(filename))
  if (indexEntry) config.entry.index = indexEntry

  config.output = {
    filename: '[name].bundle.js',
    path: path.resolve(cwd, opts.outputPath)
  }

  config.devtool = env === 'production' ? 'source-map' : 'inline-source-map'

  config.plugins = [new CleanWebpackPlugin([path.resolve(cwd, opts.outputPath)], {root: cwd})]

  if (opts.entries.length > 1) {
    config.plugins = config.plugins.concat([
      new optimize.CommonsChunkPlugin({
        name: commonChunkName
      })
    ])
  }

  config.plugins = config.plugins.concat(
    opts.entries.map(entry => {
      const htmlOpts = {}
      htmlOpts.filename = `${entry}.html`
      htmlOpts.chunks = [commonChunkName, entry]
      if (htmlOpts.template) htmlOpts.template = opts.template
      return new HtmlWebpackPlugin(htmlOpts)
    })
  )

  return config
}
