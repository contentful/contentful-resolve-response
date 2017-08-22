const assert = require('chai').assert;
const resolveResponse = require('../../index');

describe('resolveResponse', function () {
  it('empty response', function () {
    const response = {};
    const items = resolveResponse(response);
    assert.deepEqual(items.resolved, []);
    assert.deepEqual(items.response, response);
  });

  it('no links in response', function () {
    const response = {
      items: [{
        foo: 'bar'
      }]
    };
    const items = resolveResponse(response);
    assert.deepEqual(items.resolved, response.items);
    assert.deepEqual(items.response, response);
  });

  it('links in response, without matching include should remain', function () {
    const response = {
      items: [
        {
          sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }]
    };
    const items = resolveResponse(response);
    assert.deepEqual(items.resolved, response.items);
    assert.deepEqual(items.response, response);
  });

  it('links in response, with matching include should resolve', function () {
    const response = {
      items: [
        {
          sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }],
      includes: {
        Piglet: [
          { sys: { type: 'Piglet', id: 'oink' } }
        ]
      }
    };
    const items = resolveResponse(response);
    assert.deepEqual(items.resolved[0], response.includes.Piglet[0]);
    assert.deepEqual(items.response, response);
  });
});
