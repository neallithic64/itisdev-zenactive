const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

/* Accessing the models (db) of each class
 */

const bcrypt = require('bcrypt');
const saltRounds = 10;

function User(fName, lName, email, user, pass, contact, addr, otp) {
	this.fName = fName;
	this.lName = lName;
	this.email = email;
	this.user = user;
	this.pass = pass;
	this.contact = contact;
	this.addr = addr;
	this.otp = otp;
	this.isConfirmed = false;
	this.cart = [];
	this.wishlist = [];
}
function Product(name, code, desc, price, qty, size, filename, category) {
	this.name = name;
	this.code = code;
	this.desc = desc;
	this.price = price;
	this.qty = qty;
	this.size = size;
	this.filename = filename;
	this.category = [...category];
}
function Order(buyer, products) {

}

function getStrMonth(mon) {
	var d = Date.parse(mon + " 1, 2020");
	return !isNaN(d) ? new Date(d).getMonth() + 1 : -1;
}

function sendEmail(email, name, otp) {
	fs.readFile('./assets/email.html', 'utf8', function(e, bodyData) {
		var template = handlebars.compile(bodyData);
		var htmlToSend = template({name: name, otp: otp});
		
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

const indexFunctions = {
	
	getHome: function(req, res) {
		if (req.session.logUser) { // check if there's a logged in user
			if (req.session.logUser.isConfirmed) { // confirmed?
				res.render('home', {
					title: 'TheShop',
					signedIn: true,
					message: 'Welcome, ' + req.session.logUser.fName + ' ' + req.session.logUser.lName + ', to TheShop!'
				});
			} else {
				res.render('home', {
					title: 'TheShop',
					signedIn: true,
					message: 'Welcome, ' + req.session.logUser.fName + ' ' + req.session.logUser.lName
							+ ', to TheShop! Please confirm your email in My Account to access the features.'
				});
			}
		} else { // if no user logged in
			res.render('home', {
				title: 'TheShop',
				signedIn: false,
				message: "Welcome to TheShop! Log in or sign up to access our features." 
			});
		}
	}
};

module.exports = indexFunctions;
