var dictionaries = require('./lib/dictionaries.js');
var parser = require('./lib/parser.js');

/* Make sure the dictionaries get loaded up front */
console.log('Loading taxonfinder dictionaries...');
dictionaries.load();
console.log('taxonfinder dictionaries are loaded');

var findNamesAndOffsets = function(html) {
  return parser.findNamesAndOffsets(html);
};

module.exports = {
  findNamesAndOffsets: findNamesAndOffsets
};
