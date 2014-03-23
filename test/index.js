var expect = require('chai').expect,
    taxonfinder = require('../index'),
    // findAndMarkupNames = taxonfinder.findAndMarkupNames,
    isNotGenusOrFamily = taxonfinder.isNotGenusOrFamily,
    isGenus = taxonfinder.isGenus,
    isFamilyOrAbove = taxonfinder.isFamilyOrAbove,
    isRank = taxonfinder.isRank;

// describe('#findAndMarkupNames', function() {
//   it('does something', function() {
//     findAndMarkupNames("<p class='something'>Pomatomus saltator hello</p>");
//   });
// });

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
