/* @flow */

const config = require('../..') // require('webpack-config-github')

module.exports = (env /*: string */) =>
  config(env, {
    cspDirectives: {
      // Allow local fonts and Google fonts
      fontSrc: ["'self' https://fonts.gstatic.com"]
    }
  })
