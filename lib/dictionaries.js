var fs = require('fs');
var path = require('path');
var hashes = {};
var dictionariesLoaded = false;
var dictionariesToLoad = [
  'family',
  'family_new',
  'genera',
  'genera_new',
  'species',
  'species_new',
  'species_bad',
  'ranks',
  'overlap_new',
  'species_bad',
  'dict_ambig',
  'genera_family',
  'dict_bad'
];

var addToMasterDictionary = function(words, dictionaryName) {
  var currentWord = null;
  for (var i=0 ; i<words.length ; i++) {
    currentWord = words[i].toLowerCase();
    if (hashes[dictionaryName] === undefined) hashes[dictionaryName] = {};
    hashes[dictionaryName][currentWord] = true;
  }
};

var load = function() {
  if (dictionariesLoaded) return true;
  for (var i=0 ; i<dictionariesToLoad.length ; i++) {
    var dictionaryName = dictionariesToLoad[i];
    addToMasterDictionary(fs.readFileSync(path.resolve('./lib/dictionaries/' + dictionaryName + '.txt')).
      toString().split('\n'), dictionaryName);
  }
  dictionariesLoaded = true;
  return true;
}

module.exports = {
  load: load,
  hashes: hashes
};
