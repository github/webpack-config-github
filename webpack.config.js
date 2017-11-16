/* @flow */
/* eslint-disable github/no-flowfixme */

const fs = require('fs')
const path = require('path')

const {optimize} = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/*::
type Options = {|
  commonChunkName?: string,
  entries?: string[],
  outputPath?: string,
  srcRoot?: string,
  template?: string,
|}
*/

/*::
type InternalOptions = {|
  commonChunkName: string,
  entries: string[],
  outputPath: string,
  srcRoot: string,
  template?: string,
|}
*/

const defaultOptions /*: InternalOptions */ = {
  commonChunkName: 'common',
  entries: ['index'],
  outputPath: './dist',
  srcRoot: './src'
}

module.exports = (env /*: string */ = 'development', options /*: Options */) => {
  // $FlowFixMe: Forcibly cast Options to InternalOptions type after initializing default values.
  const opts /*: InternalOptions */ = Object.assign({}, defaultOptions, options)

  const cwd = process.cwd()
  const config = {}

  config.entry = {}

  for (const name of opts.entries) {
    config.entry[name] = path.resolve(cwd, opts.srcRoot, `${name}.js`)
  }

  const rootIndexPath = path.resolve(cwd, './index.js')
  if (fs.existsSync(rootIndexPath)) {
    config.entry.index = rootIndexPath
  }

  config.output = {
    filename: '[name].bundle.js',
    path: path.resolve(cwd, opts.outputPath)
  }

  config.devtool = env === 'production' ? 'source-map' : 'inline-source-map'

  config.plugins = [new CleanWebpackPlugin([path.resolve(cwd, opts.outputPath)], {root: cwd})]

  if (opts.entries.length > 1) {
    config.plugins = config.plugins.concat([
      new optimize.CommonsChunkPlugin({
        name: opts.commonChunkName
      })
    ])
  }

  config.plugins = config.plugins.concat(
    Object.keys(config.entry).map(entry => {
      const htmlOpts = {}
      htmlOpts.filename = `${entry}.html`
      htmlOpts.chunks = [opts.commonChunkName, entry]
      if (htmlOpts.template) htmlOpts.template = opts.template
      return new HtmlWebpackPlugin(htmlOpts)
    })
  )

  if (opts.environment === 'production') {
    config.plugins = config.plugins.concat([
      new BabelMinifyPlugin(),
      new CompressionPlugin({
        test: /\.(js|css)$/
      })
    ])
  }

  return config
}
