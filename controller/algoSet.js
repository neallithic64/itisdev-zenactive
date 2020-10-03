/* Index containing functions for the threshold algorithms
 */

const algoSet = {
	getAlgos: function() {
		return ['constantThresh'];
	},
	
	constantThresh: function(val) {
		return val;
	},
	
	linearRegression: function() {
		return '';
	}
};

module.exports = algoSet;
