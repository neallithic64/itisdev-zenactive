const mongoose = require('mongoose');

var cancelReaSchema = new mongoose.Schema({
	buyOrdNo: {
		type: Number,
		required: true
	},
	cancelReason: {
		type: String,
		required: true
	}
}, {collection: "CancelReason"});

module.exports = mongoose.model('CancelReason', cancelReaSchema);
