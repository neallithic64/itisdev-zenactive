const mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
	productID: String,
	name: String,
	price: Number,
	size: String,
	color: String
}, {collection: "Products"});

module.exports = mongoose.model('Admin', productSchema);
