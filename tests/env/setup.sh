#!/usr/bin/env bash
#
# Builds a disposable WordPress site for testing the theme.
#
#   bash tests/env/setup.sh            build (or refresh) the site and start the server
#   bash tests/env/setup.sh stop       stop the server
#
# Uses PHP's built-in web server and SQLite, so it needs only PHP (with the
# sqlite3 and zip extensions), curl and unzip. Settings, all optional:
#
#   OFT_DIR         where the site is built   (default: $TMPDIR/open-frame-wp-test)
#   OFT_PORT        port                      (default: 8890)
#   OFT_CLOUD_PORT  port of the mock library  (default: 8891)
#   OFT_WP          WordPress version         (default: latest)
#   OFT_ELEMENTOR   Elementor version         (default: latest-stable)
#   OFT_WOOCOMMERCE WooCommerce version       (default: latest-stable)
#   OFT_ELEMENTOR_PRO_ZIP  path to an Elementor Pro ZIP you are licensed to use; enables
#                          the Theme Builder checks. Elementor Pro is not downloaded and
#                          is never part of this repository.
#
# The site lives outside the repository on purpose: the theme folder is
# linked into it, and a site inside the theme would be scanned as theme files.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIR="${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-wp-test}"
PORT="${OFT_PORT:-8890}"
CLOUD_PORT="${OFT_CLOUD_PORT:-8891}"
WP="$DIR/wordpress"
PIDFILE="$DIR/server.pid"
CLOUD_PIDFILE="$DIR/cloud.pid"

stop_server() {
	for pidfile in "$PIDFILE" "$CLOUD_PIDFILE"; do
		if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2> /dev/null; then
			kill "$(cat "$pidfile")" || true
		fi
		rm -f "$pidfile"
	done
}

if [ "${1:-}" = "stop" ]; then
	stop_server
	echo "Server stopped."
	exit 0
fi

mkdir -p "$DIR/downloads"

fetch() { # fetch <url> <file>
	[ -s "$2" ] || curl -fsSL --retry 3 -o "$2" "$1"
}

plugin_zip() { # plugin_zip <slug> <version>
	if [ "$2" = "latest-stable" ]; then
		echo "https://downloads.wordpress.org/plugin/$1.latest-stable.zip"
	else
		echo "https://downloads.wordpress.org/plugin/$1.$2.zip"
	fi
}

WP_VERSION="${OFT_WP:-latest}"
if [ "$WP_VERSION" = "latest" ]; then
	WP_URL="https://wordpress.org/latest.zip"
else
	WP_URL="https://wordpress.org/wordpress-$WP_VERSION.zip"
fi

if [ ! -f "$WP/wp-load.php" ]; then
	fetch "$WP_URL" "$DIR/downloads/wordpress-$WP_VERSION.zip"
	unzip -q "$DIR/downloads/wordpress-$WP_VERSION.zip" -d "$DIR"
fi

install_plugin() { # install_plugin <slug> <version>
	if [ ! -d "$WP/wp-content/plugins/$1" ]; then
		fetch "$(plugin_zip "$1" "$2")" "$DIR/downloads/$1-$2.zip"
		unzip -q "$DIR/downloads/$1-$2.zip" -d "$WP/wp-content/plugins"
	fi
}

install_plugin sqlite-database-integration latest-stable
install_plugin elementor "${OFT_ELEMENTOR:-latest-stable}"
install_plugin woocommerce "${OFT_WOOCOMMERCE:-latest-stable}"
install_plugin theme-check latest-stable
install_plugin plugin-check latest-stable

if [ -n "${OFT_ELEMENTOR_PRO_ZIP:-}" ] && [ ! -d "$WP/wp-content/plugins/elementor-pro" ]; then
	unzip -q "$OFT_ELEMENTOR_PRO_ZIP" -d "$WP/wp-content/plugins"
fi

# SQLite drop-in.
SQLITE="$WP/wp-content/plugins/sqlite-database-integration"
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$SQLITE#" \
	-e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" \
	"$SQLITE/db.copy" > "$WP/wp-content/db.php"

# The theme and the companion plugin under test are the working copy.
ln -sfn "$ROOT" "$WP/wp-content/themes/open-frame"
ln -sfn "$ROOT/companion/open-frame-starter-sites" "$WP/wp-content/plugins/open-frame-starter-sites"

# WordPress.org is reached through a proxy when the environment sets one
# (WordPress does not read the HTTPS_PROXY variable by itself).
PROXY_CONFIG=""
if [ -n "${HTTPS_PROXY:-}" ]; then
	PROXY_HOSTPORT="${HTTPS_PROXY#*://}"
	PROXY_HOSTPORT="${PROXY_HOSTPORT%/}"
	PROXY_CONFIG="define( 'WP_PROXY_HOST', '${PROXY_HOSTPORT%:*}' );
define( 'WP_PROXY_PORT', '${PROXY_HOSTPORT##*:}' );
define( 'WP_PROXY_BYPASS_HOSTS', 'localhost' );
define( 'OFT_CA_BUNDLE', '${SSL_CERT_FILE:-}' );"
fi

cat > "$WP/wp-config.php" <<PHP
<?php
define( 'DB_NAME', 'wp' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );
define( 'DB_ENGINE', 'sqlite' );
foreach ( array( 'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY', 'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT' ) as \$open_frame_key ) {
	define( \$open_frame_key, 'open-frame-test-' . \$open_frame_key );
}
\$table_prefix = 'wp_';
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
define( 'WP_HOME', 'http://localhost:$PORT' );
define( 'WP_SITEURL', 'http://localhost:$PORT' );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'WP_HTTP_BLOCK_EXTERNAL', true );
define( 'WP_ACCESSIBLE_HOSTS', 'api.wordpress.org,downloads.wordpress.org' );
define( 'WP_ENVIRONMENT_TYPE', 'local' );
define( 'OFSS_API_BASE', 'http://localhost:$CLOUD_PORT/v1' );
$PROXY_CONFIG
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
PHP

mkdir -p "$WP/wp-content/mu-plugins"
cp "$ROOT/tests/env/mu-plugin.php" "$WP/wp-content/mu-plugins/open-frame-test.php"

php "$ROOT/tests/env/run.php" "$WP" "$ROOT/tests/env/install.php"
php "$ROOT/tests/env/run.php" "$WP" "$ROOT/tests/env/fixtures.php"

stop_server
nohup php -S "localhost:$PORT" -t "$WP" > "$DIR/server.log" 2>&1 < /dev/null &
echo $! > "$PIDFILE"

# The mock starter site library (tests/fixtures/cloud).
echo ok > "$DIR/cloud-mode"
OFT_CLOUD_STATE="$DIR" nohup php -S "localhost:$CLOUD_PORT" "$ROOT/tests/fixtures/cloud/router.php" > "$DIR/cloud.log" 2>&1 < /dev/null &
echo $! > "$CLOUD_PIDFILE"
sleep 1

echo
echo "Site:  http://localhost:$PORT   (admin / password)"
echo "Mock library: http://localhost:$CLOUD_PORT/v1/catalog.json"
echo "Files: $WP"
echo "Run the checks with:  OFT_DIR=$DIR OFT_PORT=$PORT node --test --test-concurrency=1 tests/e2e/*.test.js"
