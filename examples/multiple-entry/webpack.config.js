const config = require('../..')

module.exports = env => config(env, {entries: ['foo', 'bar']})
