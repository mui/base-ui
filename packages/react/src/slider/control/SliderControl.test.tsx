import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Slider } from '@base-ui/react/slider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { getHorizontalSliderRect } from '../utils/test-utils';

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
});
