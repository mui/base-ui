import { describe, expect, it } from 'vitest';
import { isJSDOM } from '#test-utils';
import { PopupTriggerMap } from './popupTriggerMap';

describe('PopupTriggerMap', () => {
  it('adds and retrieves elements by id', () => {
    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    map.add('trigger', button);

    expect(map.getById('trigger')).to.equal(button);
    expect(map.hasElement(button)).to.equal(true);
    expect(map.hasMatchingElement((el) => el === button)).to.equal(true);
    expect(map.size).to.equal(1);
  });

  it('replaces an existing element when the id is reused', () => {
    const map = new PopupTriggerMap();
    const first = document.createElement('button');
    const second = document.createElement('button');

    map.add('trigger', first);
    map.add('trigger', second);

    expect(map.getById('trigger')).to.equal(second);
    expect(map.hasElement(first)).to.equal(false);
    expect(map.hasElement(second)).to.equal(true);
    expect(map.size).to.equal(1);
  });

  it('deletes elements by id', () => {
    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    map.add('trigger', button);
    map.delete('trigger');

    expect(map.getById('trigger')).toBeUndefined();
    expect(map.hasElement(button)).to.equal(false);
    expect(map.hasMatchingElement((el) => el === button)).to.equal(false);
    expect(map.size).to.equal(0);
  });

  it('does not duplicate when the same element is added twice with the same id', () => {
    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    map.add('trigger', button);
    map.add('trigger', button);

    expect(map.getById('trigger')).to.equal(button);
    expect(map.size).to.equal(1);
  });

  it('throws in non-production when the same element is registered under multiple ids', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    try {
      map.add('first', button);
      expect(() => map.add('second', button)).to.throw(
        'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.',
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it.skipIf(!isJSDOM)(
    'does not throw in production when the same element is registered under multiple ids',
    () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const map = new PopupTriggerMap();
      const button = document.createElement('button');

      try {
        map.add('first', button);
        expect(() => map.add('second', button)).not.to.throw();
        expect(map.getById('first')).to.equal(button);
        expect(map.getById('second')).to.equal(button);
        expect(map.hasElement(button)).to.equal(true);
        expect(map.size).to.equal(2);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    },
  );
});
