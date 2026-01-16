import { expect } from 'chai';
import { spy } from 'sinon';
import { mergeProps } from '@base-ui/react/merge-props';
import type { BaseUIEvent } from '../utils/types';

describe('mergeProps', () => {
  it('merges event handlers', () => {
    const theirProps = {
      onClick: spy(),
      onKeyDown: spy(),
    };
    const ourProps = {
      onClick: spy(),
      onPaste: spy(),
    };
    const mergedProps = mergeProps<'button'>(ourProps, theirProps);

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
    mergedProps.onKeyDown?.({ nativeEvent: new KeyboardEvent('keydown') } as any);
    mergedProps.onPaste?.({ nativeEvent: new Event('paste') } as any);

    expect(theirProps.onClick.calledBefore(ourProps.onClick)).to.equal(true);
    expect(theirProps.onClick.callCount).to.equal(1);
    expect(ourProps.onClick.callCount).to.equal(1);
    expect(theirProps.onKeyDown.callCount).to.equal(1);
    expect(ourProps.onPaste.callCount).to.equal(1);
  });

  it('merges multiple event handlers', () => {
    const log: string[] = [];

    const mergedProps = mergeProps<'button'>(
      {
        onClick() {
          log.push('3');
        },
      },
      {
        onClick() {
          log.push('2');
        },
      },
      {
        onClick() {
          log.push('1');
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
    expect(log).to.deep.equal(['1', '2', '3']);
  });

  it('merges undefined event handlers', () => {
    const log: string[] = [];

    const mergedProps = mergeProps<'button'>(
      {
        onClick() {
          log.push('3');
        },
      },
      {
        onClick: undefined,
      },
      {
        onClick() {
          log.push('1');
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
    expect(log).to.deep.equal(['1', '3']);
  });

  it('merges styles', () => {
    const theirProps = {
      style: { color: 'red' },
    };
    const ourProps = {
      style: { color: 'blue', backgroundColor: 'blue' },
    };
    const mergedProps = mergeProps<'div'>(ourProps, theirProps);

    expect(mergedProps.style).to.deep.equal({
      color: 'red',
      backgroundColor: 'blue',
    });
  });

  it('merges styles with undefined', () => {
    const theirProps = {
      style: { color: 'red' },
    };
    const ourProps = {};

    const mergedProps = mergeProps<'button'>(ourProps, theirProps);

    expect(mergedProps.style).to.deep.equal({
      color: 'red',
    });
  });

  it('does not merge styles if both are undefined', () => {
    const theirProps = {};
    const ourProps = {};
    const mergedProps = mergeProps<'button'>(ourProps, theirProps);

    expect(mergedProps.style).to.equal(undefined);
  });

  it('merges classNames with rightmost first', () => {
    const theirProps = {
      className: 'external-class',
    };
    const ourProps = {
      className: 'internal-class',
    };
    const mergedProps = mergeProps<'div'>(ourProps, theirProps);

    expect(mergedProps.className).to.equal('external-class internal-class');
  });

  it('merges multiple classNames', () => {
    const mergedProps = mergeProps<'div'>(
      {
        className: 'class-1',
      },
      {
        className: 'class-2',
      },
      {
        className: 'class-3',
      },
    );

    expect(mergedProps.className).to.equal('class-3 class-2 class-1');
  });

  it('merges classNames with undefined', () => {
    const theirProps = {
      className: 'external-class',
    };
    const ourProps = {};

    const mergedProps = mergeProps<'button'>(ourProps, theirProps);

    expect(mergedProps.className).to.equal('external-class');
  });

  it('does not merge classNames if both are undefined', () => {
    const theirProps = {};
    const ourProps = {};
    const mergedProps = mergeProps<'button'>(ourProps, theirProps);

    expect(mergedProps.className).to.equal(undefined);
  });

  it('does not prevent internal handler if event.preventBaseUIHandler() is not called', () => {
    let ran = false;

    const mergedProps = mergeProps<'button'>(
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

    const mergedProps = mergeProps<'button'>(
      {
        onClick: function onClick3() {
          ran = true;
        },
      },
      {
        onClick: function onClick2() {
          ran = true;
        },
      },
      {
        onClick: function onClick1(event) {
          event.preventBaseUIHandler();
        },
      },
    );

    const event = { nativeEvent: new MouseEvent('click') } as any;
    mergedProps.onClick?.(event);

    expect(ran).to.equal(false);
  });

  it('prevents handlers merged after event.preventBaseUIHandler() is called', () => {
    const log: string[] = [];

    const mergedProps = mergeProps<any>(
      {
        onClick() {
          log.push('2');
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
          log.push('0');
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') });

    expect(log).to.deep.equal(['0', '1']);
  });

  [true, 13, 'newValue', { key: 'value' }, ['value'], () => 'value'].forEach((eventArgument) => {
    it('handles non-standard event handlers without error', () => {
      const log: string[] = [];

      const mergedProps = mergeProps<any>(
        {
          onValueChange() {
            log.push('1');
          },
        },
        {
          onValueChange() {
            log.push('0');
          },
        },
      );

      mergedProps.onValueChange(eventArgument);

      expect(log).to.deep.equal(['0', '1']);
    });
  });

  it('merges internal props so that the ones defined first override the ones defined later', () => {
    const mergedProps = mergeProps<'button'>(
      {
        title: 'internal title 2',
      },
      {
        title: 'internal title 1',
      },
      {},
    );

    expect(mergedProps.title).to.equal('internal title 1');
  });

  it('sets baseUIHandlerPrevented to true after calling preventBaseUIHandler()', () => {
    let observedFlag: boolean | undefined;

    const mergedProps = mergeProps<'button'>(
      {
        onClick() {},
      },
      {
        onClick(event) {
          event.preventBaseUIHandler();
          observedFlag = event.baseUIHandlerPrevented;
        },
      },
    );

    mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);

    expect(observedFlag).to.equal(true);
  });

  describe('props getters', () => {
    it('calls the props getter with the props defined after it', () => {
      let observedProps;
      const propsGetter = spy((props) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(
        {
          id: '2',
          className: 'test-class',
        },
        propsGetter,
        {
          id: '1',
          role: 'button',
        },
      );

      expect(propsGetter.calledOnce).to.equal(true);
      expect(observedProps).to.deep.equal({ id: '2', className: 'test-class' });
    });

    it('calls the props getter with merged props defined after it', () => {
      let observedProps;
      const propsGetter = spy((props) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(
        {
          role: 'button',
          className: 'test-class',
        },
        {
          role: 'tab',
        },
        propsGetter,
        {
          id: 'one',
        },
      );

      expect(propsGetter.calledOnce).to.equal(true);
      expect(observedProps).to.deep.equal({
        role: 'tab',
        className: 'test-class',
      });
    });

    it('calls the props getter with an empty object if no props are defined after it', () => {
      let observedProps;
      const propsGetter = spy((props) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(propsGetter, { id: '1' });

      expect(propsGetter.calledOnce).to.equal(true);
      expect(observedProps).to.deep.equal({});
    });

    it('accepts the result of the props getter', () => {
      const propsGetter = () => ({ className: 'test-class' });
      const result = mergeProps(
        {
          id: 'two',
          role: 'tab',
        },
        {
          id: 'one',
        },
        propsGetter,
      );

      expect(result).to.deep.equal({
        className: 'test-class',
      });
    });

    it('does not automatically prevent handlers that are manually called by getter handlers', () => {
      const log: string[] = [];

      const mergedProps = mergeProps<'button'>(
        {
          onClick() {
            log.push('first-handler');
          },
        },
        (props) => ({
          onClick(event: BaseUIEvent<React.MouseEvent>) {
            // Call preventBaseUIHandler to signal prevention
            event.preventBaseUIHandler();
            log.push('getter-handler');
            // Manually calling the previous handler - this bypasses automatic prevention!
            props.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
          },
        }),
        {
          onClick() {
            // This handler does NOT call preventBaseUIHandler, so getter-handler runs
            log.push('last-handler');
          },
        },
      );

      mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);

      // last-handler runs first, then getter-handler (not prevented), then getter-handler
      // manually calls first-handler which runs despite preventBaseUIHandler being called
      expect(log).to.deep.equal(['last-handler', 'getter-handler', 'first-handler']);
    });

    it('allows props getter handlers to check baseUIHandlerPrevented manually', () => {
      const log: string[] = [];

      const mergedProps = mergeProps<'button'>(
        {
          onClick() {
            log.push('first-handler');
          },
        },
        (props) => ({
          onClick(event: BaseUIEvent<React.MouseEvent>) {
            // Call preventBaseUIHandler to signal prevention
            event.preventBaseUIHandler();
            log.push('getter-handler');
            // Check the flag before manually calling previous handlers - this respects prevention
            if (!event.baseUIHandlerPrevented) {
              props.onClick?.({ nativeEvent: new MouseEvent('click') } as any);
            }
          },
        }),
        {
          onClick() {
            // This handler does NOT call preventBaseUIHandler, so getter-handler runs
            log.push('last-handler');
          },
        },
      );

      mergedProps.onClick?.({ nativeEvent: new MouseEvent('click') } as any);

      // first-handler does NOT run because getter-handler checks the flag before calling it
      expect(log).to.deep.equal(['last-handler', 'getter-handler']);
    });
  });
});
