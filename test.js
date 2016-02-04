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
  t.equals(items, response.items);
  t.end();
});

test('links in response, without matching include should remain', function(t) {
  var response = {
    items: [
      {sys: {type: 'Link', linkType: 'Piglet', id: 'oink'}
    }]
  };
  var items = resolveResponse(response);
  t.equals(items, response.items);
  t.end();
});

test('links in response, with matching include should resolve', function(t) {
  var response = {
    items: [
      {sys: {type: 'Link', linkType: 'Piglet', id: 'oink'}
    }],
    includes: {
      Piglet: [
        {sys: {type: 'Piglet', id: 'oink'}}
      ]
    }
  };
  var items = resolveResponse(response);
  t.equals(items[0], response.includes.Piglet[0]);
  t.end();
});
