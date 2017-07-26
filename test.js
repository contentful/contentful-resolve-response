'use strict';

const buster = require('buster');
const assert = buster.assert;
const resolveResponse = require('./index');

buster.testCase('resolveResponse', {
  'empty response': function () {
    const response = {};
    const items = resolveResponse(response);
    assert.equals(items, []);
  },

  'no links in response': function () {
    const response = {
      items: [{
        foo: 'bar'
      }]
    };
    const items = resolveResponse(response);
    assert.equals(items, response.items);
  },

  'links in response, without matching include should remain': function () {
    const response = {
      items: [
        { sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }]
    };
    const items = resolveResponse(response);
    assert.equals(items, response.items);
  },

  'links in response, with matching include should resolve': function () {
    const response = {
      items: [
        { sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }],
      includes: {
        Piglet: [
          { sys: { type: 'Piglet', id: 'oink' } }
        ]
      }
    };
    const items = resolveResponse(response);
    assert.equals(items[0], response.includes.Piglet[0]);
  }
});
