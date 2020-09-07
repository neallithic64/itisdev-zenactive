const mongoose = require('mongoose');

var suppOrdSchema = new mongoose.Schema({
	batchID: {
		type: Number,
		required: true
	},
	orderDate: {
		type: Date,
		required: true
	},
	cutoffDate: {
		type: Date,
		required: true
	}
}, {collection: "SupplierOrder"});

module.exports = mongoose.model('SupplierOrder', suppOrdSchema);
