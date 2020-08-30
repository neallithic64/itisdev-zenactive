const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const saltRounds = 10;

/* Accessing the models (db) of each class
 */
const db = require('../models/db');
const Admin = require('../models/Admin');
const CancelReason = require('../models/CancelReason');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const CustomerCart = require('../models/CustomerCart');
// const CustomerOrder = require('../models/CustomerOrder');
const PageView = require('../models/PageView');
const ProdCategory = require('../models/ProdCategory');
const ProdPhoto = require('../models/ProdPhoto');
const Product = require('../models/Product');
const SupplierCart = require('../models/SupplierCart');
const SupplierOrder = require('../models/SupplierOrder');
const Threshold = require('../models/Threshold');

/* Object constructors */
function Product (productID, name, price, size, color) {
	this.productID = productID;
	this.name = name;
	this.price = price;
	this.size = size;
	this.color = color;
}

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
			var admin = await db.findOne(Admin, {email: email}, '');

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
		var adminInsert = await db.insertOne(Admin, {email: email, password: adminPass});
			
		if (!adminInsert) {
			// error handling
		} else {
			// send success status or render or redirect to page
		}
		res.redirect('/');
	},

/* View Orders Report --
 * 
 * The seller may view all orders submitted to see what orders were submitted 
 * by the buyers. The seller may also view the orders they have made to the supplier.
 * 
 */

	viewBuyOrder: async function(req, res) {
		let {orderNo} = req.query;
		
		var order = await db.findOne(CustomerOrder, {buyOrdNo: orderNo}, '');
		
		if (!order) {
			// error handling
		} else {
			res.render('viewBuyOrder', {
				buyOrder: order
			});
		}
	},

	viewSuppOrder: async function(req, res) {
		let {orderNo} = req.query;
		
		var order = await db.findOne(SupplierOrder, {batchID: orderNo}, '');
		
		if (!order) {
			// error handling
		} else {
			res.render('viewSuppOrder', {
				suppOrder: order
			});
		}
	},

	getBuyerOrders: async function (req, res) {
		var buyOrders = await db.findMany(CustomerOrder, {}, '');
		
		if (!buyOrders) {
			// error handling
		} else {
			res.render('buyerOrders', {
				buyerOrders: buyOrders
			});
		}
	}, 
	
	getSupplierOrders: async function (req, res) {
		var suppOrders = await db.findMany(SupplierOrder, {}, '');
		
		if (!suppOrders) {
			//error handling
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

	getJoinedQuery: async function(req, res) {
		var query = await db.aggregate('Product', [
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
			//handle error
		} else {
			return query;
		}
	},
	
	addProduct: async function(req, res) {
		try {
			var product = await getJoinedQuery();

			// how to deal with adding quantity?
			let {productID, name, price, size, color, categName, photoLink} = req.body;

			var prodFind = await db.findOne(Product, {productID: productID});

			if (prodFind) {
				// handle error: product exists in db
			} else {
				var prodInsert = await db.insertOne(Product, {productID: productID});
				var categInsert = await db.insertOne(ProdCategory, {productID: productID});
				var photoInsert = await db.insertOne(ProdPhoto, {productID: productID});
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
			var updateProd = new Product(productID, name, price, size, color);
			
			var prodFind = await db.findOne(Product, {productID: productID});

			if (!prodFind) {
				// handle error: cannot edit product that does not exist
			} else {
				await db.updateOne(Product, {productID: productID}, updateProd);
//				await db.updateOne(ProdCategory, {productID: productID}, {categName: categName});
//				await db.updateOne(ProdPhoto, {productID: productID}, {photoLink: photoLink});
			}	
		} catch (e) {
			// error handling
		}
	},
	
	
/** The admin may choose to create a new category that products may be labelled under.
 */
	addProductCateg: async function(req, res) {
		let {categName} = req.body;
		
		var categFind = await db.findOne(Category, {categName: categName});
		
		if (categFind) {
			// handle error: category exists in db
		} else {
			var categInsert = await db.insertOne(Category, {categName: categFind});
			
			if (!categInsert) {
				// handle error
			} else {
				//categ added; redirect to page
			}
		}
		
		//when and what is the flow to add products in this category? --make as separate function
		//retrieve list of products
		//ask admin to choose which to put in categ
		
	}

};

module.exports = indexFunctions;
