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
		// insert the document
		await db.insertOne(Test, {mainVal: req.body.a1});
		
		// make the query
		var a = await db.findOne(Test, {mainVal: req.body.a1});
		
		// make the ID thing, making use of _id
		a.refID1 = (a._id+"").substring(9);
		
		// save the update/s and redirect
		await a.save();
		res.redirect('/');
	}
};

module.exports = indexFunctions;
