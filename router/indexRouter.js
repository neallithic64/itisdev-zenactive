const express = require('express');
const router = express();

router.get('/', function(req, res) {
	res.send("hello worldo i am matto");
});


module.exports = router;
