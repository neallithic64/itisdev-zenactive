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
		var obj = {
			mainVal: req.body.a,
			refID1: '1',
			refID2: '2'
		};
		var result = await db.insertOne(Test, obj);
		console.log(result ? 'inserted' : 'failed');
		
		// make the query
		var a = await db.findOne(Test, {refID1: '1', refID2: '2'});
		
		if (a) {
			// ID generation system
			var str = (a._id+"");
			// making use of _id (ObjectId)
			a.refID1 = str.substr(0, 12);
			a.refID2 = str.substr(12);
			
			// save the update/s and redirect
			await a.save();
		}
		res.redirect('/');
	}
};

module.exports = indexFunctions;
