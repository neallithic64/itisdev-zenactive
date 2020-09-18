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
 *		size: Size to Buy
 *		qty: Quantity Bought
 * }
*/
function addToCart(code, size, qty) {
	var cart = getSessionCart();
	cart.push({code: code, size: size, qty: qty});
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

function trimArr(arr) {
	arr.forEach(e => e.value = validator.trim(e.value));
}

$(document).ready(function() {
	// creating a new cart if it doesn't exist yet
	if (!getSessionCart()) {
		window.sessionStorage.setItem('cart', JSON.stringify([]));
	}
	
	$("#lblCartCount").text(getSessionCart().length);
	
	$("button#addCartButton").click(function() {
		var code;
		var size = $("select#prodSize").val();
		var qty = $("input#prodQty").val();
		addToCart(qty);
	});
	
	// creating post request to checkout cart
	$("submitCart idk what to put here").click(function() {
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





/* FRONTEND VALIDATION SCRIPTS */
$(document).ready(function() {
	$("#submitLogin").click(function() {
		var form = $("#loginForm").serializeArray();
		trimArr(form);
		if (!validator.isEmpty(form[0].value) && !validator.isEmpty(form[1].value) && validator.isEmail(form[0].value)) {
			$.ajax({
				method: 'POST',
				url: '/login',
				data: form,
				success: function() {
					window.location.href = '/admin';
				},
				error: function(str) {
					alert(str.responseText);
				}
			});
		} else if (!validator.isEmail(form[0].value)) {
			alert('Please input a valid email format.');
		} else alert('Please fill in all fields!');
	});
	
	$("button#addProdBtn").click(function() {
		var addProd = $("form#addProdForm").serializeArray();
		console.log(addProd);
		trimArr(addProd);
		
		if (false) {
			$.ajax({
				method: 'POST',
				url: '/addProduct',
				data: addProd,
				success: function() {
					window.location.href = '/admin';
				},
				error: function(str) {
					alert(str.responseText);
				}
			});
		} else {
			alert('ding dong');
		}
	});
});


/* FRONTEND STYLE SCRIPTS */
$(document).ready(function() {
	function checkScroll() {
		var opacity = 150; // start point navbar fixed to top changes in px
		if ($(window).scrollTop() > opacity) {
			$('.navbar.navbar-fixed-top').addClass("navchange");
		} else {
			$('.navbar.navbar-fixed-top').removeClass("navchange");
		}
	}
	
	if ($('.navbar').length > 0) {
		$(window).on("scroll load resize", () => checkScroll());
	}

	$('.dropdown').on('show.bs.dropdown', function() {
		$(this).find('.dropdown-menu').first().stop(true, true).slideDown(300);
	});

	$('.dropdown').on('hide.bs.dropdown', function() {
		$(this).find('.dropdown-menu').first().stop(true, true).slideUp(300);
	});
	
	$('[data-bs-hover-animate]')
		.mouseenter(function() {
			var elem = $(this);
			elem.addClass('animated ' + elem.attr('data-bs-hover-animate'));
		})
		.mouseleave(function() {
			var elem = $(this);
			elem.removeClass('animated ' + elem.attr('data-bs-hover-animate'));
		});
});

function callLogout() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/logout", true);
	xhr.onreadystatechange = function() {
		if (xhr.status === 200 && xhr.readyState === 4) {
			window.location.href = '/';
		}
	};
	xhr.send();
}
