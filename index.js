var utility = require('./lib/utility.js');
var dictionaries = require('./lib/dictionaries.js');
var match = null;

/* Make sure the dictionaries get loaded up front */
console.log('Loading dictionaries...');
dictionaries.load();
console.log('Dictionaries are loaded');

var buildResult = function(name, startItem, lastItem, lastWord) {
  return { name: name,
           initialOffset: startItem['offset'],
           endingOffset: lastItem['offset'] + lastWord.length };
};

var findNamesAndOffsets = function(html) {
  var wordsWithOffsets = utility.explodeHtml(html),
      currentStateHash = null,
      nameStartIndex = null,
      nameStartItem = null,
      nameLastIndex = null,
      nameLastItem = null,
      allNamesWithOffsets = [];
  wordsWithOffsets = utility.removeTagsFromElements(wordsWithOffsets);
  for (var i=0 ; i<wordsWithOffsets.length ; i++) {
    var word = wordsWithOffsets[i]['word'];
    currentStateHash = checkWordAgainstState(word, currentStateHash);

    if (currentStateHash['returnNames']) {
      // Determine the start and end indices of the first returned word.
      // This might be a polynomial or uninomial. Check the number of words
      // by splitting on spaces. Add the name and offsets to the results
      if (nameStartIndex === null) nameStartIndex = i;
      var words = currentStateHash['returnNames'][0].split(' ');
      var lastWord = words.pop();
      nameLastIndex = nameStartIndex + words.length;
      allNamesWithOffsets.push(buildResult(currentStateHash['returnNames'][0],
                                           wordsWithOffsets[nameStartIndex],
                                           wordsWithOffsets[nameLastIndex],
                                           lastWord));
      // If there are two return names, then the second name will always be
      // a uninomial - a Family or above, or a Genus with stop punctuation
      if (currentStateHash['returnNames'].length == 2) {
        allNamesWithOffsets.push(buildResult(currentStateHash['returnNames'][1],
                                             wordsWithOffsets[i],
                                             wordsWithOffsets[i],
                                             currentStateHash['returnNames'][1]));
      }
      nameStartIndex = null;
    }

    if (currentStateHash['workingName']) {
      // There is a workingName, but the index hasn't been set yet, so set it
      if (nameStartIndex === null) nameStartIndex = i;
    } else {
      // There is no workingName, so reset the start index
      nameStartIndex = null;
    }
  }
  return allNamesWithOffsets;
};

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

var buildState = function(workingName, workingRank, returnNames) {
  var returnHash = {}
  var finalNames = []
  if(!returnNames) returnNames = [];
  for (var i=0 ; i<returnNames.length ; i++) {
    var cleanedName = prepareReturnString(returnNames[i]);
    if (cleanedName) finalNames.push(cleanedName);
  }
  if (workingName) returnHash['workingName'] = workingName;
  if (workingRank) returnHash['workingRank'] = workingRank;
  if (finalNames.length > 0) returnHash['returnNames'] = finalNames;
  return returnHash;
};

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
  if (cleanWord == '') {
    return buildState(null, null, [ workingName ]);
  }

  // Found Abbreviation
  if (isAbbreviatedGenusWithPeriod(word)) {
    return buildState(cleanWord, 'genus', [ workingName ]);
  }
  // Within Genus
  else if (workingRank === 'genus') {
    // with valid species
    if (isSpecies(currentStateHash)) {
      if (endsWithPunctuation(word)) {
        // that ends the name
        return buildState(null, null, [ workingName + ' ' + cleanWord ]);
      } else {
        // that is the next word in a name
        return buildState(workingName + ' ' + cleanWord, 'species');
      }
    }
    if (isGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', [ workingName ]);
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, [ workingName, utility.ucfirst(lowerCaseCleanWord) ]);
    }
  }
  // Within Species
  else if (workingRank === 'species') {
    if (isSpecies(currentStateHash)) {
      return buildState(workingName + ' ' + cleanWord, 'species');
    }
    if (isRank(currentStateHash)) {
      // node the use of `word` here to retain original punctuation
      return buildState(workingName + ' ' + word, 'rank');
    }
    if (isGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', [ workingName ]);
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, [ workingName, utility.ucfirst(lowerCaseCleanWord) ]);
    }
  }
  // Within Rank
  else if (workingRank === 'rank') {
    if (isSpecies(currentStateHash)) {
      return buildState(workingName + ' ' + cleanWord, 'species');
    }
    if (isGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', [ workingName ]);
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, [ workingName, utility.ucfirst(lowerCaseCleanWord) ]);
    }
  }
  // No working state
  else {
    if (isGenus(currentStateHash)) {
      if (endsWithPunctuation(word)) {
        return buildState(null, null, [ utility.ucfirst(lowerCaseCleanWord) ]);
      } else {
        return buildState(cleanWord, 'genus');
      }
    }
    if (isFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, [ utility.ucfirst(lowerCaseCleanWord) ]);
    }
  }
  // Return the last known name
  return buildState(null, null, [ workingName ]);
}

var prepareReturnString = function(workingName) {
  if (!workingName) return null;
  if (workingName.length <= 2) return null;

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
  findNamesAndOffsets: findNamesAndOffsets,
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
