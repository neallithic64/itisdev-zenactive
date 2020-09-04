const db = require('../models/db');
const Test = require('../models/Test');
// const algo = require('algoSet');

function forceJSON(e) {
	return JSON.parse(JSON.stringify(e));
}

function genDate() {
	return new Date((new Date()) - Math.round(Math.random()*1000000000));
}

function incDate(date) {
	var d = new Date(date);
	return d.setDate(d.getDate()+1);
}

/* Index Functions
 */
const indexTest = {
	getHome: function(req, res) {
		res.render('testpage', {
			title: 'Test Test Test'
		});
	},
	
	getLookup: async function(req, res) {
		var arr = await db.aggregate(Test, [{'$match': {a: req.query.a}}, {'$lookup':
				{'from': 'Test', 'localField': 'a', 'foreignField': 'a', 'as': 'palibhasa'}}]);
		arr.forEach(e => console.table(e.palibhasa));		
		var a = await db.findMany(Test, {});
		a.forEach(e => console.log(e));
		res.redirect('/');
	},
	
	getHomeQuery: async function(req, res) {
		// querying
		var kek = {
			start: req.query.start,
			end: req.query.end,
			numstart: req.query.numstart,
			numend: req.query.numend
		};
		var queys = await db.findMany(Test, {mainVal: {$gte: kek.start, $lte: incDate(kek.end)}});
//		var queys = await db.findMany(Test, {otherVal: {$gte: kek.numstart, $lte: kek.numend}});
		console.table(forceJSON(queys));
		res.redirect('/');
	},
	
	postDoublePK: async function(req, res) {
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
	},
	
	postGenDocs: async function(req, res) {
		// generating docs
		var docs = [];
		for (var i = 0; i < 20; i++) docs.push({mainVal: genDate(), otherVal: Math.round(Math.random()*1000)});
		await db.insertMany(Test, docs);
		
		res.redirect('/');
	}
};

module.exports = indexTest;
