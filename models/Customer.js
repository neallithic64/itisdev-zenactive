const mongoose = require('mongoose');

var customerSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		required: true
	}
}, {collection: "Customer"});

module.exports = mongoose.model('Customer', customerSchema);
