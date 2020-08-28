const mongoose = require('mongoose');

var custOrdSchema = new mongoose.Schema({
	buyOrdNo: {
		type: Number,
		required: true
	},
	
}, {collection: "CustomerOrder"});

module.exports = mongoose.model('CustomerOrder', custOrdSchema);
