const mongoose = require('mongoose');

var adminSchema = new mongoose.Schema({
	email: String,
	password: String
}, {collection: "Admin"});

module.exports = mongoose.model('Admin', adminSchema);
