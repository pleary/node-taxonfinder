var expect = require('chai').expect,
    fs = require('fs'),
    taxonfinder = require('../index'),
    findNamesAndOffsets = taxonfinder.findNamesAndOffsets,
    isAbbreviatedGenus = taxonfinder.isAbbreviatedGenus,
    isAbbreviatedGenusWithPeriod = taxonfinder.isAbbreviatedGenusWithPeriod,
    startsWithPunctuation = taxonfinder.startsWithPunctuation,
    endsWithPunctuation = taxonfinder.endsWithPunctuation,
    checkWordAgainstState = taxonfinder.checkWordAgainstState,
    prepareReturnString = taxonfinder.prepareReturnString,
    isSpecies = taxonfinder.isSpecies,
    isNotGenusOrFamily = taxonfinder.isNotGenusOrFamily,
    isGenus = taxonfinder.isGenus,
    isFamilyOrAbove = taxonfinder.isFamilyOrAbove,
    isRank = taxonfinder.isRank;

var buildState = function(word, cleanWord, lowerCaseCleanWord, workingName) {
  return { word: word, cleanWord: cleanWord, lowerCaseCleanWord: lowerCaseCleanWord,
    workingName: workingName };
};

describe('#findNamesAndOffsets', function() {
  it('finds and returns names and offsets', function() {
    var result = findNamesAndOffsets("The quick brown Animalia Vulpes vulpes (Canidae; Carnivora; Animalia) jumped over the lazy Canis lupis familiaris");
    expect(result[0]['name']).to.eq('Animalia');
    expect(result[0]['initialOffset']).to.eq(16);
    expect(result[0]['endingOffset']).to.eq(24);
    expect(result[1]['name']).to.eq('Vulpes vulpes');
    expect(result[1]['initialOffset']).to.eq(25);
    expect(result[1]['endingOffset']).to.eq(38);
    expect(result[2]['name']).to.eq('Canidae');
    expect(result[2]['initialOffset']).to.eq(39);
    expect(result[2]['endingOffset']).to.eq(46);
  });
});

describe('#isAbbreviatedGenus', function() {
  it('recognizes abreviations without periods', function() {
    expect(isAbbreviatedGenus("G")).to.be.true;
    expect(isAbbreviatedGenus("Gr")).to.be.true;
  });
  it('recognizes non-abbreviations', function() {
    expect(isAbbreviatedGenus("Gr.")).to.be.false;
    expect(isAbbreviatedGenus("Gro")).to.be.false;
  });
});

describe('#isAbbreviatedGenusWithPeriod', function() {
  it('recognizes abreviations with periods', function() {
    expect(isAbbreviatedGenusWithPeriod("G.")).to.be.true;
    expect(isAbbreviatedGenusWithPeriod("Gr.")).to.be.true;
  });
  it('recognizes non-abbreviations', function() {
    expect(isAbbreviatedGenusWithPeriod("Gr")).to.be.false;
    expect(isAbbreviatedGenusWithPeriod("Gro")).to.be.false;
  });
});

describe('#startsWithPunctuation', function() {
  it('recognizes strings starting with punctuation', function() {
    expect(startsWithPunctuation(".(Felis")).to.be.true;
    expect(startsWithPunctuation(";Felis")).to.be.true;
  });
  it('recognizes strings not starting with punctuation', function() {
    expect(startsWithPunctuation("Felis")).to.be.false;
    expect(startsWithPunctuation("Felis;")).to.be.false;
  });
});

describe('#endsWithPunctuation', function() {
  it('recognizes strings ending with punctuation', function() {
    expect(endsWithPunctuation("Felis)")).to.be.true;
    expect(endsWithPunctuation("Felis;")).to.be.true;
  });
  it('recognizes strings not ending with punctuation', function() {
    expect(endsWithPunctuation("Felis")).to.be.false;
    expect(endsWithPunctuation(";Felis")).to.be.false;
  });
});

