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
const CustomerDB = require('../models/Customer');
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

/* Index Functions
 */
const indexFunctions = {
	getHome: function(req, res) {
		if (req.session.admin) {
			res.render('home', {
				title: '',
				message: 'henlo'
			});
		}
	},
	
	getLogin: function(req, res) {
		if (req.session.admin) {
			res.redirect('/'); // or whichever path for admin homepage
		} else {
			res.render('login', {});
		}
	},
	
	postLogin: async function(req, res) {
		let {email, password} =  req.body;
		
		try {
			var admin = await db.findOne(AdminDB, {email: email}, '');

			if (!admin) {
				// credentials not found error handling-- res.send({status: 401});
			} else {
				var match = await bcrypt.compare(password, admin.password);	
				
				if (match) {
					req.session.admin = admin;
					res.redirect('/');
					// res.send({status: 200});
				} else {
					// error handling-- res.send({status: 401});
				}
			}
		} catch (e) {
			// server error handling-- res.send({status: 500});
		}
	},
	
	postLogout: function(req, res) {
		req.session.destroy();
		res.redirect("/");
	},
	
	postRegister: async function(req, res) {
		let {email, password} = req.body;
		
		var adminPass = await bcrypt.hash(password, saltRounds);	
		var adminInsert = await db.insertOne(AdminDB, {email: email, password: adminPass});
			
		if (!adminInsert) {
			// error handling
		} else {
			// send success status or render or redirect to page
		}
		res.redirect('/');
	},
	
/* Buying Process functions
 * 
 * [..] Search Products
 * [..] View All Products
 * [] View One Product
 * 
 */	
	getSearchProducts: async function(req, res){
		// use customer sessions w/ server error checking here
		
		let prodQuery = new RegExp(req.query.searchProducts, 'gi'); // still convert input string to regex?
		
		var searchProd = await db.findMany(ProductDB, {name: prodQuery}, ''); //search through 'productName'?
		
		if (!searchProd){
			// error handling: no products found
			
		} else {
			res.render('search-products', {
				products: searchProd
			});
		}
	},
	
	getAllProducts: async function(req, res){
		// use customer sessions w/ server error checking here

		var products = await db.findMany(ProductDB, {}, '');
		
		if (!products){
			// error handling: no products
		} else {
			res.render('view-allproducts', {
				allProducts: products
			});
		}
	},

	getProduct: async function(req, res){
		// use customer sessions w/ server error checking here
		
		let {prodNo} = req.query;
		
		//view through productID
		var prodMatch = await db.findOne(ProductDB, {productID: prodNo}, '');
		
		if (!prodMatch){
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

	getBuyOrder: async function(req, res){
		let {orderNo} = req.query;
		
		var orderMatch = await db.findOne(CustomerOrderDB, {buyOrdNo: orderNo}, '');
		
		if (!orderMatch){
			//error handling
		} else {
			res.render('view-buyOrder', {
				buyOrder: orderMatch
			});
		}
	},

	getSuppOrder: async function(req, res){
		let {orderNo} = req.query;
		
		var orderMatch = await db.findOne(SupplierOrderDB, {batchID: orderNo}, '');
		
		if (!orderMatch){
			//error handling
		} else {
			res.render('view-suppOrder', {
				suppOrder: orderMatch
			});
		}
	},

	getBuyerOrders: async function (req, res) {
		var buyOrders = await db.findMany(CustomerOrderDB, {}, '');
		
		if (!buyOrders) {
			// error handling
		} else {
			res.render('buyerOrders', {
				buyerOrders: buyOrders
			});
		}
	}, 
	
	getSupplierOrders: async function (req, res) {
		var suppOrders = await db.findMany(SupplierOrderDB, {}, '');
		
		if (!suppOrders) {
			// error handling
		} else {
			res.render('supplierOrders', {
				supplierOrders: suppOrders
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
	getOrderStatus: async function(req, res){
		// details will be displayed in the view order status page
		let {orderNo} = req.query; //depends sa front end ano fields doon
		
		var orderMatch = await db.findOne(CustomerOrderDB, {buyOrdNo: orderNo}, '');
		
		if (!orderMatch){
			// error handling
		} else {
			if (orderMatch.status === 'SHIPPED'){
				
          res.render('view-orderStatus', {
            buyOrder: orderMatch
          });	
				
			// details regarding their delivery will be sent through the buyer’s email	
			// what details to send? 
			// how to use helper function 'sendEmail'?
			 
			// sendEmail(orderMatch.email);
			
			} else {
				// res.render('', {}); which page?
			}
		}
	},

/* Send Proof of Payment 
 * 
 * The buyer can submit proof of payment (for payments done through bank transfer and GCash) 
 * through the order tracker. The buyer is given two days to submit this proof of payment 
 * before the order is automatically cancelled from dormancy.
 * 
 */
	postProofPayment: async function(req, res){
		let {ordNo, payProof, referNo} = req.body;
		
		var order = await db.findOne(CustomerOrderDB, {buyOrdNo: ordNo}, '');
		
		if (!order){
			//handle error: order not found
		} else {
			if (order.modeOfPay === 'bank transfer' || order.modeOfPay === 'GCash'){ //values of MOP to be verified 
				var updateProof = await db.insertOne(PaymentProofDB, new constructors.PaymentProof(order.buyOrdNo, payProof, referNo));
				
				if (updateProof){
					// res.render/ redirect
				} else {
					// handle error: server error or idk amp
				}
				
			} else {
				// handle error: MOP is cash or...
			}
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

	getJoinedQuery: async function(req, res){
		var query = await db.aggregate(Product, [
			{'$match': {productID: req.query.text}},
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
		
		if (!query) {
			// handle error
		} else {
			return query;
		}
	},
	
	addProduct: async function(req, res) {
		try {
			var product = await getJoinedQuery();

			// how to deal with adding quantity?
			let {productID, name, price, size, color, categName, photoLink} = req.body;

			var prodFind = await db.findOne(ProductDB, {productID: productID});

			if (prodFind) {
				// handle error: product exists in db
			} else {
				var prodInsert = await db.insertOne(ProductDB, {productID: productID});
				var categInsert = await db.insertOne(ProdCategoryDB, {productID: productID});
				var photoInsert = await db.insertOne(ProdPhotoDB, {productID: productID});
			}
		} catch (e) {
			// error handling
		}
	},
	
	editProduct: async function(req, res) {
		try {
//			var product = await getJoinedQuery();

			// how to deal with updating prod quantity?
			let {productID, name, price, size, color, categName, photoLink} = req.body;
			var updateProd = new constructors.Product(productID, name, price, size, color);
			
			var prodFind = await db.findOne(ProductDB, {productID: productID});

			if (!prodFind) {
				// handle error: cannot edit product that does not exist
			} else {
				await db.updateOne(ProductDB, {productID: productID}, updateProd);
//				await db.updateOne(ProdCategoryDB, {productID: productID}, {categName: categName});
//				await db.updateOne(ProdPhotoDB, {productID: productID}, {photoLink: photoLink});
			}	
		} catch (e) {
			// error handling
		}
	},
	
	
/* The admin may choose to create a new category that products may be labelled under.
 */
	addProductCateg: async function(req, res) {
		let {categName} = req.body;
		
		var categFind = await db.findOne(CategoryDB, {categName: categName});
		
		if (categFind) {
			// handle error: category exists in db
		} else {
			var categInsert = await db.insertOne(CategoryDB, {categName: categFind});
			
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
