#!/usr/bin/env bash
#
# Builds the theme ZIP and runs the Theme Check plugin against the package,
# installed in the test site in place of the working copy.
#
#   bash tests/env/theme-check.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIR="${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-wp-test}"
WP="$DIR/wordpress"
THEME="$WP/wp-content/themes/open-frame"

bash "$ROOT/bin/build-zip.sh"

restore() {
	rm -rf "$THEME"
	ln -sfn "$ROOT" "$THEME"
}
trap restore EXIT

rm -rf "$THEME"
unzip -q "$ROOT/dist/open-frame.zip" -d "$WP/wp-content/themes"

php "$ROOT/tests/env/run.php" "$WP" "$ROOT/tests/env/theme-check.php"
