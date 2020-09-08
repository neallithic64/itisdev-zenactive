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
});
