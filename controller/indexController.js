const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const saltRounds = 10;

/* Accessing the models (db) of each class
 */
const db = require('../models/db');
const AdminDB = require('../models/Admin');
const CancelReasonDB = require('../models/CancelReason');
const CategoryDB = require('../models/Category');
const CustomerCartDB = require('../models/CustomerCart');
const CustomerOrderDB = require('../models/CustomerOrder');
const PaymentProofDB = require('../models/PaymentProof');
const PageViewDB = require('../models/PageView');
const ProdCategoryDB = require('../models/ProdCategory');
const ProdPhotoDB = require('../models/ProdPhoto');
const ProductDB = require('../models/Product');
const SupplierCartDB = require('../models/SupplierCart');
const SupplierOrderDB = require('../models/SupplierOrder');
const ThresholdDB = require('../models/Threshold');

const constructors = require('./constructors');

/* Backend Helper Functions
 */
function getStrMonth(mon) {
	var d = Date.parse(mon + " 1, 2020");
	return !isNaN(d) ? new Date(d).getMonth() + 1 : -1;
}

function sendEmail(email) {
	fs.readFile('./assets/email.html', 'utf8', function(e, bodyData) {
		var template = handlebars.compile(bodyData);
		var htmlToSend = template({});
		
		var smtpTransport = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.EMAIL_ADDR,
				pass: process.env.EMAIL_PASS
			}
		});
		var mailOpts = {
			from: '',
			to: email, 
			subject: '',
			html: htmlToSend
		};
		smtpTransport.sendMail(mailOpts, function(err) {
			if (err) console.log(err);
			smtpTransport.close();
		});
	});
}

function genBuyOrdNo() {
	return Number.parseInt((new Date()).toISOString().substr(2, 8).split('-').join('') + Math.round(Math.random()*100000).toString().padStart(5, '0'));
}

function forceJSON(e) {
	return JSON.parse(JSON.stringify(e));
}

async function getJoinedQuery(prodID) {
	return await db.aggregate(ProductDB, [
		{'$match': {productID: prodID}},
		{'$lookup': {
			'from': 'ProdCategory',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'prodCateg'
		}},
		{'$lookup': {
			'from': 'ProdPhoto',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'prodPhoto'
		}}
	]);
}

/* Index Functions
 */
