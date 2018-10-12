/* @flow strict */

const config = require('../..') // require('webpack-config-github')

module.exports = (env /*: string */) => {
  return config(env, {
    cspDirectives: {
      // Allow local fonts and Google fonts
      fontSrc: ["'self' https://fonts.gstatic.com"]
    }
  })
}
