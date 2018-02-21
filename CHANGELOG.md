# Change Log
All notable changes to this project will be documented in this file.

## v1.1.4 - 2018-02-21

### Bug Fixes

* **array-fields:**  proper unresolved removal while iterating array ([#19](https://github.com/contentful/contentful-resolve-response/pull/19)) ([39bf40d7](https://github.com/contentful/contentful-resolve-response/commit/39bf40d7e38f5e3a0bce96491448c333d128b850))

## v1.1.3 - 2018-02-12

### Bug Fixes

* **compatibility:**  indexOf instead of includes([#18](https://github.com/contentful/contentful-resolve-response/pull/18)) ([1c3b277c](https://github.com/contentful/contentful-resolve-response/commit/1c3b277c2189b966841a86da276de018618aa1ce))

## v1.1.2

### Build System / Dependencies

* **esm:**  provide esm version for bundlers ([#16](https://github.com/contentful/contentful-resolve-response/pull/16)) ([a40cabb7](https://github.com/contentful/contentful-resolve-response/commit/a40cabb73e099347cd7a77679ba4060f20d07b65))

### Documentation Changes

* **package.json:**  fix urls ([70f61377](https://github.com/contentful/contentful-resolve-response/commit/70f6137787345cdb5913dd198b597e446ab16390))
* **README:**  add npm version badge ([724b5ef6](https://github.com/contentful/contentful-resolve-response/commit/724b5ef684fa12d3a539e23ad089da3b3a047199))

## v1.1.1

### Bug Fixes

* **removeUnresolved:**  remove instead of set to undefined ([#15](https://github.com/contentful/contentful-resolve-response/pull/15)) ([a58906b1](https://github.com/contentful/contentful-resolve-response/commit/a58906b1df9218cfebf9974e6969d07d87a9dc05))

## v1.1.0 - 2018-01-17
### Added
- _[options]_ allow explicit item entry points

### Changed
- _[pkg]_ manually set version field to 1.0.1
- _[githooks]_ lint every commit, test every push (#13)
- _[gitignore]_ ignore coverage and other irrelevant files
- _[coverage]_ add code coverage reports
- _[unit]_ circular references in multi value fields (#11)

### Fixed
- _[lodash]_ require explicit to allow tree shaking (#10)
