import copy from 'fast-copy'

const UNRESOLVED_LINK = {} // Unique object to avoid polyfill bloat using Symbol()

/**
 * IsLink Function
 * Checks if the object has sys.type "Link"
 * @param object
 */
const isLink = (object) => object && object.sys && object.sys.type === 'Link'

/**
 * IsResourceLink Function
 * Checks if the object has sys.type "ResourceLink"
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
const makeEntityMapKeys = (sys) => {
  if (sys.space && sys.environment) {
    return [`${sys.type}!${sys.id}`, `${sys.space.sys.id}!${sys.environment.sys.id}!${sys.type}!${sys.id}`]
  }

  return [`${sys.type}!${sys.id}`]
}

/**
 * Looks up in entityMap
 *
 * @param entityMap
 * @param {*} linkData
 * @param {String} linkData.type
 * @param {String} linkData.linkType
 * @param {String} linkData.id
 * @param {String} linkData.urn
 * @return {String}
 */
const lookupInEntityMap = (entityMap, linkData) => {
  const { entryId, linkType, spaceId, environmentId } = linkData

  if (spaceId && environmentId) {
    return entityMap.get(`${spaceId}!${environmentId}!${linkType}!${entryId}`)
  }

  return entityMap.get(`${linkType}!${entryId}`)
}

const getIdsFromUrn = (urn) => {
  const regExp = /.*:spaces\/([^/]+)(?:\/environments\/([^/]+))?\/entries\/([^/]+)$/

  if (!regExp.test(urn)) {
    return undefined
  }

  // eslint-disable-next-line no-unused-vars
  const [_, spaceId, environmentId = 'master', entryId] = urn.match(regExp)
  return { spaceId, environmentId, entryId }
}

/**
 * GetResolvedLink Function
 *
 * @param entityMap
 * @param link
 * @return {undefined}
 */
const getResolvedLink = (entityMap, link) => {
  const { type, linkType } = link.sys
  if (type === 'ResourceLink') {
    if (!linkType.startsWith('Contentful:')) {
      return link
    }

    const { urn } = link.sys
    const { spaceId, environmentId, entryId } = getIdsFromUrn(urn)
    const extractedLinkType = linkType.split(':')[1]

    return (
      lookupInEntityMap(entityMap, {
        linkType: extractedLinkType,
        entryId,
        spaceId,
        environmentId,
      }) || UNRESOLVED_LINK
    )
  }

  const { id: entryId } = link.sys
  return lookupInEntityMap(entityMap, { linkType, entryId }) || UNRESOLVED_LINK
}

/**
 * CleanUpUnresolvedLinks Function
 * - Removes unresolvable links from Arrays and Objects
 *
 * @param {Object[]|Object} input
 */
const cleanUpUnresolvedLinks = (input) => {
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

const normalizeLink = (entityMap, link, removeUnresolved) => {
  const resolvedLink = getResolvedLink(entityMap, link)
  if (resolvedLink === UNRESOLVED_LINK) {
    return removeUnresolved ? resolvedLink : link
  }
  return resolvedLink
}

const maybeNormalizeLink = (entityMap, maybeLink, removeUnresolved) => {
  if (Array.isArray(maybeLink)) {
    return maybeLink.reduce((acc, link) => {
      const normalizedLink = maybeNormalizeLink(entityMap, link, removeUnresolved)
      if (removeUnresolved && normalizedLink === UNRESOLVED_LINK) {
        return acc
      }
      acc.push(normalizedLink)
      return acc
    }, [])
  } else if (typeof maybeLink === 'object') {
    if (isLink(maybeLink) || isResourceLink(maybeLink)) {
      return normalizeLink(entityMap, maybeLink, removeUnresolved)
    }
  }
  return maybeLink
}

/**
 * WalkMutate Function
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
      input = cleanUpUnresolvedLinks(input)
    }
  }
  return input
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
 * Only normalize the top level properties of the entrypoint (e.g. item.fields),
 * as JSON fields can contain values that are objects that look like links, but are not.
 */
const normalizeFromEntryPoint = (entityMap, entryPoint, removeUnresolved) => {
  if (!entryPoint) {
    return undefined
  }

  if (Array.isArray(entryPoint)) {
    return maybeNormalizeLink(entityMap, entryPoint, removeUnresolved)
  } else if (typeof entryPoint === 'object') {
    return Object.entries(entryPoint).reduce((acc, [key, val]) => {
      const normalizedLink = maybeNormalizeLink(entityMap, val, removeUnresolved)
      if (removeUnresolved && normalizedLink === UNRESOLVED_LINK) {
        return acc
      }
      acc[key] = normalizedLink
      return acc
    }, {})
  }
}

/**
 * ResolveResponse Function
 * Resolves contentful response to normalized form.
 * @param {Object} response Contentful response
 * @param {{removeUnresolved: Boolean, itemEntryPoints: Array<String>}|{}} options
 * @param {Boolean} options.removeUnresolved - Remove unresolved links default:false
 * @param {Array<String>} options.itemEntryPoints - Resolve links only in those item properties
 * @return {Object}
 */
const resolveResponse = (response, options) => {
  options ||= {}
  if (!response.items) {
    return []
  }
  const responseClone = copy(response)
  const allIncludes = Object.keys(responseClone.includes || {}).reduce(
    (all, type) => [...all, ...response.includes[type]],
    [],
  )
  const allEntries = [...responseClone.items, ...allIncludes].filter((entity) => Boolean(entity.sys))
  const entityMap = new Map(
    allEntries.reduce((acc, entity) => {
      const entries = makeEntityMapKeys(entity.sys).map((key) => [key, entity])
      acc.push(...entries)
      return acc
    }, []),
  )

  allEntries.forEach((item) => {
    if (options.itemEntryPoints && options.itemEntryPoints.length) {
      for (const entryPoint of options.itemEntryPoints) {
        item[entryPoint] = normalizeFromEntryPoint(entityMap, item[entryPoint], options.removeUnresolved)
      }
    } else {
      const entryObject = makeEntryObject(item, options.itemEntryPoints)

      Object.assign(
        item,
        walkMutate(
          entryObject,
          (x) => isLink(x) || isResourceLink(x),
          (link) => normalizeLink(entityMap, link, options.removeUnresolved),
          options.removeUnresolved,
        ),
      )
    }
  })

  return responseClone.items
}

export default resolveResponse
