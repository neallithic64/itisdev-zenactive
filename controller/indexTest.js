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
		var result = await db.insertMany(Test, arr);
		console.log(result);
		res.redirect('/');
	}
};

module.exports = indexFunctions;
