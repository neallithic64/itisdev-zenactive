const mongoose = require('mongoose');

var prodPhotoSchema = new mongoose.Schema({
	photoLink: {
		type: String,
		required: true
	},
	productID: {
		type: String,
		required: true
	}
}, {collection: "ProdPhoto"});

module.exports = mongoose.model('ProdPhoto', prodPhotoSchema);
