const express = require('express');
const router = express();
const test = require('../controller/indexTest');
const controller = require('../controller/indexController');

// Testing Routes
router.get('/test', test.getHome);
router.post('/test', test.postDoubles);



// GET Routes
router.get('/', controller.getHome);
router.get('/login', controller.getLogin);
router.get('/register', controller.getRegister);
router.get('/search-products', controller.getSearchProducts);
router.get('/view-allproducts', controller.getAllProducts);
router.get('/view-product', controller.getProduct);

router.get('/view-orderStatus', controller.getOrderStatus);

router.get('/view-buyorder', controller.getBuyOrder);
router.get('/view-suppOrder', controller.getSuppOrder);
router.get('/buyerOrders', controller.getBuyerOrders);
router.get('/supplierOrders', controller.getSupplierOrders);



// POST Routes
router.post('/login', controller.postLogin);
router.post('/logout', controller.postLogout);
router.post('/register', controller.postRegister);

module.exports = router;
