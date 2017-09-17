const { deepEqual, notDeepEqual } = require('chai').assert;
const resolveResponse = require('../../index');

describe('Resolve a response', function () {
  it('for empty response returns an empty response', function () {
    const response = {};
    const resolved = resolveResponse(response);
    deepEqual(resolved, []);
  });

  it('with no links in response returns without any change', function () {
    const response = {
      items: [{
        foo: 'bar'
      }]
    };
    const resolved = resolveResponse(response);
    deepEqual(resolved, response.items);
  });

  it('with links in response, without matching include should remain', function () {
    const response = {
      items: [
        {
          sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }]
    };
    const resolved = resolveResponse(response);
    deepEqual(resolved, response.items);
  });

  it('with links in response, with matching include should resolve to give updated items', function () {
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
    const resolved = resolveResponse(response);
    notDeepEqual(response, resolved);
    deepEqual(resolved[0], response.includes.Piglet[0]);
  });
});
