const mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
	categName: {
		type: String,
		required: true
	}
}, {collection: "Category"});

module.exports = mongoose.model('Category', categorySchema);
