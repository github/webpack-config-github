/* @flow strict */

const config = require('../..') // require('webpack-config-github')

module.exports = (env /*: string */) => config(env, {entries: ['index', 'admin']})
