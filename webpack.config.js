/* @flow */
/* eslint-disable github/no-flowfixme */

const fs = require('fs')
const path = require('path')

const {getGraphQLProjectConfig} = require('graphql-config')

const {optimize} = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/*::
type Options = {|
  commonChunkName?: string,
  entries?: string[],
  graphqlProxyPath?: string,
  outputPath?: string,
  srcRoot?: string,
  template?: string,
|}
*/

/*::
type InternalOptions = {|
  commonChunkName: string,
  entries: string[],
  graphqlProxyPath: string,
  outputPath: string,
  srcRoot: string,
  template?: string,
|}
*/

const defaultOptions /*: InternalOptions */ = {
  commonChunkName: 'common',
  entries: ['index'],
  graphqlProxyPath: '/graphql',
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

  const rewrites = opts.entries.map(entry => {
    return {from: `/${entry}`, to: `/${entry}.html`}
  })

  config.devServer = {}
  config.devServer.historyApiFallback = {rewrites}
  config.devServer.proxy = {}

  config.devServer.proxy = proxyConfig(opts.graphqlProxyPath)

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

// TODO: Investigate other ways set a default GRAPHQL_CONFIG_ENDPOINT_NAME
// for getGraphQLProjectConfig without mutating the environment.
if (!process.env['GRAPHQL_CONFIG_ENDPOINT_NAME']) {
  process.env['GRAPHQL_CONFIG_ENDPOINT_NAME'] = 'production'
}

// Get webpack proxy configuration as per .graphqlconfig.
function proxyConfig(path) {
  const config = {}

  const {endpointsExtension} = tryGetGraphQLProjectConfig()
  if (endpointsExtension) {
    const graphqlEndpoint = endpointsExtension.getEndpoint()

    const {url: target, headers} = graphqlEndpoint
    const changeOrigin = true

    const pathRewrite = {}
    pathRewrite[`^${path}`] = ''

    config[path] = {changeOrigin, headers, pathRewrite, target}
  }

  return config
}

// TODO: Find a better way to attempt to load GraphQL config without erroring
function tryGetGraphQLProjectConfig() {
  try {
    return getGraphQLProjectConfig()
  } catch (error) {
    if (error.name === 'ConfigNotFoundError') {
      return {}
    } else {
      throw error
    }
  }
}
