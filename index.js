var utility = require('./lib/utility.js');
var dictionaries = require('./lib/dictionaries.js');
var match = null;

/* Make sure the dictionaries get loaded up front */
console.log('Loading taxonfinder dictionaries...');
dictionaries.load();
console.log('taxonfinder dictionaries are loaded');

var buildResult = function(name, startItem, lastItem, lastWord) {
  var resultHash = { name: name,
                     offsets: [ startItem['offset'], lastItem['offset'] + lastWord.length ] };
  var original = name;
  if (/\[/.test(name)) {
    resultHash['name'] = resultHash['name'].replace('[', '');
    resultHash['name'] = resultHash['name'].replace(']', '');
    resultHash['original'] = original.replace(/\[.*?\]/g, '.');
  }
  return resultHash;
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

    if (currentStateHash['returnNameHashes']) {
      // Determine the start and end indices of the first returned word.
      // This might be a polynomial or uninomial. Check the number of words
      // by splitting on spaces. Add the name and offsets to the results
      if (nameStartIndex === null) nameStartIndex = i;
      var words = currentStateHash['returnNameHashes'][0]['name'].split(' ');
      var lastWord = words.pop();
      nameLastIndex = nameStartIndex + words.length;
      allNamesWithOffsets.push(buildResult(currentStateHash['returnNameHashes'][0]['name'],
                                           wordsWithOffsets[nameStartIndex],
                                           wordsWithOffsets[nameLastIndex],
                                           lastWord));
      // If there are two return names, then the second name will always be
      // a uninomial - a Family or above, or a Genus with stop punctuation
      if (currentStateHash['returnNameHashes'].length == 2) {
        allNamesWithOffsets.push(buildResult(currentStateHash['returnNameHashes'][1]['name'],
                                             wordsWithOffsets[i],
                                             wordsWithOffsets[i],
                                             currentStateHash['returnNameHashes'][1]['name']));
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
  return (/^[A-Z][a-z]?$/.test(workingName)) ? 'g' : false;
};

var isAbbreviatedGenusWithPeriod = function(workingName) {
  return (/^[A-Z][a-z]?\.$/.test(workingName)) ? 'g' : false;
};

var startsWithPunctuation = function(word) {
  return /^[^A-Za-z]*[\(\.\[;,]/.test(word);
};

var endsWithPunctuation = function(word) {
  return /[,;\.\)\]][^A-Za-z]*$/i.test(word);
};

var buildState = function(workingName, workingRank, workingScore, genusHistory, returnNameHashes) {
  var returnHash = {};
  var finalNameHashes = [];
  if(!returnNameHashes) returnNameHashes = [];
  for (var i=0 ; i<returnNameHashes.length ; i++) {
    if (modifiedReturnHash = prepareReturnHash(returnNameHashes[i])) {
      finalNameHashes.push(modifiedReturnHash);
    }
  }
  if (workingName) returnHash['workingName'] = workingName;
  if (workingRank) returnHash['workingRank'] = workingRank;
  if (workingScore) returnHash['workingScore'] = workingScore;
  if (genusHistory) returnHash['genusHistory'] = genusHistory;
  if (finalNameHashes.length > 0) returnHash['returnNameHashes'] = finalNameHashes;
  return returnHash;
};

var checkWordAgainstState = function(word, currentStateHash) {
  if (!word) word = '';
  if (!currentStateHash) currentStateHash = {};
  word = word.trim();
  var cleanWord = utility.clean(word);
  var lowerCaseCleanWord = cleanWord.toLowerCase();
  var capitalizedCleanWord = utility.ucfirst(lowerCaseCleanWord);
  var workingName = currentStateHash['workingName'];
  var workingRank = currentStateHash['workingRank'];
  var workingScore = currentStateHash['workingScore'];
  var genusHistory = currentStateHash['genusHistory'];
  if (!genusHistory) genusHistory = { };
  var score = null;
  var nextWorkingName = workingName + ' ' + cleanWord;
  currentStateHash['word'] = word;
  currentStateHash['cleanWord'] = cleanWord;
  currentStateHash['lowerCaseCleanWord'] = lowerCaseCleanWord;
  if (!workingName) {
    currentStateHash['workingName'] = '';
    workingName = '';
  }
  if (cleanWord == '') {
    return buildState(null, null, null, genusHistory, [ { name: workingName, score: workingScore } ]);
  }

  // Found Abbreviation
  if (score = isAbbreviatedGenusWithPeriod(word)) {
    return buildState(cleanWord, 'genus', score, genusHistory, [ { name: workingName, score: workingScore } ]);
  }
  // Within Genus
  else if (workingRank === 'genus') {
    // with valid species
    if (score = scoreSpecies(currentStateHash)) {
      if (match = workingName.match(/^([A-Z][a-z]?)$/)) {
        var lastGenus = null;
        if (lastGenus = genusHistory[match[1].toLowerCase()]) {
          nextWorkingName = match[1] + "[" + lastGenus.substring(match[1].length) + "] " + cleanWord;
        }
      }
      if (endsWithPunctuation(word)) {
        // that ends the name
        return buildState(null, null, null, genusHistory, [ { name: nextWorkingName, score: workingScore + score } ]);
      }
      // that is the next word in a name
      return buildState(nextWorkingName, 'species', workingScore + score, genusHistory);
    }
    if (score = scoreGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', score, genusHistory, [ { name: workingName, score: workingScore } ]);
    }
    if (score = scoreFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, null, genusHistory, [ { name: workingName, score: workingScore },
                                            { name: capitalizedCleanWord, score: score } ]);
    }
  }
  // Within Species
  else if (workingRank === 'species') {
    if (score = scoreSpecies(currentStateHash)) {
      match = workingScore.match(/s/ig);
      if (match.length >= 2) {
        return buildState(null, null, null, genusHistory, [ { name: nextWorkingName, score: workingScore + score } ]);
      }
      return buildState(nextWorkingName, 'species', workingScore + score, genusHistory);
    }
    if (score = scoreRank(currentStateHash)) {
      // node the use of `word` here to retain original punctuation
      return buildState(workingName + ' ' + word, 'rank', workingScore + score, genusHistory);
    }
    if (score = scoreGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', score, genusHistory, [ { name: workingName, score: workingScore } ]);
    }
    if (score = scoreFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, null, genusHistory, [ { name: workingName, score: workingScore },
                                            { name: capitalizedCleanWord, score: score } ]);
    }
  }
  // Within Rank
  else if (workingRank === 'rank') {
    if (score = scoreSpecies(currentStateHash)) {
      return buildState(nextWorkingName, 'species', workingScore + score, genusHistory);
    }
    if (score = scoreGenus(currentStateHash)) {
      return buildState(cleanWord, 'genus', score, genusHistory, [ { name: workingName, score: workingScore } ]);
    }
    if (score = scoreFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, null, genusHistory, [ { name: workingName, score: workingScore },
                                            { name: capitalizedCleanWord, score: score } ]);
    }
  }
  // No working state
  else {
    if (score = scoreGenus(currentStateHash)) {
      genusHistory[lowerCaseCleanWord.substring(0, 1)] = cleanWord;
      genusHistory[lowerCaseCleanWord.substring(0, 2)] = cleanWord;
      if (endsWithPunctuation(word)) {
        return buildState(null, null, null, genusHistory, [ { name: capitalizedCleanWord, score: score } ]);
      } else {
        return buildState(cleanWord, 'genus', score, genusHistory);
      }
    }
    if (score = scoreFamilyOrAbove(currentStateHash)) {
      return buildState(null, null, null, genusHistory, [ { name: capitalizedCleanWord, score: score } ]);
    }
  }
  // Return the last known name
  return buildState(null, null, null, genusHistory, [ { name: workingName, score: workingScore } ]);
}

