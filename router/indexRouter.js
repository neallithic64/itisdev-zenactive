const express = require('express');
const router = express();
const test = require('../controller/indexTest');
const adminCont = require('../controller/adminController');
const buyerCont = require('../controller/buyerController');



// Testing Routes
router.get('/test', test.getHome);
router.post('/test', test.postDoubles);



// Buyer GET Routes
router.get('/', buyerCont.getHome);
router.get('/search-products', buyerCont.getSearchProducts);
router.get('/view-allproducts', buyerCont.getAllProducts);
router.get('/view-product', buyerCont.getProduct);
router.get('/view-orderStatus', buyerCont.getOrderStatus);



// Buyer POST Routes




// Admin GET Routes
router.get('/login', adminCont.getLogin);
router.get('/register', adminCont.getRegister);
router.get('/admin', adminCont.getAdmin);
router.get('/invProds', adminCont.getInvProds);
router.get('/invCateg', adminCont.getInvCateg);
router.get('/view-buyorder', adminCont.getBuyOrder);
router.get('/view-suppOrder', adminCont.getSuppOrder);
router.get('/buyerOrders', adminCont.getBuyerOrders);
router.get('/supplierOrders', adminCont.getSupplierOrders);


// Admin POST Routes
router.post('/login', adminCont.postLogin);
router.post('/logout', adminCont.postLogout);
router.post('/register', adminCont.postRegister);


// Error Page
router.get('*', function(req, res) {
	res.send('404 error what are you doing');
//	res.render('error', {
//		// idk
//	});
});


module.exports = router;
