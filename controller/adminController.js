/* global process */

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

/* Query for joining the ff tables/collections:
 *  - Product
 *  - ProdCategory
 *  - ProdPhoto
 */
async function getJoinedQuery(prodID) {
	return (await db.aggregate(ProductDB, [
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
		}},
		{'$lookup': {
			'from': 'Product',
			'localField': 'name',
			'foreignField': 'name',
			'as': 'prodColours'
		}}
	]))[0];
}

/* Query for joining the ff tables/collections:
 *  - CustomerOrder
 *  - CustomerCart
 *  - Product
 *  - ProdCategory
 *  - PaymentProof
 */
async function getJoinedCustOrder(ordNo) {
	var stages = [];
	if (ordNo) stages.push({'$match': {buyOrdNo: ordNo}});
	return await db.aggregate(CustomerOrderDB, stages.concat([
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
	]));
}
	
/* Query for joining the ff tables/collections:
 *  - SupplierOrder
 *  - SupplierCart
 *  - Product
 *  - ProdCategory
 */
async function getJoinedSuppOrder(ordNo) {
	var stages = [];
	if (ordNo) stages.push({'$match': {batchID: ordNo}});
	return await db.aggregate(SupplierOrderDB, stages.concat([
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
	]));
}

/* Index Functions
 */
