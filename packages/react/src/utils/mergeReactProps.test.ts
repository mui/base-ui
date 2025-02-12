import { expect } from 'chai';
import { spy } from 'sinon';
import { mergeReactProps } from './mergeReactProps';
import type { BaseUIEvent } from './types';

describe('mergeReactProps', () => {
  it('merges event handlers', () => {
    const theirProps = {
      onClick: spy(),
      onKeyDown: spy(),
    };
    const ourProps = {
      onClick: spy(),
      onPaste: spy(),
    };
    const mergedProps = mergeReactProps<'button'>(theirProps, ourProps);

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
    mergedProps.onKeyDown?.({ nativeEvent: new KeyboardEvent('keydown') } as any);
    mergedProps.onPaste?.({ nativeEvent: new ClipboardEvent('paste') } as any);

    expect(theirProps.onClick.calledBefore(ourProps.onClick)).to.equal(true);
    expect(theirProps.onClick.callCount).to.equal(1);
    expect(ourProps.onClick.callCount).to.equal(1);
    expect(theirProps.onKeyDown.callCount).to.equal(1);
    expect(ourProps.onPaste.callCount).to.equal(1);
  });

  it('merges multiple event handlers', () => {
    const log: string[] = [];

    const mergedProps = mergeReactProps<'button'>(
      {
        onClick() {
          log.push('1');
        },
      },
      {
        onClick() {
          log.push('2');
        },
      },
      {
        onClick() {
          log.push('3');
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
    expect(log).to.deep.equal(['1', '2', '3']);
  });

  it('merges styles', () => {
    const theirProps = {
      style: { color: 'red' },
    };
    const ourProps = {
      style: { color: 'blue', backgroundColor: 'blue' },
    };
    const mergedProps = mergeReactProps<'div'>(theirProps, ourProps);

    expect(mergedProps.style).to.deep.equal({
      color: 'red',
      backgroundColor: 'blue',
    });
  });

  it('merges styles with undefined', () => {
    const theirProps = {
      style: { color: 'red' },
    };
    const ourProps = {
      style: undefined,
    };
    const mergedProps = mergeReactProps<'button'>(theirProps, ourProps);

    expect(mergedProps.style).to.deep.equal({
      color: 'red',
    });
  });

  it('does not merge styles if both are undefined', () => {
    const theirProps = {
      style: undefined,
    };
    const ourProps = {
      style: undefined,
    };
    const mergedProps = mergeReactProps<'button'>(theirProps, ourProps);

    expect(mergedProps.style).to.equal(undefined);
  });

  it('does not prevent internal handler if event.preventBaseUIHandler() is not called', () => {
    let ran = false;

    const mergedProps = mergeReactProps<'button'>(
      {
        onClick() {},
      },
      {
        onClick() {
          ran = true;
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);

    expect(ran).to.equal(true);
  });

  it('prevents internal handler if event.preventBaseUIHandler() is called', () => {
    let ran = false;

    const mergedProps = mergeReactProps<'button'>(
      {
        onClick(event) {
          event.preventBaseUIHandler();
        },
      },
      {
        onClick() {
          ran = true;
        },
      },
      {
        onClick() {
          ran = true;
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);

    expect(ran).to.equal(false);
  });

  it('prevents handlers merged after event.preventBaseUIHandler() is called', () => {
    const log: string[] = [];

    const mergedProps = mergeReactProps(
      {
        onClick() {
          log.push('0');
        },
      },
      {
        onClick(event: BaseUIEvent<React.MouseEvent>) {
          event.preventBaseUIHandler();
          log.push('1');
        },
      },
      {
        onClick() {
          log.push('2');
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') });

    expect(log).to.deep.equal(['0', '1']);
  });

  [true, 13, 'newValue', { key: 'value' }, ['value'], () => 'value'].forEach((eventArgument) => {
    it('handles non-standard event handlers without error', () => {
      const log: string[] = [];

      const mergedProps = mergeReactProps(
        {
          onValueChange() {
            log.push('0');
          },
        },
        {
          onValueChange() {
            log.push('1');
          },
        },
      );

      mergedProps.onValueChange(eventArgument);

      expect(log).to.deep.equal(['0', '1']);
    });
  });

  it('merges internal props so that the ones defined first override the ones defined later', () => {
    const mergedProps = mergeReactProps<'button'>(
      {},
      {
        title: 'internal title 1',
      },
      {
        title: 'internal title 2',
      },
    );

    expect(mergedProps.title).to.equal('internal title 1');
  });
});
