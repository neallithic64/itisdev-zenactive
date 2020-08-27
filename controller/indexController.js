const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

/* Accessing the models (db) of each class
 */
const Admin = require('./Admin');
const Products = require('./Products');

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
	}
};

module.exports = indexFunctions;
