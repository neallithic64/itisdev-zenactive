const mongoose = require('mongoose');

var prodCateSchema = new mongoose.Schema({
	productID: {
		type: String,
		required: true
	},
	categName: {
		type: String,
		required: true
	}
}, {collection: "ProdCategory"});

module.exports = mongoose.model('ProdCategory', prodCateSchema);
