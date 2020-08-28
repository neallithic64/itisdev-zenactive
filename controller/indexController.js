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
			//send success status or render/redirect to page
		}
		res.redirect('/');
	}

};

module.exports = indexFunctions;
