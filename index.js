import cloneDeep from 'lodash/cloneDeep';

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
 * cleanUpLink Function
 * - Removes unresolvable links from Arrays and Objects
 *
 * @param {Object[]|Object} input
 * @param {number|string} key
 */
const cleanUpLink = (input, key) => {
  if (input[key] === undefined) {
    if (Array.isArray(input)) {
      input.splice(key, 1);
    } else {
      delete input[key];
    }
  }
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
        cleanUpLink(input, key);
      }
    }
  }
  return input;
};

const normalizeLink = (allEntries, link, removeUnresolved) => {
  const resolvedLink = getLink(allEntries, link);
  if (resolvedLink === undefined) {
    return removeUnresolved ? undefined : link;
  }
  return resolvedLink;
};

const makeEntryObject = (item, itemEntryPoints) => {
  if (!Array.isArray(itemEntryPoints)) {
    return item;
  }

  const entryPoints = Object.keys(item).filter((ownKey) => itemEntryPoints.indexOf(ownKey) !== -1);

  return entryPoints.reduce((entryObj, entryPoint) => {
    entryObj[entryPoint] = item[entryPoint];
    return entryObj;
  }, {});
};

/**
 * resolveResponse Function
 * Resolves contentful response to normalized form.
 * @param {Object} response Contentful response
 * @param {Object} options
 * @param {Boolean} options.removeUnresolved - Remove unresolved links default:false
 * @param {Array<String>} options.itemEntryPoints - Resolve links only in those item properties
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
    .forEach((item) => {
      const entryObject = makeEntryObject(item, options.itemEntryPoints);

      Object.assign(
        item,
        walkMutate(entryObject, isLink, (link) => normalizeLink(allEntries, link, options.removeUnresolved))
      );
    });

  return responseClone.items;
};

export default resolveResponse;
