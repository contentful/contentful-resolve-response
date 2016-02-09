'use strict';

var clone = require('clone');

module.exports = resolveResponse;

/**
 * Response should be an object with an `items` array and an `includes` object.
 * The `items` array contains entities, which can have links and sub links.
 * The `includes` object contains lists of linked entities for each entity type.
 */
function resolveResponse(response) {
  var items = clone(response.items);
  var includes = clone(response.includes || {});
  return walk(
    items,
    function(link) {
      return getLinkFromSources(link, includes);
    }
  ) || [];
}

/**
 * Walks an object. If object is a link, replaces it with the link reference
 * otherwise recurses on each value of the current input object
 */
function walk(input, linkLookup) {
  if(Array.isArray(input)) {
    return input.map(function (val) {
      return walk(val, linkLookup);
    });
  }

  if(typeof input == 'object'){
    if(isLink(input)){
      var resolvedInput = linkLookup(input);
      return resolvedInput ? walk(resolvedInput, linkLookup) : input;
    }

    for(var key in input){
      input[key] = walk(input[key], linkLookup);
    }
  }
  return input;
}

function getLinkFromSources(link, includes) {
  var type = link.sys.linkType;
  var id = link.sys.id;
  var pred = function(resource) {
    return resource.sys.type === type && resource.sys.id === id;
  };
  //return find(items, pred) ||
  return find(includes[type], pred);
}

function find(array, pred) {
  if (!array) {
    return;
  }
  for (var i = 0, len = array.length; i < len; i++) {
    if (pred(array[i])) {
      return array[i];
    }
  }
}

function isLink(object) {
  return object && object.sys && object.sys.type === 'Link';
}
