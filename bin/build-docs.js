#!/usr/bin/env node
/**
 * Builds docs/index.html from docs/README.md.
 *
 * Development tool only (not part of the distributed theme).
 * Usage: npm install marked && node bin/build-docs.js
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { marked } = require( 'marked' );

const root = path.resolve( __dirname, '..' );
const source = fs.readFileSync( path.join( root, 'docs/README.md' ), 'utf8' );

const slug = ( text ) => text.toLowerCase().replace( /<[^>]+>/g, '' ).replace( /[^a-z0-9 -]/g, '' ).trim().replace( /\s+/g, '-' );

const toc = [];
const renderer = new marked.Renderer();
renderer.heading = function ( token ) {
	const text = this.parser.parseInline( token.tokens );
	const id = slug( token.text );
	if ( token.depth === 2 && id !== 'contents' ) {
		toc.push( { id, text: token.text } );
	}
	return `<h${ token.depth } id="${ id }">${ text }</h${ token.depth }>\n`;
};
renderer.image = function ( token ) {
	const alt = token.text || '';
	return `<figure><a href="${ token.href }"><img src="${ token.href }" alt="${ alt }" loading="lazy"></a><figcaption>${ alt }</figcaption></figure>`;
};
renderer.table = function ( token ) {
	const cell = ( c, tag ) => `<${ tag }>${ this.parser.parseInline( c.tokens ) }</${ tag }>`;
	const head = '<tr>' + token.header.map( ( c ) => cell( c, 'th' ) ).join( '' ) + '</tr>';
	const body = token.rows.map( ( r ) => '<tr>' + r.map( ( c ) => cell( c, 'td' ) ).join( '' ) + '</tr>' ).join( '\n' );
	return `<div class="table-wrap"><table><thead>${ head }</thead><tbody>${ body }</tbody></table></div>\n`;
};

// The "Contents" list is replaced by the sidebar navigation.
const withoutContents = source.replace( /## Contents[\s\S]*?\n---\n/, '' );
let html = marked.parse( withoutContents, { renderer, gfm: true } );

// Paragraphs that only hold a figure do not need the wrapping <p>.
html = html.replace( /<p>(<figure>[\s\S]*?<\/figure>)<\/p>/g, '$1' );

const nav = toc.map( ( item ) => `<li><a href="#${ item.id }">${ item.text.replace( /^\d+\.\s*/, '' ) }</a></li>` ).join( '\n\t\t\t\t' );
const version = ( fs.readFileSync( path.join( root, 'style.css' ), 'utf8' ).match( /^Version:\s*(.+)$/m ) || [] )[ 1 ] || '';

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Open Frame — Theme Documentation</title>
<meta name="description" content="Installation, setup and reference guide for the Open Frame WordPress theme.">
<style>
@font-face { font-family: "Hanken Grotesk"; font-weight: 100 900; font-display: swap; src: url("../assets/fonts/hanken-grotesk-latin-wght-normal.woff2") format("woff2"); }
@font-face { font-family: "JetBrains Mono"; font-weight: 100 800; font-display: swap; src: url("../assets/fonts/jetbrains-mono-latin-wght-normal.woff2") format("woff2"); }
:root { --primary: #3f4cd6; --primary-dark: #2b36b8; --tint: #e8eafc; --heading: #0f172a; --text: #334155; --muted: #64748b; --border: #e2e8f0; --bg: #f8fafc; --surface: #ffffff; --code: #f1f5f9; --sidebar: 280px; }
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 1.5rem; }
body { margin: 0; font-family: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 1rem; line-height: 1.65; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; }
a { color: var(--primary); text-underline-offset: 2px; }
a:hover { color: var(--primary-dark); }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }
.skip { position: absolute; left: -999px; top: 0.75rem; background: var(--surface); padding: 0.6rem 1rem; border-radius: 8px; z-index: 10; }
.skip:focus { left: 0.75rem; }
.sidebar { position: fixed; inset: 0 auto 0 0; width: var(--sidebar); overflow-y: auto; padding: 2rem 1.5rem; background: var(--surface); border-right: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.01em; color: var(--heading); text-decoration: none; }
.brand svg { flex: 0 0 auto; }
.version { margin: 0 0 1.75rem; font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.sidebar ol { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
.sidebar li { counter-increment: toc; }
.sidebar li a { display: flex; gap: 0.6rem; padding: 0.42rem 0.7rem; border-radius: 8px; color: var(--text); font-size: 0.94rem; font-weight: 500; line-height: 1.35; text-decoration: none; }
.sidebar li a::before { content: counter(toc, decimal-leading-zero); font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 0.72rem; line-height: 1.8; color: var(--muted); }
.sidebar li a:hover, .sidebar li a.is-active { background: var(--tint); color: var(--primary); }
.sidebar li a.is-active::before { color: var(--primary); }
main { margin-left: var(--sidebar); padding: 3rem clamp(1.25rem, 4vw, 4rem) 5rem; }
.doc { max-width: 860px; margin: 0 auto; }
h1, h2, h3, h4 { color: var(--heading); line-height: 1.2; letter-spacing: -0.01em; }
h1 { margin: 0 0 1rem; font-size: clamp(2rem, 1.5rem + 2.2vw, 2.75rem); font-weight: 800; letter-spacing: -0.02em; }
h2 { margin: 4rem 0 1rem; padding-top: 2rem; border-top: 1px solid var(--border); font-size: 1.75rem; }
h3 { margin: 2.5rem 0 0.75rem; font-size: 1.25rem; }
h4 { margin: 2rem 0 0.5rem; font-size: 1.05rem; }
p, ul, ol { margin: 0 0 1rem; }
ul, ol { padding-left: 1.4rem; }
li { margin-bottom: 0.35rem; }
li > p { margin-bottom: 0.5rem; }
hr { display: none; }
code, kbd { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 0.86em; }
:not(pre) > code { padding: 0.15em 0.4em; background: var(--code); border-radius: 6px; color: var(--heading); overflow-wrap: anywhere; }
kbd { padding: 0.15em 0.45em; background: var(--surface); border: 1px solid #cbd5e1; border-bottom-width: 2px; border-radius: 6px; color: var(--heading); }
pre { margin: 0 0 1.5rem; padding: 1.1rem 1.25rem; overflow: auto; background: #0f172a; color: #f1f5f9; border-radius: 12px; font-size: 0.86rem; line-height: 1.6; }
pre code { font-size: inherit; }
blockquote { margin: 0 0 1.5rem; padding: 0.9rem 1.25rem; background: var(--tint); border-left: 4px solid var(--primary); border-radius: 10px; color: var(--heading); }
blockquote p:last-child { margin-bottom: 0; }
figure { margin: 1.5rem 0 2rem; }
figure img { display: block; max-width: 100%; height: auto; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); }
figcaption { margin-top: 0.6rem; font-size: 0.875rem; color: var(--muted); text-align: center; }
.table-wrap { margin: 0 0 1.5rem; overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 0.94rem; }
th, td { padding: 0.7rem 0.9rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
th { background: var(--code); color: var(--heading); font-weight: 600; white-space: nowrap; }
tr:last-child td { border-bottom: 0; }
.menu-toggle { display: none; }
footer { max-width: 860px; margin: 4rem auto 0; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.875rem; color: var(--muted); }
@media (max-width: 900px) {
	.sidebar { position: static; width: auto; border-right: 0; border-bottom: 1px solid var(--border); padding: 1.25rem; }
	.version { margin-bottom: 1rem; }
	.menu-toggle { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.9rem; font: inherit; font-weight: 600; color: var(--primary); background: var(--tint); border: 0; border-radius: 8px; cursor: pointer; }
	.sidebar nav { display: none; margin-top: 1rem; }
	.sidebar.is-open nav { display: block; }
	main { margin-left: 0; padding-top: 2rem; }
}
@media print {
	.sidebar { display: none; }
	main { margin: 0; padding: 0; }
	body { background: #fff; }
	h2 { break-after: avoid; }
	figure, table, pre { break-inside: avoid; }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<aside class="sidebar" id="sidebar">
	<a class="brand" href="#content">
		<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#3f4cd6"/><rect x="8" y="8" width="16" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/><rect x="13" y="13" width="11" height="11" rx="2" fill="#f5a623"/></svg>
		Open Frame
	</a>
	<p class="version">Documentation · v${ version }</p>
	<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="toc">Contents</button>
	<nav id="toc" aria-label="Documentation sections">
		<ol>
				${ nav }
		</ol>
	</nav>
</aside>
<main id="content">
	<article class="doc">
${ html }
	</article>
	<footer>Open Frame ${ version } · © 2026 Mostafij Emon · Distributed under the GNU GPL v2 or later.</footer>
</main>
<script>
( function () {
	var sidebar = document.getElementById( 'sidebar' );
	var toggle = sidebar.querySelector( '.menu-toggle' );
	var links = Array.prototype.slice.call( sidebar.querySelectorAll( 'nav a' ) );

	toggle.addEventListener( 'click', function () {
		var open = sidebar.classList.toggle( 'is-open' );
		toggle.setAttribute( 'aria-expanded', String( open ) );
	} );
	links.forEach( function ( link ) {
		link.addEventListener( 'click', function () {
			sidebar.classList.remove( 'is-open' );
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
	} );

	// Highlight the section currently being read.
	if ( 'IntersectionObserver' in window ) {
		var byId = {};
		links.forEach( function ( link ) { byId[ link.getAttribute( 'href' ).slice( 1 ) ] = link; } );
		var observer = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting && byId[ entry.target.id ] ) {
					links.forEach( function ( link ) { link.classList.remove( 'is-active' ); } );
					byId[ entry.target.id ].classList.add( 'is-active' );
				}
			} );
		}, { rootMargin: '0px 0px -75% 0px' } );
		Object.keys( byId ).forEach( function ( id ) {
			var heading = document.getElementById( id );
			if ( heading ) { observer.observe( heading ); }
		} );
	}
}() );
</script>
</body>
</html>
`;

fs.writeFileSync( path.join( root, 'docs/index.html' ), page );
console.log( 'docs/index.html written (' + toc.length + ' sections)' );
