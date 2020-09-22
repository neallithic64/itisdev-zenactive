function openNav() {
    document.getElementById("mySideNav").style.width = "300px";
}

function closeNav() {
    document.getElementById("mySideNav").style.width = "0";
}

function getSessionCart() {
	return JSON.parse(window.sessionStorage.getItem('cart'));
}
function setSessionCart(cart) {
	window.sessionStorage.setItem('cart', JSON.stringify(cart));
}

/* Function to add the product ID of the added-to product
 * {
 *		code: Product Code
 *		size: Size to Buy
 *		qty: Quantity Bought
 * }
*/
function addToCart(code, size, qty) {
	$.ajax({
		method: 'POST',
		url: '/addToCart',
		data: {item: {code: code, size: size, qty: qty}},
		success: () => alert('Item added to cart'),
		error: res => console.log(res)
	});
}

function removeFromCart(s) {
	$.ajax({
		method: 'POST',
		url: '/removeFromCart',
		data: {code: s},
		success: () => alert('Item removed from cart'),
		error: res => console.log(res)
	});
}

/* Returns a boolean on the capacity of a cart. If cart still
 * has space, function returns true.
 */
function trimArr(arr) {
	arr.forEach(e => e.value = validator.trim(e.value));
}

$(document).ready(function() {
	// updating cart count in navbar
	$.ajax({
		method: 'GET',
		url: '/getCart',
		// data: {code: s},
		success: res => $("#lblCartCount").text(res.length),
		error: res => console.log(res)
	});
	
	// creating post request to checkout cart
	$("submitCart idk what to put here").click(function() {
		$.post('/checkout', cart, result => {
			// idk
		});
	});
});





/* FRONTEND VALIDATION SCRIPTS */
$(document).ready(function() {
	// buyer adding item to their bag
	$("button#addCartButton").click(function() {
		var code = $("strong#prodNameID").text().split(/ - /i)[1];
		var size = $("select#prodSize").val();
		var qty = validator.trim($("input#prodQty").val());
		
		if (validator.isEmpty(qty)) alert('Please input a quantity!');
		else if (isNaN(qty)) alert('Please input a valid number!');
		else addToCart(code, size, qty);
	});
	
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
