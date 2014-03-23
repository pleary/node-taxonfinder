var expect = require('chai').expect,
    utility = require('../lib/utility'),
    clean = utility.clean,
    addWordToEndOfOffsetList = utility.addWordToEndOfOffsetList,
    isStopTag = utility.isStopTag,
    explodeHtml = utility.explodeHtml,
    removeTagsFromElements = utility.removeTagsFromElements;

describe('#clean', function() {
  it('removes non-characters from beginning and ends of lines', function() {
    expect(clean("---abc")).to.eql("abc");
    expect(clean("abc---")).to.eql("abc");
    expect(clean("---abc---")).to.eql("abc");
  });
});

describe('#addWordToEndOfOffsetList', function() {
  it('appends strings to the end of the list', function() {
    var offsetList = [ { word: 'Abc', offset: 101 } ];
    addWordToEndOfOffsetList(offsetList, 'def');
    expect(offsetList[0]['word']).to.eq('Abcdef');
    expect(offsetList[0]['offset']).to.eq(101);
  });
});

describe('#isStopTag', function() {
  it('know valid stop tags', function() {
    expect(isStopTag('p')).to.be.true;
    expect(isStopTag('td')).to.be.true;
    expect(isStopTag('tr')).to.be.true;
    expect(isStopTag('table')).to.be.true;
    expect(isStopTag('hr')).to.be.true;
    expect(isStopTag('ul')).to.be.true;
    expect(isStopTag('li')).to.be.true;
    expect(isStopTag('/p')).to.be.true;
  });

  it('knows invalid stop tags', function() {
    expect(isStopTag('paragraph')).to.be.false;
    expect(isStopTag('\\p')).to.be.false;
    expect(isStopTag('img')).to.be.false;
    expect(isStopTag('/img')).to.be.false;
  });
});

describe('#removeTagsFromElements', function() {
  it('always returns null as the last item', function() {
    var result = removeTagsFromElements([ ]);
    expect(result.length).to.eq(1);
    expect(result[0]).to.be.null;
  });
  it('does nothing with plain text', function() {
    var result = removeTagsFromElements([{ word: 'hello' }]);
    expect(result.length).to.eq(2);
    expect(result[0]['word']).to.eq('hello');
  });
  it('replaces complete blocker tags with null', function() {
    var result = removeTagsFromElements([{ word: '<p>' }]);
    expect(result.length).to.eq(2);
    expect(result[0]).to.be.null;
    expect(result[1]).to.be.null;
  });
  it('replaces split blocker tags with null', function() {
    var result = removeTagsFromElements([{ word: '<p' }, { word: 'class="b"' }, { word: '>' }]);
    expect(result.length).to.eq(2);
    expect(result[0]).to.be.null;
    expect(result[1]).to.be.null;
  });
  it('removes complete non-blocker tags', function() {
    var result = removeTagsFromElements([{ word: '<span>' }]);
    expect(result.length).to.eq(1);
    expect(result[0]).to.be.null;
  });
  it('removes split non-blocker tags', function() {
    var result = removeTagsFromElements([{ word: '<span' }, { word: 'class="b"' }, { word: '>' }]);
    expect(result.length).to.eq(1);
    expect(result[0]).to.be.null;
  });
});

describe('#explodeHtml', function() {
  it('does something', function() {
    var elements = explodeHtml('<p class="para"> parameter. <hr p>If specified, then only substrings <hr> to <code option class="parameter">limit</code>');
  });
});
