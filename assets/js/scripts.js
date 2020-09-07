function getSessionCart() {
	return JSON.parse(window.sessionStorage.getItem('cart'));
}

function addToCart(s) {
	var cart = getSessionCart();
	cart.push(s);
	window.sessionStorage.setItem('cart', JSON.stringify(cart));
}

function removeFromCart(s) {
	var cart = getSessionCart();
	cart = cart.filter(e => e !== s);
	window.sessionStorage.setItem('cart', JSON.stringify(cart));
}

$(document).ready(function() {
	// creating a new cart
	if (!getSessionCart()) {
		window.sessionStorage.setItem('cart', JSON.stringify([]));
	}
	
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
});
