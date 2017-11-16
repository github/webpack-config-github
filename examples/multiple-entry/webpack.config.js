const config = require('../..') // require('webpack-config-github')

module.exports = env => config(env, {entries: ['foo', 'bar']})
