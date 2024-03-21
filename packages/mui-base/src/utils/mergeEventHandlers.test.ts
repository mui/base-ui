import { expect } from 'chai';
import { BaseUiEventExtension, mergeEventHandlers } from './mergeEventHandlers';

describe('mergeEventHandlers', () => {
  it('should call both event handlers: their first, then ours', () => {
    let log = '';

    const ours = () => {
      log += 'ours ';
    };

    const theirs = () => {
      log += 'theirs ';
    };

    const merged = mergeEventHandlers(ours, theirs);
    merged({} as any);

    expect(log).to.equal('theirs ours ');
  });

  it('should work if the external event handler is undefined', () => {
    let log = '';

    const ours = () => {
      log += 'ours ';
    };

    const merged = mergeEventHandlers(ours);
    merged({} as any);

    expect(log).to.equal('ours ');
  });

  it('should not call our event handler if the external one calls preventBaseUiDefault', () => {
    let log = '';

    const ours = () => {
      log += 'ours ';
    };

    const theirs = (event: React.SyntheticEvent & BaseUiEventExtension) => {
      event.preventBaseUiDefault();
    };

    const merged = mergeEventHandlers(ours, theirs);
    merged({} as any);

    expect(log).to.equal('');
  });
});
