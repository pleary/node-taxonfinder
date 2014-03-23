var expect = require('chai').expect,
    taxonfinder = require('../index'),
    // findAndMarkupNames = taxonfinder.findAndMarkupNames,
    checkWordAgainstState = taxonfinder.checkWordAgainstState,
    prepareReturnString = taxonfinder.prepareReturnString,
    isSpecies = taxonfinder.isSpecies,
    isNotGenusOrFamily = taxonfinder.isNotGenusOrFamily,
    isGenus = taxonfinder.isGenus,
    isFamilyOrAbove = taxonfinder.isFamilyOrAbove,
    isRank = taxonfinder.isRank;

// describe('#findAndMarkupNames', function() {
//   it('does something', function() {
//     findAndMarkupNames("<p class='something'>Pomatomus saltator hello</p>");
//   });
// });

describe('#checkWordAgainstState', function() {
  it('does nothing with null', function() {
    expect(checkWordAgainstState()).to.be.null;
  });
  it('recognizes potential abbreviated genera', function() {
    var response = checkWordAgainstState('P.');
    expect(response['workingName']).to.eq('P');
    expect(response['workingRank']).to.eq('genus');
  });
  it('recognizes genera', function() {
    var response = checkWordAgainstState('Pomatomus');
    expect(response['workingName']).to.eq('Pomatomus');
    expect(response['workingRank']).to.eq('genus');
  });
  it('recognizes genera with full stops', function() {
    var response = checkWordAgainstState('Pomatomus;');
    expect(response['returnNames'][0]).to.eq('Pomatomus');
  });
  it('recognizes families and above', function() {
    var response = checkWordAgainstState('Animalia');
    expect(response['returnNames'][0]).to.eq('Animalia');
  });
  it('does nothing with nonsense', function() {
    expect(checkWordAgainstState('nonsense')).to.be.null;
  });
  it('will return the last known name when encountering nonsense', function() {
    var response = checkWordAgainstState('nonsense', { workingName: 'Pomatomus' });
    expect(response['returnNames'][0]).to.eq('Pomatomus');
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
    // (in index.js => if(currentString == nextString) ...)
    expect(prepareReturnString('Amanita [] muscaria')).to.eq('Amanita [] muscaria');
  });
  it('leaves everything else alone', function() {
    expect(prepareReturnString('Amanita')).to.eq('Amanita');
    expect(prepareReturnString('Amanita muscaria')).to.eq('Amanita muscaria');
  });
});

describe('#isSpecies', function() {
  it('fails on special characters', function() {
    expect(isSpecies('(musculus', 'musculus', 'musculus', 'Mus')).to.be.null;
  });
  it('fails on strings in the species_bad dictionary', function() {
    expect(isSpecies('phobia', 'phobia', 'phobia', 'Mus')).to.be.null;
  });
  it('fails on strings with numbers in them', function() {
    expect(isSpecies('phob1a', 'phob1a', 'phob1a', 'Mus')).to.be.null;
  });
  it('fails on lowercase strings when genera are capitalized', function() {
    expect(isSpecies('musculus', 'musculus', 'musculus', 'MUS')).to.be.null;
  });
  it('fails on capitalizes strings when genera are lower case', function() {
    expect(isSpecies('MUSCULUS', 'MUSCULUS', 'musculus', 'Mus')).to.be.null;
  });
  it('fails on non-species strings', function() {
    expect(isSpecies('nonsense', 'nonsense', 'nonsense', 'Mus')).to.be.null;
  });
  it('returns 1 for valid species', function() {
    expect(isSpecies('musculus', 'musculus', 'musculus', 'Mus')).to.eq(1);
  });
  it('returns 1 for valid species when everything is capitalized', function() {
    expect(isSpecies('MUSCULUS', 'MUSCULUS', 'musculus', 'MUS')).to.eq(1);
  });
});

describe('#isNotGenusOrFamily', function() {
  it('true for short strings', function() {
    expect(isNotGenusOrFamily('Aa', 'Aa', 'aa')).to.be.true;
  });
  it('true for poorly capitalized strings', function() {
    expect(isNotGenusOrFamily('amanita', 'amanita', 'amanita')).to.be.true;
    expect(isNotGenusOrFamily('AMANita', 'AMANita', 'amanita')).to.be.true;
  });
  it('true for strings in the overlap dictionary', function() {
    expect(isNotGenusOrFamily('Goliath', 'Goliath', 'goliath')).to.be.true;
  });
  it('false for everything else', function() {
    expect(isNotGenusOrFamily('Amanita', 'Amanita', 'amanita')).to.be.false;
  });
});

describe('#isGenus', function() {
  it('fails on non-genera strings', function() {
    expect(isGenus('AMANita', 'AMANita', 'amanita')).to.be.null;
  });
  it('fails on non-genera strings', function() {
    expect(isGenus('Itsnotaname', 'Itsnotaname', 'itsnotaname')).to.be.null;
  });
  it('returns 0.5 for ambiguous genera', function() {
    expect(isGenus('Tuberosa', 'Tuberosa', 'tuberosa')).to.eq(0.5);
  });
  it('returns 1 for unambiguous genera', function() {
    expect(isGenus('Amanita', 'Amanita', 'amanita')).to.eq(1);
  });
});

describe('#isFamilyOrAbove', function() {
  it('fails on non-genera strings', function() {
    expect(isFamilyOrAbove('ANIMalia', 'ANIMalia', 'animalia')).to.be.null;
  });
  it('fails on non-family-or-above strings', function() {
    expect(isFamilyOrAbove('Itsnotaname', 'Itsnotaname', 'itsnotaname')).to.be.null;
  });
  it('returns 0.5 for ambiguous genera', function() {
    expect(isFamilyOrAbove('Sorghum', 'Sorghum', 'sorghum')).to.eq(0.5);
  });
  it('returns 1 for unambiguous genera', function() {
    expect(isFamilyOrAbove('Animalia', 'Animalia', 'animalia')).to.eq(1);
  });
});

describe('#isRank', function() {
  it('fails on special characters', function() {
    expect(isRank('(var', 'var', 'var')).to.be.null;
  });
  it('fails on capital characters', function() {
    expect(isRank('VAR', 'VAR', 'var')).to.be.null;
  });
  it('fails on non-ranks', function() {
    expect(isRank('nonsense', 'nonsense', 'nonsens')).to.be.null;
  });
  it('returns 1 for valid ranks', function() {
    expect(isRank('var', 'var', 'var')).to.eq(1);
  });
});