const adminFunctions = {
	getLogin: function(req, res) {
		console.log(req.session);
		if (req.session.admin) res.redirect('/');
		else res.render('login', {
			title: 'Login - ZenActivePH'
		});
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
		else res.redirect('/login');
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
		if (req.session.admin) {
			var prods = await db.aggregate(ProductDB, [
				{'$lookup': {
					'from': 'ProdCategory',
					'localField': 'productID',
					'foreignField': 'productID',
					'as': 'prodCateg'
				}}
			]);
			res.render('productlist', {
				title: 'Manage Products - ZenActivePH',
				products: forceJSON(prods)
			});
		} else res.redirect('/login');
	},
	
	getInvCateg: async function(req, res, next) {
		if (req.session.admin) {
			var categs = await db.findMany(CategoryDB, {});
			res.render('categlist', {
				title: 'Manage Categories - ZenActivePH',
				categories: categs
			});
		} else res.redirect('/login');
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

	getAllSalesOrders: async function(req, res) { 
		try {
			var orderMatch = await getJoinedCustOrder();
			res.render('salestracker', {
				title: 'Sales Tracker - ZenActivePH',
				salesOrder: forceJSON(orderMatch)
			});
		} catch(e) {
			res.status(500).send(e);
		}
	},
	
	getPurchQuery: async function(req, res, next) {
		res.status(200).send(await getJoinedSuppOrder(req.query.ordNo));
	},

	getAllPurchaseOrders: async function(req, res) { 
		try {
			var orderMatch = await getJoinedSuppOrder();
			res.render('purchtracker', {
				title: 'Purchases Tracker - ZenActivePH',
				suppOrder: forceJSON(orderMatch)
			});			
		} catch(e){
			res.status(500).send(e);
		}
	},

/* Update Order Status --
 * 
 * When items are shipped, details regarding their delivery will be sent
 * through the buyer’s email and displayed in the view order status page,
 * by utilizing the tracking details from the partner courier. When items
 * are cancelled, the reason for cancelling will also be displayed.
 * 
 * Validate Payment -- 
 * 
 * The seller receives the proof of payment from the buyer and 
 * updates the status of the order.
 */

	getSalesOrder: async function(req, res) {
		if (req.session.admin) {
			var buyOrder = await db.aggregate(CustomerOrderDB, [
				{'$match': {buyOrdNo: Number.parseInt(req.params.ordNo)}},
				{'$lookup': {
					'from': 'PaymentProof',
					'localField': 'buyOrdNo',
					'foreignField': 'buyOrdNo',
					'as': 'paymentProof'
				}},
				{'$lookup': {
					'from': 'CustomerCart',
					'localField': 'buyOrdNo',
					'foreignField': 'buyOrdNo',
					'as': 'customerCart'
				}},
				{'$lookup': {
					'from': 'Product',
					'localField': 'customerCart.productID',
					'foreignField': 'productID',
					'as': 'product'
				}}
			]);
			buyOrder.forEach(e1 => e1.product = e1.product.map((e2, i) => Object.assign({}, e2, e1.customerCart[i])));
			// retrieve paymentProof (url/pic) & reference order, for seller to check
			res.render('viewsalesorder', {
				title: 'View Sales Order - ZenActivePH',
				order: buyOrder[0]
			});
		} else res.redirect('/login');
	},

	postUpdateSalesOrder: async function(req, res) {
		// possibly AJAX: update order status depending on what seller chooses in front end (dropdown?) 
		try{
			let {orderNo, orderStatus, cancelRsn} = req.body;
			await db.updateOne(CustomerOrderDB, {buyOrdNo: orderNo}, {status: orderStatus});
			res.status(200).send();			
			
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
			
		} catch(e){
			res.status(500).send(e);
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
		if (req.session.admin)
			res.render('addproduct', {
				title: 'Add New Product - ZenActivePH'
			});
		else res.redirect('/login');
	},
	
	getAddProdExist: async function(req, res) {
		let prod = await db.aggregate(ProductDB, [
			{'$match': {name: req.query.name}},
			{'$lookup': {
				'from': 'ProdCategory',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'prodCateg'
			}},
			{'$project': {
				'price': 1,
				'size': 1,
				'prodCateg.categName': 1
			}}
		]);
		res.status(200).send(prod ? prod[0] : '');
	},
	
	getAddCategory: async function(req, res) {
		if (req.session.admin)
			res.render('addcateg', {
				title: 'Add Category - ZenActivePH'
			});
		else res.redirect('/login');
	},
	
	getEditProduct: async function(req, res) {
		if (req.session.admin) {
			let prod = await getJoinedQuery(req.params.id);
			let categs = (await db.findMany(CategoryDB, {}))
					.map(e => e.categName)
					.filter(e => !prod.prodCateg.map(prodE => prodE.categName).includes(e));
			console.log(categs);
			res.render('editproduct', {
				title: 'Edit Product - ZenActivePH',
				prod: prod,
				categs: categs
			});
		}
		else res.redirect('/login');
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
			let {pname, pcateg, pcolor, phex, psize, pprice, plink1, plink2, plink3} = req.body;
			let productID = await genProdCode(pcateg);
			console.log(req.body);
			
			var newProd = new constructors.Product(productID, pname, pprice, psize, pcolor, phex);
			await db.insertOne(ProductDB, newProd);
			await db.insertOne(ProdCategoryDB, {productID: productID, categName: pcateg});
			await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink1});
			if (!!plink2) await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink2});
			if (!!plink3) await db.insertOne(ProdPhotoDB, {productID: productID, photoLink: plink3});
			
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	postEditProduct: async function(req, res) {
		try {
			let {editProdName, editProdPrice, editProdSize, editProdColor, editProdHex} = req.body;
			let updateProd = new constructors.Product(req.params.id, editProdName, editProdPrice, editProdSize, editProdColor, editProdHex);
			await db.updateOne(ProductDB, {productID: req.params.id}, updateProd);
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
/* Edit Product Category
 * 
 */	

	postAddProdCateg: async function(req, res){
		try {
			let {categ} = req.body;
			await db.insertOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			res.status(200).send();
		} catch (e){
			res.status(500).send(e);
		}		
	},
	
	postDelProdCateg: async function(req, res){
		try {
			let {categ} = req.body;
			await db.deleteOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			res.status(200).send();
		} catch (e){
			res.status(500).send(e);
		}		
	},


/* Edit Product Photo(s)
 * 
 */	
	postAddProdPhoto: async function(req, res){
		try {
			let {photo} = req.body;
			await db.insertOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			res.status(200).send();
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	postDelProdPhoto: async function(req, res){
		try {
			let {photo} = req.body;
			await db.deleteOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			res.status(200).send();
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	
/* The admin may choose to create a new category that products may be labelled under.
 */
	postAddCateg: async function(req, res) {
		try {
			let {categName} = req.body;
			await db.insertOne(CategoryDB, {categName: categName});
			res.status(200).send();
		} catch (e){
			res.status(500).send(e);
		}
	}
};

module.exports = adminFunctions;
