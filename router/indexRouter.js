const express = require('express');
const router = express();
const test = require('../controller/indexTest');
const controller = require('../controller/indexController');


router.get('/', test.getHome);
router.get('/test', test.getHomeQuery);
router.get('/login', controller.getLogin);


router.post('/', test.postHome);

module.exports = router;
