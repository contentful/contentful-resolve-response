const { cloneDeep } = require('lodash');

/**
 * isLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link';

/**
 * findNormalizableLinkInArray
 *
 * @param array
 * @param predicate
 * @return {*}
 */
const findNormalizableLinkInArray = (array, predicate) => {
  if (!array) {
    return undefined;
  }
  for (let i = 0, len = array.length; i < len; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  return undefined;
};

/**
 * getLink Function
 *
 * @param response
 * @param link
 * @return {undefined}
 */
const getLink = (allEntries, link) => {
  const { linkType: type, id } = link.sys;

  const predicate = ({ sys }) => (sys.type === type && sys.id === id);

  return findNormalizableLinkInArray(allEntries, predicate);
};

/**
 * walkMutate Function
 * @param input
 * @param predicate
 * @param mutator
 * @return {*}
 */
const walkMutate = (input, predicate, mutator) => {
  if (predicate(input)) {
    return mutator(input);
  }

  if (input && typeof input === 'object') {
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        input[key] = walkMutate(input[key], predicate, mutator);
      }
    }
  }
  return input;
};

const normalizeLink = (allEntries, link, removeUnresolved) => {
  const resolvedLink = getLink(allEntries, link);
  if (resolvedLink === undefined) {
    return removeUnresolved && isLink(link) ? undefined : link;
  }
  return resolvedLink;
};

/**
 * resolveResponse Function
 * Resolves contentful response to normalized form.
 * @param {Object} response Contentful response
 * @param {Object} options
 * @param {Boolean} options.removeUnresolved - Remove unresolved links default:false
 * @return {Object}
 */
const resolveResponse = (response, options) => {
  options = options || {};
  if (!response.items) {
    return [];
  }
  const responseClone = cloneDeep(response);
  const allIncludes = Object.keys(responseClone.includes || {})
    .reduce((all, type) => ([...all, ...response.includes[type]]), []);

  const allEntries = [...responseClone.items, ...allIncludes];

  allEntries
    .forEach((item) => (
      Object.assign(item, {
        fields: walkMutate(item.fields, isLink, (link) => normalizeLink(allEntries, link, options.removeUnresolved))
      })
    ));

  return responseClone.items;
};

module.exports = resolveResponse;
