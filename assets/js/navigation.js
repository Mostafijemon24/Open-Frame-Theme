/**
 * Open Frame accessible navigation.
 *
 * - Toggles the mobile menu with correct aria-expanded state.
 * - Opens and closes submenus from their toggle buttons (click and keyboard).
 * - Closes open submenus on Escape, on outside click and when focus leaves.
 * - Keeps dropdowns inside the viewport and closes the mobile menu after use.
 * - Gives a transparent sticky header a solid background once the page scrolls.
 */
( function () {
	'use strict';

	function closeSubmenu( item ) {
		var btn = item.querySelector( '.of-submenu-toggle' );
		item.classList.remove( 'submenu-open' );
		if ( btn ) {
			btn.setAttribute( 'aria-expanded', 'false' );
		}
	}

	function closeSubmenus( scope, except ) {
		var open = scope.querySelectorAll( '.menu-item-has-children.submenu-open' );
		Array.prototype.forEach.call( open, function ( item ) {
			if ( ! except || ! item.contains( except ) ) {
				closeSubmenu( item );
			}
		} );
	}

	// Flip a top-level dropdown to the other edge when it would leave the
	// viewport, and tell a mega menu how far it sits below its menu item so the
	// hover bridge in the stylesheet covers the gap exactly.
	function positionSubmenu( item ) {
		var panel = null;
		var rect, itemRect, i;

		for ( i = 0; i < item.children.length; i++ ) {
			if ( item.children[ i ].classList.contains( 'sub-menu' ) ) {
				panel = item.children[ i ];
				break;
			}
		}
		if ( ! panel || window.getComputedStyle( panel ).position !== 'absolute' ) {
			return;
		}

		if ( item.classList.contains( 'of-mega' ) ) {
			itemRect = item.getBoundingClientRect();
			rect = panel.getBoundingClientRect();
			if ( rect.height > 0 && rect.top > itemRect.bottom ) {
				panel.style.setProperty( '--of-mega-gap', Math.ceil( rect.top - itemRect.bottom ) + 'px' );
			}
			return;
		}

		item.classList.remove( 'of-submenu-end' );
		rect = panel.getBoundingClientRect();
		if ( rect.width > 0 && ( rect.right > document.documentElement.clientWidth || rect.left < 0 ) ) {
			item.classList.add( 'of-submenu-end' );
		}
	}

	function setupNavigation() {
		var nav = document.getElementById( 'site-navigation' );
		if ( ! nav ) {
			return;
		}

		var toggle = nav.querySelector( '.menu-toggle' );
		var list = nav.querySelector( 'ul' );

		if ( list ) {
			Array.prototype.forEach.call( list.children, function ( item ) {
				if ( item.classList.contains( 'menu-item-has-children' ) ) {
					item.addEventListener( 'mouseenter', function () {
						positionSubmenu( item );
					} );
				}
			} );
		}

		function closeMenu() {
			nav.classList.remove( 'is-open' );
			if ( toggle ) {
				toggle.setAttribute( 'aria-expanded', 'false' );
			}
		}

		if ( toggle ) {
			toggle.addEventListener( 'click', function () {
				var expanded = toggle.getAttribute( 'aria-expanded' ) === 'true';
				toggle.setAttribute( 'aria-expanded', String( ! expanded ) );
				nav.classList.toggle( 'is-open', ! expanded );
				if ( expanded ) {
					closeSubmenus( nav );
				}
			} );
		}

		// Submenu toggle buttons.
		Array.prototype.forEach.call( nav.querySelectorAll( '.of-submenu-toggle' ), function ( btn ) {
			btn.addEventListener( 'click', function ( event ) {
				var parent = btn.closest( '.menu-item-has-children' );
				var expanded = btn.getAttribute( 'aria-expanded' ) === 'true';

				event.preventDefault();
				if ( ! parent ) {
					return;
				}

				// Close sibling branches so only one path is open at a time.
				closeSubmenus( nav, parent );

				btn.setAttribute( 'aria-expanded', String( ! expanded ) );
				parent.classList.toggle( 'submenu-open', ! expanded );
				if ( expanded ) {
					closeSubmenus( parent );
				} else if ( list && parent.parentNode === list ) {
					positionSubmenu( parent );
				}
			} );
		} );

		// Following a link (for example to a section of the same page) closes
		// the mobile menu so it does not stay over the content.
		nav.addEventListener( 'click', function ( event ) {
			var link = event.target.closest ? event.target.closest( 'a' ) : null;
			if ( link && nav.classList.contains( 'is-open' ) ) {
				closeMenu();
				closeSubmenus( nav );
			}
		} );

		// Escape closes the innermost open submenu first, then the mobile menu.
		nav.addEventListener( 'keydown', function ( event ) {
			var item, btn;

			if ( event.key !== 'Escape' ) {
				return;
			}

			item = event.target.closest ? event.target.closest( '.menu-item-has-children.submenu-open' ) : null;
			if ( item ) {
				btn = item.querySelector( '.of-submenu-toggle' );
				closeSubmenu( item );
				if ( btn ) {
					btn.focus();
				}
				event.stopPropagation();
				return;
			}

			if ( nav.classList.contains( 'is-open' ) ) {
				closeMenu();
				if ( toggle ) {
					toggle.focus();
				}
			}
		} );

		// Close submenus when keyboard focus moves out of them, and the mobile
		// menu when focus leaves the navigation altogether.
		nav.addEventListener( 'focusout', function ( event ) {
			var next = event.relatedTarget;
			if ( ! next ) {
				return;
			}
			closeSubmenus( nav, next );
			if ( ! nav.contains( next ) && nav.classList.contains( 'is-open' ) ) {
				closeMenu();
			}
		} );

		// Close submenus when clicking or tapping outside of them.
		document.addEventListener( 'click', function ( event ) {
			closeSubmenus( nav, event.target );
		} );
	}

	function setupStickyHeader() {
		var header = document.getElementById( 'masthead' );
		var ticking = false;

		if ( ! header || ! header.classList.contains( 'is-sticky' ) || ! header.classList.contains( 'is-transparent' ) ) {
			return;
		}

		function update() {
			header.classList.toggle( 'is-stuck', window.scrollY > 8 );
			ticking = false;
		}

		window.addEventListener( 'scroll', function () {
			if ( ! ticking ) {
				ticking = true;
				window.requestAnimationFrame( update );
			}
		}, { passive: true } );

		update();
	}

	function init() {
		setupNavigation();
		setupStickyHeader();
	}

	if ( document.readyState !== 'loading' ) {
		init();
	} else {
		document.addEventListener( 'DOMContentLoaded', init );
	}
}() );
