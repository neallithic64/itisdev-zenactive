const mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
	productID: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	size: {
		type: String,
		required: true
	},
	color: {
		type: String,
		required: true
	}
}, {collection: "Products"});

module.exports = mongoose.model('Products', productSchema);
