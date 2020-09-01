const mongoose = require('mongoose');

var testSchema = new mongoose.Schema({
	mainVal: String,
	newID: String,
	refID1: String,
	refID2: String
}, {collection: "Test"});

testSchema.index({
	refID1: 1,
	refID2: 1
}, { unique: true });

module.exports = mongoose.model('Test', testSchema);
