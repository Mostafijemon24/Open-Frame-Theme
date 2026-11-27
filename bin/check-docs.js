#!/usr/bin/env node
/**
 * Checks that every link and every picture in the guides leads somewhere: in
 * the HTML pages built by bin/build-docs.js and in the Markdown documents.
 * A link to a heading has to name a heading that exists. Web addresses are
 * not requested.
 *
 * Development tool only (not part of the distributed theme or plugin).
 * Usage: node bin/check-docs.js
 */
const fs = require( 'fs' ), path = require( 'path' );
const root = path.resolve( __dirname, '..' );
const slug = ( text ) => text.toLowerCase().replace( /<[^>]+>/g, '' ).replace( /`/g, '' ).replace( /[^a-z0-9 _-]/g, '' ).trim().replace( /\s/g, '-' );
let bad = 0, seen = 0;
const ids = {};
const idsOf = ( file ) => {
	if ( ids[ file ] ) return ids[ file ];
	const text = fs.readFileSync( file, 'utf8' );
	ids[ file ] = file.endsWith( '.html' )
		? new Set( [ ...text.matchAll( / id="([^"]+)"/g ) ].map( ( m ) => m[ 1 ] ) )
		: new Set( [ ...text.matchAll( /^#{1,6} (.+)$/gm ) ].map( ( m ) => slug( m[ 1 ].replace( /\[([^\]]+)\]\([^)]+\)/g, '$1' ).replace( /\*\*/g, '' ) ) ) );
	return ids[ file ];
};
const check = ( from, href ) => {
	seen++;
	if ( /^(https?:|mailto:)/.test( href ) ) return;
	const [ file, hash ] = href.split( '#' );
	const target = file ? path.resolve( path.dirname( from ), decodeURI( file ) ) : from;
	// Links that only mean something on GitHub, such as ../../releases/latest.
	if ( ! path.resolve( target ).startsWith( root + path.sep ) && path.resolve( target ) !== root ) return;
	if ( ! fs.existsSync( target ) ) { bad++; console.log( `${ path.relative( root, from ) }: missing ${ href }` ); return; }
	if ( hash && /\.(md|html)$/.test( target ) && ! idsOf( target ).has( hash ) ) { bad++; console.log( `${ path.relative( root, from ) }: no anchor ${ href }` ); }
};
for ( const file of [ 'docs/index.html', 'docs/starter-sites.html', 'docs/install.html', 'docs/support.html' ] ) {
	const full = path.join( root, file ), text = fs.readFileSync( full, 'utf8' );
	for ( const m of text.matchAll( /<(?:a|img)[^>]*? (?:href|src)="([^"]+)"/g ) ) check( full, m[ 1 ] );
}
for ( const file of [ 'docs/README.md', 'docs/STARTER-SITES.md', 'docs/INSTALL.md', 'docs/SUPPORT.md', 'docs/dev/PLUGIN.md', 'docs/dev/RELEASE.md', 'CHANGELOG.md', 'README.md' ] ) {
	const full = path.join( root, file );
	if ( ! fs.existsSync( full ) ) continue;
	const text = fs.readFileSync( full, 'utf8' ).replace( /```[\s\S]*?```/g, '' );
	for ( const m of text.matchAll( /\]\(([^)\s]+)\)/g ) ) check( full, m[ 1 ] );
}
console.log( `${ seen } links and pictures checked, ${ bad } broken` );
process.exit( bad ? 1 : 0 );
