const db = require('../models/db');
const Test = require('../models/Test');

/* Index Functions
 */
const indexFunctions = {
	getHome: function(req, res) {
		res.render('testpage', {
			title: 'Test Test Test'
		});
	},
	
	postHome: async function(req, res) {
		var arr = [{a: req.body.a}, {a: req.body.b}, {a: req.body.c}];
		db.insertMany(Test, arr, a => {});
		res.redirect('/');
	}
};

module.exports = indexFunctions;
