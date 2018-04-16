#!/bin/bash

set -e

for path in examples/*; do
  pushd "$path"
  webpack
  webpack --env production
  popd
done

ensure_dedupe() {
  if [ $(npm list --parseable "$1" | wc -l) -ne 1 ]; then
    echo "$1: duplicate versions detected"
    npm list "$1"
    exit 1
  fi
}

ensure_dedupe "graphql"
ensure_dedupe "graphql-config"
ensure_dedupe "relay-compiler"
ensure_dedupe "webpack"
