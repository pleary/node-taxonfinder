var utility = require('./lib/utility.js');
var dictionaries = require('./lib/dictionaries.js');
var match = null;

/* Make sure the dictionaries get loaded up front */
console.log('Loading dictionaries...');
dictionaries.load();
console.log('Dictionaries are loaded');

var isAbbreviatedGenus = function(workingName) {
  return /^[A-Z][a-z]?$/.test(workingName);
};

var isAbbreviatedGenusWithPeriod = function(workingName) {
  return /^[A-Z][a-z]?\.$/.test(workingName);
};

var startsWithPunctuation = function(word) {
  return /^[^A-Za-z]*[\(\.\[;,]/.test(word);
};

var endsWithPunctuation = function(word) {
  return /[,;\.\)\]][^A-Za-z]*$/i.test(word);
};

// var findAndMarkupNames = function(html) {
//   var wordsWithOffsets = utility.explodeHtml(html);
//   var lastGenus = null;
//   var currentStateHash = null;
//   wordsWithOffsets = utility.removeTagsFromElements(wordsWithOffsets);
//   for (var i=0 ; i<wordsWithOffsets.length ; i++) {
//     var word = wordsWithOffsets[i]['word'];
//     currentStateHash = checkWordAgainstState(word, currentStateHash);
//   }
// };

var checkWordAgainstState = function(word, currentStateHash) {
  if (!word) word = '';
  if (!currentStateHash) currentStateHash = {};
  word = word.trim();
  var cleanWord = utility.clean(word);
  var lowerCaseCleanWord = cleanWord.toLowerCase();
  var workingName = currentStateHash['workingName'];
  var workingRank = currentStateHash['workingRank'];
  currentStateHash['word'] = word;
  currentStateHash['cleanWord'] = cleanWord;
  currentStateHash['lowerCaseCleanWord'] = lowerCaseCleanWord;
  if (!workingName) {
    currentStateHash['workingName'] = '';
    workingName = '';
  }

  // Found Abbreviation
  if (isAbbreviatedGenusWithPeriod(word)) {
    returnHash = { workingName: cleanWord, workingRank: 'genus' };
    if (workingName !== '') returnHash['returnNames'] = [ workingName ];
    return returnHash;
  }
  // Within Genus
  else if (workingRank === 'genus') {
    // with valid species
    if (isSpecies(currentStateHash)) {
      if (endsWithPunctuation(word)) {
        // that ends the name
        return { returnNames: [ workingName + ' ' + cleanWord ] };
      } else {
        // that is the next word in a name
        return { workingName: workingName + ' ' + cleanWord, workingRank: 'species' };
      }
    }
  }
  // Within Species
  else if (workingRank === 'species') {
    if (isSpecies(currentStateHash)) {
      return { workingName: workingName + ' ' + cleanWord, workingRank: 'species' };
    }
    if (isRank(currentStateHash)) {
      // node the use of `word` here to retain original punctuation
      return { workingName: workingName + ' ' + word, workingRank: 'rank' };
    }
    if (isGenus(currentStateHash)) {
      return { workingName: cleanWord, workingRank: 'genus', returnNames: [ workingName ] };
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return { returnNames: [ workingName, utility.ucfirst(lowerCaseCleanWord) ] };
    }
  }
  // Within Rank
  else if (workingRank === 'rank') {
    if (isSpecies(currentStateHash)) {
      return { workingName: workingName + ' ' + cleanWord, workingRank: 'species' };
    }
    if (isGenus(currentStateHash)) {
      return { workingName: cleanWord, workingRank: 'genus', returnNames: [ workingName ] };
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return { returnNames: [ workingName, utility.ucfirst(lowerCaseCleanWord) ] };
    }
  }
  // No working state
  else {
    if (isGenus(currentStateHash)) {
      if (endsWithPunctuation(word)) {
        return { returnNames: [ utility.ucfirst(lowerCaseCleanWord) ] };
      } else {
        return { workingName: cleanWord, workingRank: 'genus' };
      }
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return { returnNames: [ utility.ucfirst(lowerCaseCleanWord) ] };
    }
  }
  // Return the last known name
  if (workingName) {
    return { returnNames: [ workingName ] };
  }
  return null;
}

