import copy from 'fast-copy'

const UNRESOLVED_LINK = {} // unique object to avoid polyfill bloat using Symbol()

/**
 * isLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link' && object.sys.linkType !== 'ContentType';

/**
 * Creates a string key for lookup in entityMap
 *
 * @param {*} sys
 * @param {String} sys.type
 * @param {String} sys.id
 * @return {String}
 */
const makeLookupKey = (sys) => `${sys.type}!${sys.id}`

/**
 * getLink Function
 *
 * @param response
 * @param link
 * @return {undefined}
 */
const getLink = (entityMap, link) => {
  const { linkType: type, id } = link.sys
  const lookupKey = makeLookupKey({ type, id })

  return entityMap.get(lookupKey) || UNRESOLVED_LINK
}

/**
 * cleanUpLinks Function
 * - Removes unresolvable links from Arrays and Objects
 *
 * @param {Object[]|Object} input
 */
const cleanUpLinks = (input) => {
  if (Array.isArray(input)) {
    return input.filter((val) => val !== UNRESOLVED_LINK)
  }
  for (const key in input) {
    if (input[key] === UNRESOLVED_LINK) {
      delete input[key]
    }
  }
  return input
}

/**
 * walkMutate Function
 * @param input
 * @param predicate
 * @param mutator
 * @return {*}
 */
const walkMutate = (input, predicate, mutator, removeUnresolved) => {
  if (predicate(input)) {
    return mutator(input)
  }

  if (input && typeof input === 'object') {
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        input[key] = walkMutate(input[key], predicate, mutator, removeUnresolved)
      }
    }
    if (removeUnresolved) {
      input = cleanUpLinks(input)
    }
  }
  return input
}

const normalizeLink = (entityMap, link, removeUnresolved) => {
  const resolvedLink = getLink(entityMap, link)
  if (resolvedLink === UNRESOLVED_LINK) {
    return removeUnresolved ? resolvedLink : link
  }
  return resolvedLink
}

const makeEntryObject = (item, itemEntryPoints) => {
  if (!Array.isArray(itemEntryPoints)) {
    return item
  }

  const entryPoints = Object.keys(item).filter((ownKey) => itemEntryPoints.indexOf(ownKey) !== -1)

  return entryPoints.reduce((entryObj, entryPoint) => {
    entryObj[entryPoint] = item[entryPoint]
    return entryObj
  }, {})
}

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
  options = options || {}
  if (!response.items) {
    return []
  }
  const responseClone = copy(response)
  const allIncludes = Object.keys(responseClone.includes || {}).reduce(
    (all, type) => [...all, ...response.includes[type]],
    []
  )

  const allEntries = [...responseClone.items, ...allIncludes]

  const entityMap = new Map(allEntries.map((entity) => [makeLookupKey(entity.sys), entity]))

  allEntries.forEach((item) => {
    const entryObject = makeEntryObject(item, options.itemEntryPoints)

    Object.assign(
      item,
      walkMutate(
        entryObject,
        isLink,
        (link) => normalizeLink(entityMap, link, options.removeUnresolved),
        options.removeUnresolved
      )
    )
  })

  return responseClone.items
}

export default resolveResponse
