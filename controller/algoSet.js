/* Index containing functions for the threshold algorithms
 */

const algoSet = {
	callAlgo: function(algoName) {
		switch(algoName) {
			case 'constantThresh': {
				return constantThresh;
				break;
			}
			/* 
			case 'NAME': {
				return NAME;
				break;
			}
			 */
		}
	},
	
	constantThresh: function() {
		return "hello";
	},
	
	linearRegression: function() {
		
	}
};

module.exports = algoSet;
