const mongoose = require('mongoose');

var pageViewSchema = new mongoose.Schema({
	productID: {
		type: String,
		required: true
	},
	date: {
		type: String,
		required: true
	},
	count: {
		type: Number,
		required: true
	}
}, {collection: "PageView"});

module.exports = mongoose.model('PageView', pageViewSchema);
