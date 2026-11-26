#!/usr/bin/env bash
#
# A rehearsal of publishing the library and of a new user importing from it,
# without Cloudflare. Everything a real publication uses is used, except
# Cloudflare's servers:
#
#   1. the theme and the plugin are built into the ZIPs users install;
#   2. the library is built and signed with a key made for the rehearsal;
#   3. the Worker (cloud/worker) runs on this machine with wrangler's simulated
#      R2 bucket, and "library.mjs publish" uploads to that bucket;
#   4. publishing a second time must upload the catalog only, and a design that
#      changed without a new version number must be refused;
#   5. a WordPress site is installed from the ZIPs, with nothing in it, and
#      every design is imported from the screen, looked at and rolled back
#      (tests/library/import-all.js).
#
#   bash tests/library/rehearsal.sh            every design
#   bash tests/library/rehearsal.sh business   only these
#   bash tests/library/rehearsal.sh stop       stop the servers
#
# Settings, all optional:
#
#   OFT_DIR          where everything is built   (default: $TMPDIR/open-frame-rehearsal)
#   OFT_PORT         port of the site            (default: 8894)
#   OFT_WORKER_PORT  port of the Worker          (default: 8895)
#   WRANGLER         the wrangler command        (default: npx --yes wrangler@4)
#   OFT_ELEMENTOR_PRO_ZIP  an Elementor Pro ZIP you are licensed to use; without
#                          it the five Pro designs are skipped, and the report says so
#
# Needs what tests/env/setup.sh needs, plus Playwright (cd tests && npm install).
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export OFT_DIR="${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-rehearsal}"
export OFT_PORT="${OFT_PORT:-8894}"
WORKER_PORT="${OFT_WORKER_PORT:-8895}"
export WRANGLER="${WRANGLER:-npx --yes wrangler@4}"
DIR="$OFT_DIR"
WP="$DIR/wordpress"
BASE="http://localhost:$WORKER_PORT/v1"
BUCKET="open-frame-library-staging"
LIBRARY="node $ROOT/tools/library.mjs"

stop_worker() {
	if [ -f "$DIR/worker.pid" ] && kill -0 "$(cat "$DIR/worker.pid")" 2> /dev/null; then
		# wrangler starts the Worker runtime as a child; stop both.
		pkill -P "$(cat "$DIR/worker.pid")" 2> /dev/null || true
		kill "$(cat "$DIR/worker.pid")" 2> /dev/null || true
	fi
	rm -f "$DIR/worker.pid"
}

if [ "${1:-}" = "stop" ]; then
	stop_worker
	bash "$ROOT/tests/env/setup.sh" stop
	exit 0
fi

mkdir -p "$DIR"
cd "$ROOT"

echo "== 1. The packages users install"
bash bin/build-zip.sh
bash bin/build-plugin-zip.sh

echo "== 2. Build, sign and check the library"
[ -s "$DIR/rehearsal.key" ] || $LIBRARY keygen --out "$DIR/rehearsal.key" > /dev/null
PUBLIC_KEY="$($LIBRARY public --key "$DIR/rehearsal.key")"
rm -rf "$DIR/library"
$LIBRARY licences --check
$LIBRARY build --out "$DIR/library" --api "$BASE" --cdn "$BASE" --key "$DIR/rehearsal.key"
$LIBRARY verify --out "$DIR/library" --api "$BASE" --cdn "$BASE" --public "$PUBLIC_KEY"

echo "== 3. The Worker, with an empty bucket"
stop_worker
rm -rf "$DIR/r2"
( cd cloud/worker && exec nohup $WRANGLER dev --env staging --local --persist-to "$DIR/r2" --port "$WORKER_PORT" --ip 127.0.0.1 ) > "$DIR/worker.log" 2>&1 < /dev/null &
echo $! > "$DIR/worker.pid"
for attempt in $(seq 1 90); do
	[ "$(curl -s -o /dev/null -w '%{http_code}' -m 3 "$BASE/catalog.json" || true)" = "404" ] && break
	if [ "$attempt" = 90 ]; then
		echo "The Worker did not start; see $DIR/worker.log" >&2
		exit 1
	fi
	sleep 1
done
echo "The Worker answers on $BASE (nothing is published yet)."

echo "== 4. Publish, publish again, and try to change a published version"
( cd cloud/worker && $LIBRARY publish --out "$DIR/library" --bucket "$BUCKET" --live "$BASE" --local "$DIR/r2" > "$DIR/publish.log" )
echo "First publication: $(grep -c '^uploaded ' "$DIR/publish.log") files uploaded."
$LIBRARY check-live --api "$BASE" --public "$PUBLIC_KEY"

AGAIN="$($LIBRARY plan --out "$DIR/library" --live "$BASE")"
echo "Publishing the same build again: $AGAIN"
case "$AGAIN" in
	"1 files to upload,"*", 0 in conflict.") ;;
	*) echo "A second publication should upload the catalog and nothing else." >&2; exit 1 ;;
esac

# The same design, changed, with the same version number.
rm -rf "$DIR/changed-sources" "$DIR/changed-library"
cp -r starter-sites "$DIR/changed-sources"
node -e '
	const fs = require( "fs" );
	const file = process.argv[ 1 ] + "/business/content/pages/home.json";
	const page = JSON.parse( fs.readFileSync( file, "utf8" ) );
	page.title += " (changed after publishing)";
	fs.writeFileSync( file, JSON.stringify( page, null, "\t" ) + "\n" );
' "$DIR/changed-sources"
$LIBRARY build --sources "$DIR/changed-sources" --out "$DIR/changed-library" --api "$BASE" --cdn "$BASE" --key "$DIR/rehearsal.key" > /dev/null
if ( cd cloud/worker && $LIBRARY publish --out "$DIR/changed-library" --bucket "$BUCKET" --live "$BASE" --local "$DIR/r2" > /dev/null 2> "$DIR/refused.log" ); then
	echo "A changed design with an unchanged version number was published. It must be refused." >&2
	exit 1
fi
grep -q 'business 1.0.0 is already published with different content' "$DIR/refused.log" || { cat "$DIR/refused.log" >&2; exit 1; }
[ "$(curl -s -m 10 "$BASE/catalog.json" | sha256sum | cut -d' ' -f1)" = "$(sha256sum < "$DIR/library/v1/catalog.json" | cut -d' ' -f1)" ] || { echo "The refused publication changed the catalog that is live." >&2; exit 1; }
echo "A changed Business 1.0.0 was refused, and the live catalog is untouched."

echo "== 5. A clean WordPress site, installed from the ZIPs"
OFT_LIBRARY_BASE="$BASE" OFT_LIBRARY_KEY="$PUBLIC_KEY" OFT_PACKAGES="$ROOT/dist" OFT_FIXTURES=no bash tests/env/setup.sh > "$DIR/setup.log"
php tests/env/run.php "$WP" tests/library/clean.php
rm -rf "$DIR/clean" && mkdir -p "$DIR/clean"
cp -r "$WP/wp-content/database" "$DIR/clean/database"
[ -d "$WP/wp-content/uploads" ] && cp -r "$WP/wp-content/uploads" "$DIR/clean/uploads"

echo "== 6. Import every design from the library"
node tests/library/import-all.js "$@"
