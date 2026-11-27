#!/usr/bin/env bash
#
# Builds the installable companion plugin: dist/open-frame-starter-sites.zip
#
# The archive contains a single top-level "open-frame-starter-sites" folder and
# leaves out what the plugin's .distignore lists. Usage: bash bin/build-plugin-zip.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="open-frame-starter-sites"
SOURCE="$ROOT/companion/$SLUG"
DIST="$ROOT/dist"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/$SLUG" "$DIST"

EXCLUDES=()
while IFS= read -r line; do
	line="${line%%#*}"
	line="$(echo "$line" | xargs)"
	[ -n "$line" ] && EXCLUDES+=("--exclude=./$line")
done < "$SOURCE/.distignore"

tar -C "$SOURCE" "${EXCLUDES[@]}" -cf - . | tar -C "$STAGE/$SLUG" -xf -

rm -f "$DIST/$SLUG.zip"
( cd "$STAGE" && zip -rqX "$DIST/$SLUG.zip" "$SLUG" )

VERSION="$(sed -n 's/^ \* Version:[[:space:]]*//p' "$SOURCE/$SLUG.php" | head -n 1)"
echo "Built dist/$SLUG.zip (Open Frame Starter Sites $VERSION, $(du -h "$DIST/$SLUG.zip" | cut -f1))"
