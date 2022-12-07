import copy from 'fast-copy'

const UNRESOLVED_LINK = {} // unique object to avoid polyfill bloat using Symbol()

/**
 * isLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link'

/**
 * isResourceLink Function
 * Checks if the object has sys.type "Resource"
 * @param object
 */
const isResourceLink = (object) => object && object.sys && object.sys.type === 'ResourceLink'

/**
 * Creates a key with spaceId and a key without for entityMap
 *
 * @param {*} sys
 * @param {String} sys.type
 * @param {String} sys.id
 * @param {*} sys.space
 * @param {*} sys.space.sys
 * @param {String} sys.space.id
 * @return {string[]}
 */
const makeEntityMapKeys = (sys) =>
  sys.space ? [`${sys.type}!${sys.id}`, `${sys.space.sys.id}!${sys.type}!${sys.id}`] : [`${sys.type}!${sys.id}`]

/**
 * Looks up in entityMap
 *
 * @param entityMap
 * @param {*} sys
 * @param {String} sys.type
 * @param {String} sys.linkType
 * @param {String} sys.id
 * @param {String} sys.urn
 * @return {String}
 */
const lookupInEntityMap = (entityMap, sys) => {
  const { id, linkType, spaceId } = sys
  if (spaceId) {
    return entityMap.get(`${spaceId}!${linkType}!${id}`)
  }
  return entityMap.get(`${linkType}!${id}`)
}

/**
 * getResolvedLink Function
 *
 * @param entityMap
 * @param link
 * @return {undefined}
 */
const getResolvedLink = (entityMap, link) => {
  const { type, linkType } = link.sys
  if (type === 'ResourceLink') {
    const { urn } = link.sys
    const paths = urn.split('/')
    const spaceId = paths[1]
    const id = paths[3]
    const extractedLinkType = linkType.split(':')[1]
    return lookupInEntityMap(entityMap, { linkType: extractedLinkType, id, spaceId }) || UNRESOLVED_LINK
  }
  const { id } = link.sys
  return lookupInEntityMap(entityMap, { linkType, id }) || UNRESOLVED_LINK
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
 * @param removeUnresolved
 * @return {*}
 */
const walkMutate = (input, predicate, mutator, removeUnresolved) => {
  if (predicate(input)) {
    return mutator(input)
  }

  if (input && typeof input === 'object') {
    for (const key in input) {
      // eslint-disable-next-line no-prototype-builtins
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
  const resolvedLink = getResolvedLink(entityMap, link)
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
 * @param {{removeUnresolved: Boolean, itemEntryPoints: Array<String>}|{}} options
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

  const entityMap = new Map(
    allEntries.reduce((acc, entity) => {
      const keys = makeEntityMapKeys(entity.sys)
      acc.push([keys[0], entity])
      acc.push([keys[1], entity])
      return acc
    }, [])
  )

  allEntries.forEach((item) => {
    const entryObject = makeEntryObject(item, options.itemEntryPoints)

    Object.assign(
      item,
      walkMutate(
        entryObject,
        (x) => isLink(x) || isResourceLink(x),
        (link) => normalizeLink(entityMap, link, options.removeUnresolved),
        options.removeUnresolved
      )
    )
  })

  return responseClone.items
}

export default resolveResponse
