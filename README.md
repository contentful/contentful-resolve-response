# contentful-resolve-response

[![npm](https://img.shields.io/npm/v/contentful-resolve-response.svg)](https://www.npmjs.com/package/contentful-resolve-response)
[![Build Status](https://travis-ci.org/contentful/contentful-resolve-response.svg?branch=master)](https://travis-ci.org/contentful/contentful-resolve-response)
[![codecov](https://codecov.io/gh/contentful/contentful-resolve-response/branch/master/graph/badge.svg)](https://codecov.io/gh/contentful/contentful-resolve-response)

Suppose you have a Contentful query's response JSON. The links are
nice, but what we really usually need is the response with a resolved
object graph.

`contentful-resolve-response` does just that:

``` js
var resolveResponse = require('contentful-resolve-response');

var response = {
  items: [
    {
      someValue: 'wow',
      someLink: { sys: { type: 'Link', linkType: 'Entry', id: 'suchId' } }
    }
  ],
  includes: {
    Entry: [
      { sys: { type: 'Entry', id: 'suchId' }, very: 'doge' }
    ]
  }
};

var items = resolveResponse(response)
// Responds with the resolved array of items.

console.log(items);

// produces:
// re`solved` object [Array] of items.
  [
    {
      // Value stays the same
      someValue: 'wow',

      // Link gets replaced by the actual object from `includes.Entry`
      someLink: {sys: {type: 'Entry', id: 'suchId'}, very: 'doge'}
    }
  ]
```

Note that:

- Multiple links to the same resource will point to the same object
- Circular references are possible, still!!
