'use strict';

module.exports = resolveResponse;

function resolveResponse (response) {
  walkMutate(response, isLink, function (link) {
    return getLink(response, link) || link;
  });
  return response.items || [];
}

function isLink (object) {
  return object && object.sys && object.sys.type === 'Link';
}

function getLink (response, link) {
  const type = link.sys.linkType;
  const id = link.sys.id;
  const pred = function (resource) {
    return resource.sys.type === type && resource.sys.id === id;
  };

  const result = find(response.items, pred);
  const hasResult = Boolean(result);

  if (!hasResult && response.includes) {
    return find(response.includes[type], pred);
  }

  return hasResult ? result : undefined;
}

function walkMutate (input, pred, mutator) {
  if (pred(input)) {
    return mutator(input);
  }

  if (input && typeof input === 'object') {
    for (const key in input) {
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
  for (let i = 0, len = array.length; i < len; i++) {
    if (pred(array[i])) {
      return array[i];
    }
  }
}
