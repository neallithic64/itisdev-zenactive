function genBuyOrdNo() {
	return Number.parseInt((new Date()).toISOString().substr(2, 8).split('-').join('') + Math.round(Math.random()*100000).toString().padStart(5, '0'));
}

const objConstructors = {
	Admin: function (email, password) {
		this.email = email;
		this.password = password;
	},
	
	Product: function (productID, name, price, size, color, hexcode) {
		this.productID = productID;
		this.name = name;
		this.price = price;
		this.size = size;
		this.color = color;
		this.hexcode = hexcode;
	},
	
	CustomerOrder: function (email, totalAmount, modeOfPay, address, city, area, compName, contNum) {
		this.buyOrdNo = genBuyOrdNo();
		this.email = email;
		this.status = 'PENDING';
		this.totalAmount = totalAmount;
		this.timestamp = new Date();
		this.modeOfPay = modeOfPay;
		this.address = address;
		this.city = city;
		this.area = area;
		this.completeName = compName;
		this.contactNumber = contNum.split('-').join('').split(' ').join('');
	},
	
	PaymentProof: function (buyOrdNo, paymentProof, referenceNo, amountPaid) {
		this.buyOrdNo = buyOrdNo;
		this.paymentProof = paymentProof;
		this.referenceNo = referenceNo;
		this.amountPaid = amountPaid;
	}
};

module.exports = objConstructors;
