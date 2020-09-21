const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/* Accessing the models (db) of each class
 */
const db = require('../models/db');
const AdminDB = require('../models/Admin');
const CancelReasonDB = require('../models/CancelReason');
const CategoryDB = require('../models/Category');
const CustomerCartDB = require('../models/CustomerCart');
const CustomerOrderDB = require('../models/CustomerOrder');
const PaymentProofDB = require('../models/PaymentProof');
const PageViewDB = require('../models/PageView');
const ProdCategoryDB = require('../models/ProdCategory');
const ProdPhotoDB = require('../models/ProdPhoto');
const ProductDB = require('../models/Product');
const SupplierCartDB = require('../models/SupplierCart');
const SupplierOrderDB = require('../models/SupplierOrder');
const ThresholdDB = require('../models/Threshold');


async function getJoinedQuery(prodID) {
	return await db.aggregate(ProductDB, [
		{'$match': {productID: prodID}},
		{'$lookup': {
			'from': 'ProdCategory',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'prodCateg'
		}},
		{'$unwind': "$prodCateg"},
		{'$lookup': {
			'from': 'ProdPhoto',
			'localField': 'productID',
			'foreignField': 'productID',
			'as': 'prodPhoto'
		}},
		{'$unwind': "$prodPhoto"}
	]);
}

const adminMiddleware = {
	validateRegister: async function (req, res, next) {
		try {
			// check if id and email exists in db
			let {email, password} = req.body;
			
			var emailMatch = await db.findOne(AdminDB, {email: password})
			
			if (emailMatch) {
				res.status(400).send();
			}
			else if (emailMatch) { //for password
				res.status(400).send();
			}
			else return next();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	validateEditProduct: async function (req, res, next) {
		let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;

		// when will getJoinedQuery() be used if functions are done separately? (e.g. AddProdCateg, AddProdPhoto)
		var prodFind = await db.findOne(ProductDB, {productID: editProdID}, '');
		
		// should product ID be editable?
		if (!prodFind) {
			res.status(400).send();
		} else return next();
	},
	
	validateAddProdCateg: async function (req, res, next) {
		let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
		let {remCateg, addCateg} = req.body;
		
		var prodFind = await getJoinedQuery(editProdID);
		
		if (prodFind) {
			res.status(400).send(); // categ exists under product!
		} else return next();
	},
	
	validateDelProdCateg: async function (req, res, next) {
		let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
		let {remCateg, addCateg} = req.body;
		
		var prodFind = await getJoinedQuery(editProdID);
		
		if (!prodFind) {
			res.status(400).send(); // categ not found under product!
		} else return next();
	},
	
	validateAddProdPhoto: async function (req, res, next) {
		let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
		let {addProdPhoto} = req.body;
		
		var prodFind = await getJoinedQuery(editProdID);
		
		if (prodFind) {
			res.status(400).send(); // photo exists under product!
		} else return next();		
	},

	validateDelProdPhoto: async function (req, res, next) {
		let {editProdID, editProdName, editProdPrice, editProdSize, editProdColor} = req.body;
		let {remProdPhoto} = req.body;
		
		var prodFind = await getJoinedQuery(editProdID); 
		// ^ is it correct to find the product itself instead existence of the photo?
		
		if (!prodFind) {
			res.status(400).send(); // photo not found under product!
		} else return next();		
	},
	
	validateAddCateg: async function (req, res, next) {
		let {addCategName} = req.body;
		
		var categFind = await db.findOne(CategoryDB, {categName: addCategName}, '');
		
		if (categFind){
			res.status(400).send(); //categ exists!
		} else return next();
	},
	
	validatePayment: async function (req, res, next) {
		// which hbs view is this?
	}
	
};

module.exports = adminMiddleware;
