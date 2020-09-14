const mongoose = require('mongoose');

var custOrdSchema = new mongoose.Schema({
	buyOrdNo: {
		type: Number,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	status: {
		type: String,
		required: true
	},
	totalAmount: {
		type: Number,
		required: true
	},
	timestamp: {
		type: Date,
		required: true
	},
	modeOfPay: {
		type: String,
		required: true
	},
	shipTrackID: String,
	address: {
		type: String,
		required: true
	},
	city: {
		type: String,
		required: true
	},
	area: {
		type: String,
		required: true
	},
	completeName: {
		type: String,
		required: true
	},
	contactNumber: {
		type: Number,
		required: true
	}
}, {collection: "CustomerOrder"});

module.exports = mongoose.model('CustomerOrder', custOrdSchema);
