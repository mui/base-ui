import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { DirectionProvider, type TextDirection } from '@base-ui/react/direction-provider';
import { Slider } from '@base-ui/react/slider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Slider.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Indicator />, () => ({
    render: (node) => {
      return render(<Slider.Root>{node}</Slider.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  const parityCases = ['horizontal-ltr', 'horizontal-rtl', 'vertical-ltr'].flatMap((axis) =>
    ['center', 'edge'].flatMap((alignment) =>
      ['single', 'range'].map((valueShape) => ({ axis, alignment, valueShape })),
    ),
  );

  it.skipIf(isJSDOM).each(parityCases)(
    'preserves keyboard and indicator parity for $axis $alignment $valueShape sliders',
    async ({ axis, alignment, valueShape }) => {
      const vertical = axis === 'vertical-ltr';
      const direction: TextDirection = axis === 'horizontal-rtl' ? 'rtl' : 'ltr';
      const range = valueShape === 'range';
      const edge = alignment === 'edge';
      const { user } = await render(
        <div dir={direction}>
          <DirectionProvider direction={direction}>
            <Slider.Root
              defaultValue={range ? [30, 70] : 30}
              orientation={vertical ? 'vertical' : 'horizontal'}
              thumbAlignment={edge ? 'edge' : 'center'}
              style={vertical ? { height: '100px' } : { width: '100px' }}
            >
              <Slider.Control
                style={vertical ? { height: '100%' } : { width: '100%' }}
                data-testid="control"
              >
                <Slider.Track style={vertical ? { height: '100%' } : { width: '100%' }}>
                  <Slider.Indicator data-testid="indicator" />
                  <Slider.Thumb style={{ width: '10px', height: '10px' }} />
                  {range && <Slider.Thumb style={{ width: '10px', height: '10px' }} />}
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </DirectionProvider>
        </div>,
      );

      const indicator = screen.getByTestId('indicator');
      const startSide = vertical ? 'bottom' : 'insetInlineStart';
      const sizeSide = vertical ? 'height' : 'width';
      const start = edge ? '32%' : '30%';
      const size = edge ? '36%' : '40%';
      let expectedStartSide = range ? start : '0px';
      let expectedSizeSide = range ? size : start;
      if (edge) {
        expectedStartSide = range ? 'var(--start-position)' : '0px';
        expectedSizeSide = range ? 'var(--relative-size)' : 'var(--start-position)';
      }

      await waitFor(() => {
        expect(indicator.style.visibility).toBe('');
      });
      expect(indicator.style[startSide]).toBe(expectedStartSide);
      expect(indicator.style[sizeSide]).toBe(expectedSizeSide);
      if (edge) {
        expect(indicator.style.getPropertyValue('--start-position')).toBe(start);
        expect(indicator.style.getPropertyValue('--relative-size')).toBe(range ? size : '');
      }

      const input = screen.getAllByRole('slider')[0];
      let incrementKey = 'ArrowRight';
      if (vertical) {
        incrementKey = 'ArrowUp';
      } else if (direction === 'rtl') {
        incrementKey = 'ArrowLeft';
      }
      await user.keyboard('[Tab]');
      await user.keyboard(`[${incrementKey}][PageUp][PageDown][End]`);
      expect(input).toHaveAttribute('aria-valuenow', range ? '70' : '100');
      await user.keyboard('[Home]');
      expect(input).toHaveAttribute('aria-valuenow', '0');
    },
  );
});
