# contentful-resolve-response

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
      someLink: {sys: {type: 'Link', linkType: 'Entry', id: 'suchId'}}
    }
  ],
  includes: {
    Entry: [
      {sys: {type: 'Entry', id: 'suchId'}, very: 'doge'}
    ]
  }
};

var items = resolveResponse(response)

console.log(items);

// produces:

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

- The original object passed in will be mutated (Boo! PRs welcome!)
- Multiple links to the same resource will point to the same object
- Circular references are possible
