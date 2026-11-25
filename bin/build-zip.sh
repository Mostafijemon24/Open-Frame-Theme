#!/usr/bin/env bash
#
# Builds the installable theme package: dist/open-frame.zip
#
# The archive contains a single top-level "open-frame" folder and leaves out
# everything listed in .distignore (documentation, development tooling, Git
# metadata). Usage: bash bin/build-zip.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="open-frame"
DIST="$ROOT/dist"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/$SLUG" "$DIST"

EXCLUDES=()
while IFS= read -r line; do
	line="${line%%#*}"
	line="$(echo "$line" | xargs)"
	[ -n "$line" ] && EXCLUDES+=("--exclude=./$line")
done < "$ROOT/.distignore"

tar -C "$ROOT" "${EXCLUDES[@]}" -cf - . | tar -C "$STAGE/$SLUG" -xf -

rm -f "$DIST/$SLUG.zip"
( cd "$STAGE" && zip -rqX "$DIST/$SLUG.zip" "$SLUG" )

VERSION="$(sed -n 's/^Version:[[:space:]]*//p' "$ROOT/style.css" | head -n 1)"
echo "Built dist/$SLUG.zip (Open Frame $VERSION, $(du -h "$DIST/$SLUG.zip" | cut -f1))"
