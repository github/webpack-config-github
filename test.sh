#!/usr/bin/env bats

@test "minimal" {
  cd examples/minimal
  webpack
}

@test "multiple-entry" {
  cd examples/multiple-entry
  webpack
}

@test "single-entry" {
  cd examples/single-entry
  webpack
}
