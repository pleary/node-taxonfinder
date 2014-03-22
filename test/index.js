var should = require('chai').should(),
    taxonfinder = require('../index'),
    dictionaryHash = taxonfinder.dictionaryHash;
    loadDictionaries = taxonfinder.loadDictionaries;

describe('#loadDictionaries', function() {
  it('adds a lot of words', function() {
    loadDictionaries();
    Object.keys(dictionaryHash['family']).length.should.be.above(55231);
    Object.keys(dictionaryHash['family_new']).length.should.be.above(42);
    Object.keys(dictionaryHash['genera']).length.should.be.above(437062);
    Object.keys(dictionaryHash['genera_new']).length.should.be.above(898);
    Object.keys(dictionaryHash['species']).length.should.be.above(660012);
    Object.keys(dictionaryHash['species_new']).length.should.be.above(1841);
    Object.keys(dictionaryHash['species_bad']).length.should.be.above(1188);
    Object.keys(dictionaryHash['ranks']).length.should.be.above(159);
    Object.keys(dictionaryHash['overlap_new']).length.should.be.above(3026);
    Object.keys(dictionaryHash['species_bad']).length.should.be.above(1188);
    Object.keys(dictionaryHash['dict_ambig']).length.should.be.above(4167);
    Object.keys(dictionaryHash['genera_family']).length.should.be.above(12);
    Object.keys(dictionaryHash['dict_bad']).length.should.be.above(10);
  });

  it('adds family and above names', function() {
    loadDictionaries();
    dictionaryHash['family']['animalia'].should.eql(true);
    dictionaryHash['family']['chordata'].should.eql(true);
    dictionaryHash['family']['mammalia'].should.eql(true);
    dictionaryHash['family']['primates'].should.eql(true);
    dictionaryHash['family']['hominidae'].should.eql(true);
  });

  it('adds genera names', function() {
    loadDictionaries();
    dictionaryHash['genera']['homo'].should.eql(true);
    dictionaryHash['genera']['geranium'].should.eql(true);
    dictionaryHash['genera']['giraffe'].should.eql(true);
    dictionaryHash['genera']['amanita'].should.eql(true);
    dictionaryHash['genera']['escherichia'].should.eql(true);
  });

  it('adds species names', function() {
    loadDictionaries();
    dictionaryHash['species']['sapiens'].should.eql(true);
    dictionaryHash['species']['cinereum'].should.eql(true);
    dictionaryHash['species']['camelopardalis'].should.eql(true);
    dictionaryHash['species']['muscaria'].should.eql(true);
    dictionaryHash['species']['coli'].should.eql(true);
  });

  it('adds ranks', function() {
    loadDictionaries();
    dictionaryHash['ranks']['sp'].should.eql(true);
    dictionaryHash['ranks']['var'].should.eql(true);
    dictionaryHash['ranks']['gen'].should.eql(true);
    dictionaryHash['ranks']['f'].should.eql(true);
    dictionaryHash['ranks']['subsp'].should.eql(true);
  });

});