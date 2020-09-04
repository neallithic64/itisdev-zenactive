const express = require('express');
const router = express();
const test = require('../controller/indexTest');
const controller = require('../controller/indexController');

// Testing Routes
router.get('/', test.getHome);
router.get('/test', test.getHomeQuery);

router.get('/login', controller.getLogin);
router.get('/search-products', controller.getSearchProducts);
router.get('/view-allproducts', controller.getAllProducts);
router.get('/view-product', controller.getProduct);

router.get('/view-orderStatus', controller.getOrderStatus);

router.get('/view-buyorder', controller.getBuyOrder);
router.get('/view-suppOrder', controller.getSuppOrder);
router.get('/buyerOrders', controller.getBuyerOrders);
router.get('/supplierOrders', controller.getSupplierOrders);
//router.get('', );

router.post('/', test.postHome);
//router.post('', );

module.exports = router;
