#!/bin/bash

set -e

for path in examples/*; do
  pushd "$path"
  webpack
  webpack --env production
  popd
done
