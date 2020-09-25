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
		data: {item: {code: code, size: size, qty: Number.parseInt(qty)}},
		success: () => alert('Item added to cart'),
		error: res => console.log(res)
	});
}

async function getCart() {
	return await $.ajax({
		method: 'GET',
		url: '/getCart',
		error: res => console.log(res)
	});
}
async function getCartTotal() {
	return (await getCart()).reduce((a, e) => a + Number.parseInt(e.qty), 0);
}

function trimArr(arr) {
	arr.forEach(e => e.value = validator.trim(e.value));
}

$(document).ready(async function() {
	
	// updating cart count in navbar
	console.log(await getCart());
	$("span#totItems").text('Items: ' + await getCartTotal());
	$("#lblCartCount").text(await getCartTotal());
	
	$('span.bagRemove').click(function() {
		let parent = $(this).closest(".text-nowrap");
		$.ajax({
			method: 'POST',
			url: '/removeFromCart',
			data: {code: parent.attr('id')},
			success: async () => {
				alert('Item removed from cart.');
				parent.remove();
				$("span#totItems").text('Items: ' + await getCartTotal());
			},
			error: res => console.log(res)
		});
	});
	
	$(':input[type="number"]').on('keyup mouseup', function() {
		let id = $(this).closest(".text-nowrap").attr('id'),
			newqty = $(this).val();
		if (!!newqty && !isNaN(newqty)) {
			$.ajax({
				method: 'POST',
				url: '/updateQtyBag',
				data: {id: id, newqty: newqty},
				success: async () => {
					$("span#totItems").text('Items: ' + await getCartTotal());
				},
				error: res => console.log(res)
			});
		}
	});
	
	$('select[name="area"]').change(function() {
		let text = $(this).val(), subtot = Number.parseFloat($('strong#subtot').text().split(' ')[1].split(',').join(''));
		$('strong#shipping').text(text === "Metro Manila" ? 80 : 150);
		$('strong#total').text('Php ' + (subtot + (text === "Metro Manila" ? 80 : 150)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
	});
	
});

function searchSales() {
	$.ajax({
		method: 'GET',
		url: '/searchSales',
		data: {ordNo: $("#salesInput")},
		success: res => $('tbody').html(res.match(/<tbody>([\s\S]*)<\/tbody>/g)),
		error: str => console.log(str)
	});
}

function searchPurchases() {
	$.ajax({
		method: 'GET',
		url: '/searchPurchases',
		data: {ordNo: $("#purchInput")},
		success: res => $('tbody').html(res.match(/<tbody>([\s\S]*)<\/tbody>/g)),
		error: str => console.log(str)
	});
}

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
	
	$("button#placeOrder").click(function() {
		var form = {}, check = true, arr = $('form#checkout').serializeArray();
		trimArr(arr);
		arr.forEach(e => form[e.name] = e.value);
		console.log(form);
		
		Object.values(form).forEach(e => {
			if (validator.isEmpty(e)) check = false;
		});
		
		if (check && Object.keys(form).length === 7) {
			if (validator.isEmail(form.email)) {
				if (/^09[0-9]{2}( |-)?[0-9]{3}( |-)?[0-9]{4}$/.test(form.contno)) {
					$.ajax({
						method: 'POST',
						url: '/checkout',
						data: form,
						success: () => {
							alert('thank you have a good day');
							window.location.href = '/';
						},
						error: res => console.log(res)
					});
				} else alert('Please enter a valid contact number.');
			} else alert('Please enter a valid email address.');
		} else alert('Please accomplish all fields.');
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
