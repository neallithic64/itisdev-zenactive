const mongoose = require('mongoose');

var thresholdSchema = new mongoose.Schema({
	algoID: {
		type: String,
		required: true
	},
	categName: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		required: true
	},
	threshVal: {
		type: Number,
		required: true
	}
}, {collection: "Threshold"});

module.exports = mongoose.model('Threshold', thresholdSchema);
