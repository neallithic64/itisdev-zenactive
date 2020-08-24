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
	
	getHomeQuery: async function(req, res) {
		try {
			var arr = await db.aggregate(Test, [{'$match': {a: req.query.a}}, {'$lookup':
					{'from': 'Test', 'localField': 'a', 'foreignField': 'a', 'as': 'palibhasa'}}]);
			arr.forEach(e => {
				console.table(e.palibhasa);
			});
		} catch (e) {
			console.log(e);
		}
		res.render('testpage');
	},
	
	postHome: async function(req, res) {
		var arr = [{a: req.body.a}, {a: req.body.b}, {a: req.body.c}];
		var result = await db.insertMany(Test, arr);
		console.log(result);
		res.redirect('/');
	}
};

module.exports = indexFunctions;
