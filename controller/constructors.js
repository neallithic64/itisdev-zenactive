const objConstructors = {
	Admin: function (email, password) {
		this.email = email;
		this.password = password;
	},
	
	Product: function (productID, name, price, size, color) {
		this.productID = productID;
		this.name = name;
		this.price = price;
		this.size = size;
		this.color = color;
	},
	
	PaymentProof: function (buyOrdNo, paymentProof, referenceNo, amountPaid) {
		this.buyOrdNo = buyOrdNo;
		this.paymentProof = paymentProof;
		this.referenceNo = referenceNo;
		this.amountPaid = amountPaid;
	}
};

module.exports = objConstructors;
