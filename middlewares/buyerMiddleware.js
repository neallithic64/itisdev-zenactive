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
		if (!req.session.cart) res.status(403).send('cart no exist');
		else return next();
	},
	
	validateAddCart: function(req, res, next) {
		if (req.session.cart.some(e => e.code === req.body.item.code))
			res.status(403).send('Item already exists in your bag!');
		else if (req.session.cart.reduce((a, e) => a + e.qty, 0) + req.body.item.qty >= 30)
			res.status(403).send('Bag is full! Try removing some items.');
		else return next();
	}
};

module.exports = buyerMiddleware;
