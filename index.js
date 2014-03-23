var utility = require('./lib/utility.js');
var dictionaries = require('./lib/dictionaries.js');
var match = null;

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
//     var word = wordsWithOffsets[i]['word'];
//     currentStateHash = checkWordAgainstState(word, currentStateHash);
//   }
// };

var checkWordAgainstState = function(word, currentStateHash) {
  if(!word) word = '';
  if(!currentStateHash) currentStateHash = {};
  word = word.trim();
  var cleanWord = utility.clean(word);
  var lowerCaseCleanWord = cleanWord.toLowerCase();
  var workingName = currentStateHash['workingName'];
  var workingRank = currentStateHash['workingRank'];
  if(!workingName) workingName = '';

  // Abbreviation
  if (/^[A-Z][a-z]?\.$/.test(word)) {
    return { workingName: cleanWord, workingRank: 'genus' };
  }
  // Genus
  if(isGenus(word, cleanWord, lowerCaseCleanWord)) {
    if(/[,;\.\)\]][^A-Za-z]*$/i.test(word)) {
      return { returnNames: [ utility.ucfirst(lowerCaseCleanWord) ] };
    } else {
      return { workingName: cleanWord, workingRank: 'genus' };
    }
  }
  // Family or above
  if(isFamilyOrAbove(word, cleanWord, lowerCaseCleanWord)) {
    return { returnNames: [ utility.ucfirst(lowerCaseCleanWord) ] };
  }
  // Return the last known name
  if(workingName) {
    return { returnNames: [ workingName ] };
  }
  return null;
}

var prepareReturnString = function(currentString) {
  if(currentString.length <= 2) currentString = "";
  if(!currentString) return null;

  // AMANITA MUSCARIA
  if(match = currentString.match(/^([A-Z])([A-Z\[\]-]*)( |$)(.*$)/)) {
    currentString = match[1] + match[2].toLowerCase() + match[3] + match[4];
  }
  // Amanita (MUSCARIA) MUSCARIA
  if(match = currentString.match(/^(.+ \()([A-Z])([A-Z\[\]-]*)(\) |\)$)(.*$)/)) {
    currentString = match[1] + match[2] + match[3].toLowerCase() + match[4] + match[5];
  }
  // Amanita MUSCARIA MUSCARIA
  var nextString = null;
  while(match = currentString.match(/^(.+ )([A-Z\[\]-]*)( |$)(.*$)/)) {
    nextString = match[1] + match[2].toLowerCase() + match[3] + match[4];
    if(currentString == nextString) break;
    else currentString = nextString;
  }
  // Amanita sp.
  if(match = currentString.match(/^(.*) ([^ ]+)$/))
  {
    var potentialRank = match[2];
    if(dictionaries.hashes['ranks'][potentialRank]) {
      currentString = match[1];
    }
  }
  return currentString;
};

var isSpecies = function(word, cleanWord, lowerCaseCleanWord, currentString) {
  // (amanita)
  if(/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if(dictionaries.hashes['species_bad'][lowerCaseCleanWord]) return null;
  if(/[0-9]/.test(cleanWord)) return null;
  if(currentString.length > 2 && /^[A-Z-\(\)]+$/.test(currentString)) {
    // AMANITA muscaria
    if(/[a-z]/.test(cleanWord)) return null;
  } else {
    // Amanita MUSCARIA
    if(/[A-Z]/.test(cleanWord)) return null;
  }
  if(dictionaries.hashes['species'][lowerCaseCleanWord] || dictionaries.hashes['species_new'][lowerCaseCleanWord]) {
    return 1;
  }
  return null;
};

var isNotGenusOrFamily = function(word, cleanWord, lowerCaseCleanWord) {
  if(cleanWord.length <= 2) return true;
  if(!(/^[A-Z][a-z-]+$/.test(cleanWord)) && !(/^[A-Z-]+$/.test(cleanWord))) return true;
  if(dictionaries.hashes['overlap_new'][lowerCaseCleanWord]) return true;
  return false;
};

var isGenus = function(word, cleanWord, lowerCaseCleanWord) {
  if(isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if((dictionaries.hashes['genera'][lowerCaseCleanWord] || dictionaries.hashes['genera_new'][lowerCaseCleanWord]) &&
     !dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if(dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
};

var isFamilyOrAbove = function(word, cleanWord, lowerCaseCleanWord) {
  if(isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if(dictionaries.hashes['family'][lowerCaseCleanWord] || dictionaries.hashes['family_new'][lowerCaseCleanWord] ||
     dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if(dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
};

var isRank = function(word, cleanWord, lowerCaseCleanWord) {
  if(/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if(/[A-Z]/.test(cleanWord)) return null;
  if(dictionaries.hashes['ranks'][lowerCaseCleanWord]) return 1;
  return null;
};

module.exports = {
  dictionaries: dictionaries,
  utility: utility,
  // findAndMarkupNames: findAndMarkupNames,
  prepareReturnString: prepareReturnString,
  checkWordAgainstState: checkWordAgainstState,
  isSpecies: isSpecies,
  isNotGenusOrFamily: isNotGenusOrFamily,
  isGenus: isGenus,
  isFamilyOrAbove: isFamilyOrAbove,
  isRank: isRank
};
