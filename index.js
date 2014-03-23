var utility = require('./lib/utility.js');
var dictionaries = require('./lib/dictionaries.js');

/* Make sure the dictionaries get loaded up front */
console.log('Loading dictionaries...');
dictionaries.load();
console.log('Dictionaries are loaded');




// var findAndMarkupNames = function(html) {
//   var wordsWithOffsets = utility.explodeHtml(html);
//   var lastGenus = null;
//   var currentStateHash = null;
//   wordsWithOffsets = utility.removeTagsFromElements(wordsWithOffsets);
//   for(var i=0 ; i<wordsWithOffsets.length ; i++) {
//     // need to reset the current name here
//     if(wordsWithOffsets[i] === null) {
//       currentStateHash = null;
//       continue;
//     }
// 
//     var word = wordsWithOffsets[i]['word'];
//     // currentStateHash = bigOne(word, currentStateHash);
//   }
// };

// var bigOne = function(word, currentStateHash) {
//   var cleanWord = utility.clean(word);
//   var lowerCaseCleanWord = cleanWord.toLowerCase();
// 
//   // Abbreviation
//   if (/^[A-Z][a-z]?\.$/.test(word)) {
//     return { workingName: cleanWord, workingRank: 'genus' }
//   }
//   
// }

var isNotGenusOrFamily = function(word, cleanWord, lowerCaseCleanWord) {
  if(cleanWord.length <= 2) return true;
  if(!(/^[A-Z][a-z-]+$/.test(cleanWord)) && !(/^[A-Z-]+$/.test(cleanWord))) return true;
  if(dictionaries.hashes['overlap_new'][lowerCaseCleanWord]) return true;
  return false;
}

var isGenus = function(word, cleanWord, lowerCaseCleanWord) {
  if(isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if((dictionaries.hashes['genera'][lowerCaseCleanWord] || dictionaries.hashes['genera_new'][lowerCaseCleanWord]) &&
     !dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if(dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
}

var isFamilyOrAbove = function(word, cleanWord, lowerCaseCleanWord) {
  if(isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if(dictionaries.hashes['family'][lowerCaseCleanWord] || dictionaries.hashes['family_new'][lowerCaseCleanWord] ||
     dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if(dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
}

var isRank = function(word, cleanWord, lowerCaseCleanWord) {
  if(/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if(/[A-Z]/.test(cleanWord)) return null;
  if(dictionaries.hashes['ranks'][lowerCaseCleanWord]) return 1;
  return null;
}

module.exports = {
  dictionaries: dictionaries,
  utility: utility,
  // findAndMarkupNames: findAndMarkupNames,
  isNotGenusOrFamily: isNotGenusOrFamily,
  isGenus: isGenus,
  isFamilyOrAbove: isFamilyOrAbove,
  isRank: isRank
};
