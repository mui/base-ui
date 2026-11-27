import { expect, vi, describe, it } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { SafeReact } from '@base-ui/utils/safeReact';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Combobox.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root>
          {node}
          <Combobox.Trigger>Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('warns without relying on React.captureOwnerStack when labeling an external input', async () => {
    const captureOwnerStack = SafeReact.captureOwnerStack;
    Object.defineProperty(SafeReact, 'captureOwnerStack', {
      configurable: true,
      value: undefined,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root>
          <Combobox.Label>Fruit</Combobox.Label>
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Combobox.Label> labels <Combobox.Trigger> only.'),
      );
    } finally {
      errorSpy.mockRestore();
      Object.defineProperty(SafeReact, 'captureOwnerStack', {
        configurable: true,
        value: captureOwnerStack,
      });
    }
  });

  it.skipIf(!isJSDOM)('does not run the development warning in production', async () => {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const captureOwnerStack = SafeReact.captureOwnerStack;
    const captureOwnerStackSpy = vi.fn();
    Object.defineProperty(SafeReact, 'captureOwnerStack', {
      configurable: true,
      value: captureOwnerStackSpy,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root>
          <Combobox.Label>Fruit</Combobox.Label>
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(captureOwnerStackSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      Object.defineProperty(SafeReact, 'captureOwnerStack', {
        configurable: true,
        value: captureOwnerStack,
      });
      process.env.NODE_ENV = nodeEnv;
    }
  });

  describe('prop: render', () => {
    it('labels the trigger with the id of the render element', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Label render={<div id="custom" />}>Fruit</Combobox.Label>
          <Combobox.Trigger>Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByText('Fruit')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Label render={<div id={undefined} />}>Fruit</Combobox.Label>
          <Combobox.Trigger>Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByText('Fruit')).not.toHaveAttribute('id');
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-labelledby');
    });
  });
});
