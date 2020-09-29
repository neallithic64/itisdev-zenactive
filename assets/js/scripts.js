/* global validator */

function openNav() {
	document.getElementById("mySideNav").style.width = "300px";
}

function closeNav() {
	document.getElementById("mySideNav").style.width = "0";
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
	
	// updating cart item qty
	$(':input[type="number"]').on('keyup mouseup', function() {
		let id = $(this).closest(".text-nowrap").attr('id'),
			newqty = $(this).val();
		if (!!newqty && !validator.isNumeric(newqty)) {
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
	
	// changing shipping stuff at checkout
	$('select[name="area"]').change(function() {
		let text = $(this).val(),
			subtot = Number.parseFloat($('strong#subtot').text().split(' ')[1].split(',').join(''));
		$('strong#shipping').text(text === "Metro Manila" ? 80 : 150);
		$('strong#total').text('Php ' + (subtot + (text === "Metro Manila" ? 80 : 150)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
	});
	
	// add product: checking existing item code
	$('input[name="pname"]').on('keyup', function() {
		let name = $(this).val();
		
		$.ajax({
			method: 'GET',
			url: '/addProdExist',
			data: {name: name},
			success: res => {
				if (res) {
					$('select[name="pcateg"]').val(res.prodCateg[0].categName);
					$('input[name="pprice"]').val(res.price);
					$('input[name="psize"]').val(res.size);
				}
			},
			error: res => console.log(res)
		});
	});
	
	$('select#addCateg').change(function() {
		let prodID = $('input[name="editProdID"]').val();
		let obj = {categ: $(this).val()};
		if (obj.categ !== "0") {
			$.ajax({
				method: 'POST',
				url: '/addProdCateg/' + prodID,
				data: obj,
				success: () => {
					$('select#addCateg').children('option[value=' + obj.categ + ']').remove();
					$('select#remCateg').append("<option value=" + obj.categ + ">" + obj.categ + "</option>");
					alert('yeet success addCateg');
				},
				error: str => alert(str.responseText)
			});
		}
	});
	
	$('select#remCateg').change(function() {
		let prodID = $('input[name="editProdID"]').val();
		let obj = {categ: $(this).val()};
		if (obj.categ !== "0") {
			$.ajax({
				method: 'POST',
				url: '/remProdCateg/' + prodID,
				data: obj,
				success: () => {
					$('select#remCateg').children('option[value=' + obj.categ + ']').remove();
					$('select#addCateg').append("<option value=" + obj.categ + ">" + obj.categ + "</option>");
					alert('yeet success remCateg');
				},
				error: str => alert(str.responseText)
			});
		}
	});
	
	$('button#addPhoto').click(function() {
		let prodID = $('input[name="editProdID"]').val();
		let obj = {photo: $(this).siblings('input').val()};
		if (validator.isURL(obj.photo)) {
			$.ajax({
				method: 'POST',
				url: '/addProdPhoto/' + prodID,
				data: obj,
				success: () => {
					$('SOMETHING').append(`<div style="padding-left: 75px;margin-bottom: 5px;"><img style="width: 100px;height: 100px;" src="${obj.photo}"><button class="btn remPhoto" type="button" style="border-width: 0px;font-weight: 600;color: #93623c;font-size: 10px;background: #f2d8be;margin-left: 24px;">Remove</button></div>`);
					alert('yeet success addPhoto');
				},
				error: str => alert(str.responseText)
			});
		} else alert('Please input a valid URL.');
	});
	
	$('button.remPhoto').click(function() {
		let button = $(this), prodID = $('input[name="editProdID"]').val();
		let obj = {photo: button.siblings('img').attr('src')};
		$.ajax({
			method: 'POST',
			url: '/remProdPhoto/' + prodID,
			data: obj,
			success: () => {
				button.parent().remove();
				alert('yeet success remPhoto');
			},
			error: str => alert(str.responseText)
		});
	});
	
	$('select.????').change(function() {
		var choice = $(this).val();
		
		switch (choice) {
			case 'sometihng': {
				
			}
		}
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
		let checks = Array(3).fill(true);;
		trimArr(addProd);
		
		for (let i = 0; i < addProd.length-2; i++)
			if (validator.isEmpty(addProd[i].value)) {
				checks[0] = false;
				alert('Please fill in all required fields.');
			}
		
		if (!validator.isNumeric(addProd[5].value)) {
			checks[1] = false;
			alert('Please input a number for the price.');
		}
		
		if (!validator.isEmpty(addProd[6].value) && !validator.isURL(addProd[6].value)) {
			checks[2] = false;
			alert('Please input a valid link for the first photo.');
		} else if (!validator.isEmpty(addProd[7].value) && !validator.isURL(addProd[7].value)) {
			checks[2] = false;
			alert('Please input a valid link for the second photo.');
		} else if (!validator.isEmpty(addProd[8].value) && !validator.isURL(addProd[8].value)) {
			checks[2] = false;
			alert('Please input a valid link for the third photo.');
		}
		
		if (checks.every(Boolean)) {
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
							alert('Cart checked out successfully!');
							window.location.href = '/';
						},
						error: res => console.log(res)
					});
				} else alert('Please enter a valid contact number.');
			} else alert('Please enter a valid email address.');
		} else alert('Please accomplish all fields.');
	});
	
	$('button#addNewCateg').click(function() {
		var categName = $('input[name="addCategName"]').val();
		validator.trim(categName);
		
		if (validator.isEmpty(categName)) alert('Please input a category name.');
		else {
			$.ajax({
				method: 'POST',
				url: '/addCategory',
				data: {categName: categName},
				success: () => {
					alert('Category added!');
					window.location.href = '/admin';
				},
				error: res => alert(res.responseText)
			});
		}
	});
	
	$('button#editSave').click(function() {
		let arr = $('form#editProd').serializeArray(), checks = Array(2).fill(true);;
		trimArr(arr);
		
		checks[0] = arr.some(e => validator.isEmpty(e.value)) ? false : true;
		if (!checks[0]) alert('Please fill in all required fields.');
		
		if (!validator.isNumeric(arr[5].value)) {
			checks[1] = false;
			alert('Please input a number for the price.');
		}
		
		if (checks.every(Boolean)) {
			$.ajax({
				method: 'POST',
				url: '/editProduct/' + arr[0].value,
				data: arr,
				success: function() {
					window.location.href = '/invProds';
				},
				error: function(str) {
					alert(str.responseText);
				}
			});
		}
	});
	
	$('button#submitProof').click(function() {
		var form = $('form#payProof').serializeArray();
		trimArr(form);
		var checks = Array(3).fill(true);
		
		checks[0] = form.some(e => validator.isEmpty(e.value)) ? false : true;
		if (!checks[0]) alert('Please fill in all fields.');
		
		if (!validator.isNumeric(form[1].value)) {
			checks[1] = false;
			alert('Please input a valid value for the price.');
		}
		
		if (!validator.isURL(form[2].value)) {
			checks[2] = false;
			alert('Please input a valid URL for the proof.');
		}
		
		if (checks.every(Boolean)) {
			$.ajax({
				method: 'POST',
				url: '/sendProof',
				data: form,
				success: function() {
					window.location.href = '/vieworder';
				},
				error: function(str) {
					alert(str.responseText);
				}
			});
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
