/* @flow */
/* eslint-disable github/no-flowfixme */

const fs = require('fs')
const path = require('path')

const {getGraphQLProjectConfig} = require('graphql-config')
const buildContentSecurityPolicy = require('content-security-policy-builder')

const {EnvironmentPlugin, optimize} = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const RelayCompilerWebpackPlugin = require('relay-compiler-webpack-plugin')

/*::
type Options = {|
  commonChunkName?: string,
  entries?: string[],
  graphqlProxyPath?: string,
  historyApiFallback?: boolean,
  maxAssetSize?: number,
  maxEntrypointSize?: number,
  outputPath?: string,
  srcRoot?: string,
  staticRoot?: string,
  template?: string,
|}
*/

/*::
type InternalOptions = {|
  commonChunkName: string,
  entries: string[],
  graphqlProxyPath: string,
  historyApiFallback: boolean,
  maxAssetSize: number,
  maxEntrypointSize: number,
  outputPath: string,
  srcRoot: string,
  staticRoot: string,
  template: string
|}
*/

const defaultOptions /*: InternalOptions */ = {
  commonChunkName: 'common',
  entries: ['index'],
  graphqlProxyPath: '/graphql',
  historyApiFallback: true,
  maxAssetSize: 200000, // 200 kB
  maxEntrypointSize: 500000, // 500 kB
  outputPath: './dist',
  srcRoot: './src',
  staticRoot: './public',
  template: path.resolve(__dirname, 'index.html')
}

module.exports = (env /*: string */ = 'development', options /*: Options */) => {
  // $FlowFixMe: Forcibly cast Options to InternalOptions type after initializing default values.
  const opts /*: InternalOptions */ = Object.assign({}, defaultOptions, options)

  const cwd = process.cwd()
  const isDevServer = process.argv.find(v => v.includes('webpack-dev-server'))

  const config = {}

  if (env === 'production') {
    config.performance = {
      hints: 'error',
      maxAssetSize: opts.maxAssetSize,
      maxEntrypointSize: opts.maxEntrypointSize
    }
  } else {
    config.performance = false
  }

  config.entry = {}

  for (const name of opts.entries) {
    config.entry[name] = path.resolve(cwd, opts.srcRoot, `${name}.js`)
  }

  const rootIndexPath = path.resolve(cwd, './index.js')
  if (fs.existsSync(rootIndexPath)) {
    config.entry.index = rootIndexPath
  }

  config.output = {}
  config.output.filename = '[name].bundle.js'
  config.output.path = path.resolve(cwd, opts.outputPath)

  if (opts.historyApiFallback) {
    config.output.publicPath = '/'
  }

  // TODO: Fix source-map option in production environment
  config.devtool = env === 'production' ? 'cheap-source-map' : 'inline-source-map'

  config.devServer = {}

  if (opts.historyApiFallback) {
    const rewrites = opts.entries.map(entry => {
      return {from: `/${entry}`, to: `/${entry}.html`}
    })
    config.devServer.historyApiFallback = {rewrites}
  }

  config.devServer.proxy = {}
  config.devServer.proxy = proxyConfig(opts.graphqlProxyPath)

  config.plugins = [
    new EnvironmentPlugin({
      GRAPHQL_CONFIG_ENDPOINT_NAME: '',
      NODE_ENV: env
    }),
    new CleanWebpackPlugin([path.resolve(cwd, opts.outputPath)], {root: cwd}),
    new ExtractTextPlugin({
      filename: '[name].bundle.css'
    })
  ]

  if (opts.staticRoot && fs.existsSync(opts.staticRoot)) {
    config.devServer.contentBase = opts.staticRoot
    config.plugins.push(new CopyWebpackPlugin([{from: opts.staticRoot}]))
  }

  if (opts.entries.length > 1) {
    config.plugins = config.plugins.concat([
      new optimize.CommonsChunkPlugin({
        name: opts.commonChunkName
      })
    ])
  }

  const {config: graphqlConfig} = tryGetGraphQLProjectConfig()
  if (graphqlConfig && graphqlConfig.schemaPath) {
    config.plugins = config.plugins.concat([
      new RelayCompilerWebpackPlugin({
        schema: path.resolve(cwd, graphqlConfig.schemaPath),
        src: path.resolve(cwd, opts.srcRoot)
      })
    ])
  }

  const directives = {
    defaultSrc: ["'none'"],
    baseUri: ["'self'"],
    blockAllMixedContent: true,
    connectSrc: ["'self'"],
    imgSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
  }

  if (isDevServer) {
    directives.connectSrc.push('ws:')
  }

  config.plugins = config.plugins.concat(
    Object.keys(config.entry).map(
      entry =>
        new HtmlWebpackPlugin({
          filename: `${entry}.html`,
          chunks: [opts.commonChunkName, entry],
          template: opts.template,
          contentSecurityPolicy: buildContentSecurityPolicy({directives})
        })
    )
  )

  if (env === 'production') {
    config.plugins = config.plugins.concat([
      new BabelMinifyPlugin(),
      new CompressionPlugin({
        test: /\.(js|css)$/
      })
    ])
  }

  const cssLoader = {
    loader: 'css-loader',
    options: {}
  }
  const cssLoaders = [cssLoader]

  const postCSSConfig = path.resolve(cwd, 'postcss.config.js')
  if (fs.existsSync(postCSSConfig)) {
    cssLoader.options.importLoaders = 1
    cssLoaders.push({
      loader: 'postcss-loader'
    })
  }

  config.module = {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        // exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: cssLoaders
        })
      }
    ]
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
