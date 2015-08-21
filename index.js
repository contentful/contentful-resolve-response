'use strict';

module.exports = resolveResponse;

function resolveResponse(response) {
  walkMutate(response, isLink, function(link) {
    return getLink(response, link) || link;
  });
  return response.items || [];
}

function isLink(object) {
  return object && object.sys && object.sys.type === 'Link';
}

function getLink(response, link) {
  var type = link.sys.linkType;
  var id = link.sys.id;
  var pred = function(resource) {
    return resource.sys.type === type && resource.sys.id === id;
  };
  return find(response.items, pred) ||
    response.includes && find(response.includes[type], pred);
}

function walkMutate(input, pred, mutator) {
  if (pred(input))
    return mutator(input);

  if (input && typeof input == 'object') {
    for (var key in input) {
      if (input.hasOwnProperty(key)) {
        input[key] = walkMutate(input[key], pred, mutator);
      }
    }
    return input;
  }

  return input;
}

function find (array, pred) {
  if (!array) {
    return;
  }
  for (var i = 0, len = array.length; i < len; i++) {
    if (pred(array[i])) {
      return array[i];
    }
  }
}
