/* global process */

const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const algo = require('./algoSet');

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

async function getJoinedSalesOrder(ordNo) {
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
			'localField': 'Cart.productID',
			'foreignField': 'productID',
			'as': 'Product'
		}},
		{'$lookup': {
			'from': 'ProdCategory',
			'localField': 'Product.productID',
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
async function getJoinedPurchOrder(ordNo) {
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

/* Query for joining the ff tables/collections:
 *  - Product
 *  - ProdCategory
 *  - ProdPhoto
 *  - CustomerOrder
 *  - CustomerCart
 */
async function getJoinedSalesQuery(startDate, endDate) {
	var results = await db.aggregate(ProductDB, [
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
			'from': 'CustomerCart',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'custCart'
		}},
		{'$lookup': {
			'from': 'CustomerOrder',
			'localField': 'custCart.buyOrdNo',
			'foreignField': 'buyOrdNo',
			'as': 'custOrder'
		}}
	]);
	var newArr = [];
	if (startDate && endDate) {
		results.forEach(function(elem1) {
			newArr = [];
			elem1.custCart.forEach(function(elem2, index) {
				if (elem1.custOrder[index].timestamp >= new Date(startDate) && elem1.custOrder[index].timestamp <= new Date(endDate)) {
					newArr.push(elem2);
				}
			});
			elem1.custCart = newArr;
		});
	}
	return results.filter(e => e.custCart.length > 0);
}

/* Query for joining the ff tables/collections:
 *  - none
 */
async function getJoinedCustQuery(startDate, endDate) {
	var results = await db.aggregate(CustomerOrderDB, [
		{'$group': {
			_id : { '$dateToString': { format: "%Y-%m-%d", date: "$timestamp" } },
			count: { '$sum': 1 },
			email: { '$push': '$email' },
			emailNew: { '$addToSet': '$email' }
		}},
		{'$sort': {_id: 1}}
	]);
	var counts;
	results.forEach(function(elem1) {
		counts = {};
		elem1.newCust = elem1.emailNew.length;
		elem1.email.forEach(function(x) {
			counts[x] = (counts[x] || 0) + 1;
		});
		elem1.emailRep = counts;
		elem1.repeatCust = Object.values(counts).filter(e => e > 1).length;
	});
	// console.log(results);
	if (startDate && endDate) return results.filter(e => new Date(e._id) >= new Date(startDate) && new Date(e._id) <= new Date(endDate));
	else return results;
}

/* Query for joining the ff tables/collections:
 *  - Product
 *  - ProdCategory
 *  - ProdPhoto
 *  - 
 */
async function getJoinedWebQuery(startDate, endDate) {
	var results = await db.aggregate(ProductDB, [
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
			'from': 'PageView',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'pageView'
		}},
		{'$lookup': {
			'from': 'CustomerCart',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'custCart'
		}},
		{'$lookup': {
			'from': 'CustomerOrder',
			'localField': 'custCart.buyOrdNo',
			'foreignField': 'buyOrdNo',
			'as': 'custOrder'
		}}
	]);
	var newArr = [];
	if (startDate && endDate) {
		results.forEach(function(elem1) {
			newArr = [];
			elem1.custCart.forEach(function(elem2, index) {
				if (elem1.custOrder[index].timestamp >= new Date(startDate) && elem1.custOrder[index].timestamp <= new Date(endDate)) {
					newArr.push(elem2);
				}
			});
			elem1.totalSales = newArr.length;
			elem1.totalViews = elem1.pageView
					.filter(e => new Date(e.date) >= new Date(startDate) && new Date(e.date) <= new Date(endDate))
					.reduce((acc, e) => acc + e.count, 0);
		});
	} else {
		results.forEach(function(elem1) {
			elem1.totalSales = elem1.custCart.length;
			elem1.totalViews = elem1.pageView.reduce((acc, e) => acc + e.count, 0);
		});
	}
	return results;
}

/* Index Functions
 */
