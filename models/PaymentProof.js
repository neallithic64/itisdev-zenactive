const mongoose = require('mongoose');

var payProofSchema = new mongoose.Schema({
	buyOrdNo: {
		type: Number,
		required: true
	},
	paymentProof: {
		type: String,
		required: true
	},
	referenceNo: {
		type: String,
		required: true
	},
	amountPaid: {
		type: Number,
		required: true
	}
}, {collection: "PaymentProof"});

module.exports = mongoose.model('PaymentProof', payProofSchema);
