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
		getArrIndex: function(arr, index) {
			return arr[index];
		},
		getFirstPhoto: function(photos) {
			return photos.length > 0 ? photos[0].photoLink : 'https://safetyaustraliagroup.com.au/wp-content/uploads/2019/05/image-not-found.png';
		},
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
		getOrdAccess: function(cart, index, attr) {
			switch (attr) {
				case 0: return cart[index].size;
				case 1: return cart[index].qty;
				case 2: return cart[index].price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
				case 3: return (cart[index].qty * cart[index].price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
		},
		getSalesStyle: function(status) {
			switch (status) {
				case 'CONFIRMED': return '#b3ffb2';
				case 'PENDING': return '';
				case 'IN TRANSIT': return '#fffbd4';
				case 'CANCELLED': return '#ffa7a7';
				case 'SHIPPED': return '#ffd6a6';
			}
		},
		getPurchStyle: function(status) {
			switch (status) {
				case 'INCOMPLETE': return '#fffbd4';
				case 'PENDING': return '';
				case 'COMPLETE': return '#b3ffb2';
				case 'CANCELLED': return '#ffa7a7';
				case 'REFUNDED': return '#ffd1ed';
			}
		},
		getDateNow: function() {
			return new Date();
		},
		getFracRate: function(val, total) {
			return val&&total ? Math.round(val/total * 100) / 100 + '%' : '0%';
		}
	}
}).engine);
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const router = require('./router/indexRouter');
app.use('/', router);

app.listen(PORT, () => console.log(`Listening to localhost on port ${PORT}.`));
