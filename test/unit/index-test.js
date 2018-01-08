const { deepEqual, notEqual, equal, notDeepEqual } = require('chai').assert;
const resolveResponse = require('../../index');

describe('Resolve a', function () {
  it('empty response which returns an empty response', function () {
    const response = {};
    const resolved = resolveResponse(response);
    deepEqual(resolved, []);
  });

  it('response with links without matching in includes should remain by default', function () {
    const items = [{
      sys: { type: 'Entry', locale: 'en-US' },
      fields: {
        animal: { sys: { type: 'Link', linkType: 'Piglet', id: 'oink' } }
      }
    }];
    const resolved = resolveResponse({ items });
    notEqual(resolved[0].fields.animal, undefined);
    equal(resolved[0].fields.animal.sys.type, 'Link');
  });

  it('response with links without matching in includes should not remain given removeUnresolved: true', function () {
    const items = [{
      sys: { type: 'Entry', locale: 'en-US' },
      fields: {
        animal: { sys: { type: 'Link', linkType: 'Piglet', id: 'oink' } }
      }
    }];
    const resolved = resolveResponse({ items }, { removeUnresolved: true });
    equal(resolved[0].fields.animal, undefined);
  });

  it('response with links only within fields are removed given removeUnresolved: true', function () {
    const items = [{
      sys: {
        type: 'Entry',
        locale: 'en-US',
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'someSpaceId'
          }
        }
      },
      fields: {
        sys: {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'Piglet'
          }
        },
        otherField: {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'Piglet'
          }
        },
        arrayField: [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'Piglet'
            }
          }
        ]
      }
    }];
    const resolved = resolveResponse({ items }, { removeUnresolved: true });
    notEqual(resolved[0].sys.space, undefined, 'Space is not removed');
    equal(resolved[0].sys.space.sys.type, 'Link', 'Space is still a link');
    equal(resolved[0].fields.sys, undefined, 'Field called sys got removed');
    equal(resolved[0].fields.otherField, undefined, 'Field called otherField got removed');
    equal(resolved[0].fields.arrayField[0], undefined, 'Entry in arrayField got removed');
  });

  it('response with links matching items from includes should be resolved', function () {
    const response = {
      items: [
        {
          sys: {},
          fields: {
            linkField: {
              sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
            }
          }
        }],
      includes: {
        Piglet: [
          { sys: { type: 'Piglet', id: 'oink' } }
        ]
      }
    };
    const resolved = resolveResponse(response);
    notDeepEqual(response, resolved);
    deepEqual(resolved[0].fields.linkField, response.includes.Piglet[0]);
  });

  it('response with links matching items from items and includes should be resolved', function () {
    const response = {
      items: [
        {
          sys: { type: 'Entry', locale: 'en-US', id: 'link-to-oink' },
          fields: {
            animal: { sys: { type: 'Link', linkType: 'Animal', id: 'oink' } }
          }
        },
        {
          sys: { type: 'Animal', id: 'parrot', locale: 'en-US' },
          fields: { name: 'Parrot' }
        }
      ],
      includes: {
        Animal: [
          {
            sys: { type: 'Animal', id: 'oink', locale: 'en-US' },
            fields: { name: 'Pig', friend: { sys: { type: 'Link', linkType: 'Animal', id: 'parrot' } } }
          }
        ]
      }
    };

    const resolved = resolveResponse(response);

    equal(resolved[0].fields.animal.sys.type, 'Animal', 'first link type');
    equal(resolved[0].fields.animal.sys.id, 'oink', 'first link id');
    equal(resolved[0].fields.animal.fields.friend.sys.type, 'Animal', 'sub link type');
    equal(resolved[0].fields.animal.fields.friend.sys.id, 'parrot', 'sub link id');
    equal(resolved[0].fields.animal.fields.friend.fields.name, 'Parrot', 'sub link fields.name');
    equal(resolved.length, 2, 'contains only the queried entries');
  });

  it('response with links having circular references between items and includes should be resolved', function () {
    const response = {
      items: [
        {
          sys: { type: 'Entry', locale: 'en-US' },
          fields: {
            animal: { sys: { type: 'Link', linkType: 'Animal', id: 'oink' } }
          }
        }
      ],
      includes: {
        Animal: [
          {
            sys: { type: 'Animal', id: 'oink', locale: 'en-US' },
            fields: { name: 'Pig', friend: { sys: { type: 'Link', linkType: 'Animal', id: 'parrot' } } }
          },
          {
            sys: { type: 'Animal', id: 'parrot', locale: 'en-US' },
            fields: { name: 'Parrot', friend: { sys: { type: 'Link', linkType: 'Animal', id: 'oink' } } }
          }
        ]
      }
    };

    const resolved = resolveResponse(response);

    equal(resolved[0].fields.animal.sys.type, 'Animal', 'first link type');
    equal(resolved[0].fields.animal.sys.id, 'oink', 'first link id');
    equal(resolved[0].fields.animal.fields.friend.sys.type, 'Animal', 'sub link type');
    equal(resolved[0].fields.animal.fields.friend.sys.id, 'parrot', 'sub link id');
    equal(resolved[0].fields.animal.fields.friend.fields.friend.sys.type, 'Animal', 'sub sub link type');
    equal(resolved[0].fields.animal.fields.friend.fields.friend.sys.id, 'oink', 'sub sub link id');
    equal(resolved.length, 1, 'contains only the queried entry');
  });

  it('response with links having circular references within items should be resolved', function () {
    const response = {
      items: [
        {
          sys: { type: 'Entry', locale: 'en-US', id: 'one' },
          fields: {
            linkfield: { sys: { type: 'Link', linkType: 'Entry', id: 'two' } }
          }
        },
        {
          sys: { type: 'Entry', locale: 'en-US', id: 'two' },
          fields: {
            linkfield: { sys: { type: 'Link', linkType: 'Entry', id: 'one' } }
          }
        }
      ]
    };

    const resolved = resolveResponse(response);

    equal(resolved[0].fields.linkfield.sys.type, 'Entry', 'first link type');
    equal(resolved[0].fields.linkfield.sys.id, 'two', 'first link id');
    equal(resolved[0].fields.linkfield.fields.linkfield.sys.type, 'Entry', 'sub link type');
    equal(resolved[0].fields.linkfield.fields.linkfield.sys.id, 'one', 'sub link id');
    equal(resolved[0].fields.linkfield.fields.linkfield.fields.linkfield.sys.type, 'Entry', 'sub sub link type');
    equal(resolved[0].fields.linkfield.fields.linkfield.fields.linkfield.sys.id, 'two', 'sub sub link id');
  });

  it('response with links should resolve complex references between items and includes', function () {
    const items = [
      {
        sys: { type: 'Entry', locale: 'en-US' },
        fields: {
          animal: { sys: { type: 'Link', linkType: 'Animal', id: 'oink' } },
          anotheranimal: { sys: { type: 'Link', linkType: 'Animal', id: 'middle-parrot' } }
        }
      },
      {
        sys: { type: 'Entry', locale: 'en-US' },
        fields: {
          birds: [
            { sys: { type: 'Link', linkType: 'Animal', id: 'parrot' } },
            { sys: { type: 'Link', linkType: 'Animal', id: 'middle-parrot' } },
            { sys: { type: 'Link', linkType: 'Animal', id: 'aussie-parrot' } }
          ]
        }
      },
      {
        sys: { type: 'Entry' },
        fields: {
          animal: {
            'en-US': { sys: { type: 'Link', linkType: 'Animal', id: 'oink' } }
          },
          animals: {
            'en-US': [{ sys: { type: 'Link', linkType: 'Animal', id: 'oink' } }]
          }
        }
      }
    ];
    const includes = {
      Animal: [
        {
          sys: { type: 'Animal', id: 'oink', locale: 'en-US' },
          fields: {
            name: 'Pig',
            friend: { sys: { type: 'Link', linkType: 'Animal', id: 'groundhog' } }
          }
        },
        {
          sys: { type: 'Animal', id: 'groundhog', locale: 'en-US' },
          fields: { name: 'Phil' }
        },
        {
          sys: { type: 'Animal', id: 'parrot', locale: 'en-US' },
          fields: { name: 'Parrot' }
        },
        {
          sys: { type: 'Animal', id: 'aussie-parrot', locale: 'en-US' },
          fields: { name: 'Aussie Parrot' }
        }
      ]
    };

    const resolved = resolveResponse({ items, includes });
    deepEqual(resolved[0].fields.animal.sys, includes.Animal[0].sys, 'pig');
    deepEqual(resolved[0].fields.animal.fields.friend.sys, includes.Animal[1].sys, 'groundhog');
    deepEqual(resolved[0].fields.anotheranimal.sys.type, 'Link', 'first middle parrot not resolved');
    deepEqual(resolved[1].fields.birds[0], includes.Animal[2], 'parrot');
    deepEqual(resolved[1].fields.birds[1].sys.type, 'Link', 'second middle parrot not resolved');
    deepEqual(resolved[1].fields.birds[2], includes.Animal[3], 'aussie parrot');
    deepEqual(resolved[2].fields.animal['en-US'].sys, includes.Animal[0].sys, 'localized pig');
    deepEqual(resolved[2].fields.animal['en-US'].fields.friend.sys, includes.Animal[1].sys, 'localized groundhog');
    deepEqual(resolved[2].fields.animals['en-US'][0].sys, includes.Animal[0].sys, 'listed localized pig');
    deepEqual(resolved[2].fields.animals['en-US'][0].fields.friend.sys, includes.Animal[1].sys,
      'listed localized groundhog'
    );
  });

  it('response with links should resolve with unlocalised entries ("locale: *" query)', function () {
    const items = [
      {
        sys: { type: 'Entry' },
        fields: {
          animal: { 'en': { sys: { type: 'Link', linkType: 'Entry', id: 'oink' } } },
          animals: { 'en': [{ sys: { type: 'Link', linkType: 'Entry', id: 'oink' } }] }
        }
      }
    ];
    const includes = {
      Entry: [
        {
          sys: { type: 'Entry', id: 'oink' },
          fields: {
            name: {
              'en': 'Pig'
            }
          }
        }
      ]
    };
    const resolved = resolveResponse({ items, includes });
    equal(resolved[0].fields.animal['en'].fields.name['en'], includes.Entry[0].fields.name['en']);
  });
});
