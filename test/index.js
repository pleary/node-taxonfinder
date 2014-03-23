var expect = require('chai').expect,
    taxonfinder = require('../index'),
    dictionaryHash = taxonfinder.dictionaryHash,
    loadDictionaries = taxonfinder.loadDictionaries;

describe('#loadDictionaries', function() {
  it('adds a lot of words', function() {
    loadDictionaries();
    expect(Object.keys(dictionaryHash['family']).length).to.be.above(55231);
    expect(Object.keys(dictionaryHash['family_new']).length).to.be.above(42);
    expect(Object.keys(dictionaryHash['genera']).length).to.be.above(437062);
    expect(Object.keys(dictionaryHash['genera_new']).length).to.be.above(898);
    expect(Object.keys(dictionaryHash['species']).length).to.be.above(660012);
    expect(Object.keys(dictionaryHash['species_new']).length).to.be.above(1841);
    expect(Object.keys(dictionaryHash['species_bad']).length).to.be.above(1188);
    expect(Object.keys(dictionaryHash['ranks']).length).to.be.above(159);
    expect(Object.keys(dictionaryHash['overlap_new']).length).to.be.above(3026);
    expect(Object.keys(dictionaryHash['species_bad']).length).to.be.above(1188);
    expect(Object.keys(dictionaryHash['dict_ambig']).length).to.be.above(4167);
    expect(Object.keys(dictionaryHash['genera_family']).length).to.be.above(12);
    expect(Object.keys(dictionaryHash['dict_bad']).length).to.be.above(10);
  });

  it('adds family and above names', function() {
    loadDictionaries();
    expect(dictionaryHash['family']['animalia']).to.be.true;
    expect(dictionaryHash['family']['chordata']).to.be.true;
    expect(dictionaryHash['family']['mammalia']).to.be.true;
    expect(dictionaryHash['family']['primates']).to.be.true;
    expect(dictionaryHash['family']['hominidae']).to.be.true;
  });

  it('adds genera names', function() {
    loadDictionaries();
    expect(dictionaryHash['genera']['homo']).to.be.true;
    expect(dictionaryHash['genera']['geranium']).to.be.true;
    expect(dictionaryHash['genera']['giraffe']).to.be.true;
    expect(dictionaryHash['genera']['amanita']).to.be.true;
    expect(dictionaryHash['genera']['escherichia']).to.be.true;
  });

  it('adds species names', function() {
    loadDictionaries();
    expect(dictionaryHash['species']['sapiens']).to.be.true;
    expect(dictionaryHash['species']['cinereum']).to.be.true;
    expect(dictionaryHash['species']['camelopardalis']).to.be.true;
    expect(dictionaryHash['species']['muscaria']).to.be.true;
    expect(dictionaryHash['species']['coli']).to.be.true;
  });

  it('adds ranks', function() {
    loadDictionaries();
    expect(dictionaryHash['ranks']['sp']).to.be.true;
    expect(dictionaryHash['ranks']['var']).to.be.true;
    expect(dictionaryHash['ranks']['gen']).to.be.true;
    expect(dictionaryHash['ranks']['f']).to.be.true;
    expect(dictionaryHash['ranks']['subsp']).to.be.true;
  });
});
