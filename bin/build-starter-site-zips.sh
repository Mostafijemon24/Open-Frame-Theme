#!/usr/bin/env bash
#
# Packs each starter site into an archive of its own, for the release page:
#
#   dist/starter-sites/open-frame-starter-site-<id>-<version>.zip
#   dist/starter-sites/SHA256SUMS.txt
#
# An archive holds the complete source of one design, as it is kept in the
# folder starter-sites/<id>: its pages, texts and settings (content), its
# pictures and fonts, its preview pictures, and the record of where every
# picture comes from and under which licence. It is what the library is built
# from (docs/dev/LIBRARY.md).
#
# The archives are for keeping, studying and building a library of your own.
# A site does not need them: the Starter Sites plugin fetches a design from the
# library by itself.
#
# Usage: bash bin/build-starter-site-zips.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCES="$ROOT/starter-sites"
OUT="$ROOT/dist/starter-sites"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

rm -rf "$OUT"
mkdir -p "$OUT"

# "<id> <version> <tier> <name>" for every design, read from its site.json.
list() {
	node -e '
		const fs = require( "fs" );
		const path = require( "path" );
		for ( const entry of fs.readdirSync( process.argv[ 1 ], { withFileTypes: true } ) ) {
			const file = path.join( process.argv[ 1 ], entry.name, "site.json" );
			if ( ! entry.isDirectory() || ! fs.existsSync( file ) ) {
				continue;
			}
			const site = JSON.parse( fs.readFileSync( file, "utf8" ) );
			if ( site.id !== entry.name || ! /^[a-z0-9-]+$/.test( site.id ) || ! /^\d+\.\d+\.\d+$/.test( site.version ) ) {
				console.error( "Unexpected id or version in " + file );
				process.exit( 1 );
			}
			console.log( [ site.id, site.version, site.tier, site.name ].join( " " ) );
		}
	' "$SOURCES"
}

COUNT=0
while read -r ID VERSION TIER NAME; do
	FOLDER="open-frame-starter-site-$ID"
	mkdir -p "$STAGE/$FOLDER"
	cp -R "$SOURCES/$ID/." "$STAGE/$FOLDER"

	if [ "$TIER" = "pro" ]; then NEEDS="Elementor Pro"; else NEEDS="the free version of Elementor"; fi
	cat > "$STAGE/$FOLDER/README.txt" <<TEXT
$NAME $VERSION
A starter site for the Open Frame theme, made with $NEEDS.

This archive holds the source of the design: its pages, texts and settings
(content), its pictures (media) and fonts, its preview pictures (preview) and
the record of where every picture comes from and under which licence
(CREDITS.md, LICENSES.md, photos.json).

To use the design on a WordPress site you do not need this archive. Install the
Open Frame theme and the Open Frame Starter Sites plugin, go to
Appearance > Starter Sites and import "$NAME" there. The plugin fetches it
from the library and checks every file.

The archive is for keeping, for studying, and for building a library of your
own with the tools in the repository:
https://github.com/Mostafijemon24/Open-Frame-Theme/blob/main/docs/dev/LIBRARY.md

The pages, texts and settings are licensed under the GNU General Public
License, version 2 or later. The pictures and fonts are in the public domain,
under CC0 or under the SIL Open Font License; LICENSES.md names each one.
TEXT

	( cd "$STAGE" && zip -rqX "$OUT/$FOLDER-$VERSION.zip" "$FOLDER" -x '*.DS_Store' )
	COUNT=$((COUNT + 1))
done < <(list)

[ "$COUNT" -gt 0 ] || { echo "No starter site was found in $SOURCES." >&2; exit 1; }

( cd "$OUT" && sha256sum ./*.zip | sed 's# \./# #' > SHA256SUMS.txt )

echo "Built $COUNT starter site archives in dist/starter-sites ($(du -sh "$OUT" | cut -f1))"