const adminFunctions = {
	getLogin: function(req, res) {
		if (req.session.admin) res.redirect('/admin');
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
	getAllSalesOrders: async function(req, res) { 
		try {
			var orderMatch = await getJoinedSalesOrder();
			console.log(orderMatch);
			res.render('salestracker', {
				title: 'Sales Tracker - ZenActivePH',
				salesOrder: forceJSON(orderMatch)
			});
		} catch(e) {
			res.status(500).send(e);
		}
	},
	
	getAllPurchaseOrders: async function(req, res) { 
		try {
			var orderMatch = await getJoinedPurchOrder();
			res.render('purchtracker', {
				title: 'Purchases Tracker - ZenActivePH',
				purchOrder: forceJSON(orderMatch)
			});			
		} catch(e) {
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
			// Product, Customer Cart, Customer Order collections
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
					'as': 'Cart'
				}},
				{'$lookup': {
					'from': 'Product',
					'localField': 'Cart.productID',
					'foreignField': 'productID',
					'as': 'Product'
				}},
				{'$lookup': {
					'from': 'ProdCategory',
					'localField': 'productID',
					'foreignField': 'productID',
					'as': 'Category'
				}},
				{'$unwind': '$Product'},
				{'$unwind': '$Cart'},
				{'$unwind': '$Category'}
			]);
//			buyOrder.forEach(e1 => e1.Product = e1.Product.map((e2, i) => Object.assign({}, e2, e1.Cart[i])));
			
