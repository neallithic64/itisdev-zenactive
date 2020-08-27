const mongoose = require('mongoose');

var testSchema = new mongoose.Schema({
	a: String
}, {collection: "Test"});

module.exports = mongoose.model('Test', testSchema);
