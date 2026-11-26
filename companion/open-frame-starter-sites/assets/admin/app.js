/**
 * Starter Sites screen.
 *
 * Written against the packages WordPress ships (wp.element, wp.components,
 * wp.apiFetch, wp.i18n, wp.a11y), without a build step: this file is the
 * source and what runs in the browser.
 */
( function ( wp, settings ) {
	'use strict';

	const { createElement: h, Fragment, useState, useEffect, useMemo, useCallback, useRef } = wp.element;
	const { __, _n, sprintf } = wp.i18n;
	const { Button, Modal, Spinner, Notice, SearchControl, SelectControl, ExternalLink } = wp.components;
	const { speak } = wp.a11y;
	const apiFetch = wp.apiFetch;

	const path = ( rest ) => '/' + settings.namespace + rest;

	/** Message of a failed request, always something a person can act on. */
	const messageOf = ( error ) =>
		error && typeof error.message === 'string' && error.message
			? error.message
			: __( 'Something went wrong. Please try again.', 'open-frame-starter-sites' );

	const TIER_LABEL = {
		free: __( 'Free', 'open-frame-starter-sites' ),
		pro: __( 'Needs Elementor Pro', 'open-frame-starter-sites' ),
	};

	const STATE_MESSAGE = {
		coming_soon: __( 'This design is on its way and cannot be imported yet. You can already see what it will need.', 'open-frame-starter-sites' ),
		update_plugin: __( 'This design needs a newer version of the Open Frame Starter Sites plugin. Update the plugin, then come back.', 'open-frame-starter-sites' ),
		incompatible: __( 'Your site does not meet the requirements marked below yet.', 'open-frame-starter-sites' ),
		needs_pro: __( 'This design is built with Elementor Pro, which is sold by Elementor. Install and activate Elementor Pro, then come back.', 'open-frame-starter-sites' ),
		needs_plugins: __( 'This design needs the plugins marked below. You can install them here.', 'open-frame-starter-sites' ),
		ready: __( 'Your site has everything this design needs.', 'open-frame-starter-sites' ),
	};

	const PART_LABEL = {
		pages: __( 'Pages', 'open-frame-starter-sites' ),
		header: __( 'Header', 'open-frame-starter-sites' ),
		footer: __( 'Footer', 'open-frame-starter-sites' ),
		404: __( '"Page not found" page', 'open-frame-starter-sites' ),
		blog: __( 'Blog and archives', 'open-frame-starter-sites' ),
		single: __( 'Single post', 'open-frame-starter-sites' ),
		shop: __( 'Shop and product pages', 'open-frame-starter-sites' ),
	};

	const HOW_LABEL = {
		elementor: __( 'Edit with Elementor', 'open-frame-starter-sites' ),
		theme: __( 'Set in the Customizer', 'open-frame-starter-sites' ),
	};

	const PLUGIN_STATUS = {
		active: __( 'Active', 'open-frame-starter-sites' ),
		inactive: __( 'Installed, not active', 'open-frame-starter-sites' ),
		missing: __( 'Not installed', 'open-frame-starter-sites' ),
		outdated: __( 'Needs an update', 'open-frame-starter-sites' ),
	};

	const ACTION_LABEL = {
		install: __( 'Install and activate', 'open-frame-starter-sites' ),
		activate: __( 'Activate', 'open-frame-starter-sites' ),
		update: __( 'Update', 'open-frame-starter-sites' ),
	};

	const ACTION_PROGRESS = {
		/* translators: %s: plugin name. */
		install: __( 'Installing %s…', 'open-frame-starter-sites' ),
		/* translators: %s: plugin name. */
		activate: __( 'Activating %s…', 'open-frame-starter-sites' ),
		/* translators: %s: plugin name. */
		update: __( 'Updating %s…', 'open-frame-starter-sites' ),
	};

	/** A small label. The text carries the meaning; the color only supports it. */
	function Badge( { kind, children } ) {
		return h( 'span', { className: 'ofss-badge ofss-badge--' + kind }, children );
	}

	function Badges( { site } ) {
		return h(
			'span',
			{ className: 'ofss-badges' },
			h( Badge, { kind: site.tier }, TIER_LABEL[ site.tier ] ),
			site.status === 'coming_soon' && h( Badge, { kind: 'soon' }, __( 'Coming soon', 'open-frame-starter-sites' ) ),
			site.update_available && h( Badge, { kind: 'update' }, __( 'Update available', 'open-frame-starter-sites' ) ),
			site.imported_version && ! site.update_available && h( Badge, { kind: 'imported' }, __( 'Imported', 'open-frame-starter-sites' ) )
		);
	}

	/** One design in the grid. */
	function Card( { site, categoryName, onOpen } ) {
		return h(
			'li',
			{ className: 'ofss-card' },
			h(
				'button',
				{
					type: 'button',
					className: 'ofss-card__preview',
					onClick: () => onOpen( site.id ),
					// The "View details" button below does the same for keyboard and screen reader users.
					tabIndex: -1,
					'aria-hidden': 'true',
				},
				h( 'img', { src: site.thumbnail, alt: '', width: 1200, height: 900, loading: 'lazy', decoding: 'async' } )
			),
			h(
				'div',
				{ className: 'ofss-card__body' },
				h( 'h2', { className: 'ofss-card__title' }, site.name ),
				h(
					'p',
					{ className: 'ofss-card__meta' },
					categoryName,
					' · ',
					/* translators: %d: number of pages. */
					sprintf( _n( '%d page', '%d pages', site.page_count, 'open-frame-starter-sites' ), site.page_count )
				),
				h( Badges, { site } ),
				h(
					Button,
					{
						variant: 'secondary',
						className: 'ofss-card__button',
						onClick: () => onOpen( site.id ),
						/* translators: %s: starter site name. */
						'aria-label': sprintf( __( 'View details: %s', 'open-frame-starter-sites' ), site.name ),
					},
					__( 'View details', 'open-frame-starter-sites' )
				)
			)
		);
	}

	/** A passed or failed check, said in words. */
	function CheckItem( { ok, label, detail, help } ) {
		return h(
			'li',
			{ className: 'ofss-check ofss-check--' + ( ok ? 'ok' : 'fail' ) },
			h( 'span', { className: 'dashicons ' + ( ok ? 'dashicons-yes-alt' : 'dashicons-warning' ), 'aria-hidden': 'true' } ),
			h(
				'span',
				{ className: 'ofss-check__text' },
				h( 'strong', null, label ),
				detail && h( 'span', { className: 'ofss-check__detail' }, ' ', detail ),
				h( 'span', { className: 'screen-reader-text' }, ok ? __( '(met)', 'open-frame-starter-sites' ) : __( '(not met)', 'open-frame-starter-sites' ) ),
				! ok && help && h( 'span', { className: 'ofss-check__help' }, help )
			)
		);
	}

	function environmentDetail( item ) {
		if ( item.required && item.current ) {
			/* translators: 1: required version, 2: installed version. */
			return sprintf( __( 'needs %1$s or newer, you have %2$s', 'open-frame-starter-sites' ), item.required, item.current );
		}
		return item.current || '';
	}

	/** A required plugin with its status and, where possible, a button that resolves it. */
	function PluginItem( { plugin, busy, disabled, onResolve } ) {
		const ok = plugin.status === 'active';
		let action = null;

		if ( ! ok && plugin.action === 'external' ) {
			action = plugin.url
				? h(
						ExternalLink,
						{ href: plugin.url },
						/* translators: %s: plugin name. */
						sprintf( __( 'Get %s', 'open-frame-starter-sites' ), plugin.name )
				  )
				: h( 'span', { className: 'ofss-check__help' }, __( 'Install this plugin by hand under Plugins > Add New.', 'open-frame-starter-sites' ) );
		} else if ( ! ok && plugin.allowed ) {
			action = h(
				Button,
				{
					variant: 'primary',
					size: 'compact',
					isBusy: busy,
					disabled: disabled || busy,
					// Stays focusable while it works, so focus is not thrown back to the page.
					accessibleWhenDisabled: true,
					onClick: () => onResolve( plugin ),
					'aria-label': ACTION_LABEL[ plugin.action ] + ': ' + plugin.name,
				},
				busy ? sprintf( ACTION_PROGRESS[ plugin.action ], plugin.name ) : ACTION_LABEL[ plugin.action ]
			);
		} else if ( ! ok ) {
			action = h( 'span', { className: 'ofss-check__help' }, __( 'Your account cannot install plugins on this site. Ask an administrator to do it.', 'open-frame-starter-sites' ) );
		}

		const version = plugin.version
			? /* translators: %s: version number. */
			  sprintf( __( 'version %s or newer', 'open-frame-starter-sites' ), plugin.version )
			: '';

		return h(
			'li',
			{ className: 'ofss-check ofss-check--' + ( ok ? 'ok' : 'fail' ) },
			h( 'span', { className: 'dashicons ' + ( ok ? 'dashicons-yes-alt' : 'dashicons-warning' ), 'aria-hidden': 'true' } ),
			h(
				'span',
				{ className: 'ofss-check__text' },
				h( 'strong', null, plugin.name ),
				! plugin.required && h( 'span', { className: 'ofss-check__detail' }, ' ', __( '(optional)', 'open-frame-starter-sites' ) ),
				h( 'span', { className: 'ofss-check__detail' }, ' ', [ version, PLUGIN_STATUS[ plugin.status ] ].filter( Boolean ).join( ' · ' ) )
			),
			action && h( 'span', { className: 'ofss-check__action' }, action )
		);
	}

	/** Everything about one design, in a dialog. */
	function Details( { siteId, summary, categoryName, onClose, onChanged } ) {
		const [ site, setSite ] = useState( null );
		const [ error, setError ] = useState( '' );
		const [ actionError, setActionError ] = useState( '' );
		const [ busy, setBusy ] = useState( '' );
		const [ shot, setShot ] = useState( 0 );

		useEffect( () => {
			let cancelled = false;
			apiFetch( { path: path( '/sites/' + siteId ) } )
				.then( ( result ) => ! cancelled && setSite( result ) )
				.catch( ( problem ) => ! cancelled && setError( messageOf( problem ) ) );
			return () => {
				cancelled = true;
			};
		}, [ siteId ] );

		const resolve = useCallback(
			( plugin ) => {
				setBusy( plugin.slug );
				setActionError( '' );
				speak( sprintf( ACTION_PROGRESS[ plugin.action ], plugin.name ) );

				apiFetch( { path: path( '/requirements' ), method: 'POST', data: { site: siteId, plugin: plugin.slug } } )
					.then( ( result ) => {
						setSite( ( current ) => Object.assign( {}, current, { requirements: result.requirements } ) );
						/* translators: %s: plugin name. */
						speak( sprintf( __( '%s is now active.', 'open-frame-starter-sites' ), plugin.name ) );
						onChanged();
					} )
					.catch( ( problem ) => {
						setActionError( messageOf( problem ) );
						speak( messageOf( problem ), 'assertive' );
					} )
					.finally( () => setBusy( '' ) );
			},
			[ siteId, onChanged ]
		);

		const images = site
			? [ { title: __( 'Overview', 'open-frame-starter-sites' ), url: site.preview.thumbnail } ].concat( site.preview.screenshots )
			: [ { title: '', url: summary.thumbnail } ];
		const image = images[ Math.min( shot, images.length - 1 ) ];
		const requirements = site ? site.requirements : null;

		return h(
			Modal,
			{ title: summary.name, onRequestClose: onClose, className: 'ofss-details', size: 'large' },
			h(
				'div',
				{ className: 'ofss-details__layout' },
				h(
					'div',
					{ className: 'ofss-details__preview' },
					h( 'img', {
						src: image.url,
						/* translators: 1: starter site name, 2: page name. */
						alt: sprintf( __( 'Preview of %1$s: %2$s', 'open-frame-starter-sites' ), summary.name, image.title ),
						width: 1200,
						height: 900,
					} ),
					images.length > 1 &&
						h(
							'ul',
							{ className: 'ofss-details__shots', 'aria-label': __( 'Page previews', 'open-frame-starter-sites' ) },
							images.map( ( item, index ) =>
								h(
									'li',
									{ key: item.url },
									h( Button, { variant: index === shot ? 'primary' : 'tertiary', size: 'small', 'aria-pressed': index === shot, onClick: () => setShot( index ) }, item.title )
								)
							)
						)
				),
				h(
					'div',
					{ className: 'ofss-details__info' },
					h( 'p', { className: 'ofss-card__meta' }, categoryName, ' · ', h( Badges, { site: summary } ) ),
					error && h( Notice, { status: 'error', isDismissible: false }, error ),
					! site && ! error && h( 'p', { className: 'ofss-loading' }, h( Spinner ), ' ', __( 'Checking what this design needs…', 'open-frame-starter-sites' ) ),
					site &&
						h(
							Fragment,
							null,
							site.summary && h( 'p', { className: 'ofss-details__summary' }, site.summary ),
							h( 'p', { className: 'ofss-details__state ofss-details__state--' + requirements.state, role: 'status' }, STATE_MESSAGE[ requirements.state ] ),
							site.preview.demo_url && h( 'p', null, h( ExternalLink, { href: site.preview.demo_url }, __( 'Open the live demo', 'open-frame-starter-sites' ) ) ),

							h( 'h2', null, __( 'What it needs', 'open-frame-starter-sites' ) ),
							actionError && h( Notice, { status: 'error', onRemove: () => setActionError( '' ) }, actionError ),
							h(
								'ul',
								{ className: 'ofss-checks' },
								requirements.environment.map( ( item ) => h( CheckItem, { key: item.id, ok: item.ok, label: item.label, detail: environmentDetail( item ), help: item.help } ) ),
								requirements.plugins.map( ( plugin ) =>
									h( PluginItem, { key: plugin.slug, plugin, busy: busy === plugin.slug, disabled: busy !== '', onResolve: resolve } )
								)
							),

							site.pages.length > 0 &&
								h(
									Fragment,
									null,
									h(
										'h2',
										null,
										/* translators: %d: number of pages. */
										sprintf( _n( '%d page included', '%d pages included', site.pages.length, 'open-frame-starter-sites' ), site.pages.length )
									),
									h( 'ul', { className: 'ofss-pages' }, site.pages.map( ( page ) => h( 'li', { key: page }, page ) ) )
								),

							Object.keys( site.editable ).length > 0 &&
								h(
									Fragment,
									null,
									h( 'h2', null, __( 'Where you edit each part', 'open-frame-starter-sites' ) ),
									h(
										'table',
										{ className: 'ofss-editable' },
										h(
											'tbody',
											null,
											Object.keys( site.editable ).map( ( part ) =>
												h( 'tr', { key: part }, h( 'th', { scope: 'row' }, PART_LABEL[ part ] ), h( 'td', null, HOW_LABEL[ site.editable[ part ] ] ) )
											)
										)
									)
								)
						)
				)
			)
		);
	}

	/** Past imports. Shown only when there are any. */
	function History() {
		const [ entries, setEntries ] = useState( null );
		const [ error, setError ] = useState( '' );

		useEffect( () => {
			apiFetch( { path: path( '/history' ) } )
				.then( ( result ) => setEntries( result.entries ) )
				.catch( ( problem ) => setError( messageOf( problem ) ) );
		}, [] );

		if ( error ) {
			return h( Notice, { status: 'error', isDismissible: false }, error );
		}
		if ( ! entries ) {
			return h( 'p', { className: 'ofss-loading' }, h( Spinner ), ' ', __( 'Loading…', 'open-frame-starter-sites' ) );
		}

		const RESULT = {
			success: __( 'Imported', 'open-frame-starter-sites' ),
			failed: __( 'Failed', 'open-frame-starter-sites' ),
			rolled_back: __( 'Rolled back', 'open-frame-starter-sites' ),
		};

		return h(
			'table',
			{ className: 'widefat striped ofss-history' },
			h( 'caption', { className: 'screen-reader-text' }, __( 'Past imports, newest first', 'open-frame-starter-sites' ) ),
			h(
				'thead',
				null,
				h(
					'tr',
					null,
					h( 'th', { scope: 'col' }, __( 'Design', 'open-frame-starter-sites' ) ),
					h( 'th', { scope: 'col' }, __( 'Date', 'open-frame-starter-sites' ) ),
					h( 'th', { scope: 'col' }, __( 'Result', 'open-frame-starter-sites' ) ),
					h( 'th', { scope: 'col' }, __( 'Notes', 'open-frame-starter-sites' ) )
				)
			),
			h(
				'tbody',
				null,
				entries.map( ( entry ) =>
					h(
						'tr',
						{ key: entry.id },
						h( 'th', { scope: 'row' }, entry.name, entry.version ? ' ' + entry.version : '' ),
						h( 'td', null, entry.started ? new Date( entry.started * 1000 ).toLocaleString() : '' ),
						h( 'td', null, RESULT[ entry.result ] ),
						h( 'td', null, entry.error || entry.warnings.join( ' ' ) )
					)
				)
			)
		);
	}

	function App() {
		const [ status, setStatus ] = useState( 'loading' );
		const [ catalog, setCatalog ] = useState( null );
		const [ error, setError ] = useState( '' );
		const [ refreshing, setRefreshing ] = useState( false );
		const [ search, setSearch ] = useState( '' );
		const [ category, setCategory ] = useState( '' );
		const [ tier, setTier ] = useState( '' );
		const [ openId, setOpenId ] = useState( '' );
		const [ view, setView ] = useState( 'sites' );
		const firstLoad = useRef( true );

		const load = useCallback( ( refresh, quiet ) => {
			if ( ! quiet ) {
				setRefreshing( true );
			}
			return apiFetch( { path: path( '/sites' + ( refresh ? '?refresh=1' : '' ) ) } )
				.then( ( result ) => {
					setCatalog( result );
					setStatus( 'ready' );
					setError( '' );
					if ( refresh && ! quiet ) {
						speak( result.stale ? result.notice : __( 'The list is up to date.', 'open-frame-starter-sites' ) );
					}
				} )
				.catch( ( problem ) => {
					setError( messageOf( problem ) );
					// A list that is already on screen stays there.
					setStatus( ( current ) => ( current === 'ready' ? 'ready' : 'error' ) );
					speak( messageOf( problem ), 'assertive' );
				} )
				.finally( () => setRefreshing( false ) );
		}, [] );

		useEffect( () => {
			if ( firstLoad.current ) {
				firstLoad.current = false;
				load( false );
			}
		}, [ load ] );

		const categoryNames = useMemo( () => {
			const names = {};
			( catalog ? catalog.categories : [] ).forEach( ( item ) => {
				names[ item.slug ] = item.name;
			} );
			return names;
		}, [ catalog ] );

		const visible = useMemo( () => {
			if ( ! catalog ) {
				return [];
			}
			const words = search.toLowerCase().split( /\s+/ ).filter( Boolean );
			return catalog.sites.filter( ( site ) => {
				if ( category && site.category !== category ) {
					return false;
				}
				if ( tier && site.tier !== tier ) {
					return false;
				}
				const haystack = [ site.name, site.summary, categoryNames[ site.category ] || '', site.tags.join( ' ' ) ].join( ' ' ).toLowerCase();
				return words.every( ( word ) => haystack.includes( word ) );
			} );
		}, [ catalog, search, category, tier, categoryNames ] );

		// Tell screen reader users how many designs a filter left. Only a change
		// of the filters is announced, not a list that was merely reloaded.
		const filters = [ search, category, tier ].join( '\n' );
		const announcedFilters = useRef( filters );
		useEffect( () => {
			if ( ! catalog || announcedFilters.current === filters ) {
				return;
			}
			announcedFilters.current = filters;
			/* translators: %d: number of starter sites. */
			speak( sprintf( _n( '%d design shown.', '%d designs shown.', visible.length, 'open-frame-starter-sites' ), visible.length ) );
		}, [ filters, visible.length, catalog ] );

		const usedCategories = useMemo( () => {
			if ( ! catalog ) {
				return [];
			}
			const used = new Set( catalog.sites.map( ( site ) => site.category ) );
			return catalog.categories.filter( ( item ) => used.has( item.slug ) );
		}, [ catalog ] );

		const themeNotice =
			! settings.themeActive &&
			h(
				Notice,
				{ status: 'warning', isDismissible: false, className: 'ofss-notice' },
				__( 'These designs are made for the Open Frame theme, which is not active on this site.', 'open-frame-starter-sites' ),
				' ',
				h( 'a', { href: settings.themesUrl }, __( 'Go to Themes', 'open-frame-starter-sites' ) )
			);

		if ( status === 'loading' ) {
			return h( 'p', { className: 'ofss-loading', role: 'status' }, h( Spinner ), ' ', __( 'Loading the designs…', 'open-frame-starter-sites' ) );
		}

		if ( status === 'error' ) {
			return h(
				Fragment,
				null,
				themeNotice,
				h(
					'div',
					{ className: 'ofss-empty', role: 'alert' },
					h( 'h2', null, __( 'The designs could not be loaded', 'open-frame-starter-sites' ) ),
					h( 'p', null, error ),
					h( Button, { variant: 'primary', isBusy: refreshing, disabled: refreshing, accessibleWhenDisabled: true, onClick: () => load( true ) }, __( 'Try again', 'open-frame-starter-sites' ) )
				)
			);
		}

		const openSummary = openId ? catalog.sites.find( ( site ) => site.id === openId ) : null;

		return h(
			Fragment,
			null,
			themeNotice,
			catalog.stale &&
				h(
					Notice,
					{ status: 'warning', isDismissible: false, className: 'ofss-notice' },
					__( 'Showing the list saved earlier.', 'open-frame-starter-sites' ),
					' ',
					catalog.notice
				),
			error && h( Notice, { status: 'error', className: 'ofss-notice', onRemove: () => setError( '' ) }, error ),

			settings.hasHistory &&
				h(
					'div',
					{ className: 'ofss-views', role: 'group', 'aria-label': __( 'Sections', 'open-frame-starter-sites' ) },
					h( Button, { variant: view === 'sites' ? 'primary' : 'secondary', 'aria-pressed': view === 'sites', onClick: () => setView( 'sites' ) }, __( 'Designs', 'open-frame-starter-sites' ) ),
					h( Button, { variant: view === 'history' ? 'primary' : 'secondary', 'aria-pressed': view === 'history', onClick: () => setView( 'history' ) }, __( 'Import history', 'open-frame-starter-sites' ) )
				),

			view === 'history' && h( History ),

			view === 'sites' &&
				h(
					Fragment,
					null,
					h(
						'div',
						{ className: 'ofss-toolbar' },
						h( SearchControl, {
							className: 'ofss-toolbar__search',
							label: __( 'Search designs', 'open-frame-starter-sites' ),
							placeholder: __( 'Search designs', 'open-frame-starter-sites' ),
							value: search,
							onChange: setSearch,
							__nextHasNoMarginBottom: true,
						} ),
						h( SelectControl, {
							className: 'ofss-toolbar__select',
							label: __( 'Category', 'open-frame-starter-sites' ),
							value: category,
							onChange: setCategory,
							options: [ { value: '', label: __( 'All categories', 'open-frame-starter-sites' ) } ].concat( usedCategories.map( ( item ) => ( { value: item.slug, label: item.name } ) ) ),
							__nextHasNoMarginBottom: true,
							__next40pxDefaultSize: true,
						} ),
						h( SelectControl, {
							className: 'ofss-toolbar__select',
							label: __( 'Elementor version', 'open-frame-starter-sites' ),
							value: tier,
							onChange: setTier,
							options: [
								{ value: '', label: __( 'Free and Pro', 'open-frame-starter-sites' ) },
								{ value: 'free', label: __( 'Works with free Elementor', 'open-frame-starter-sites' ) },
								{ value: 'pro', label: __( 'Needs Elementor Pro', 'open-frame-starter-sites' ) },
							],
							__nextHasNoMarginBottom: true,
							__next40pxDefaultSize: true,
						} ),
						h(
							'div',
							{ className: 'ofss-toolbar__refresh' },
							h( Button, { variant: 'tertiary', isBusy: refreshing, disabled: refreshing, accessibleWhenDisabled: true, onClick: () => load( true ) }, __( 'Check for new designs', 'open-frame-starter-sites' ) ),
							h(
								'span',
								{ className: 'ofss-toolbar__time' },
								/* translators: %s: date and time. */
								sprintf( __( 'Last checked: %s', 'open-frame-starter-sites' ), new Date( catalog.fetched_at * 1000 ).toLocaleString() )
							)
						)
					),

					visible.length === 0
						? h(
								'div',
								{ className: 'ofss-empty' },
								h( 'h2', null, catalog.sites.length === 0 ? __( 'No designs are available yet', 'open-frame-starter-sites' ) : __( 'No designs match your search', 'open-frame-starter-sites' ) ),
								catalog.sites.length > 0 &&
									h(
										Button,
										{
											variant: 'secondary',
											onClick: () => {
												setSearch( '' );
												setCategory( '' );
												setTier( '' );
											},
										},
										__( 'Show all designs', 'open-frame-starter-sites' )
									)
						  )
						: h(
								'ul',
								{ className: 'ofss-grid' },
								visible.map( ( site ) => h( Card, { key: site.id, site, categoryName: categoryNames[ site.category ] || site.category, onOpen: setOpenId } ) )
						  )
				),

			openSummary &&
				h( Details, {
					siteId: openSummary.id,
					summary: openSummary,
					categoryName: categoryNames[ openSummary.category ] || openSummary.category,
					onClose: () => setOpenId( '' ),
					onChanged: () => load( false, true ),
				} )
		);
	}

	const root = document.getElementById( 'ofss-root' );
	if ( root ) {
		if ( wp.element.createRoot ) {
			wp.element.createRoot( root ).render( h( App ) );
		} else {
			wp.element.render( h( App ), root );
		}
	}
} )( window.wp, window.ofssData );
