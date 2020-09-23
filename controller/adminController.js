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

/** Query for joining the ff tables/collections:
 *  - Product
 *  - ProdCategory
 *  - ProdPhoto
 */
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

/** Query for joining the ff tables/collections:
 *  - CustomerOrder
 *  - CustomerCart
 *  - Product
 *  - ProdCategory
 *  - PaymentProof
 */
	async function getJoinedCustOrder(ordNo) {
		return await db.aggregate(CustomerOrderDB, [
			{'$match': {buyOrdNo: ordNo}},
			{'$lookup': {
				'from': 'CustomerCart',
				'localField': 'buyOrdNo',
				'foreignField': 'buyOrdNo',
				'as': 'Cart'
			}},
			{'$lookup': {
				'from': 'Product',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Product'
			}},
			{'$lookup': {
				'from': 'ProdCategory',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Category'
			}},
			{'$lookup': {
				'from': 'PaymentProof',
				'localField': 'buyOrdNo',
				'foreignField': 'buyOrdNo',
				'as': 'PaymentProof'
			}}
		]);
	}
	
/** Query for joining the ff tables/collections:
 *  - SupplierOrder
 *  - SupplierCart
 *  - Product
 *  - ProdCategory
 */
	async function getJoinedSuppOrder(ordNo) {
		return await db.aggregate(SupplierOrderDB, [
			{'match': {batchID: ordNo}},
			{'$lookup': {
				'from': 'SupplierCart',
				'localField': 'batchID',
				'foreignField': 'batchID',
				'as': 'SuppCart'
			}},
			{'$lookup': {
				'from': 'Product',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Product'
			}},
			{'$lookup': {
				'from': 'ProdCategory',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Category'
			}}
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
		// var prods = await db.findMany(ProductDB, {});
		if (req.session.admin) {
			var prods = await db.aggregate(ProductDB, [
				{'$lookup': {
					'from': 'ProdCategory',
					'localField': 'productID',
					'foreignField': 'productID',
					'as': 'prodCateg'
				}},
				{'$unwind': "$prodCateg"}
			]);
			res.render('productlist', {
				title: 'Manage Products - ZenActivePH',
				products: forceJSON(prods)
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
	getSalesQuery: async function(req, res, next) {
		res.status(200).send(await getJoinedCustOrder(req.query.ordNo));
	},

	getSalesOrder: async function(req, res) {
		try {
			var orderMatch = await getJoinedCustOrder('');
			
			console.log(orderMatch);
			
			res.render('salestracker', {
				title: 'Sales Tracker',
				salesOrder: forceJSON(orderMatch)
			});			
		} catch(e){
			res.status(500).send(e);
		}
	},
	
	getPurchQuery: async function(req, res, next) {
		res.status(200).send(await getJoinedSuppOrder(req.query.ordNo));
	},

	getPurchaseOrder: async function(req, res) {
		try {
			var orderMatch = await getJoinedSuppOrder('');

			console.log(orderMatch);

			res.render('purchtracker', {
				title: 'Purchases Tracker',
				suppOrder: forceJSON(orderMatch)
			});			
		} catch(e){
			res.status(500).send(e);			
		}
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
			let {pname, pprice, psize, pcolor, pcateg, plink1, plink2, plink3} = req.body;
			let productID = genProdCode(pcateg);
		
			var newProd = new constructors.Product(productID, pname, pprice, psize, pcolor);
			await db.insertOne(ProductDB, newProd);
			await db.insertOne(ProdCategoryDB, {productID: productID, categName: pcateg});
			if (!!plink1) await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink1});
			if (!!plink2) await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink2});
			if (!!plink3) await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink3});
			
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	postEditProduct: async function(req, res) {
		try {
			// how to deal with updating prod quantity?
			let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
			var updateProd = new constructors.Product(editProdID, editProdName, editProdPrice, editProdSize, editProdColor);

			await db.updateOne(ProductDB, {productID: editProdID}, updateProd);

		} catch (e) {
			res.status(500).send(e);
		}
	},
	
/* Edit Product Category
 * 
 */	

	postAddProdCateg: async function(req, res){
		try {
			let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
			let {remCateg, addCateg} = req.body;
								
			if (!!remCateg) await db.insertOne(ProdCategoryDB, {productID: editProdID, categName: addCateg});
	
		} catch (e){
			res.status(500).send(e);
		}		
	},
	
	postDelProdCateg: async function(req, res){
		try {
			let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
			let {remCateg, addCateg} = req.body;
								
			if (!!addCateg) await db.deleteOne(ProdCategoryDB, {productID: editProdID, categName: addCateg});
	
		} catch (e){
			res.status(500).send(e);
		}		
	},


/* Edit Product Photo(s)
 * 
 */	
	postAddProdPhoto: async function(req, res){
		try {
			let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
			let {addProdPhoto} = req.body;
						
			if (!!addProdPhoto) await db.insertOne(ProdPhotoDB, {productID: editProdID, photoLink: addProdPhoto});
	
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	postDelProdPhoto: async function(req, res){
		try {
			let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
			let {remProdPhoto} = req.body;
						
			if (!!remProdPhoto) await db.deleteOne(ProdPhotoDB, {productID: editProdID, photoLink: remProdPhoto});
	
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	
/* The admin may choose to create a new category that products may be labelled under.
 */
	postAddCateg: async function(req, res) {
		try {
			let {addCategName} = req.body;

			var categInsert = await db.insertOne(CategoryDB, {categName: addCategName});
			if (!categInsert) {
				// handle error
				res.status(400).send();
			} else {
				// categ added; redirect to page
				res.render('addcateg', {
					title: 'Admin Page - ZenActivePH'
				});
			}			
		} catch (e){
			res.status(500).send(e);
		}
	}
};

module.exports = adminFunctions;
