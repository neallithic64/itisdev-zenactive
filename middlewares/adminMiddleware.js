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


/* Query for joining the ff tables/collections:
 *  - CustomerOrder
 *  - CustomerCart
 *  - Product
 *  - ProdCategory
 *  - PaymentProof
 */
	async function getJoinedCustOrder(ordNo) {
		return (await db.aggregate(CustomerOrderDB, [
			{'$match': {buyOrdNo: ordNo}},
			{'$lookup': {
				'from': 'CustomerCart',
				'localField': 'buyOrdNo',
				'foreignField': 'buyOrdNo',
				'as': 'Cart'
			}},
			{'$lookup': {
				'from': 'Product',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Product'
			}},
			{'$lookup': {
				'from': 'ProdCategory',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Category'
			}},
			{'$lookup': {
				'from': 'PaymentProof',
				'localField': 'buyOrdNo',
				'foreignField': 'buyOrdNo',
				'as': 'PaymentProof'
			}}
		]))[0];
	}

/* Query for joining the ff tables/collections:
 *  - SupplierOrder
 *  - SupplierCart
 *  - Product
 *  - ProdCategory
 */
	async function getJoinedSuppOrder(ordNo) {
		return (await db.aggregate(SupplierOrderDB, [
			{'match': {batchID: ordNo}},
			{'$lookup': {
				'from': 'SupplierCart',
				'localField': 'batchID',
				'foreignField': 'batchID',
				'as': 'SuppCart'
			}},
			{'$lookup': {
				'from': 'Product',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Product'
			}},
			{'$lookup': {
				'from': 'ProdCategory',
				'localField': 'productID',
				'foreignField': 'productID',
				'as': 'Category'
			}}
		]))[0];
	}

const adminMiddleware = {
	validateRegister: async function (req, res, next) {
		try {
			let {email} = req.body;
			var emailMatch = await db.findOne(AdminDB, {email: email});
			if (emailMatch) res.status(400).send();
			else return next();
		} catch (e) {
			res.status(500).send(e);
		}
	},
	
	validateProductExist: async function(req, res, next) {
		let prod = await db.findOne(ProductDB, {productID: req.params.id});
		if (prod) return next();
		else res.render('error', {
			title: 'Product not found - ZenActivePH',
			code: 404,
			message: 'Product not found!',
			showNav: true
		});
	},
	
	validateAddProdCateg: async function (req, res, next) {
		try {
			let {categ} = req.body;
			var prodFind = await db.findOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			if (prodFind) {
				res.status(400).send('Product already has that category!');
			} else return next();
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	validateDelProdCateg: async function (req, res, next) {
		try {
			let {categ} = req.body;
			var prodFind = await db.findOne(ProdCategoryDB, {productID: req.params.id, categName: categ});
			if (!prodFind) res.status(400).send('Product doesn\'t have that category!');
			else return next();
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	validateAddProdPhoto: async function (req, res, next) {
		try {
			let {photo} = req.body;
			var prodFind = await db.findOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			if (prodFind) res.status(400).send('Product already has that photo!');
			else return next();
		} catch (e){
			res.status(500).send(e);
		}
	},

	validateDelProdPhoto: async function (req, res, next) {
		try {
			let {photo} = req.body;
			var prodFind = await db.findOne(ProdPhotoDB, {productID: req.params.id, photoLink: photo});
			if (!prodFind) res.status(400).send('Product doesn\'t have that photo!');
			else return next();
		} catch (e){
			res.status(500).send(e);
		}
	},
	
	validateAddCateg: async function (req, res, next) {
		let {categName} = req.body;
		var categFind = await db.findOne(CategoryDB, {categName: categName});
		
		if (categFind){
			res.status(400).send('Category exists!');
		} else return next();
	},
	
	validateUpdateSalesOrd: async function (req, res, next) {
		let {action, orderNo} = req.body;
		var orderFind = await db.findOne(CustomerOrderDB, {buyOrdNo: orderNo});
		if (!orderFind) res.status(400).send('Order not found.');
		else if (action === 'Purchase' && orderFind.status !== 'PENDING') res.status(400).send('Order does not have PENDING status.');
		else return next();
	},
	
	validateUpdatePurchOrd: async function (req, res, next) {
		let {batchID} = req.body;
		var orderFind = await db.findOne(SupplierOrderDB, {batchID: batchID});
		if (!orderFind) res.status(400).send('Batch not found.');			
		else return next();
	},
	
	validateSalesOrder: async function (req, res, next) {
		let {salesInput} = req.body;
		
		var orderFind = await getJoinedCustOrder(salesInput);
		
		if (!orderFind){
			res.status(400).send(); //order not found!
		} else return next();
	},

	validatePurchOrder: async function (req, res, next) {
		let {purchInput} = req.body;
		
		var orderFind = await getJoinedSuppOrder(purchInput);
		
		if (!orderFind){
			res.status(400).send(); //order not found!
		} else return next();
	}
};

module.exports = adminMiddleware;
