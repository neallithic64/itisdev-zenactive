/* Index containing functions for the threshold algorithms
 */

const algoSet = {
	getAlgos: function() {
		return [{id: 1, name: 'constantThresh', desc: 'Use a constant duration of time.'}];
	},
	
	callAlgo: function(algoID) {
		switch(algoID) {
			case 1: return constantThresh;
		}
	},
	
	constantThresh: function() {
		return 14;
	},
	
	linearRegression: function() {
		return '';
	}
};

module.exports = algoSet;
