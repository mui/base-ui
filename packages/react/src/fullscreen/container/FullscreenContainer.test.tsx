import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer, describeConformance } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Container />', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  describeConformance(<Fullscreen.Container />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<Fullscreen.Root>{node}</Fullscreen.Root>);
    },
  }));

  describe('render prop state', () => {
    it('passes the fullscreen state to render, className, and style callbacks', async () => {
      const renderSpy = vi.fn();
      const classNameSpy = vi.fn().mockReturnValue('container-class');
      const styleSpy = vi.fn().mockReturnValue({ color: 'red' });

      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container
            className={classNameSpy}
            style={styleSpy}
            render={(props, state) => {
              renderSpy(state);
              return <div data-testid="container" {...props} />;
            }}
          />
        </Fullscreen.Root>,
      );

      const initialState = renderSpy.mock.calls.at(-1)?.[0];
      expect(initialState).toEqual({ open: false, disabled: false, supported: true });
      expect(classNameSpy).toHaveBeenLastCalledWith(initialState);
      expect(styleSpy).toHaveBeenLastCalledWith(initialState);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      const openState = renderSpy.mock.calls.at(-1)?.[0];
      expect(openState).toEqual({ open: true, disabled: false, supported: true });
      expect(classNameSpy).toHaveBeenLastCalledWith(openState);
      expect(styleSpy).toHaveBeenLastCalledWith(openState);
    });
  });
});
