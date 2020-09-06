const objConstructors = {
	Product: function (productID, name, price, size, color) {
		this.productID = productID;
		this.name = name;
		this.price = price;
		this.size = size;
		this.color = color;
	},
	
	PaymentProof: function (buyOrdNo, paymentProof, referenceNo) {
		this.buyOrdNo = buyOrdNo;
		this.paymentProof = paymentProof;
		this.referenceNo = referenceNo;
	}
};

module.exports = objConstructors;
