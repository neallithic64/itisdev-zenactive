const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname + '/'));

app.use(cookieParser());
app.use(session({
	secret: "hi mga ghorls",
	name: "cookie",
	resave: true,
	saveUninitialized: true
}));

app.set('views', path.join(__dirname, 'views/'));
app.engine('hbs', exphbs.create({
	extname: 'hbs',
	defaultLayout: 'main',
	partialsDir: 'views/partials',
	layoutsDir: 'views/layouts',
	helpers: {
		// hello
	}
}).engine);
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const db = require('./model/db');
db.connect();

const router = require('./router/indexRouter');
app.use('/', router);

app.get('*', function(req, res) {
	res.render('error', {
		// idk
	});
});

app.listen(PORT, () => {
	console.log(`Listening to localhost on port ${PORT}.`);
});
