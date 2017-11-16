/* @flow */

const config = require('../..') // require('webpack-config-github')

// TODO: It would be nice if .graphqlconfig didn't crash when API_TOKEN was missing
process.env['API_TOKEN'] = 'abc123'

module.exports = (env /*: string */) => config(env, {graphqlProxyPath: '/graphql'})
