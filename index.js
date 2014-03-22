
var fs = require("fs");
var dictionaryHash = {};
var dictionariesLoaded = false;
var dictionariesLoading = false;
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
  for(var i=0 ; i<words.length ; i++) {
    currentWord = words[i].toLowerCase();
    if(dictionaryHash[dictionaryName] == undefined) dictionaryHash[dictionaryName] = {};
    dictionaryHash[dictionaryName][currentWord] = true;
  }
};

var loadDictionaries = function() {
  if(dictionariesLoaded) return true;
  if(dictionariesLoading) return false;
  for(var i=0 ; i<dictionariesToLoad.length ; i++) {
    var dictionaryName = dictionariesToLoad[i];
    addToMasterDictionary(fs.readFileSync("dictionaries/" + dictionaryName + ".txt").toString().split('\n'), dictionaryName);
  }
  dictionariesLoaded = true;
  dictionariesLoading = false;
  return true;
}

/* Make sure the dictionaries get loaded up front */
loadDictionaries(function() { console.log('Dictionaries are loaded') });

module.exports = {
  loadDictionaries: loadDictionaries,
  dictionaryHash: dictionaryHash
};
