# webpack-config-github

An opinionated [webpack](https://webpack.js.org/) config for GitHub apps.

## Features

* Single and multiple HTML entry points
* Common chunks bundle when using multiple entry points
* ES6 transpilation via Babel
* Source Maps
* GraphQL proxy (in development)
* JS minification (in production)
* Static gzip compression (in production)

## Deployment

Currently targets GitHub's internal Kubernetes Docker deployment environment. Improved gh-pages deployment is planned in
the future.

## Basic Setup

```sh
$ npm install --save-dev webpack-dev-server
$ npm install --save-dev webpack-config-github
```

**webpack.config.js**

```js
module.exports = require('webpack-config-github')
```

**src/index.js**

```js
document.body.innerHTML = '<h1>Hello, World!</h1>'
```

**Start development server**

```sh
$ webpack-dev-server --open
```

## Directory Structure

```
my-app
├── package.json
├── .graphqlconfig
├── data
│   └── schema.graphql
├── node_modules
├── public
│   └── favicon.ico
│   └── robots.txt
└── src
    └── index.js
    └── components
        └── App.js
        └── Layout.js
        └── Sidebar.js
```

**.graphqlconfig**

Specifies the location of the GraphQL schema and target endpoints.

Here is an example configuration file when targeting the GitHub GraphQL API.

```json
{
  "schemaPath": "data/schema.graphql",
  "extensions": {
    "endpoints": {
      "production": {
        "url": "https://api.github.com/graphql",
        "headers": {
          "Authorization": "Bearer ${env:API_TOKEN}"
        }
      }
    }
  }
}
```

See the [GraphQL Configuration Format](https://github.com/graphcool/graphql-config/blob/master/specification.md) for
more information.

**data/schema.graphql**

When using Relay, a copy of the GraphQL schema should be checked in at this location. Checking the schema in ensures
linting and build tools can be consistently ran offline and in CI.

**public/**

The `public/` directory contains static assets that will be exposed as is. This is useful for well known static assets
that need to be served at a specific root path like `favicon.ico` and `robots.txt`.

**src/**

Contains source JavaScript, CSS and other assets that will be compiled via webpack.

**src/index.js**

Is the main entry point for bootstrapping the application.

When using React, this file should render the root application component.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'

ReactDOM.render(<App />, document.getElementById('root'))
```

## Roadmap

* Add Content-Security-Policy support
* Add Subresource Integrity support
* Support CSS Modules
* Support hot reloading
* Add gh-pages deployment pattern

## See Also

Many of the directory conventions used here are inspired from
[create-react-app](https://github.com/facebookincubator/create-react-app).
