/**
 * Open Frame: the notice that recommends the Starter Sites plugin.
 *
 * - "Install" asks WordPress to install the plugin from the WordPress.org
 *   Plugin Directory, with WordPress's own "install-plugin" request, and shows
 *   what happened in the notice. Nothing is installed before the click, and
 *   the plugin is not activated: that is a second click.
 * - "Dismiss" and the close button remember the choice for this user.
 *
 * Without JavaScript the buttons are plain links that do the same through
 * WordPress's screens.
 */
( function () {
	'use strict';

	var settings = window.openFrameStarterNotice;
	var notice = document.querySelector( '.open-frame-starter-notice' );

	if ( ! settings || ! notice ) {
		return;
	}

	var main = notice.querySelector( '.open-frame-starter-notice__main' );
	var result = notice.querySelector( '.open-frame-starter-notice__result' );
	var status = notice.getAttribute( 'data-status' );
	var busy = false;
	var idleLabel = main ? main.textContent : '';

	function speak( message ) {
		if ( window.wp && window.wp.a11y && window.wp.a11y.speak ) {
			window.wp.a11y.speak( message );
		}
	}

	// WordPress's messages can contain links and entities; the notice shows their text.
	function plainText( html ) {
		if ( ! window.DOMParser ) {
			return String( html ).replace( /<[^>]*>/g, '' );
		}
		return new window.DOMParser().parseFromString( String( html ), 'text/html' ).body.textContent;
	}

	function post( fields ) {
		var body = new URLSearchParams();
		Object.keys( fields ).forEach( function ( key ) {
			body.append( key, fields[ key ] );
		} );

		return window.fetch( settings.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: body.toString(),
		} );
	}

	function show( message, isError ) {
		result.textContent = message;
		result.hidden = false;
		notice.classList.toggle( 'notice-error', !! isError );
		notice.classList.toggle( 'notice-info', ! isError );
		speak( message );
	}

	function setBusy( on, label ) {
		busy = on;
		main.textContent = label;
		main.classList.toggle( 'updating-message', on );
		if ( on ) {
			main.setAttribute( 'aria-disabled', 'true' );
		} else {
			main.removeAttribute( 'aria-disabled' );
		}
	}

	function fail( message ) {
		setBusy( false, settings.strings.tryAgain );
		show( message, true );
	}

	function install() {
		setBusy( true, settings.strings.installing );
		result.hidden = true;
		speak( settings.strings.installing );

		post( {
			action: 'install-plugin',
			slug: settings.slug,
			_ajax_nonce: settings.installNonce,
		} )
			.then( function ( response ) {
				return response.json();
			} )
			.then( function ( answer ) {
				var data = ( answer && answer.data ) || {};

				if ( answer && answer.success ) {
					setBusy( true, settings.strings.installed );
					show( settings.strings.installed, false );
					window.location.reload();
					return;
				}

				// WordPress needs FTP details first: its own screen asks for them.
				if ( 'unable_to_connect_to_filesystem' === data.errorCode ) {
					window.location.href = main.href;
					return;
				}

				// Someone installed it in the meantime.
				if ( 'folder_exists' === data.errorCode ) {
					window.location.reload();
					return;
				}

				// WordPress names the plugin in its answer once it has found it in the
				// directory. No name: the directory has no such plugin, or cannot be reached.
				if ( ! data.pluginName ) {
					fail( settings.strings.unavailable );
					return;
				}

				fail( data.errorMessage ? settings.strings.failed.replace( '%s', plainText( data.errorMessage ) ) : settings.strings.failedPlain );
			} )
			.catch( function () {
				fail( settings.strings.failedPlain );
			} );
	}

	function dismiss() {
		post( {
			action: 'open_frame_dismiss_starter_notice',
			nonce: settings.dismissNonce,
		} ).catch( function () {} );
	}

	if ( main && 'not-installed' === status && settings.installNonce && window.fetch && window.URLSearchParams ) {
		main.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			if ( ! busy ) {
				install();
			}
		} );
	}

	// Opening the screen is what the notice was for: it need not come back.
	if ( main && 'active' === status ) {
		main.addEventListener( 'click', function () {
			if ( window.navigator.sendBeacon && window.URLSearchParams ) {
				window.navigator.sendBeacon(
					settings.ajaxUrl,
					new URLSearchParams( { action: 'open_frame_dismiss_starter_notice', nonce: settings.dismissNonce } )
				);
			}
		} );
	}

	notice.addEventListener( 'click', function ( event ) {
		var target = event.target;

		// The close button WordPress adds to a dismissible notice removes it; remember that.
		if ( target.closest( '.notice-dismiss' ) ) {
			dismiss();
			return;
		}

		if ( target.closest( '.open-frame-starter-notice__dismiss' ) && window.fetch && window.URLSearchParams ) {
			event.preventDefault();
			dismiss();
			notice.parentNode.removeChild( notice );
		}
	} );
} )();
