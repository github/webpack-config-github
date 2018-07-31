/* @flow */
/* eslint-disable github/no-flowfixme */

const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const {getGraphQLProjectConfig} = require('graphql-config')
const buildContentSecurityPolicy = require('content-security-policy-builder')
const readPkg = require('read-pkg')

const {EnvironmentPlugin, optimize} = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const RelayCompilerWebpackPlugin = require('relay-compiler-webpack-plugin')

/*::
type Options = {|
  allowGitHubSubresources?: boolean,
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
  cspDirectives?: Object
|}
*/

/*::
type InternalOptions = {|
  allowGitHubSubresources: boolean,
  commonChunkName: string,
  entries: string[],
  graphqlProxyPath: string,
  historyApiFallback: boolean,
  maxAssetSize: number,
  maxEntrypointSize: number,
  outputPath: string,
  srcRoot: string,
  staticRoot: string,
  template: string,
  cspDirectives: Object
|}
*/

const defaultOptions /*: InternalOptions */ = {
  allowGitHubSubresources: false,
  commonChunkName: 'common',
  entries: [],
  graphqlProxyPath: '/graphql',
  historyApiFallback: true,
  maxAssetSize: 500000, // 500 kB
  maxEntrypointSize: 1000000, // 1 mB
  outputPath: './dist',
  srcRoot: './src',
  staticRoot: './public',
  template: path.resolve(__dirname, 'index.html'),
  cspDirectives: {}
}

module.exports = (env /*: string */ = 'development', options /*: Options */) => {
  // $FlowFixMe: Forcibly cast Options to InternalOptions type after initializing default values.
  const opts /*: InternalOptions */ = Object.assign({}, defaultOptions, options)

  // Load .env file
  const result = dotenv.config()

  const cwd = process.cwd()
  const isDevServer = process.argv.find(v => v.includes('webpack-dev-server'))

  const packageJSONPath = path.resolve(cwd, 'package.json')
  const pkg = fs.existsSync(packageJSONPath) && readPkg.sync({path: packageJSONPath})

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

  if (opts.entries.length > 0) {
    for (const name of opts.entries) {
      config.entry[name] = path.resolve(cwd, opts.srcRoot, `${name}.js`)
    }
  } else if (pkg) {
    if (pkg.main) {
      const name = path.basename(pkg.main, '.js')
      config.entry[name] = path.resolve(cwd, pkg.main)
    }

    if (pkg.entries) {
      for (const entry of pkg.entries) {
        const name = path.basename(entry, '.js')
        config.entry[name] = path.resolve(cwd, entry)
      }
    }
  }

  if (Object.keys(config.entry).length === 0) {
    const srcIndexPath = path.resolve(cwd, opts.srcRoot, `index.js`)
    const rootIndexPath = path.resolve(cwd, 'index.js')

    if (fs.existsSync(srcIndexPath)) {
      config.entry.index = srcIndexPath
    } else if (fs.existsSync(rootIndexPath)) {
      config.entry.index = rootIndexPath
    }
  }

  config.output = {}
  config.output.filename = '[name].[chunkhash].js'
  config.output.path = path.resolve(cwd, opts.outputPath)

  config.node = {
    __filename: true,
    __dirname: true
  }

  if (opts.historyApiFallback) {
    config.output.publicPath = '/'
  }

  // TODO: Fix source-map option in production environment
  config.devtool = env === 'production' ? 'cheap-source-map' : 'inline-source-map'

  if (isDevServer) {
    config.devServer = {}

    if (process.env.HOST) config.devServer.host = process.env.HOST
    if (process.env.PORT) config.devServer.port = process.env.PORT

    if (opts.historyApiFallback) {
      const rewrites = Object.keys(config.entry).map(entry => {
        return {from: `/${entry}`, to: `/${entry}.html`}
      })
      config.devServer.historyApiFallback = {rewrites}
    }

    config.devServer.proxy = proxyConfig(opts.graphqlProxyPath)
  }

  config.plugins = []

  config.plugins.push(
    new EnvironmentPlugin({
      GRAPHQL_CONFIG_ENDPOINT_NAME: '',
      NODE_ENV: env
    })
  )

  if (result.parsed) {
    config.plugins.push(new Dotenv())
  }

  config.plugins.push(new CleanWebpackPlugin([path.resolve(cwd, opts.outputPath)], {root: cwd}))

  config.plugins.push(
    new ExtractTextPlugin({
      filename: '[name].[chunkhash].css'
    })
  )

  if (opts.staticRoot && fs.existsSync(opts.staticRoot)) {
    if (config.devServer) config.devServer.contentBase = opts.staticRoot
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

  const directives = Object.assign(
    {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      blockAllMixedContent: true,
      connectSrc: ["'self'"],
      imgSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"]
    },
    opts.cspDirectives || {}
  )

  if (opts.allowGitHubSubresources) {
    directives.imgSrc.push('*.githubusercontent.com')
  }

  if (isDevServer) {
    directives.connectSrc.push('ws:')
  }

  const minify =
    env === 'production'
      ? {
          collapseWhitespace: true,
          removeComments: true
        }
      : false

  config.plugins = config.plugins.concat(
    Object.keys(config.entry).map(
      entry =>
        new HtmlWebpackPlugin({
          filename: `${entry}.html`,
          chunks: [opts.commonChunkName, entry],
          template: opts.template,
          contentSecurityPolicy: buildContentSecurityPolicy({directives}),
          minify
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

  config.resolve = {
    mainFields: ['style', 'browser', 'module', 'main']
  }

  return config
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
