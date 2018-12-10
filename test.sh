#!/bin/bash

set -e

run_webpack() {
  pushd "$1"
  if [ -f package.json ]; then
    npm install
  fi
  webpack
  webpack --env production
  popd
}

if [ $# -eq 0 ]; then
  for path in examples/*; do
    run_webpack $path
  done
else
  run_webpack "examples/$1"
fi

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
