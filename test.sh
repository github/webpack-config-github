#!/usr/bin/env bats

for example in examples/*; do
  @test "$example" {
    cd "$example"
    webpack
  }
done
