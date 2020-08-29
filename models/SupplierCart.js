const mongoose = require('mongoose');

var suppCartSchema = new mongoose.Schema({
	batchID: {
		type: Number,
		required: true
	},
	productID: {
		type: String,
		required: true
	},
	qty: {
		type: Number,
		required: true
	},
	price: {
		type: Number,
		required: true
	}
}, {collection: "SupplierCart"});

module.exports = mongoose.model('SupplierCart', suppCartSchema);