describe('#checkWordAgainstState', function() {
  it('does nothing with null', function() {
    expect(checkWordAgainstState()).to.be.empty;
  });
  it('returns working name when finding potential abbreviations', function() {
    var response = checkWordAgainstState('F.', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.eq('F');
    expect(response['workingRank']).to.eq('genus');
    expect(response['returnNames'][0]).to.eq('Felis');
  });
  it('recognizes potential abbreviated genera', function() {
    var response = checkWordAgainstState('F.');
    expect(response['workingName']).to.eq('F');
    expect(response['workingRank']).to.eq('genus');
  });
  it('recognizes genera', function() {
    var response = checkWordAgainstState('Felis');
    expect(response['workingName']).to.eq('Felis');
    expect(response['workingRank']).to.eq('genus');
  });
  it('recognizes genera with full stops', function() {
    var response = checkWordAgainstState('Felis;');
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis');
  });
  it('recognizes families and above', function() {
    var response = checkWordAgainstState('Animalia');
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Animalia');
  });
  it('does nothing with nonsense', function() {
    expect(checkWordAgainstState('nonsense')).to.be.empty;
  });
  it('returns the last known name when encountering nonsense', function() {
    var response = checkWordAgainstState('nonsense', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis');
  });
  // State Genus
  it('returns the species name if there is terminating punctuation', function() {
    var response = checkWordAgainstState('leo;', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis leo');
  });
  it('attaches species to genera', function() {
    var response = checkWordAgainstState('leo', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.eq('Felis leo');
    expect(response['workingRank']).to.eq('species');
  });
  it('finds genera after genera', function() {
    var response = checkWordAgainstState('Felis', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.eq('Felis');
    expect(response['workingRank']).to.eq('genus');
    expect(response['returnNames'][0]).to.eq('Felis');
  });
  it('finds families or above after genera', function() {
    var response = checkWordAgainstState('Animalia', { workingName: 'Felis', workingRank: 'genus' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis');
    expect(response['returnNames'][1]).to.eq('Animalia');
  });
  // State Species
  it('attaches species to species', function() {
    var response = checkWordAgainstState('leo', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.eq('Felis leo leo');
    expect(response['workingRank']).to.eq('species');
  });
  it('attaches ranks to species', function() {
    var response = checkWordAgainstState('var', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.eq('Felis leo var');
    expect(response['workingRank']).to.eq('rank');
  });
  it('attaches ranks to species and keeps punctuation', function() {
    var response = checkWordAgainstState('var.', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.eq('Felis leo var.');
    expect(response['workingRank']).to.eq('rank');
  });
  it('starts a new name when in species and found genus', function() {
    var response = checkWordAgainstState('Amanita', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.eq('Amanita');
    expect(response['workingRank']).to.eq('genus');
    expect(response['returnNames'][0]).to.eq('Felis leo');
  });
  it('returns two names when in species and found family or above', function() {
    var response = checkWordAgainstState('Animalia', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis leo');
    expect(response['returnNames'][1]).to.eq('Animalia');
  });
  it('returns species when in species and the next word is nonsense', function() {
    var response = checkWordAgainstState('asdfasdf', { workingName: 'Felis leo', workingRank: 'species' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis leo');
  });
  // State Rank
  it('attaches species to ranks', function() {
    var response = checkWordAgainstState('leo', { workingName: 'Felis leo var.', workingRank: 'rank' });
    expect(response['workingName']).to.eq('Felis leo var. leo');
    expect(response['workingRank']).to.eq('species');
  });
  it('starts a new name when in rank and found genus', function() {
    var response = checkWordAgainstState('Amanita', { workingName: 'Felis leo var.', workingRank: 'rank' });
    expect(response['workingName']).to.eq('Amanita');
    expect(response['workingRank']).to.eq('genus');
    expect(response['returnNames'][0]).to.eq('Felis leo var.');
  });
  it('returns two names when in rank and found family or above', function() {
    var response = checkWordAgainstState('Animalia', { workingName: 'Felis leo var.', workingRank: 'rank' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis leo var.');
    expect(response['returnNames'][1]).to.eq('Animalia');
  });
  it('returns name when in rank and the next word is nonsense', function() {
    var response = checkWordAgainstState('asdfasdf', { workingName: 'Felis leo var.', workingRank: 'rank' });
    expect(response['workingName']).to.be.undefined;
    expect(response['returnNames'][0]).to.eq('Felis leo var.');
  });
});

describe('#prepareReturnString', function() {
  it('fails on short strings', function() {
    expect(prepareReturnString('Aa')).to.be.null;
  });
  it('fails on empty strings', function() {
    expect(prepareReturnString('')).to.be.null;
  });
  it('chops off trailing ranks', function() {
    expect(prepareReturnString('Amanita sp')).to.eq('Amanita');
  });
  it('fixes capitalization', function() {
    expect(prepareReturnString('AMANITA MUSCARIA')).to.eq('Amanita muscaria');
    expect(prepareReturnString('AMANITA (AMANITA) MUSCARIA')).to.eq('Amanita (Amanita) muscaria');
    expect(prepareReturnString('AMANITA (AMANITA) MUSCARIA MUSCARIA')).
      to.eq('Amanita (Amanita) muscaria muscaria');
    expect(prepareReturnString('AMANITA (AMANITA) MUSCARIA MUSCARIA MUSCARIA')).
      to.eq('Amanita (Amanita) muscaria muscaria muscaria');
  });
  it('avoids infinite loops', function() {
    // I don't have a real example of this bug, but there are ways
    // to get stuck in a loop and this is a way to check for it.
    // (in index.js => if(currentString === nextString) ...)
    expect(prepareReturnString('Amanita [] muscaria')).to.eq('Amanita [] muscaria');
  });
  it('leaves everything else alone', function() {
    expect(prepareReturnString('Amanita')).to.eq('Amanita');
    expect(prepareReturnString('Amanita muscaria')).to.eq('Amanita muscaria');
  });
});

describe('#isSpecies', function() {
  it('fails on special characters', function() {
    expect(isSpecies(buildState('(musculus', 'musculus', 'musculus', 'Mus'))).to.be.null;
  });
  it('fails on strings in the species_bad dictionary', function() {
    expect(isSpecies(buildState('phobia', 'phobia', 'phobia', 'Mus'))).to.be.null;
  });
  it('fails on strings with numbers in them', function() {
    expect(isSpecies(buildState('phob1a', 'phob1a', 'phob1a', 'Mus'))).to.be.null;
  });
  it('fails on lowercase strings when genera are capitalized', function() {
    expect(isSpecies(buildState('musculus', 'musculus', 'musculus', 'MUS'))).to.be.null;
  });
  it('fails on capitalizes strings when genera are lower case', function() {
    expect(isSpecies(buildState('MUSCULUS', 'MUSCULUS', 'musculus', 'Mus'))).to.be.null;
  });
  it('fails on non-species strings', function() {
    expect(isSpecies(buildState('nonsense', 'nonsense', 'nonsense', 'Mus'))).to.be.null;
  });
  it('returns 1 for valid species', function() {
    expect(isSpecies(buildState('musculus', 'musculus', 'musculus', 'Mus'))).to.eq(1);
  });
  it('returns 1 for valid species when everything is capitalized', function() {
    expect(isSpecies(buildState('MUSCULUS', 'MUSCULUS', 'musculus', 'MUS'))).to.eq(1);
  });
});

describe('#isNotGenusOrFamily', function() {
  it('true for short strings', function() {
    expect(isNotGenusOrFamily(buildState('Aa', 'Aa', 'aa'))).to.be.true;
  });
  it('true for poorly capitalized strings', function() {
    expect(isNotGenusOrFamily(buildState('amanita', 'amanita', 'amanita'))).to.be.true;
    expect(isNotGenusOrFamily(buildState('AMANita', 'AMANita', 'amanita'))).to.be.true;
  });
  it('true for strings in the overlap dictionary', function() {
    expect(isNotGenusOrFamily(buildState('Goliath', 'Goliath', 'goliath'))).to.be.true;
  });
  it('false for everything else', function() {
    expect(isNotGenusOrFamily(buildState('Amanita', 'Amanita', 'amanita'))).to.be.false;
  });
});

describe('#isGenus', function() {
  it('fails on non-genera strings', function() {
    expect(isGenus(buildState('AMANita', 'AMANita', 'amanita'))).to.be.null;
  });
  it('fails on non-genera strings', function() {
    expect(isGenus(buildState('Itsnotaname', 'Itsnotaname', 'itsnotaname'))).to.be.null;
  });
  it('returns 0.5 for ambiguous genera', function() {
    expect(isGenus(buildState('Tuberosa', 'Tuberosa', 'tuberosa'))).to.eq(0.5);
  });
  it('returns 1 for unambiguous genera', function() {
    expect(isGenus(buildState('Amanita', 'Amanita', 'amanita'))).to.eq(1);
  });
});

describe('#isFamilyOrAbove', function() {
  it('fails on non-genera strings', function() {
    expect(isFamilyOrAbove(buildState('ANIMalia', 'ANIMalia', 'animalia'))).to.be.null;
  });
  it('fails on non-family-or-above strings', function() {
    expect(isFamilyOrAbove(buildState('Itsnotaname', 'Itsnotaname', 'itsnotaname'))).to.be.null;
  });
  it('returns 0.5 for ambiguous genera', function() {
    expect(isFamilyOrAbove(buildState('Sorghum', 'Sorghum', 'sorghum'))).to.eq(0.5);
  });
  it('returns 1 for unambiguous genera', function() {
    expect(isFamilyOrAbove(buildState('Animalia', 'Animalia', 'animalia'))).to.eq(1);
  });
});

describe('#isRank', function() {
  it('fails on special characters', function() {
    expect(isRank(buildState('(var', 'var', 'var'))).to.be.null;
  });
  it('fails on capital characters', function() {
    expect(isRank(buildState('VAR', 'VAR', 'var'))).to.be.null;
  });
  it('fails on non-ranks', function() {
    expect(isRank(buildState('nonsense', 'nonsense', 'nonsens'))).to.be.null;
  });
  it('returns 1 for valid ranks', function() {
    expect(isRank(buildState('var', 'var', 'var'))).to.eq(1);
  });
});
