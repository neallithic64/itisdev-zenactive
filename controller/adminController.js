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

async function genProdCode(category) {
	// {TOP|BOT|SET|ACC}00000
	var catCode = category.substr(0, 3).toUpperCase(),
		prod = await db.aggregate(ProductDB, [
			{ '$match': {'productID': new RegExp('^(' + catCode + ')\\d{5}', 'g')} },
			{ '$sort': {'productID': -1} }
		]),
		count = Number.parseInt(prod[0].productID.substr(3)) + 1;
	return catCode + count.toString().padStart(5, '0');
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
		{'$unwind': "$prodCateg"},
		{'$lookup': {
			'from': 'ProdPhoto',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'prodPhoto'
		}},
		{'$unwind': "$prodPhoto"}
	]);
}

/* Index Functions
 */
const adminFunctions = {
	getLogin: function(req, res) {
		if (req.session.admin) res.redirect('/');
		else res.render('login', {title: 'Login - ZenActivePH'});
	},
	
	getRegister: function(req, res) {
		if (req.session.admin) res.redirect('/');
		else res.render('register', {
			title: 'Register - ZenactivePH'
		});
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
					res.status(200).send();
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
		res.status(200).send();
	},
	
	postRegister: async function(req, res) {
		let {email, password} = req.body;
		var adminPass = await bcrypt.hash(password, saltRounds);
		await db.insertOne(AdminDB, new constructors.Admin(email, adminPass));
		res.redirect('/');
	},

	getInvProds: async function(req, res) {
		var prods = await db.findMany(ProductDB, {});
		if (req.session.admin) {
			res.render('productlist', {
				title: 'Manage Products - ZenActivePH',
				products: prods
			});
		} else res.redirect('/');
	},
	
	getInvCateg: async function(req, res, next) {
		var categs = await db.findMany(CategoryDB, {});
		if (req.session.admin) {
			res.render('categorylist', {
				title: 'Manage Categories - ZenActivePH',
				categories: categs
			});
		} else res.redirect('/');
	},

/* View Orders Report --
 * 
 * The seller may view all orders submitted to see what orders were submitted 
 * by the buyers. The seller may also view the orders they have made to the supplier.
 * 
 */

	getSalesOrder: async function(req, res) {
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

	getPurchaseOrder: async function(req, res) {
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

	getSalesOrders: async function (req, res) {
		var orders = await db.findMany(CustomerOrderDB, {}, '');
		
		if (!orders) {
			// error handling
		} else {
		}
		res.render('salestracker', {
			title: 'Sales Tracker',
			orders: orders
		});
	}, 
	
	getPurchaseOrders: async function (req, res) {
		var orders = await db.findMany(SupplierOrderDB, {}, '');
		
		if (!orders) {
			// error handling
		} else {
		}
		res.render('purchtracker', {
			title: 'Purchases Tracker',
			orders: orders
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

	getAddProduct: async function(req, res) {
		res.render('addproduct', {
			title: 'Add New Product - ZenActivePH'
		});
	},
	
	getAddCategory: async function(req, res) {
		
	},
	
	getEditProduct: async function(req, res) {
		res.render('editproduct', {
			title: 'Edit Product - ZenActivePH'
		});
	},
	
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
	postAddCateg: async function(req, res) {
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

module.exports = adminFunctions;
