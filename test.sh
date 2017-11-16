#!/usr/bin/env bats

@test "minimal" {
  cd examples/minimal
  webpack
}

@test "single-entry" {
  cd examples/single-entry
  webpack
}