var prepareReturnHash = function(returnNameHash) {
  var name = returnNameHash['name'];
  var score = returnNameHash['score'];
  if (!name) return null;
  if (name.length <= 2) return null;
  if (!/[FGS]/.test(score)) return null;

  // AMANITA MUSCARIA
  if (match = name.match(/^([A-Z])([A-Z\[\]-]*)( |$)(.*$)/)) {
    name = match[1] + match[2].toLowerCase() + match[3] + match[4];
  }
  // Amanita (MUSCARIA) MUSCARIA
  if (match = name.match(/^(.+ \()([A-Z])([A-Z\[\]-]*)(\) |\)$)(.*$)/)) {
    name = match[1] + match[2] + match[3].toLowerCase() + match[4] + match[5];
  }
  // Amanita MUSCARIA MUSCARIA
  var nextString = null;
  while(match = name.match(/^(.+ )([A-Z\[\]-]*)( |$)(.*$)/)) {
    nextString = match[1] + match[2].toLowerCase() + match[3] + match[4];
    if (name === nextString) break;
    else name = nextString;
  }
  // Amanita sp.
  if (match = name.match(/^(.*) ([^ .]+)\.?$/))
  {
    var potentialRank = match[2];
    if (dictionaries.hashes['ranks'][potentialRank]) {
      name = match[1];
      score = score.substring(0, score.length - 1);
    }
  }
  if (dictionaries.hashes['dict_bad'][name.toLowerCase()]) return null;

  return { name: name, score: score };
};

var scoreSpecies = function(currentStateHash) {
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
    return 'S';
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

var scoreGenus = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if ((dictionaries.hashes['genera'][lowerCaseCleanWord] || dictionaries.hashes['genera_new'][lowerCaseCleanWord]) &&
     !dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if (dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 'g';
    else return 'G';
  }
  return null;
};

var scoreFamilyOrAbove = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (isNotGenusOrFamily(word, cleanWord, lowerCaseCleanWord)) return null;
  if (dictionaries.hashes['family'][lowerCaseCleanWord] || dictionaries.hashes['family_new'][lowerCaseCleanWord] ||
     dictionaries.hashes['genera_family'][lowerCaseCleanWord]) {
    if (dictionaries.hashes['dict_ambig'][lowerCaseCleanWord] ) return 'f';
    else return 'F';
  }
  return null;
};

var scoreRank = function(currentStateHash) {
  utility.extract(currentStateHash, this);
  if (/^[^A-Za-z]*[\(\.\[;,]/.test(word)) return null;
  if (/[A-Z]/.test(cleanWord)) return null;
  if (dictionaries.hashes['ranks'][lowerCaseCleanWord]) return 'R';
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
  prepareReturnHash: prepareReturnHash,
  checkWordAgainstState: checkWordAgainstState,
  scoreSpecies: scoreSpecies,
  isNotGenusOrFamily: isNotGenusOrFamily,
  scoreGenus: scoreGenus,
  scoreFamilyOrAbove: scoreFamilyOrAbove,
  scoreRank: scoreRank,
  buildState: buildState
};
