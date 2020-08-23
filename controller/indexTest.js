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
		db.insertMany(Test, )
	}
};

module.exports = indexFunctions;
