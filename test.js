'use strict';

var test = require('tape');
var resolveResponse = require('./index');

test('empty response', function(t) {
  var response = {};
  var items = resolveResponse(response);
  t.looseEquals(items, []);
  t.end();
});

test('no links in response', function(t) {
  var response = {
    items: [{
      foo: 'bar'
    }]
  };
  var items = resolveResponse(response);
  t.looseEquals(items, response.items);
  t.end();
});

test('links in response, without matching include should remain', function(t) {
  var response = {
    items: [
      {sys: {type: 'Link', linkType: 'Piglet', id: 'oink'}
    }]
  };
  var items = resolveResponse(response);
  t.looseEquals(items, response.items);
  t.end();
});

test('links in response, with matching include should resolve', function(t) {
  var response = {
    items: [
      {
        sys: {type: 'Entry'},
        fields: {
          animal: {sys: {type: 'Link', linkType: 'Animal', id: 'oink'}}
        }
      },
      {
        sys: {type: 'Entry'},
        fields: {
          birds: [
            {sys: {type: 'Link', linkType: 'Animal', id: 'parrot'}},
            {sys: {type: 'Link', linkType: 'Animal', id: 'middle-parrot'}},
            {sys: {type: 'Link', linkType: 'Animal', id: 'aussie-parrot'}}
          ]
        }
      }
    ],
    includes: {
      Animal: [
        {
          sys: {type: 'Animal', id: 'oink'},
          fields: {
            name: 'Pig',
            friend: {sys: {type: 'Link', linkType: 'Animal', id: 'groundhog'}}
          }
        },
        {
          sys: {type: 'Animal', id: 'groundhog'},
          fields: {name: 'Phil'}
        },
        {
          sys: {type: 'Animal', id: 'parrot'},
          fields: {name: 'Parrot'}
        },
        {
          sys: {type: 'Animal', id: 'aussie-parrot'},
          fields: {name: 'Aussie Parrot'}
        }
      ]
    }
  };

  var items = resolveResponse(response);
  t.looseEquals(items[0].fields.animal.sys, response.includes.Animal[0].sys, 'pig');
  t.looseEquals(items[0].fields.animal.fields.friend.sys, response.includes.Animal[1].sys, 'groundhog');
  t.looseEquals(items[1].fields.birds[0], response.includes.Animal[2], 'parrot');
  t.looseEquals(items[1].fields.birds[1].sys.type, 'Link', 'middle parrot not resolved');
  t.looseEquals(items[1].fields.birds[2], response.includes.Animal[3], 'aussie parrot');
  t.equals(response.items[0].fields.animal.sys.type, 'Link', 'original response is not mutated');
  t.end();
});


test.only('links in response, with circular references', function(t) {
  var response = {
    items: [
      {
        sys: {type: 'Entry'},
        fields: {
          animal: {sys: {type: 'Link', linkType: 'Animal', id: 'oink'}}
        }
      }
    ],
    includes: {
      Animal: [
        {
          sys: {type: 'Animal', id: 'oink'},
          fields: {name: 'Pig', friend: {sys: {type: 'Link', linkType: 'Animal', id: 'parrot'}}}
        },
        {
          sys: {type: 'Animal', id: 'parrot'},
          fields: {name: 'Parrot', friend: {sys: {type: 'Link', linkType: 'Animal', id: 'oink'}}}
        }
      ]
    }
  };

  var items = resolveResponse(response);

  var util = require('util');
  console.log(util.inspect(items[0], {depth: null}))
  t.equals(items[0].fields.animal.sys.type, 'Animal', 'first link type');
  t.equals(items[0].fields.animal.sys.id, 'oink', 'first link id');
  t.equals(items[0].fields.animal.fields.friend.sys.type, 'Animal', 'sub link type');
  t.equals(items[0].fields.animal.fields.friend.sys.id, 'parrot', 'sub link id');
  t.equals(items[0].fields.animal.fields.friend.fields.friend.sys.type, 'Animal', 'sub sub link type');
  t.equals(items[0].fields.animal.fields.friend.fields.friend.sys.id, 'oink', 'sub sub link id');
  t.end();
});
