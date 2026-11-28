#!/usr/bin/env bash
#
# Completes what a release carries, after bin/release-package.sh has prepared
# the product that is being released. Every release is a complete set:
#
#   the product being released          dist/<slug>-<version>.zip, with its checksum
#   the other product, as it is in the  dist/<other-slug>-<version>.zip, with its checksum
#     files of the same commit
#   every starter site, one archive     dist/starter-sites/open-frame-starter-site-<id>-<version>.zip
#     each, and their checksums         dist/starter-sites/SHA256SUMS.txt
#
#   bash bin/release-package.sh theme && bash bin/release-bundle.sh theme
#   bash bin/release-package.sh plugin && bash bin/release-bundle.sh plugin
#
# It adds a list of the files to the release notes and writes the paths of all
# files to attach, one per line, to dist/<slug>-release-assets.txt. Nothing is
# tagged or published; the Release workflow does that.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRODUCT="${1:-}"
cd "$ROOT"

case "$PRODUCT" in
	theme)
		SLUG="open-frame"
		OTHER="plugin"
		;;
	plugin)
		SLUG="open-frame-starter-sites"
		OTHER="theme"
		;;
	*)
		echo "Usage: bash bin/release-bundle.sh theme|plugin" >&2
		exit 2
		;;
esac

NOTES="dist/$SLUG-release-notes.md"
PACKAGE="$(find dist -maxdepth 1 -name "$SLUG-[0-9]*.zip" | sort | tail -n 1)"
[ -f "$NOTES" ] && [ -n "$PACKAGE" ] || { echo "Run bin/release-package.sh $PRODUCT first." >&2; exit 1; }

# The other product is packed in the version its files name. The tag of this
# run belongs to the product being released, so it is kept from that check.
read -r _ OTHER_VERSION OTHER_SLUG <<< "$(env -u GITHUB_REF_TYPE -u GITHUB_REF_NAME bash bin/release-package.sh "$OTHER" | tail -n 1)"
OTHER_PACKAGE="dist/$OTHER_SLUG-$OTHER_VERSION.zip"
[ -f "$OTHER_PACKAGE" ]

bash bin/build-starter-site-zips.sh >&2

if [ "$PRODUCT" = "theme" ]; then
	THEME_FILE="$(basename "$PACKAGE")"
	PLUGIN_FILE="$(basename "$OTHER_PACKAGE")"
else
	THEME_FILE="$(basename "$OTHER_PACKAGE")"
	PLUGIN_FILE="$(basename "$PACKAGE")"
fi

{
	echo
	echo "### The files of this release"
	echo
	echo "| File | What it is |"
	echo "| --- | --- |"
	echo "| \`$THEME_FILE\` | **The Open Frame theme.** Install it under *Appearance → Themes → Add Theme → Upload Theme* |"
	echo "| \`$PLUGIN_FILE\` | **The Open Frame Starter Sites plugin.** Install it under *Plugins → Add Plugin → Upload Plugin*. It needs the theme |"
	for ARCHIVE in dist/starter-sites/*.zip; do
		FOLDER="$(basename "$ARCHIVE" .zip)"
		FOLDER="${FOLDER%-*}"
		README="$(unzip -p "$ARCHIVE" "$FOLDER/README.txt")"
		TITLE="$(sed -n '1p' <<< "$README")"
		NEEDS="$(sed -n '2s/^A starter site for the Open Frame theme, made with \(.*\)\.$/\1/p' <<< "$README")"
		echo "| \`$(basename "$ARCHIVE")\` | Starter site **$TITLE**, made with $NEEDS: the source of the design |"
	done
	echo "| \`*.sha256\`, \`SHA256SUMS.txt\` | Checksums of the files above |"
	echo
	echo "**To build a website from a starter site you need only the theme and the plugin.** In WordPress go to *Appearance → Starter Sites* and import a design there; the plugin fetches it from the library and checks every file. The starter site archives are the sources of the ten designs (pages, texts, settings, pictures, fonts and the licence of every picture), for keeping, for studying, and for building a library of your own. They are not uploaded to WordPress."
} >> "$NOTES"

{
	echo "$PACKAGE"
	echo "$PACKAGE.sha256"
	echo "$OTHER_PACKAGE"
	echo "$OTHER_PACKAGE.sha256"
	ls dist/starter-sites/*.zip
	echo "dist/starter-sites/SHA256SUMS.txt"
} > "dist/$SLUG-release-assets.txt"

echo "Completed the set: $(wc -l < "dist/$SLUG-release-assets.txt") files, listed in dist/$SLUG-release-assets.txt" >&2
