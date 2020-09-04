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
	shipTrackID: String
}, {collection: "CustomerOrder"});

module.exports = mongoose.model('CustomerOrder', custOrdSchema);
