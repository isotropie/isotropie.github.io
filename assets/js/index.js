
(function () {
	(function main() {
		var sections, section, home;

		document.addEventListener( 'click', onClick, false );
		window.addEventListener( 'popstate', onPopState, false );
	})()

	function onPopState( e ) {
		loadPath( document.location.pathname + document.location.hash );
	}

	function autoScroll() {
	}

	function onClick( e ) {
		var link, path;
		link = e.target;

		if ( link.matches( 'a, a *' ) ) {
			do {
				if ( link.tagName.toLowerCase() === 'a' ) {
					break;
				}
			} while ( link = link.parentNode );

			if ( link ) {
				path = link.getAttribute( 'href' );
				if ( path && path[ 0 ] === '/' ) {
					e.preventDefault();
					history.pushState( null, "", path );
					loadPath( path, link );
				}
			}
		}
	}

	function loadPath( path, link ) {
		var container, curr, path;
		container = document.querySelector( '.main' );
		curr = document.querySelector( '.home, .page' );
		document.body.classList.add( 'loading' );

		if ( container && path ) {
			if ( path === '/' ) {
				link = null;
			}

			if ( link ) link.classList.add( 'loading' );
			else curr.style.opacity = '0';

			load( path, container, function ( err, el ) {
				if ( el ) {
					if ( link ) {
						animate( link, path, el, function () {
							link.classList.remove( 'loading' );
							document.body.classList.remove( 'loading' );
							if ( curr && curr.parentNode ) {
								curr.parentNode.removeChild( curr );
							}
						} );
					} else {
						el.style.opacity = '1';
						if ( curr && curr.parentNode ) {
							curr.parentNode.removeChild( curr );
						}
						document.body.classList.remove( 'loading' );
					}
				}
			}, 500 );
		}
	}

	function animate( link, path, el, cb ) {
		var img, orgWidth, scale, linkRect, imgRect, pageRect, x, y, r, tx, ty, cx, cy;

		img = getImage( el, path );
		if ( !img ) {
			cb();
			return;
		}

		orgWidth = parseInt( link.getAttribute( 'data-width' ), 10 ) ||
			img.naturalWidth;
		scale = img.width / orgWidth;

		imgRect = img.getBoundingClientRect();
		pageRect = el.getBoundingClientRect();
		el.scrollTop = imgRect.top - pageRect.top;

		linkRect = link.getBoundingClientRect();
		imgRect = img.getBoundingClientRect();
		pageRect = el.getBoundingClientRect();

		x = ( parseInt( link.getAttribute( 'data-x' ), 10 ) || 0 );
		y = ( parseInt( link.getAttribute( 'data-y' ), 10 ) || 0 );

		tx = imgRect.left + x * scale - ( linkRect.left + linkRect.width * 0.5 );
		ty = imgRect.top + y * scale - ( linkRect.top + linkRect.height * 0.5 );

		link.style.transformOrigin = '50% 50%';
		link.parentNode.style.zIndex = '10';
		link.parentNode.style.transform =
			'translate3d(' + tx + 'px, 0px, 1px)';
		link.style.transform =
			'translate3d(0px, ' + ty + 'px, 1px) ' +
			'scale(' + scale + ')';

		r = 100 * scale;
		cx = x * scale + (imgRect.left - pageRect.left);
		cy = y * scale + (imgRect.top - pageRect.top);
		el.style.clipPath = 'circle(' + r + 'px at ' + cx + 'px ' + cy + 'px)';

		// TODO improve
		setTimeout( function () {
			el.style.opacity = '1';
			el.style.transition = 'clip-path 1000ms ease-in-out, transform 300ms linear';
			r = Math.max( window.innerWidth, window.innerHeight );
			el.style.clipPath = 'circle(' + r + 'px at ' + cx + 'px ' + cy + 'px)';
			link.style.display = 'none';
			setTimeout( function () {
				reset( link, el )
				cb();
			}, 1000 );
		}, 600 );
	}

	function reset( link, el ) {
		link.removeAttribute( 'style' );
		link.parentNode.removeAttribute( 'style' );
		el.removeAttribute( 'style' );
	}

	function getImage( el, path ) {
		var id = path.split( '#' )[ 1 ] || 'page-1';
		return el.querySelector( '#' + id + ' img' )
	}

	function load( path, container, cb, minDuration ) {
		var t0, minDuration;
		t0 = Date.now();
		minDuration = minDuration || 0;

		fetch( path )
			.then( function ( res ) { return res.text(); } )
			.then( function ( res ) {
				var el = getInclude( res );
				el.style.opacity = '0';
				waitForImages( el, function () {
					console.log( 'loaded' );
					var elapsed = Date.now() - t0;
					if ( elapsed < minDuration ) {
						setTimeout( cb.bind( null, null, el ), minDuration - elapsed );
					} else {
						cb( null, el );
					}
				} );
				container.appendChild( el );
			} )
			.catch( function ( err ) {
				console.log( err );
				cb( err );
			} );
	}

	function getInclude( html ) {
		var container, el;
		container = document.createElement( 'div' );
		container.innerHTML = html;
		el = container.querySelector( '#include' );
		if ( el ) {
			el.parentNode.removeChild( el );
		}

		return el;
	}

	function waitForImages( cont, cb ) {
		var imgs, img, counter, err;
		imgs = cont.querySelectorAll( 'img' );
		counter = 1;
		function onLoaded() {
			counter--;
			if ( counter === 0 ) {
				cb( err );
			}
		}
		function onError( e ) {
			err = e;
			onLoaded();
		}

		if ( imgs && imgs.length ) {
			for ( var i = 0, l = imgs.length; i < l; i++ ) {
				counter++;
				img = new Image();
				img.onload = onLoaded;
				img.onerror = onError;
				img.src = imgs[ i ].src;
			}
		}
		
		// return immediately if no images need to be loaded
		onLoaded();
	}
})();
