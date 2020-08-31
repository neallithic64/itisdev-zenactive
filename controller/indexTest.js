const db = require('../models/db');
const Test = require('../models/Test');

function forceJSON(e) {
	return JSON.parse(JSON.stringify(e));
}

/* Index Functions
 */
const indexFunctions = {
	getHome: function(req, res) {
		res.render('testpage', {
			title: 'Test Test Test'
		});
	},
	
	getHomeQuery: async function(req, res) {
//		var arr = await db.aggregate(Test, [{'$match': {a: req.query.a}}, {'$lookup':
//				{'from': 'Test', 'localField': 'a', 'foreignField': 'a', 'as': 'palibhasa'}}]);
//		arr.forEach(e => console.table(e.palibhasa));
		
		var a = await db.findMany(Test, {}, '');
		a.forEach(e => console.log(e));
		res.render('testpage', {
			title: 'Test Queries'
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
