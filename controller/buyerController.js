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
		}},
		{'$lookup': {
			'from': 'Product',
			'localField': 'name',
			'foreignField': 'name',
			'as': 'prodColours'
		}}
	]);
}

async function lookupBag(bag) {
	return forceJSON(await db.findMany(ProductDB, {})).filter(e1 => bag.map(e2 => e2.code).includes(e1.productID)).map((item, i) => Object.assign({}, item, bag[i]));
}

/* Index Functions
 */
const buyerFunctions = {
	getHome: function(req, res) {
		req.session.cart = !!req.session.cart ? req.session.cart : [];
		res.render('home', {
			title: 'ZenActivePH',
			showNav: true
		});
	},
	
	getCartObj: function(req, res) {
		res.status(200).send(req.session.cart);
	},
	
	getBag: async function(req, res) {
		var newBag = await lookupBag(req.session.cart);
		console.log(newBag);
		res.render('bag', {
			title: 'My Bag - ZenActivePH',
			bag: newBag,
			showNav: true
		});
	},
	
	getCheckout: async function(req, res) {
		var bag = await lookupBag(req.session.cart),
			sub = bag.reduce((acc, e) => acc + e.price*e.qty, 0);
		console.log(bag);
		res.render('checkout', {
			title: 'Checkout - ZenActivePH',
			bag: bag,
			subtotal: sub,
			total: sub + 80,
			showNav: true
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
			allProducts: products,
			showNav: true
		});
	},
	
	getSearchProducts: async function(req, res) {
		// use server error checking here
		let prodQuery = new RegExp(req.query.homeSearch, 'gi');
//		var searchProd = await db.findMany(ProductDB, {name: prodQuery}, '');
		
		var searchProd = await db.aggregate(ProductDB, [
			{'$match': {name: prodQuery}},
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
		
		res.render('products', {
			products: forceJSON(searchProd),
			showNav: true
		});		
	},
	
	getCategoryProds: async function(req, res) {
		// place query in a placehold array var
		var searchProd = await db.aggregate(ProductDB, [
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
		
		// filter results 
		var searchCateg = searchProd.filter(function(elem1){
			return elem1.prodCateg.some(function(elem2){
				return elem2.categName === req.params.category;
			});
		});
		
		// render the found elem
		console.log(searchProd);
		console.log(forceJSON(searchCateg));
		res.render('products', {
			products: forceJSON(searchCateg),
			showNav: true
		});
	},
	
	getProduct: async function(req, res) {
		try {
			var prodMatch = await getJoinedQuery(req.params.prodID);
			res.render('product', {
				title: prodMatch[0].productID + ' - ZenActivePH',
				product: prodMatch[0],
				showNav: true
			});
		} catch (e) {
			res.render('error', {
				title: 'Product not found - ZenActivePH',
				code: 404,
				message: 'Product not found!',
				showNav: true
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
				buyOrder: orderMatch,
				showNav: true
			});
		}

	},
	
	postCheckout: async function(req, res) {
		let {compname, email, contno, address, city, area, modePay} = req.body;
		try {
			let bag = await lookupBag(req.session.cart),
				total = bag.reduce((acc, e) => acc + e.qty*e.price, 0) + area === 'Metro Manila' ? 80 : 150,
				ord = new constructors.CustomerOrder(email, total, modePay, address, city, area, compname, contno),
				cartOrds = [];
			
			// make customer order document
			await db.insertOne(CustomerOrderDB, ord);

			// make customer cart documents
			bag.forEach(e => {
				cartOrds.push({
					productID: e.code,
					buyOrdNo: ord.buyOrdNo,
					qty: e.qty,
					price: e.price
				});
			});
			await db.insertMany(CustomerCartDB, cartOrds);

			// clear cart and exit
			req.session.cart = [];
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	postAddCart: function(req, res) {
		let {item} = req.body;
		req.session.cart.push(item);
		res.status(200).send();
	},
	
	postRemCart: function(req, res) {
		let {code} = req.body;
		req.session.cart = req.session.cart.filter(e => e.code !== code);
		res.status(200).send();
	},
	
	postUpdateQty: function(req, res) {
		let {id, newqty} = req.body;
		req.session.cart.forEach(e => {
			if (e.code === id) e.qty = newqty;
		});
		// req.session.cart.forEach(e => e.qty = e.code === id ? newqty : e.qty);
		res.status(200).send();
	},

/* Send Proof of Payment 
 * 
 * The buyer can submit proof of payment (for payments done through bank transfer and GCash) 
 * through the order tracker. The buyer is given two days to submit this proof of payment 
 * before the order is automatically cancelled from dormancy.
 * 
 */
	postProofPayment: async function(req, res) {
		try {
			let {ordNo, payProof, referNo, amtPaid} = req.body;
			var order = await db.findOne(CustomerOrderDB, {buyOrdNo: ordNo}, '');

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
		} catch (e){
			res.status(500).send(e);
		}
		
	}
};

module.exports = buyerFunctions;
