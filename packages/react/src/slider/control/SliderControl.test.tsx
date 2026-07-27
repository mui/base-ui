import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Slider } from '@base-ui/react/slider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { createTouches, getHorizontalSliderRect } from '../utils/test-utils';

describe('<Slider.Control />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Control />, () => ({
    render: (node) => {
      return render(<Slider.Root>{node}</Slider.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('does not apply a tabIndex by default', async () => {
    await render(
      <Slider.Root defaultValue={50}>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );

    expect(screen.getByTestId('control')).not.toHaveAttribute('tabindex');
  });

  it('throws a descriptive error when rendered outside <Slider.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Slider.Control />)).rejects.toThrow(
        'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('moves the first of several thumbs stacked at the maximum', async () => {
    const onValueChange = vi.fn();

    await render(
      <Slider.Root defaultValue={[100, 100, 100]} onValueChange={onValueChange}>
        <Slider.Control data-testid="control">
          <Slider.Thumb index={0} data-testid="thumb-0" />
          <Slider.Thumb index={1} data-testid="thumb-1" />
          <Slider.Thumb index={2} data-testid="thumb-2" />
        </Slider.Control>
      </Slider.Root>,
    );

    const control = screen.getByTestId('control');
    const lastThumb = screen.getByTestId('thumb-2');
    vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);
    vi.spyOn(lastThumb, 'getBoundingClientRect').mockReturnValue(new DOMRect(90, 0, 20, 10));

    fireEvent.pointerDown(lastThumb, { buttons: 1, clientX: 100 });
    fireEvent.pointerMove(document.body, { buttons: 1, clientX: 50 });

    expect(onValueChange).toHaveBeenLastCalledWith(
      [50, 100, 100],
      expect.objectContaining({ activeThumbIndex: 0, reason: 'drag' }),
    );
  });

  it('clears the grabbed offset when swapping to a thumb that is not rendered', async () => {
    const onValueChange = vi.fn();

    await render(
      <Slider.Root
        defaultValue={[20, 40]}
        thumbCollisionBehavior="swap"
        onValueChange={onValueChange}
      >
        <Slider.Control data-testid="control">
          <Slider.Thumb index={0} data-testid="thumb" />
        </Slider.Control>
      </Slider.Root>,
    );

    const control = screen.getByTestId('control');
    const thumb = screen.getByTestId('thumb');
    vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);
    vi.spyOn(thumb, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 0, 20, 10));

    fireEvent.pointerDown(thumb, { buttons: 1, clientX: 30 });
    fireEvent.pointerMove(document.body, { buttons: 1, clientX: 70 });
    fireEvent.pointerMove(document.body, { buttons: 1, clientX: 80 });

    expect(onValueChange).toHaveBeenLastCalledWith(
      [40, 80],
      expect.objectContaining({ activeThumbIndex: 1, reason: 'drag' }),
    );
  });

  it('ignores a drag when collision behavior cannot satisfy the minimum distance', async () => {
    const onValueChange = vi.fn();

    await render(
      <Slider.Root
        value={[20, 40]}
        thumbCollisionBehavior="none"
        minStepsBetweenValues={50}
        onValueChange={onValueChange}
      >
        <Slider.Control data-testid="control">
          <Slider.Thumb index={0} data-testid="thumb" />
          <Slider.Thumb index={1} />
        </Slider.Control>
      </Slider.Root>,
    );

    const control = screen.getByTestId('control');
    const thumb = screen.getByTestId('thumb');
    vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);
    vi.spyOn(thumb, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 0, 20, 10));

    fireEvent.pointerDown(thumb, { button: 0, buttons: 1, clientX: 20 });
    fireEvent.pointerMove(document.body, { buttons: 1, clientX: 80 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  [
    {
      name: 'horizontal',
      orientation: 'horizontal' as const,
      controlRect: new DOMRect(0, 0, 100, 10),
      thumbRect: new DOMRect(40, 0, 20, 10),
      pointer: { clientX: 10, clientY: 5 },
    },
    {
      name: 'vertical',
      orientation: 'vertical' as const,
      controlRect: new DOMRect(0, 0, 10, 100),
      thumbRect: new DOMRect(0, 40, 10, 20),
      pointer: { clientX: 5, clientY: 90 },
    },
  ].forEach(({ name, orientation, controlRect, thumbRect, pointer }) => {
    it(`accounts for the thumb size when pressing an inset ${name} control`, async () => {
      const onValueChange = vi.fn();

      await render(
        <Slider.Root
          defaultValue={50}
          orientation={orientation}
          thumbAlignment="edge-client-only"
          onValueChange={onValueChange}
        >
          <Slider.Control data-testid="control">
            <Slider.Thumb data-testid="thumb" />
          </Slider.Control>
        </Slider.Root>,
      );

      const control = screen.getByTestId('control');
      vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(controlRect);
      vi.spyOn(screen.getByTestId('thumb'), 'getBoundingClientRect').mockReturnValue(thumbRect);

      fireEvent.pointerDown(control, { button: 0, buttons: 1, ...pointer });

      expect(onValueChange).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ activeThumbIndex: 0, reason: 'track-press' }),
      );
    });
  });

  it('releases pointer capture when the interaction ends', async () => {
    await render(
      <Slider.Root defaultValue={20}>
        <Slider.Control data-testid="control">
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );

    const control = screen.getByTestId('control');
    vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);
    const releasePointerCapture = vi.fn();
    Object.defineProperties(control, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: () => true },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
    });

    fireEvent.pointerDown(control, {
      pointerId: 7,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 40,
    });
    fireEvent.pointerUp(document.body, {
      pointerId: 7,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 40,
    });

    expect(releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('degrades safely when a custom render function drops the control ref', async () => {
    const onValueChange = vi.fn();
    const { unmount } = await render(
      <Slider.Root defaultValue={20} onValueChange={onValueChange}>
        <Slider.Control data-testid="control" render={(props) => <div {...props} ref={null} />}>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );

    fireEvent.pointerDown(screen.getByTestId('control'), {
      button: 0,
      buttons: 1,
      clientX: 80,
    });
    expect(onValueChange).not.toHaveBeenCalled();

    unmount();
  });

  it.skipIf(isJSDOM || typeof Touch === 'undefined')(
    'handles touch interactions that originate on a text node',
    async () => {
      const onValueChange = vi.fn();

      await render(
        <Slider.Root defaultValue={20} onValueChange={onValueChange}>
          <Slider.Control data-testid="control">
            <span data-testid="track-text">Track</span>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>,
      );

      const control = screen.getByTestId('control');
      vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);
      const textNode = screen.getByTestId('track-text').firstChild!;

      fireEvent.touchStart(textNode, createTouches([{ identifier: 1, clientX: 60, clientY: 0 }]));

      expect(onValueChange).toHaveBeenCalledWith(
        60,
        expect.objectContaining({ activeThumbIndex: 0, reason: 'track-press' }),
      );
    },
  );

  it.skipIf(isJSDOM || typeof Touch === 'undefined')(
    'ignores touch interactions when no thumbs are composed',
    async () => {
      const onValueChange = vi.fn();

      await render(
        <Slider.Root
          defaultValue={20}
          thumbAlignment="edge-client-only"
          onValueChange={onValueChange}
        >
          <Slider.Control data-testid="control" />
        </Slider.Root>,
      );

      const control = screen.getByTestId('control');
      fireEvent.touchStart(control, createTouches([{ identifier: 1, clientX: 60, clientY: 0 }]));
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
      );

      expect(onValueChange).not.toHaveBeenCalled();
    },
  );

  // Requires layout: the range drag relies on real thumb measurements.
  it.skipIf(isJSDOM)(
    'does not resurrect a removed thumb value when the range shrinks mid-drag',
    async () => {
      const onValueChange = vi.fn();
      const onValueCommitted = vi.fn();

      function App() {
        const [value, setValue] = React.useState<number[]>([10, 20, 30]);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setValue([10, 20])}>
              shrink
            </button>
            <Slider.Root
              value={value}
              min={0}
              max={100}
              onValueChange={onValueChange}
              onValueCommitted={onValueCommitted}
            >
              <Slider.Control data-testid="control">
                {value.map((_, index) => (
                  <Slider.Thumb key={index} index={index} data-testid={`thumb-${index}`} />
                ))}
              </Slider.Control>
            </Slider.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      const control = screen.getByTestId('control');
      vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);

      // Press the last thumb so the pressed index points at index 2.
      fireEvent.pointerDown(screen.getByTestId('thumb-2'), { buttons: 1, clientX: 30 });

      // Cache a committed drag value before the range shrinks.
      fireEvent.pointerMove(document.body, { buttons: 1, clientX: 50 });
      expect(onValueChange).toHaveBeenCalledWith(
        [10, 20, 100],
        expect.objectContaining({ reason: 'drag' }),
      );

      // Shrink the value array while the pointer is still down, removing index 2.
      // `fireEvent.click` avoids dispatching a `pointerup` that would end the drag.
      fireEvent.click(screen.getByRole('button', { name: 'shrink' }));
      await waitFor(() => {
        expect(screen.getAllByRole('slider')).toHaveLength(2);
      });

      onValueChange.mockClear();
      onValueCommitted.mockClear();

      // A subsequent move must not write past the end of the shrunken array.
      fireEvent.pointerMove(document.body, { buttons: 1, clientX: 50 });
      fireEvent.pointerUp(document.body, { buttons: 0, clientX: 50 });

      expect(onValueChange).not.toHaveBeenCalled();
      expect(onValueCommitted).not.toHaveBeenCalled();
    },
  );

  // Requires layout: the range drag relies on real thumb measurements.
  it.skipIf(isJSDOM)(
    'does not commit a stale value when the range shrinks mid-drag and the pressed thumb stays valid',
    async () => {
      const onValueChange = vi.fn();
      const onValueCommitted = vi.fn();

      function App() {
        const [value, setValue] = React.useState<number[]>([10, 20, 30]);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setValue([10, 20])}>
              shrink
            </button>
            <Slider.Root
              value={value}
              min={0}
              max={100}
              onValueChange={onValueChange}
              onValueCommitted={onValueCommitted}
            >
              <Slider.Control data-testid="control">
                {value.map((_, index) => (
                  <Slider.Thumb key={index} index={index} data-testid={`thumb-${index}`} />
                ))}
              </Slider.Control>
            </Slider.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      const control = screen.getByTestId('control');
      vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);

      // Press the middle thumb so the pressed index (1) stays in range after the shrink.
      fireEvent.pointerDown(screen.getByTestId('thumb-1'), { buttons: 1, clientX: 20 });

      // Cache a 3-element drag value before the range shrinks.
      fireEvent.pointerMove(document.body, { buttons: 1, clientX: 40 });
      expect(onValueChange).toHaveBeenCalled();
      expect(onValueChange.mock.calls.at(-1)?.[0]).toHaveLength(3);

      // Shrink the value array while the pointer is still down. Index 1 is still valid,
      // so the pressed-index guard alone would not invalidate the cached 3-element array.
      fireEvent.click(screen.getByRole('button', { name: 'shrink' }));
      await waitFor(() => {
        expect(screen.getAllByRole('slider')).toHaveLength(2);
      });

      onValueChange.mockClear();
      onValueCommitted.mockClear();

      // Releasing without a reconciling move must not commit the now-mismatched array.
      fireEvent.pointerUp(document.body, { buttons: 0, clientX: 40 });

      expect(onValueCommitted).not.toHaveBeenCalled();
    },
  );

  // Requires layout: the range drag relies on real thumb measurements.
  it.skipIf(isJSDOM)(
    'clears cached interaction state when the controlled range grows mid-drag',
    async () => {
      const onValueChange = vi.fn();
      const onValueCommitted = vi.fn();

      function App() {
        const [value, setValue] = React.useState<number[]>([10, 20]);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setValue([10, 20, 30])}>
              grow
            </button>
            <Slider.Root
              value={value}
              min={0}
              max={100}
              onValueChange={(nextValue, details) => {
                onValueChange(nextValue, details);
                setValue(nextValue as number[]);
              }}
              onValueCommitted={onValueCommitted}
            >
              <Slider.Control data-testid="control">
                {value.map((_, index) => (
                  <Slider.Thumb key={index} index={index} data-testid={`thumb-${index}`} />
                ))}
              </Slider.Control>
            </Slider.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      const control = screen.getByTestId('control');
      vi.spyOn(control, 'getBoundingClientRect').mockImplementation(getHorizontalSliderRect);

      fireEvent.pointerDown(screen.getByTestId('thumb-1'), { buttons: 1, clientX: 20 });
      fireEvent.pointerMove(document.body, { buttons: 1, clientX: 40 });
      fireEvent.click(screen.getByRole('button', { name: 'grow' }));
      await waitFor(() => {
        expect(screen.getAllByRole('slider')).toHaveLength(3);
      });

      onValueChange.mockClear();
      onValueCommitted.mockClear();
      fireEvent.pointerUp(document.body, { buttons: 0, clientX: 40 });

      expect(onValueCommitted).not.toHaveBeenCalled();

      fireEvent.pointerDown(screen.getByTestId('thumb-2'), { buttons: 1, clientX: 30 });
      fireEvent.pointerMove(document.body, { buttons: 1, clientX: 80 });
      fireEvent.pointerUp(document.body, { buttons: 0, clientX: 80 });

      const nextValue = onValueChange.mock.lastCall?.[0];
      expect(nextValue).toEqual([10, 20, 100]);
      expect(onValueCommitted).toHaveBeenCalledWith(
        nextValue,
        expect.objectContaining({ reason: 'drag' }),
      );
    },
  );
});
