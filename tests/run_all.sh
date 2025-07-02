#!/bin/bash
# Simple script to run all API tests

set -e
for t in tests/test_*.py; do
  echo "Running $t"
  python3 "$t"
done
