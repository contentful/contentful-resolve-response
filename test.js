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
          fields: {name: 'Pig'}
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
  t.looseEquals(items[0].fields.animal, response.includes.Animal[0]);
  t.looseEquals(items[1].fields.birds[0], response.includes.Animal[1]);
  t.looseEquals(items[1].fields.birds[2], response.includes.Animal[2]);
  t.end();
});
