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

async function lookupBag(bag) {
	return (await db.findMany(ProductDB, {})).filter(e1 => bag.map(e2 => e2.code).includes(e1.productID));
}

/* Index Functions
 */
const buyerFunctions = {
	getHome: function(req, res) {
		req.session.cart = !!req.session.cart ? req.session.cart : [];
		res.render('home', {
			title: 'ZenActivePH'
		});
	},
	
	getBag: async function(req, res) {
		res.render('bag', {
			title: 'My Bag - ZenActivePH',
			bag: await lookupBag(req.session.cart)
		});
	},
	
/* Buying Process functions
 * 
 * [/] Search Products
 * [/] View All Products
 * [/] View One Product
 * 
 */
	getAllProducts: async function(req, res) {
		// use server error checking here
		var products = await db.findMany(ProductDB, {}, '');
		
		res.render('products', {
			allProducts: products
		});
	},
	
	getSearchProducts: async function(req, res) {
		// use server error checking here
		let prodQuery = new RegExp(req.query.searchProducts, 'gi');
		var searchProd = await db.findMany(ProductDB, {name: prodQuery}, '');
		
		res.render('products', {
			products: forceJSON(searchProd)
		});
	},
	
	getCategoryProds: async function(req, res) {
		var searchProd = await db.aggregate(ProdCategoryDB, [
			{'$match': {categName: req.params.category}},
			{'$lookup': {
				'from': 'Product',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'product'
			}},
			{'$unwind': '$product'}
		]);
		console.table(forceJSON(searchProd));
		res.render('products', {
			products: forceJSON(searchProd)
		});
	},
	
	getProduct: async function(req, res) {
		// use server error checking here
		// view through productID
		var prodMatch = await db.findOne(ProductDB, {productID: req.params.prodID}, '');
		
		if (!prodMatch) {
			// error handling: no product found
		} else {
			res.render('product', {
				title: prodMatch.productID + ' - ZenActivePH',
				product: prodMatch
			});
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
	
	postAddCart: function(req, res) {
		let {item} = req.body;
		if (req.session.cart) {
			console.log('cart exists!');
			req.session.cart.push(item);
			res.status(200).send();
		} else {
			console.log('cart no exist');
			res.status(403).send('cart no exist');
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
		
	}
};

module.exports = buyerFunctions;
