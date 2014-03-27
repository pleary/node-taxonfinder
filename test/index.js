var expect = require('chai').expect,
    fs = require('fs'),
    taxonfinder = require('../index'),
    findNamesAndOffsets = taxonfinder.findNamesAndOffsets,
    testText = null;

describe('#aWholeLottaNameTests', function() {
  it('gets the name when the string is exactly the name', function() {
    expectNameInText({ text: 'Felis leo', name: 'Felis leo' });
  });
  it('gets the name when there is text before or after', function() {
    expectNameInText({ text: 'Wow, Felis leo rocks', name: 'Felis leo' });
  });
  it('keeps track of genera to expand abbreviations', function() {
    expectNameInText({ text: 'Pomatomus; P. saltator', name: 'Pomatomus', index: 0 });
    expectNameInText({ text: 'Pomatomus; P. saltator', name: 'Pomatomus saltator', index: 1 });
    expectNameInText({ text: 'Pomatomus; P. saltator', original: 'P. saltator', index: 1 });
  });
  it('limits strings to quadrinomials', function() {
    expectNameInText({ text: 'Felis leo', name: 'Felis leo', index: 0 });
    expectNameInText({ text: 'Felis leo leo', name: 'Felis leo leo', index: 0 });
    expectNameInText({ text: 'Felis leo leo leo', name: 'Felis leo leo leo', index: 0 });
    expectNameInText({ text: 'Felis leo leo leo leo', name: 'Felis leo leo leo', index: 0 });
    expectNameInText({ text: 'Felis leo leo leo leo leo', name: 'Felis leo leo leo', index: 0 });
  });
  it('finds names in species lists', function() {
    expectNameInText({ text: 'Felis leo, chaus, catus', name: 'Felis leo', index: 0 });
    expectNameInText({ text: 'Felis leo, chaus, catus', name: 'Felis chaus', index: 1 });
    expectNameInText({ text: 'Felis leo, chaus, catus', name: 'Felis catus', index: 2 });
  });
});

// describe('#checksATestDocument', function() {
//   it('logs the results of a run against a test file', function() {
//     console.log(findNamesAndOffsets(fs.readFileSync('test.txt').toString()));
//   });
// });

describe('#expectNameInText', function() {
  it('gets the name when the string is exactly the name', function() {
    expectNameInText({ text: 'Felis leo', name: 'Felis leo' });
  });
  it('confirms the first name by default', function() {
    expectNameInText({ text: 'Some text Felis leo more text', name: 'Felis leo' });
  });
  it('can take other indices', function() {
    testText = 'Some Animalia Felis leo more text';
    expectNameInText({ text: testText, name: 'Animalia', index: 0 });
    expectNameInText({ text: testText, name: 'Felis leo', index: 1 });
  });
  it('can take original names', function() {
    testText = 'Pomatomus; P. saltator';
    expectNameInText({ text: testText, name: 'Pomatomus', index: 0 });
    expectNameInText({ text: testText, name: 'Pomatomus saltator', index: 1 });
    expectNameInText({ text: testText, original: 'P. saltator', index: 1 });
  });
});

var expectNameInText = function(options) {
  if (options['text'] === undefined) return null;
  var expectedIndex = options['index'] ? options['index'] : 0;
  var result = findNamesAndOffsets(options['text']);
  if (options['name'] !== undefined) {
    expect(result[expectedIndex]['name']).to.eq(options['name']);
  }
  if (options['original'] !== undefined) {
    expect(result[expectedIndex]['original']).to.eq(options['original']);
  }
};
