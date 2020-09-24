const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname + '/'));

const db = require('./models/db');
db.connect();

app.use(cookieParser());
app.use(session({
	secret: "s3cr3t4nds3cur3",
	name: "sessionId",
	resave: false,
	saveUninitialized: true,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: 60*60*24,
		autoRemove: 'native',
		touchAfter: 60*60
	})
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
			return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		},
		getPURL: function(id) {
			return '/product/' + id;
		},
		getSizeChart: function(categs) {
			return categs.some(e => e.categName === 'Bottoms');
		},
		getPriceTotal: function(cart) {
			return cart.reduce((total, item) => total + item.price * item.qty, 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		},
		getOrdHeadClass: function(ordStatus) {
			switch(ordStatus) {
				case 'CANCELLED': return "order-header-cancelled";
			}
		},
		categToString: function(cats) {
			return cats.map(e => e.categName).join(', ');
		},
		isProofEmpty: function(proofPay) {
			// return proofPay.length > 0 ? 'Yes' : 'No';
			if (proofPay.length > 0) return 'Yes'; 
			else return 'No';
		},
		getSalesStatActs: function(status) {
			switch (status) {
				case 'CONFIRMED': return 'confirmactions';
				case 'PENDING': return 'pendingactions';
				case 'IN TRANSIT': return 'transitactions';
				case 'CANCELLED':
				case 'SHIPPED': return 'disabledactions';
			}
		},
		getPurchStatActs: function(status) {
			switch (status) {
				case 'INCOMPLETE': return 'purchincactions';
				case 'PENDING': return 'purchpendingactions';
				case 'COMPLETE':
				case 'CANCELLED':
				case 'REFUNDED': return 'disabledactions';
			}
		}
	}
}).engine);
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const router = require('./router/indexRouter');
app.use('/', router);

app.listen(PORT, () => console.log(`Listening to localhost on port ${PORT}.`));