var prepareReturnString = function(workingName) {
  if (workingName.length <= 2) workingName = "";
  if (!workingName) return null;

  // AMANITA MUSCARIA
  if (match = workingName.match(/^([A-Z])([A-Z\[\]-]*)( |$)(.*$)/)) {
    workingName = match[1] + match[2].toLowerCase() + match[3] + match[4];
  }
  // Amanita (MUSCARIA) MUSCARIA
  if (match = workingName.match(/^(.+ \()([A-Z])([A-Z\[\]-]*)(\) |\)$)(.*$)/)) {
    workingName = match[1] + match[2] + match[3].toLowerCase() + match[4] + match[5];
  }
  // Amanita MUSCARIA MUSCARIA
  var nextString = null;
  while(match = workingName.match(/^(.+ )([A-Z\[\]-]*)( |$)(.*$)/)) {
    nextString = match[1] + match[2].toLowerCase() + match[3] + match[4];
    if (workingName === nextString) break;
    else workingName = nextString;
  }
  // Amanita sp.
  if (match = workingName.match(/^(.*) ([^ ]+)$/))
  {
    var potentialRank = match[2];
    if (dictionaries.hashes['ranks'][potentialRank]) {
      workingName = match[1];
    }
  }
  return workingName;
};

var isSpecies = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  // (amanita)
  if (/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if (dictionaries.hashes['species_bad'][lowerCaseCleanWord]) return null;
  if (/[0-9]/.test(cleanWord)) return null;
  if (workingName.length > 2 && /^[A-Z-\(\)]+$/.test(workingName)) {
    // AMANITA muscaria
    if (/[a-z]/.test(cleanWord)) return null;
  } else {
    // Amanita MUSCARIA
    if (/[A-Z]/.test(cleanWord)) return null;
  }
  if (dictionaries.hashes['species'][lowerCaseCleanWord] || dictionaries.hashes['species_new'][lowerCaseCleanWord]) {
    return 1;
  }
  return null;
};

var isNotGenusOrFamily = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (cleanWord.length <= 2) return true;
  if (!(/^[A-Z][a-z-]+$/.test(cleanWord)) && !(/^[A-Z-]+$/.test(cleanWord))) return true;
  if (dictionaries.hashes['overlap_new'][lowerCaseCleanWord]) return true;
  return false;
};

var isGenus = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if ((dictionaries.hashes['genera'][lowerCaseCleanWord] || dictionaries.hashes['genera_new'][lowerCaseCleanWord]) &&
     !dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if (dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
};

var isFamilyOrAbove = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if (dictionaries.hashes['family'][lowerCaseCleanWord] || dictionaries.hashes['family_new'][lowerCaseCleanWord] ||
     dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if (dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 0.5;
    else return 1;
  }
  return null;
};

var isRank = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if (/[A-Z]/.test(cleanWord)) return null;
  if (dictionaries.hashes['ranks'][lowerCaseCleanWord]) return 1;
  return null;
};

module.exports = {
  dictionaries: dictionaries,
  utility: utility,
  // findAndMarkupNames: findAndMarkupNames,
  isAbbreviatedGenus: isAbbreviatedGenus,
  isAbbreviatedGenusWithPeriod: isAbbreviatedGenusWithPeriod,
  startsWithPunctuation: startsWithPunctuation,
  endsWithPunctuation: endsWithPunctuation,
  prepareReturnString: prepareReturnString,
  checkWordAgainstState: checkWordAgainstState,
  isSpecies: isSpecies,
  isNotGenusOrFamily: isNotGenusOrFamily,
  isGenus: isGenus,
  isFamilyOrAbove: isFamilyOrAbove,
  isRank: isRank
};