//			console.log(buyOrder[0].Product[0].name);
			console.log(buyOrder);
			
			// retrieve paymentProof (url/pic) & reference order, for seller to check
			res.render('viewsalesorder', {
				title: 'View Sales Order - ZenActivePH',
				order: buyOrder[0]
			});
		} else res.redirect('/login');
	},
	
	// seller inputs the shipTrackID of the courier
	postTrackID: async function(req, res) {
		let {ordNo, trackID} = req.body;
		
		//if not yet existing in db
		var orderFind = db.findOne(CustomerOrderDB, {buyOrdNo: ordNo}, '');
		
		if (orderFind){
			if (!orderFind.shipTrackID){
				db.updateOne(CustomerOrderDB, {buyOrdNo: ordNo}, {shipTrackID: trackID});
				console.log(orderFind.shipTrackID);
				res.status(200).send();
			} else res.status(400).send('Order already has tracking ID.');
		} else res.status(400).send('Order not found.');
	},

	postUpdateSalesOrder: async function(req, res) {
		try {
			let {orderNo, action} = req.body;
			var status = (function(action) {
				switch (action) {
					case 'Purchase': return 'IN TRANSIT';
					case 'Ship': return 'SHIPPED';
					default: return 'CANCELLED';
				}
			})(action);
			await db.updateOne(CustomerOrderDB, {buyOrdNo: orderNo}, {status: status});
			
			if (status === 'CANCELLED') {
				var cancRsn = (function(action) {
					switch (action) {
						case 'Cancel1': return 'Supplier is out of stock';
						case 'Cancel2': return 'Wrong payment details';
						case 'Cancel3': return 'Unable to deliver to buyer';
					}
				})(action);
				await db.insertOne(CancelReasonDB, {buyOrdNo: orderNo, cancelReason: cancRsn});
			}
			res.status(200).send();
		} catch(e) {
			res.status(500).send(e);
		}
	},
	
	postUpdatePurchOrder: async function(req, res) {
		try {
			let {batchID, action} = req.body;
			var status = (function(action) {
				switch (action) {
					case 'Complete': return 'COMPLETE';
					case 'Incomplete': return 'INCOMPLETE';
					case 'Refunded': return 'REFUNDED';
					case 'Cancelled': return 'CANCELLED';
				}
			})(action);
			await db.updateOne(SupplierOrderDB, {batchID: batchID}, {status: status});
			res.status(200).send();	
		} catch(e) {
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

	postAddProdCateg: async function(req, res) {
		try {
			let {categ} = req.body;
			await db.insertOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}		
	},
	
	postDelProdCateg: async function(req, res) {
		try {
			let {categ} = req.body;
			await db.deleteOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}		
	},


/* Edit Product Photo(s)
 * 
 */	
	postAddProdPhoto: async function(req, res) {
		try {
			let {photo} = req.body;
			await db.insertOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	postDelProdPhoto: async function(req, res) {
		try {
			let {photo} = req.body;
			await db.deleteOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			res.status(200).send();
		} catch (e) {
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
		} catch (e) {
			res.status(500).send(e);
		}
	},

/* Generate Sales Report
 * 
 * The admin can view all sales made within a specific timeframe (week, month, year) 
 * in a summary. The results may also be filtered between a specific product to 
 * see how many were sold.
 * 
 */	
	getSalesReport: async function (req, res) {
		// Note: are orders with status CONFIRMED the only ones considered as sales?
		var salesMatch = await getJoinedSalesQuery(req.query.startDate, req.query.endDate);
		
		var salesCount = [], totalSales = [];
		salesMatch.forEach(function(elem1) {
			salesCount.push(elem1.custCart.reduce(function(acc, elem2) {
								return acc + elem2.qty;
							}, 0));
			totalSales.push(elem1.custCart.reduce(function(acc, elem2) {
								return acc + (elem2.price*elem2.qty);
							}, 0));
		});
		var totalS = totalSales.reduce((acc, elem) => acc + elem, 0);
		var sCount = salesCount.reduce((acc, elem) => acc + elem, 0);
		var aveS = totalS / sCount;
		res.render('salesreport', {
			title: 'View Sales Report - ZenActivePH',
			salesRow: salesMatch,
			salesCount: salesCount,
			totalSales: totalSales,
			totalS: totalS,
			sCount: sCount,
			aveS: aveS
		});
	},
	
	getSalesDetReport: async function(req, res, next) {
		
	},
	
/* Generate Customer Report
 * 
 * The admin can view all new and repeating customers within a specific timeframe 
 * (week, month, year) in a summary.
 * 
 */	
	getCustReport: async function (req, res) {
		var custMatch = await getJoinedCustQuery(req.query.startDate, req.query.endDate);
		console.log(custMatch);
		
		res.render('custreport', {
			title: 'View Customer Report - ZenActivePH',
			custRow: custMatch,
			totNewCust: custMatch.reduce((acc, e) => acc + e.newCust, 0),
			totRepCust: custMatch.reduce((acc, e) => acc + e.repeatCust, 0)
		});
	},
	
	getCustDetReport: async function(req, res, next) {
		let dateNext = new Date(req.query.date), date = new Date(req.query.date);
		dateNext.setDate(dateNext.getDate()+1);
		console.log(date, dateNext);
		var results = await db.aggregate(CustomerOrderDB, [
			{'$lookup': {
				'from': 'CustomerOrder',
				'localField': 'email',
				'foreignField': 'email',
				'as': 'otherOrds'
			}}
		]);
		results = results.filter(e => e.timestamp >= date && e.timestamp < dateNext);
		results.forEach(e => e.ordCount = e.otherOrds.length);
		console.log(results);
		res.render('custdetailed', {
			title: 'Detailed Customer Report - ZenActivePH',
			rows: results,
			date: req.query.date,
			totalCount: results.reduce((acc, e) => acc + e.ordCount, 0)
		});
	},
	
/* Generate Web Metrics Report
 * 
 * The admin can view most-viewed products and search metrics from the website 
 * within a specific timeframe (week, month, year) in a summary.
 * 
 */	
	getWebReport: async function (req, res) {
		var webMatch = await getJoinedWebQuery(req.query.startDate, req.query.endDate);
		
		res.render('webreport', {
			title: 'View Web Report - ZenActivePH',
			webRow: webMatch,
			totalViews: webMatch.reduce((acc, e) => acc + e.totalViews, 0),
			aveViews: webMatch.reduce((acc, e) => acc + e.totalViews, 0)/webMatch.length
		});
	},
	
	
/* Select Pre-Order Batch Threshold
 * 
 * The admin can view recommendations on the pre-order cut-off date based on different
 * algorithms using historical data from orders and sales. The recommendations will be
 * by type and color, which are already assigned by the admin upon adding an item
 * (e.g.: sets, accessories, tops, bottoms).
 * 
 * The admin will be notified at the cut-off date to make the batch order to the
 * supplier. This way, they can have a more efficient schedule when they will be
 * ordering the products from their supplier, lessening the shipping and overall
 * costs.
 * 
 */
	getChooseThresh: async function(req, res, next) {
		try {
			console.log(algo.getAlgos());
			var categs = await db.findMany(CategoryDB, {});
			res.render('choosethreshold', {
				title: 'Choose Threshold - ZenActivePH',
				categs: categs,
				thresh: algo.getAlgos()
			});
		} catch (e) {
			res.send(e);
		}
	},
	
	
	postChooseThresh: async function(req, res, next) {
		try {
			// let {} = req.body;
			algo.callAlgo();
			
		} catch (e) {
			res.send(e);
		}
	}
};

module.exports = adminFunctions;
