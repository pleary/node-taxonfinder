Taxonfinder
=========

[![Build Status](https://travis-ci.org/pleary/node-taxonfinder.svg?branch=master)](https://travis-ci.org/pleary/node-taxonfinder)
[![Coverage Status](https://coveralls.io/repos/pleary/node-taxonfinder/badge.png?branch=master)](https://coveralls.io/r/pleary/node-taxonfinder?branch=master)

Taxonfinder detects scientific names in plain text. Given a string, it will scan through the contents and use a dictionary-based approach to identifying which words and strings are latin scientific organism names. Taxonfinder will detect names at all ranks including Kingdom, Phylum, Class, Order, Family, Genus, Species, Subspecies and lots more.

## Installation

  npm install taxonfinder --save

## Usage

  var taxonfinder = require('taxonfinder');

  var resultsWithOffsets = taxonfinder.findNamesAndOffsets(stringWithNamesInIt);

## Tests

  npm test

#### Test Coverage

  npm run test-coverage

## Release History

* 0.2.0 Added ability to resolve abbreviated genera

* 0.1.4 Updating package.json

* 0.1.3 Improving documentation

* 0.1.2 Bug fixes: dictionaries not loading

* 0.1.1 Bug fixes: dictionaries not loading

* 0.1.0 Initial release
