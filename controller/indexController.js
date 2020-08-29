const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

/* Accessing the models (db) of each class
 */
const db = require('../models/db');
const Admin = require('../models/Admin');
const Products = require('../models/Products');

const bcrypt = require('bcrypt');
const saltRounds = 10;

/* Object constructors */


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
		if (req.session.logUser) {
			res.render('home', {
				title: '',
				message: 'henlo'
			});
		}
	},
	
	getLogin: function(req, res){		
		if (req.session.logUser) {
			res.redirect('/'); //or whichever path for admin homepage
		} else {
			res.render('login', {});
		}
	},
	
	postLogin: async function(req, res){
		let {email, password} =  req.body;
		
		try {
			var admin = await db.findOne(Admin, {email: email}, '');

			if (!admin){
				// credentials not found error handling-- res.send({status: 401});
			} else {
				var match = await bcrypt.compare(password, admin.password);	
				
				if (match){
					req.session.logUser = admin;
					res.redirect('/');
					//res.send({status: 200});						
				} else {
					//error handling-- res.send({status: 401});
				}
			}
		} catch (e) {
			// server error handling-- res.send({status: 500});
		}
	},
	
	postLogout: function(req, res){
		req.session.destroy();
		res.redirect("/");
	},
	
	postRegister: async function(req, res){
		let {email, password} = req.body;
		
		var adminPass = await bcrypt.hash(password, saltRounds);	
		var adminInsert = await db.insertOne(Admin, {email: email, password: adminPass});
			
		if (!adminInsert){
			//error handling
		} else {
			//send success status or render or redirect to page
		}
		res.redirect('/');
	},

/* Update Order Status --
 * 
 * When items are shipped, details regarding their delivery will be sent 
 * through the buyer’s email and displayed in the view order status page, 
 * by utilizing the tracking details from the partner courier. When items 
 * are cancelled, the reason for cancelling will also be displayed.
 */

/** Manage Inventory --
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
		
		if (!query){
			//handle error
		} else {
			return res;
		}
	},
	
	addProduct: async function(req, res){
		try {
			var product = await getJoinedQuery();

			// how to deal with adding quantity?
			let {productID, name, price, size, color, categName, photoLink} = req.body;

			var prodFind = await db.findOne(Product, {productID: productID});

			if (prodFind){
				// handle error: product exists in db
			} else {
				var prodInsert = await db.insertOne('Product', {productID: productID});
				var categInsert = await db.insertOne('ProdCategory', {productID: productID});
				var photoInsert = await db.insertOne('ProdPhoto', {productID: productID});
			}
		} catch (e){
			// error handling
		}
	},
	
	editProduct: async function(req, res){
		try {
			var product = await getJoinedQuery();

			// how to deal with updating prod quantity?
			let {productID, name, price, size, color, categName, photoLink} = req.body;

			var prodFind = await db.findOne(Product, {productID: productID});

			if (!prodFind){
				// handle error: cannot edit product that does not exist
			} else {
				//update the doc
			}	
		} catch (e){
			// error handling
		}
	},
	
	
/** The admin may choose to create a new category that products may be labelled under.
 */
	addProductCateg: async function(req, res){
		let {categName} = req.body;
		
		var categFind = await db.findOne(Category, {categName: categName});
		
		if (categFind){
			// handle error: category exists in db
		} else {
			var categInsert = await db.insertOne(Category, {categName: categFind});
			
			if (!categInsert){
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
