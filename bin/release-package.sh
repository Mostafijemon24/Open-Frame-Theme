#!/usr/bin/env bash
#
# Prepares what a release of one product consists of, after checking that the
# product is ready to be released:
#
#   dist/<slug>-<version>.zip          the installable package
#   dist/<slug>-<version>.zip.sha256   its checksum
#   dist/<slug>-release-notes.md       the text of the release page
#
#   bash bin/release-package.sh theme
#   bash bin/release-package.sh plugin
#
# It creates no tag and publishes nothing; the Release workflow does that with
# what this script prepared. Run it by hand to see what a release would contain.
#
# The last line of output is "<tag> <version> <slug>", for the workflow.
#
# RELEASE_ALLOW_UNPUBLISHED=1 lets the plugin through without the public key
# of the library, for trying the packaging out. The workflow never sets it.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRODUCT="${1:-}"
REPOSITORY="${GITHUB_REPOSITORY:-Mostafijemon24/Open-Frame-Theme}"
cd "$ROOT"

fail() {
	echo "Not ready for a release: $1" >&2
	exit 1
}

# The lines under "= <version> =" in the changelog of a readme.txt.
changes() {
	awk -v ver="= $2 =" '$0 == ver { found = 1; next } found && /^= .* =$/ { exit } found { print }' "$1" | sed -e '/./,$!d'
}

case "$PRODUCT" in
	theme)
		SLUG="open-frame"
		NAME="Open Frame"
		README="readme.txt"
		VERSION="$(sed -n 's/^Version:[[:space:]]*//p' style.css | head -n 1)"
		TAG="v$VERSION"
		BUILD="bin/build-zip.sh"
		GUIDE="docs/README.md"
		INSTALL="upload it under *Appearance → Themes → Add Theme → Upload Theme*"

		grep -q "define( 'OPEN_FRAME_VERSION', '$VERSION' );" functions.php || fail "OPEN_FRAME_VERSION in functions.php is not $VERSION."
		;;
	plugin)
		SLUG="open-frame-starter-sites"
		NAME="Open Frame Starter Sites"
		SOURCE="companion/$SLUG"
		README="$SOURCE/readme.txt"
		VERSION="$(sed -n 's/^ \* Version:[[:space:]]*//p' "$SOURCE/$SLUG.php" | head -n 1)"
		TAG="starter-sites-v$VERSION"
		BUILD="bin/build-plugin-zip.sh"
		GUIDE="docs/STARTER-SITES.md"
		INSTALL="upload it under *Plugins → Add Plugin → Upload Plugin*. It needs the Open Frame theme"

		grep -q "define( 'OFSS_VERSION', '$VERSION' );" "$SOURCE/$SLUG.php" || fail "OFSS_VERSION in $SLUG.php is not $VERSION."
		grep -q "^\"Project-Id-Version: $NAME $VERSION\\\\n\"$" "$SOURCE/languages/$SLUG.pot" || fail "the translation template was not regenerated for $VERSION (see docs/dev/PLUGIN.md, \"Translating\")."

		# Without a public key the plugin accepts no list of designs: it would show an empty screen.
		if grep -q 'const PUBLIC_KEYS = array();' "$SOURCE/src/Config.php"; then
			if [ "${RELEASE_ALLOW_UNPUBLISHED:-}" = "1" ]; then
				echo "Warning: the plugin has no public key of the library. This package is for trying out only." >&2
			else
				fail "the plugin carries no public key of the library (Config::PUBLIC_KEYS). Publish the library first (docs/dev/LIBRARY.md)."
			fi
		fi
		;;
	*)
		echo "Usage: bash bin/release-package.sh theme|plugin" >&2
		exit 2
		;;
esac

[ -n "$VERSION" ] || fail "no version number found."
grep -q "^Stable tag: $VERSION$" "$README" || fail "\"Stable tag\" in $README is not $VERSION."
[ -n "$(changes "$README" "$VERSION")" ] || fail "$README has no changelog entry \"= $VERSION =\"."

if [ -n "${GITHUB_REF_TYPE:-}" ] && [ "$GITHUB_REF_TYPE" = "tag" ] && [ "${GITHUB_REF_NAME:-}" != "$TAG" ]; then
	fail "the tag $GITHUB_REF_NAME does not match the version in the files ($TAG)."
fi

bash "$BUILD" >&2
PACKAGE="$SLUG-$VERSION.zip"
cp "dist/$SLUG.zip" "dist/$PACKAGE"
( cd dist && sha256sum "$PACKAGE" > "$PACKAGE.sha256" )

# What must never be inside a package.
if unzip -Z1 "dist/$PACKAGE" | grep -E '(^|/)(\.git|\.github|node_modules|tests|tools|cloud|starter-sites|companion|docs|dist)(/|$)|\.(key|pem|env|sql|zip|map)$|(^|/)\.env' >&2; then
	fail "the package contains files that do not belong in it (listed above)."
fi

{
	echo "## $NAME $VERSION"
	echo
	changes "$README" "$VERSION"
	echo
	echo "**Install:** download \`$PACKAGE\` below and $INSTALL. Do not unzip it."
	echo
	echo "**Update:** install the new file the same way and choose *Replace current with uploaded*. Settings and content are kept."
	echo
	echo "**Check the download (optional):** \`sha256sum -c $PACKAGE.sha256\`"
	echo
	echo "**Documentation:** [guide](https://github.com/$REPOSITORY/blob/$TAG/$GUIDE) · [installation](https://github.com/$REPOSITORY/blob/$TAG/docs/INSTALL.md) · [support and updates](https://github.com/$REPOSITORY/blob/$TAG/docs/SUPPORT.md)"
} > "dist/$SLUG-release-notes.md"

echo "Prepared dist/$PACKAGE, its checksum and dist/$SLUG-release-notes.md" >&2
echo "$TAG $VERSION $SLUG"
