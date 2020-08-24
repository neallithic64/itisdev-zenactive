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
	
	postHome: function(req, res) {
		console.table(req.body);
		// db.insertMany(Test, req.body);
	}
};

module.exports = indexFunctions;
