#!/usr/bin/env bash
#
# Builds the companion plugin ZIP and runs the Plugin Check plugin (the checks
# WordPress.org applies to submitted plugins) against the package, installed in
# the test site in place of the working copy.
#
#   bash tests/env/plugin-check.sh
#
# Every error and warning is printed, and the script fails when Plugin Check
# reports any error.
#
# Needs WP-CLI: point OFT_WP_CLI at a wp-cli.phar, or have `wp` on the PATH.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIR="${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-wp-test}"
WP="$DIR/wordpress"
SLUG="open-frame-starter-sites"
PLUGIN="$WP/wp-content/plugins/$SLUG"

if [ -n "${OFT_WP_CLI:-}" ]; then
	WPCLI=(php "$OFT_WP_CLI")
elif command -v wp > /dev/null 2>&1; then
	WPCLI=(wp)
else
	echo "WP-CLI was not found. Set OFT_WP_CLI to the path of wp-cli.phar." >&2
	exit 1
fi

if [ ! -d "$WP/wp-content/plugins/plugin-check" ]; then
	echo "The Plugin Check plugin is not in the test site. Run tests/env/setup.sh first." >&2
	exit 1
fi

bash "$ROOT/bin/build-plugin-zip.sh"

restore() {
	rm -rf "$PLUGIN"
	ln -sfn "$ROOT/companion/$SLUG" "$PLUGIN"
	( cd "$WP" && "${WPCLI[@]}" plugin deactivate plugin-check > /dev/null 2>&1 ) || true
}
trap restore EXIT

rm -rf "$PLUGIN"
unzip -q "$ROOT/dist/$SLUG.zip" -d "$WP/wp-content/plugins"

cd "$WP"
"${WPCLI[@]}" plugin activate plugin-check "$SLUG"

# Plugin Check exits with 0 even when it reports errors, so the report is read.
REPORT="$("${WPCLI[@]}" plugin check "$SLUG" --format=table)"
echo "$REPORT"
if echo "$REPORT" | grep -qE "[[:space:]]ERROR[[:space:]]"; then
	echo "Plugin Check reported errors." >&2
	exit 1
fi
