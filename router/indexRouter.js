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

router.get('/aaaaa', (req, res) => res.render('product', {title: 'testing AAAAA'}));



// Buyer GET Routes
router.get('/', buyerCont.getHome);
router.get('/getCart', buyerMiddle.validateCartExist, buyerCont.getCartObj);
router.get('/bag', buyerMiddle.validateCartExist, buyerCont.getBag);
router.get('/search-products', buyerCont.getSearchProducts);
router.get('/category/:category', buyerCont.getCategoryProds);
router.get('/product/:prodID', buyerCont.getProduct);
router.get('/view-allproducts', buyerCont.getAllProducts);
router.get('/view-orderStatus', buyerCont.getOrderStatus);


// Buyer POST Routes
router.post('/addToCart', buyerCont.postAddCart);
router.post('/removeFromCart', buyerCont.postRemCart);



// Admin GET Routes
router.get('/login', adminCont.getLogin);
router.get('/register', adminCont.getRegister);
router.get('/admin', adminCont.getAdmin);
router.get('/invProds', adminCont.getInvProds);
router.get('/invCateg', adminCont.getInvCateg);
router.get('/view-buyorder', adminCont.getSalesOrder);
router.get('/view-suppOrder', adminCont.getPurchaseOrder);
router.get('/salesOrders', adminCont.getSalesOrders);
router.get('/purchaseOrders', adminCont.getPurchaseOrders);

router.get('/addProduct', adminCont.getAddProduct);
router.get('/addCategory', adminCont.getAddCategory);
router.get('/editProduct', adminCont.getEditProduct);



// Admin POST Routes
router.post('/login', adminCont.postLogin);
router.post('/logout', adminCont.postLogout);
router.post('/register', adminCont.postRegister);
router.post('/addProduct', adminCont.postAddProduct);
router.post('/addCategory', adminCont.postAddCateg);


// Error Page
router.get('*', function(req, res) {
	res.send('404 error what are you doing');
//	res.render('error', {
//		// idk
//	});
});


module.exports = router;