const indexFunctions = {
	getHome: function(req, res) {
		if (req.session.admin) {
		}
		res.render('home', {
			title: 'ZenActivePH'
		});
	},
	
	getLogin: function(req, res) {
		if (req.session.admin) res.redirect('/');
		else res.render('login', {title: 'Login'});
	},
	
	getRegister: function(req, res) {
		if (req.session.admin) res.redirect('/');
		else res.render('register');
	},
	
	getAdmin: function(req, res) {
		if (req.session.admin)
			res.render('admin', {
				title: 'Admin Page - ZenActivePH'
			});
		else res.redirect('/');
	},
	
	postLogin: async function(req, res) {
		let {email, password} = req.body;
		try {
			var admin = await db.findOne(AdminDB, {email: email}, '');
			if (!admin) {
				res.status(401).send('Incorrect credentials.');
			} else {
				var match = await bcrypt.compare(password, admin.password);
				if (match) {
					req.session.admin = admin;
					res.status(200);
				} else {
					res.status(401).send('Incorrect credentials.');
				}
			}
		} catch (e) {
			res.status(500).send('Server error.');
		}
	},
	
	postLogout: function(req, res) {
		req.session.destroy();
		res.redirect("/");
	},
	
	postRegister: async function(req, res) {
		let {email, password} = req.body;
		var adminPass = await bcrypt.hash(password, saltRounds);
		await db.insertOne(AdminDB, new constructors.Admin(email, adminPass));
		res.redirect('/');
	},
	
/* Buying Process functions
 * 
 * [/] Search Products
 * [/] View All Products
 * [/] View One Product
 * 
 */
	getSearchProducts: async function(req, res) {
		// use server error checking here
		let prodQuery = new RegExp(req.query.searchProducts, 'gi'); // still convert input string to regex?
		var searchProd = await db.findMany(ProductDB, {name: prodQuery}, ''); //search through 'productName'?
		
		res.render('search-products', {
			products: forceJSON(searchProd)
		});
	},
	
	getAllProducts: async function(req, res) {
		// use server error checking here
		var products = await db.findMany(ProductDB, {}, '');
		
		res.render('view-allproducts', {
			allProducts: products
		});
	},

	getProduct: async function(req, res) {
		// use server error checking here
		// view through productID
		var prodMatch = await db.findOne(ProductDB, {productID: req.query.prodNo}, '');
		
		if (!prodMatch) {
			// error handling: no product found
		} else {
			res.render('view-product', {
				product: prodMatch
			});
		}
	},

/* View Orders Report --
 * 
 * The seller may view all orders submitted to see what orders were submitted 
 * by the buyers. The seller may also view the orders they have made to the supplier.
 * 
 */

	getBuyOrder: async function(req, res) {
		let {orderNo} = req.query;
		var orderMatch = await db.findOne(CustomerOrderDB, {buyOrdNo: orderNo}, '');
		
		if (!orderMatch) {
			//error handling
		} else {
		}
		res.render('salestracker', {
			title: 'Sales Tracker'
			// buyOrder: orderMatch
		});
	},

	getSuppOrder: async function(req, res) {
		let {orderNo} = req.query;
		var orderMatch = await db.findOne(SupplierOrderDB, {batchID: orderNo}, '');
		
		if (!orderMatch) {
			//error handling
		} else {
		}
		res.render('purchtracker', {
			title: 'Purchases Tracker'
			// suppOrder: orderMatch
		});
	},

	getBuyerOrders: async function (req, res) {
		var buyOrders = await db.findMany(CustomerOrderDB, {}, '');
		
		if (!buyOrders) {
			// error handling
		} else {
		}
		res.render('salestracker', {
			title: 'Sales Tracker',
			buyerOrders: buyOrders
		});
	}, 
	
	getSupplierOrders: async function (req, res) {
		var suppOrders = await db.findMany(SupplierOrderDB, {}, '');
		
		if (!suppOrders) {
			// error handling
		} else {
		}
		res.render('purchtracker', {
			title: 'Purchases Tracker',
			supplierOrders: suppOrders
		});
	},

/* View Order Status
 * 
 * Buyers may choose to view their order’s status to track where
 * it is currently (PENDING, CONFIRMED, IN TRANSIT (supplier to
 * seller), SHIPPED (seller to buyer), CANCELLED (by the seller)).
 */
	getOrderStatus: async function(req, res) {
		// details will be displayed in the view order status page
		
		var orderMatch = await db.findOne(CustomerOrderDB, {buyOrdNo: req.query.orderNo}, '');
		
		if (orderMatch.status === 'CANCELLED'){
			var cancelMatch = await db.findOne(CancelReasonDB, {buyOrdNo: req.query.orderNo}, '');

			if (cancelMatch){
				res.render('', {
					buyOrder: orderMatch,
					cancelReason: cancelMatch
				});
			}

		} else {
			res.render('view-orderStatus', {
				buyOrder: orderMatch
			});
		}

	},

/* Update Order Status --
 * 
 * When items are shipped, details regarding their delivery will be sent
 * through the buyer’s email and displayed in the view order status page,
 * by utilizing the tracking details from the partner courier. When items
 * are cancelled, the reason for cancelling will also be displayed.
 */
	postOrderStatus: async function(req, res) {

		let {orderNo, cancelRsn} = req.body;
		var orderMatch = await db.findOne(CustomerOrderDB, {buyOrdNo: orderNo}, '');

		if (orderMatch.status === 'SHIPPED'){
			// details regarding their delivery will be sent through the buyer’s email
			// what details to send? 
			// how to use helper function 'sendEmail'?
			// sendEmail(orderMatch.email);        
		
		} else if (orderMatch.status === 'CANCELLED'){
			await db.insertOne(CancelReasonDB, {buyOrdNo: orderNo, cancelReason: cancelRsn});
			
		} else {
			// render smthn
		}
	},

/* Send Proof of Payment 
 * 
 * The buyer can submit proof of payment (for payments done through bank transfer and GCash) 
 * through the order tracker. The buyer is given two days to submit this proof of payment 
 * before the order is automatically cancelled from dormancy.
 * 
 */
	postProofPayment: async function(req, res) {
		let {ordNo, payProof, referNo, amtPaid} = req.body;
		var order = await db.findOne(CustomerOrderDB, {buyOrdNo: ordNo}, '');
		
		if (!order) {
			//handle error: order not found
		} else {
			if (order.modeOfPay === 'bank transfer' || order.modeOfPay === 'GCash') { //values of MOP to be verified 
				var updateProof = await db.insertOne(PaymentProofDB, new constructors.PaymentProof(order.buyOrdNo, payProof, referNo, amtPaid));
				
				if (updateProof) {
					// res.render/ redirect
				} else {
					// handle error: server error or idk amp
				}
			} else {
				// handle error: MOP is cash or...
			}
		}
		
	},
	
/* Validate Payment
 * 
 * The seller receives the proof of payment from the buyer and 
 * updates the status of the order.
 * 
 */
	getValidPayment: async function(req, res) {
		// seller inputs orderNo to search in the db
		var buyOrder = await db.aggregate(CustomerOrderDB, [
			{'$match': {buyOrdNo: req.query.text}},
			{'$lookup': {
				'from': 'PaymentProof',
				'localField': 'buyOrdNo',
				'foreignField': 'buyOrdNo',
				'as': 'paymentProof'
			}}
		]);
		
		// retrieve payProof (url/pic) & reference order, for seller to check
		res.render('', {
			ordNo: buyOrder.buyOrdNo,
			payProof: buyOrder.paymentProof
		});
	},

	postValidPayment: async function(req, res) {
		// possibly AJAX: update order status depending on what seller chooses in front end (dropdown?)
		let {orderNo, orderStatus} = req.body;
		var updateStatus = await db.updateOne(CustomerOrderDB, {buyOrdNo: orderNo}, {status: orderStatus});

		if (!updateStatus) {
			// handle error
		} else {
			// possiblly AJAX instead idk
		}

	},

/* Manage Inventory --
 * 
 * The admin/seller can add products or edit existing products 
 * with their corresponding pictures, details and colors. Since 
 * pre-order takes place, every order made will show up in the 
 * inventory system (like number of items per product needed) 
 * on the admin’s side.
 * 
 * SELECT *
 * FROM Product p
 * JOIN ProdCategory pc
 * ON p.productID = pc.productID
 * JOIN ProdPhoto pp
 * ON p.productID = pp.productID
 * WHERE p.productID = req.query.text
 */

	postAddProduct: async function(req, res) {
		try {
			let {productID, name, price, size, color, categName, photoLink} = req.body;
			var prodFind = await getJoinedQuery(productID);
			
			if (prodFind) {
				// handle error: product exists in db
			} else {
				await db.insertOne(ProductDB, {productID: productID});
				await db.insertOne(ProdCategoryDB, {productID: productID});
				await db.insertOne(ProdPhotoDB, {productID: productID});
			}
		} catch (e) {
			// error handling
		}
	},
	
	postEditProduct: async function(req, res) {
		try {
			// how to deal with updating prod quantity?
			let {productID, name, price, size, color} = req.body;
			var prodFind = await getJoinedQuery(productID);
			var updateProd = new constructors.Product(productID, name, price, size, color);
			
			if (!prodFind) {
				// handle error: cannot edit product that does not exist
			} else {
				await db.updateOne(ProductDB, {productID: productID}, updateProd);
//				await db.updateOne(ProdCategoryDB, {productID: productID}, {categName: categName}); // MOVE TO SEPARATE EDIT FUNCTION
//				await db.updateOne(ProdPhotoDB, {productID: productID}, {photoLink: photoLink}); // MOVE TO SEPARATE EDIT FUNCTION
			}
		} catch (e) {
			// error handling
		}
	},
	
	
/* The admin may choose to create a new category that products may be labelled under.
 */
	postAddProductCateg: async function(req, res) {
		let {categName} = req.body;
		var categFind = await db.findOne(CategoryDB, {categName: categName});
		
		if (categFind) {
			// handle error: category exists in db
		} else {
			var categInsert = await db.insertOne(CategoryDB, {categName: categName});
			if (!categInsert) {
				// handle error
			} else {
				// categ added; redirect to page
			}
		}
		
		// when and what is the flow to add products in this category? --make as separate function
		// retrieve list of products
		// ask admin to choose which to put in categ
	}
};

module.exports = indexFunctions;
