const express = require('express');
const router = express();
const test = require('../controller/indexTest');

router.get('/', test.getHome);
router.post('/', test.postHome);

module.exports = router;
