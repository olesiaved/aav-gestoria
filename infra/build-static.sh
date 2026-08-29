#!/usr/bin/env bash
# Assembles the deployable static site into dist/, used as the SST
# StaticSite build output. Regenerates HTML from templates/content first.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 build.py

rm -rf dist
mkdir -p dist
cp -r ru css js img files dist/
cp ./*.html dist/
