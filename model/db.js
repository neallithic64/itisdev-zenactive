const mongoose = require('mongoose');

const Admin = require('./Admin');
const Products = require('./Products');

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@zenactive-cluster.ot555.mongodb.net/zenactive?retryWrites=true&w=majority`;
const options = {
	useUnifiedTopology: true,
	useNewUrlParser: true
};

const database = {
	connect: async function() {
		try {
			await mongoose.connect(url, options);
			console.log('Connected to db');
		} catch (error) {
			throw error;
		}
	},
	
	insertOne: async function(model, doc, callback) {
		try {
			var result =  await model.create(doc);
			console.log('Added ' + result);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	insertMany: async function(model, docs, callback) {
		try {
			var result = await model.insertMany(docs);
			console.log('Added ' + result);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	findOne: async function(model, query, projection, callback) {
		try {
			var result = await model.findOne(query, projection);
			return callback(result);
		} catch (e) {
			return callback(false);
		}
	},
	
	findMany: async function(model, query, projection, callback) {
		try {
			var result = await model.find(query, projection);
			return callback(result);
		} catch (e) {
			return callback(false);
		}
	},
	
	updateOne: async function(model, filter, update, callback) {
		try {
			var result = await model.updateOne(filter, update);
			console.log('Document modified: ' + result.nModified);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	updateMany: async function(model, filter, update, callback) {
		try {
			var result = await model.updateMany(filter, update);
			console.log('Document modified: ' + result.nModified);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	deleteOne: async function(model, conditions, callback) {
		try {
			var result = await model.deleteOne(conditions);
			console.log('Document deleted: ' + result.deletedCount);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	deleteMany: async function(model, conditions, callback) {
		try {
			var result = await model.deleteMany(conditions);
			console.log('Document deleted: ' + result.deletedCount);
			return callback(true);
		} catch (e) {
			return callback(false);
		}
	},
	
	populate: function() {
		// stuff
	}
};

module.exports = database;
