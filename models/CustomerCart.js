const mongoose = require('mongoose');

var custCartSchema = new mongoose.Schema({
	productID: {
		type: String,
		required: true
	},
	buyOrdNo: {
		type: Number,
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
}, {collection: "CustomerCart"});

module.exports = mongoose.model('CustomerCart', custCartSchema);
