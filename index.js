/**
 * isLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link';
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
 * resolveResponse Function
 * Resolves contentful response to normalized form.
 * @param response
 * @return {Object}
 */
const resolveResponse = (response) => {
  if (!response.items) {
    return { response: {}, resolved: [] };
  }
  const customObject = Object.assign({}, response);
  walkMutate(customObject, isLink, (link) => (getLink(customObject, link) || link));
  return { response, resolved: customObject.items };
};

module.exports = resolveResponse;
