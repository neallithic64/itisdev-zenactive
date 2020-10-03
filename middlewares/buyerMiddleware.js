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


const buyerMiddleware = {
	validateCartExist: function (req, res, next) {
		if (!req.session.cart) res.redirect('/');
		else return next();
	},
	
	validateAddCart: function(req, res, next) {
		if (req.session.cart.some(e => e.code === req.body.item.code))
			res.status(403).send('Item already exists in your bag!');
		else if (req.session.cart.reduce((a, e) => a + e.qty, 0) + Number.parseInt(req.body.item.qty) >= 30)
			res.status(403).send('Bag is full! Try removing some items.');
		else return next();
	},
	
	validateProofPayment: async function(req, res, next) {
		try {
			let {buyOrdNo, submitProofImg} = req.body;
			var order = await db.findOne(CustomerOrderDB, {buyOrdNo: buyOrdNo});
			var payProof = await db.findOne(PaymentProofDB, {buyOrdNo: buyOrdNo, paymentProof: submitProofImg});
			
			// Only orders with status 'PENDING' will have payment proof
			if (order.status !== 'PENDING'){
				res.status(400).send('Not PENDING status orders don\'t need proof submission!');
			} else {
				if (order.modeOfPay === 'PayPal') res.status(400).send('PayPal payments don\'t need proof submission!');
				else if (payProof) res.status(400).send('You already submitted that payment proof!');
				else return next();						
			}
		} catch (e){
			res.status(500).send(e);
		}
	}
};

module.exports = buyerMiddleware;
