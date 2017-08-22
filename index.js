/**
 * resolveResponse Function
 * Resolves contentful response to normalized form.
 * @param response
 * @return {Array}
 */
const resolveResponse = (response) => {
  walkMutate(response, isLink, (link) => (getLink(response, link) || link));
  return response.items || [];
};

/**
 * isLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link';

/**
 * getLink Function
 *
 * @param response
 * @param link
 * @return {undefined}
 */
const getLink = (response, link) => {
  const { linkType: type, id } = link.sys;

  const predicate = (resource) => (resource.sys.type === type && resource.sys.id === id);

  const result = findNormalizableArray(response.items, predicate);

  const hasResult = Boolean(result);

  if (!hasResult && response.includes) {
    return findNormalizableArray(response.includes[type], predicate);
  }
  return hasResult ? result : undefined;
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
    return input;
  }
  return input;
};

/**
 * findNormalizableArray
 *
 * @param array
 * @param predicate
 * @return {*}
 */
const findNormalizableArray = (array, predicate) => {
  if (!array) {
    return;
  }
  for (let i = 0, len = array.length; i < len; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
};

module.exports = resolveResponse;
