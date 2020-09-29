const express = require('express');
const router = express();
const test = require('../controller/indexTest');
const adminCont = require('../controller/adminController');
const buyerCont = require('../controller/buyerController');
const adminMiddle = require('../middlewares/adminMiddleware');
const buyerMiddle = require('../middlewares/buyerMiddleware');


// Testing Routes
router.get('/test', test.getHome);
router.post('/test', test.postGenDocs);

router.get('/a', (req, res) => res.render('salesreport', {title: 'a'}));



// Buyer GET Routes
router.get('/', buyerCont.getHome);
router.get('/getCart', buyerMiddle.validateCartExist, buyerCont.getCartObj);
router.get('/bag', buyerMiddle.validateCartExist, buyerCont.getBag);
router.get('/checkout', buyerMiddle.validateCartExist, buyerCont.getCheckout);
router.get('/search-products', buyerCont.getSearchProducts);
router.get('/category/:category', buyerCont.getCategoryProds);
router.get('/product/:prodID', buyerCont.getProduct);
router.get('/view-allproducts', buyerCont.getAllProducts);
router.get('/vieworder*', buyerCont.getOrderStatus);
router.get('/sendProof/:buyOrd', buyerCont.getProofPayment);



// Buyer POST Routes
router.post('/addToCart', buyerMiddle.validateCartExist, buyerMiddle.validateAddCart, buyerCont.postAddCart);
router.post('/removeFromCart', buyerCont.postRemCart);
router.post('/updateQtyBag', buyerCont.postUpdateQty);
router.post('/checkout', buyerMiddle.validateCartExist, buyerCont.postCheckout);
router.post('/sendProof', buyerMiddle.validateProofPayment, buyerCont.postProofPayment);



// Admin GET Routes
router.get('/login', adminCont.getLogin);
router.get('/register', adminCont.getRegister);
router.get('/admin', adminCont.getAdmin);
router.get('/invProds', adminCont.getInvProds);
router.get('/invCateg', adminCont.getInvCateg);
router.get('/addProduct', adminCont.getAddProduct);
router.get('/addProdExist', adminCont.getAddProdExist);
router.get('/addCategory', adminCont.getAddCategory);
router.get('/editProduct/:id', adminMiddle.validateProductExist, adminCont.getEditProduct);

router.get('/salesOrders', adminCont.getSalesOrder);
router.get('/purchaseOrders', adminCont.getPurchaseOrder);
router.get('/searchSales', adminCont.getSalesQuery);
router.get('/searchPurchases', adminCont.getPurchQuery);
//router.get('/salesreport', adminCont.getSalesReport);
//router.get('/custreport', adminCont.getCustReport);
//router.get('/webreport', adminCont.getWebReport);



// Admin POST Routes
router.post('/login', adminCont.postLogin);
router.post('/logout', adminCont.postLogout);
router.post('/register', adminCont.postRegister);
router.post('/addProduct', adminCont.postAddProduct);
router.post('/addCategory', adminMiddle.validateAddCateg, adminCont.postAddCateg);
router.post('/editProduct/:id', adminMiddle.validateProductExist, adminCont.postEditProduct);

router.post('/addProdCateg/:id', adminMiddle.validateProductExist, adminMiddle.validateAddProdCateg, adminCont.postAddProdCateg);
router.post('/remProdCateg/:id', adminMiddle.validateProductExist, adminMiddle.validateDelProdCateg, adminCont.postDelProdCateg);
router.post('/addProdPhoto/:id', adminMiddle.validateProductExist, adminMiddle.validateAddProdPhoto, adminCont.postAddProdPhoto);
router.post('/remProdPhoto/:id', adminMiddle.validateProductExist, adminMiddle.validateDelProdPhoto, adminCont.postDelProdPhoto);


// Error Page
router.get('*', function(req, res) {
	res.render('error', {
		title: 'Page not found - ZenActivePH',
		code: 404,
		message: 'Page not found',
		showNav: true
	});
});

module.exports = router;
