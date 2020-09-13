function openNav() {
    document.getElementById("mySideNav").style.width = "300px";
}

function closeNav() {
    document.getElementById("mySideNav").style.width = "0";
}

function getSessionCart() {
	return JSON.parse(window.sessionStorage.getItem('cart'));
}

/* Function to add the product ID of the added-to product
 * {
 *		code: Product Code
 *		qty: Quantity Bought
 * }
*/
function addToCart(s) {
	var cart = getSessionCart();
	cart.push({code: s, qty: 1});
	window.sessionStorage.setItem('cart', JSON.stringify(cart));
}

function removeFromCart(s) {
	var cart = getSessionCart();
	cart = cart.filter(e => e.code !== s);
	window.sessionStorage.setItem('cart', JSON.stringify(cart));
}

/* Returns a boolean on the capacity of a cart. If cart still
 * has space, function returns true.
 */
function getCartLimit() {
	return getSessionCart().reduce((t, n) => t + n.qty, 0) < 30;
}

$(document).ready(function() {
	// creating a new cart if it doesn't exist yet
	if (!getSessionCart()) {
		window.sessionStorage.setItem('cart', JSON.stringify([]));
	}
	
	$("#lblCartCount").text(getSessionCart().length);
	
	$("addToCart").click(() => {
		// addToCart($("productID").text());
	});
	
	// creating post request to checkout cart
	$("submitCart idk what to put here").click(() => {
		var cart = getSessionCart();
		$.post('/checkout', cart, result => {
			// idk
		});
	});
	
	if (location.href === "viewCart idk exactly yet") {
		getSessionCart().forEach(e => {
			$("select something here idk yet").append(e);
		});
	}
	
	
	
	
	
	
	
	function checkScroll() {
		var opacity = 150; // start point navbar fixed to top changes in px
		if ($(window).scrollTop() > opacity) {
			$('.navbar.navbar-fixed-top').addClass("navchange");
		} else {
			$('.navbar.navbar-fixed-top').removeClass("navchange");
		}
	}
	
	if ($('.navbar').length > 0) {
		$(window).on("scroll load resize", function() {
			checkScroll();
		});
	}

	$('.dropdown').on('show.bs.dropdown', function() {
		$(this).find('.dropdown-menu').first().stop(true, true).slideDown(300);
	});

	$('.dropdown').on('hide.bs.dropdown', function() {
		$(this).find('.dropdown-menu').first().stop(true, true).slideUp(300);
	});
	
	$('[data-bs-hover-animate]')
		.mouseenter( function() {
			var elem = $(this);
			elem.addClass('animated ' + elem.attr('data-bs-hover-animate'));
		})
		.mouseleave( function() {
			var elem = $(this);
			elem.removeClass('animated ' + elem.attr('data-bs-hover-animate'));
		});
});
