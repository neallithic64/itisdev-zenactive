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

app.set('views', path.join(__dirname, '/views/'));
app.engine('hbs', exphbs.create({
	extname: 'hbs',
	defaultLayout: 'main',
	runtimeOptions: {
		allowProtoPropertiesByDefault: true,
		allowProtoMethodsByDefault: true
	},
	partialsDir: 'views/partials',
	layoutsDir: 'views/layouts',
	helpers: {
		getPrice: function(price) {
			return price.toFixed(2);
		},
		getSizeChart: function(categs) {
			return categs.includes('Bottoms');
		},
		getPriceTotal: function(cart) {
			return cart.reduce(function(total, item) {
				return total + item.price * item.qty;
			}, 0.00).toFixed(2);
		},
		getOrdHeadClass: function(ordStatus) {
			switch(ordStatus) {
				case 'CANCELLED': return "order-header-cancelled";
			}
		},
		categToString: function(cats) {
			return cats.join(', ');
		}
	}
}).engine);
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const db = require('./models/db');
db.connect();

const router = require('./router/indexRouter');
app.use('/', router);

app.listen(PORT, () => console.log(`Listening to localhost on port ${PORT}.`));
