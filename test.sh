#!/usr/bin/env bats

@test "minimal" {
  cd examples/minimal
  webpack
}

@test "single-entry" {
  cd examples/single-entry
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

@test "github-graphql" {
  cd examples/github-graphql
  webpack
}
