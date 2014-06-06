'use strict';

var buster = require('buster');
var assert = buster.assert;
var resolveResponse = require('./index');

buster.testCase('resolveResponse', {
  'empty response': function() {
    var response = {};
    var items = resolveResponse(response);
    assert.equals(items, []);
  },

  'no links in response': function() {
    var response = {
      items: [{
        foo: 'bar'
      }]
    };
    var items = resolveResponse(response);
    assert.equals(items, response.items);
  },

  'links in response, without matching include should remain': function() {
    var response = {
      items: [
        {sys: {type: 'Link', linkType: 'Piglet', id: 'oink'}
      }]
    };
    var items = resolveResponse(response);
    assert.equals(items, response.items);
  },

  'links in response, with matching include should resolve': function() {
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
    assert.equals(items[0], response.includes.Piglet[0]);
  }
});
