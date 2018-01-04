const { deepEqual, notEqual, equal, notDeepEqual } = require('chai').assert;
const resolveResponse = require('../../index');

describe('Resolve a response', function () {
  it('for empty response returns an empty response', function () {
    const response = {};
    const resolved = resolveResponse(response);
    deepEqual(resolved, []);
  });

  it('links in response, without matching include should remain by default', function () {
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

  it('links in response, without matching include should not remain given removeUnresolved: true', function () {
    const items = [{
      sys: { type: 'Entry', locale: 'en-US' },
      fields: {
        animal: { sys: { type: 'Link', linkType: 'Piglet', id: 'oink' } }
      }
    }];
    const resolved = resolveResponse({ items }, { removeUnresolved: true });
    equal(resolved[0].fields.animal, undefined);
  });

  it('with links in response, with matching include should resolve to give updated items', function () {
    const response = {
      items: [
        {
          sys: { type: 'Link', linkType: 'Piglet', id: 'oink' }
        }],
      includes: {
        Piglet: [
          { sys: { type: 'Piglet', id: 'oink' } }
        ]
      }
    };
    const resolved = resolveResponse(response);
    notDeepEqual(response, resolved);
    deepEqual(resolved[0], response.includes.Piglet[0]);
  });
  it('link resolving: links in response, with circular references', function () {
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
  });

  it('link resolving: links in response, with circular references #2', function () {
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

  it('links in response, with matching include should resolve', function () {
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

  it('links in response with locale: *', function () {
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
