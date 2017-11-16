/* @flow */

const config = require('../..') // require('webpack-config-github')

module.exports = (env /*: string */) =>
  config(env, {
    graphqlProxyPath: '/graphql',
    schemaPath: './data/schema.graphql'
  })
