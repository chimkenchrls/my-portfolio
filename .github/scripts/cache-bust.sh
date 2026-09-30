#!/usr/bin/env bash
# Appends ?v=<version> to the CSS/JS URLs in the staged index.html so browsers
# fetch fresh files after every deploy instead of a cached older copy.
# Usage: cache-bust.sh <site-dir> <version>
set -euo pipefail

site_dir="${1:?usage: cache-bust.sh <site-dir> <version>}"
version="${2:?usage: cache-bust.sh <site-dir> <version>}"
html="$site_dir/index.html"

for ref in ./style.css ./script.js ./assets/data.js; do
  grep -qF "\"$ref\"" "$html" || { echo "cache-bust: $ref not referenced in $html" >&2; exit 1; }
  sed -i "s|\"$ref\"|\"$ref?v=$version\"|g" "$html"
done
echo "cache-bust: stamped assets with v=$version"
