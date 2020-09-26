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

router.get('/a', (req, res) => res.render('error', {title: 'a', showNav: true}));



// Buyer GET Routes
router.get('/', buyerCont.getHome);
router.get('/getCart', buyerMiddle.validateCartExist, buyerCont.getCartObj);
router.get('/bag', buyerMiddle.validateCartExist, buyerCont.getBag);
router.get('/checkout', buyerMiddle.validateCartExist, buyerCont.getCheckout);
router.get('/search-products', buyerCont.getSearchProducts);
router.get('/category/:category', buyerCont.getCategoryProds);
router.get('/product/:prodID', buyerCont.getProduct);
router.get('/view-allproducts', buyerCont.getAllProducts);
router.get('/view-orderStatus', buyerCont.getOrderStatus);


// Buyer POST Routes
router.post('/addToCart', buyerMiddle.validateCartExist, buyerMiddle.validateAddCart, buyerCont.postAddCart);
router.post('/removeFromCart', buyerCont.postRemCart);
router.post('/updateQtyBag', buyerCont.postUpdateQty);
router.post('/checkout', buyerMiddle.validateCartExist, buyerCont.postCheckout);



// Admin GET Routes
router.get('/login', adminCont.getLogin);
router.get('/register', adminCont.getRegister);
router.get('/admin', adminCont.getAdmin);
router.get('/invProds', adminCont.getInvProds);
router.get('/invCateg', adminCont.getInvCateg);
router.get('/salesOrders', adminCont.getSalesOrder);
router.get('/purchaseOrders', adminCont.getPurchaseOrder);

router.get('/addProduct', adminCont.getAddProduct);
router.get('/addProdExist', adminCont.getAddProdExist);
router.get('/addCategory', adminCont.getAddCategory);
router.get('/editProduct/:id', adminCont.getEditProduct);

router.get('/searchSales', adminCont.getSalesQuery);
router.get('/searchPurchases', adminCont.getPurchQuery);


// Admin POST Routes
router.post('/login', adminCont.postLogin);
router.post('/logout', adminCont.postLogout);
router.post('/register', adminCont.postRegister);
router.post('/addProduct', adminCont.postAddProduct);
router.post('/addCategory', adminMiddle.validateAddCateg, adminCont.postAddCateg);


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
