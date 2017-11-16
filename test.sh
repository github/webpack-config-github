#!/usr/bin/env bats

@test "github-graphql" {
  cd examples/github-graphql
  webpack
}

@test "minimal" {
  cd examples/minimal
  webpack
}

@test "multiple-entry" {
  cd examples/multiple-entry
  webpack
}

@test "relay" {
  cd examples/relay
  webpack
}

@test "single-entry" {
  cd examples/single-entry
  webpack
}

@test "static" {
  cd examples/static
  webpack
}
