import { expect, vi } from 'vitest';
import { Toolbar } from '@base-ui/react/toolbar';
import { NumberField } from '@base-ui/react/number-field';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { NOOP } from '../../internals/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { type Orientation } from '../../internals/types';
import { CompositeRootContext } from '../../internals/composite/root/CompositeRootContext';
import { ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT } from '../../internals/composite/composite';

const testCompositeContext: CompositeRootContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
  highlightItemOnHover: false,
  relayKeyboardEvent: NOOP,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: false,
  orientation: 'horizontal',
};

describe('<Toolbar.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    testRenderPropWith: 'input',
    render: (node) => {
      return render(
        <ToolbarRootContext.Provider value={testToolbarContext}>
          <CompositeRootContext.Provider value={testCompositeContext}>
            {node}
          </CompositeRootContext.Provider>
        </ToolbarRootContext.Provider>,
      );
    },
  }));

  describe('ARIA attributes', () => {
    it('renders a textbox', async () => {
      await render(
        <Toolbar.Root>
          <Toolbar.Input data-testid="input" />
        </Toolbar.Root>,
      );

      expect(screen.getByTestId('input')).toBe(screen.getByRole('textbox'));
    });
  });

  describe('pointer interactions', () => {
    it('does not steal focus while disabled and becomes pointer-focusable when enabled', async () => {
      function TestInput({ disabled }: { disabled: boolean }) {
        return (
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" />
            <Toolbar.Input data-testid="input" disabled={disabled} />
          </Toolbar.Root>
        );
      }

      const { setProps, user } = await render(<TestInput disabled />);
      const button = screen.getByTestId('button');
      const input = screen.getByTestId('input');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.click(input);
      expect(button).toHaveFocus();

      await setProps({ disabled: false });
      await user.click(input);
      expect(input).toHaveFocus();
    });

    it('prevents click default actions while disabled', async () => {
      function TestInput({ disabled }: { disabled: boolean }) {
        return (
          <Toolbar.Root>
            <Toolbar.Input type="checkbox" disabled={disabled} />
          </Toolbar.Root>
        );
      }

      const { setProps, user } = await render(<TestInput disabled />);
      const input = screen.getByRole('checkbox');

      await user.click(input);
      expect(input).not.toBeChecked();

      await setProps({ disabled: false });
      await user.click(input);
      expect(input).toBeChecked();
    });
  });

  describe.skipIf(isJSDOM)('keyboard navigation', () => {
    it.each([
      ['ltr', ARROW_RIGHT, ARROW_LEFT],
      ['rtl', ARROW_LEFT, ARROW_RIGHT],
    ] as const)(
      'respects caret and selection boundaries in horizontal %s toolbars',
      async (direction, nextKey, previousKey) => {
        const { user } = await render(
          <DirectionProvider direction={direction}>
            <Toolbar.Root orientation="horizontal">
              <Toolbar.Button data-testid="before" />
              <Toolbar.Input defaultValue="abcd" />
              <Toolbar.Button data-testid="after" />
            </Toolbar.Root>
          </DirectionProvider>,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        const before = screen.getByTestId('before');
        const after = screen.getByTestId('after');

        await user.keyboard('[Tab]');
        await user.keyboard(`[${nextKey}]`);
        expect(input).toHaveFocus();

        input.setSelectionRange(1, 3);
        await user.keyboard(`[${nextKey}]`);
        expect(input).toHaveFocus();

        input.setSelectionRange(2, 2);
        await user.keyboard(`[ShiftLeft>][${nextKey}][/ShiftLeft]`);
        expect(input).toHaveFocus();

        const nextBoundary =
          direction === 'rtl' || nextKey === ARROW_RIGHT ? input.value.length : 0;
        input.setSelectionRange(nextBoundary, nextBoundary);
        await user.keyboard(`[${nextKey}]`);
        expect(after).toHaveFocus();

        await user.keyboard(`[${previousKey}]`);
        expect(input).toHaveFocus();
        const previousBoundary =
          direction === 'rtl' || previousKey === ARROW_LEFT ? 0 : input.value.length;
        input.setSelectionRange(previousBoundary, previousBoundary);
        await user.keyboard(`[${previousKey}]`);
        expect(before).toHaveFocus();
      },
    );

    // when navigating through RTL text in real browsers the arrow keys for
    // moving the text insertion cursor is also reversed from LTR but this doesn't
    // work with testing library
    [
      ['horizontal', ARROW_RIGHT, ARROW_LEFT],
      ['vertical', ARROW_DOWN, ARROW_UP],
    ].forEach((entry) => {
      const [orientation, nextKey, prevKey] = entry;

      it(`orientation: ${orientation}`, async () => {
        const { user } = await render(
          <Toolbar.Root orientation={orientation as Orientation}>
            <Toolbar.Button />
            <Toolbar.Input defaultValue="abcd" />
            <Toolbar.Button />
          </Toolbar.Root>,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        const [button1, button2] = screen.getAllByRole('button');

        await user.keyboard('[Tab]');
        expect(button1).toHaveFocus();

        await user.keyboard(`[${nextKey}]`);
        expect(input).toHaveFocus();

        // Firefox doesn't support document.getSelection() in inputs
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(4);

        await user.keyboard(`[${ARROW_RIGHT}]`);
        await user.keyboard(`[${nextKey}]`);

        expect(button2).toHaveFocus();

        await user.keyboard(`[${prevKey}]`);
        expect(input).toHaveFocus();

        await user.keyboard(`[${ARROW_LEFT}]`);
        await user.keyboard(`[${prevKey}]`);

        expect(button1).toHaveFocus();
      });
    });
  });

  describe.skipIf(isJSDOM)('disabled', () => {
    it('does not trap keyboard focus when disabled', async () => {
      const { user } = await render(
        <div>
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" />
            <Toolbar.Input defaultValue="abcd" disabled />
          </Toolbar.Root>
          <button type="button" data-testid="after">
            after
          </button>
        </div>,
      );

      const button = screen.getByTestId('button');
      const input = screen.getByRole('textbox');
      const after = screen.getByTestId('after');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.keyboard(`[${ARROW_RIGHT}]`);
      expect(input).toHaveFocus();

      // Tab must leave the toolbar instead of being trapped on the disabled input
      await user.keyboard('[Tab]');
      expect(after).toHaveFocus();

      await user.keyboard('[ShiftLeft>][Tab][/ShiftLeft]');
      expect(input).toHaveFocus();
    });

    it('does not block vertical roving focus when disabled', async () => {
      const { user } = await render(
        <Toolbar.Root orientation="vertical">
          <Toolbar.Button data-testid="button1" />
          <Toolbar.Input defaultValue="abcd" disabled />
          <Toolbar.Button data-testid="button2" />
        </Toolbar.Root>,
      );

      const input = screen.getByRole('textbox');
      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');

      await user.keyboard('[Tab]');
      expect(button1).toHaveFocus();

      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(input).toHaveFocus();

      // ArrowDown must move roving focus past the disabled input
      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(button2).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      expect(input).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      expect(button1).toHaveFocus();
    });
  });

  describe('rendering NumberField', () => {
    it('renders NumberField.Input', async () => {
      await render(
        <Toolbar.Root>
          <NumberField.Root>
            <NumberField.Group>
              <Toolbar.Input render={<NumberField.Input />} />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-roledescription', 'Number field');
    });

    it('handles interactions', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <Toolbar.Root>
          <NumberField.Root min={1} max={10} defaultValue={5} onValueChange={onValueChange}>
            <NumberField.Group>
              <NumberField.Decrement />
              <Toolbar.Input render={<NumberField.Input />} />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      const input = screen.getByRole('textbox');

      await user.keyboard('[Tab]');
      expect(input).toHaveAttribute('tabindex', '0');
      expect(input).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.calls[0][0]).toBe(6);

      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(onValueChange.mock.calls.length).toBe(2);
      expect(onValueChange.mock.calls[1][0]).toBe(5);
    });

    it('disabled state', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <Toolbar.Root>
          <NumberField.Root min={1} max={10} defaultValue={5} onValueChange={onValueChange}>
            <NumberField.Group>
              <NumberField.Decrement />
              <Toolbar.Input disabled render={<NumberField.Input />} />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      const input = screen.getByRole('textbox');

      expect(input).not.toHaveAttribute('disabled');
      expect(input).toHaveAttribute('data-disabled');
      expect(input).toHaveAttribute('aria-disabled', 'true');

      await user.keyboard('[Tab]');
      expect(input).toHaveAttribute('tabindex', '0');
      expect(input).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(onValueChange.mock.calls.length).toBe(0);
    });
  });
});
