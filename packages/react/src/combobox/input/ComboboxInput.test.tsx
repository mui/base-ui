import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Field } from '@base-ui-components/react/field';

describe('<Combobox.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  describe('prop: disabled', () => {
    it('should render aria-disabled attribute when disabled', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Input disabled data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('disabled');
    });

    it('should inherit disabled state from ComboboxRoot', async () => {
      await render(
        <Combobox.Root disabled>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('disabled');
    });

    it('should inherit disabled state from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('disabled');
    });

    it('should not open popup when disabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input disabled data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                  <Combobox.Item value="b">b</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should prioritize local disabled over root disabled', async () => {
      await render(
        <Combobox.Root disabled={false}>
          <Combobox.Input disabled data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('disabled');
    });
  });

  describe('prop: readOnly', () => {
    it('should render aria-readonly and readonly attributes when readOnly', async () => {
      await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('aria-readonly', 'true');
      expect(input).to.have.attribute('readonly');
    });

    it('should not open popup when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                  <Combobox.Item value="b">b</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should prevent keyboard interactions when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                  <Combobox.Item value="b">b</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await user.type(input, 'a');
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('allows interactions when readOnly={false}', async () => {
      const { user } = await render(
        <Combobox.Root readOnly={false}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      await waitFor(() => {
        screen.getByRole('option', { name: 'a' });
      });
      await user.click(screen.getByRole('option', { name: 'a' }));
      expect(input).to.have.value('a');
    });
  });

  describe('interaction behavior', () => {
    it('should open popup on typing when enabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'a');

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('should handle multiple selection with chips when disabled', async () => {
      const { user } = await render(
        <Combobox.Root multiple disabled defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const chip = screen.getByTestId('chip');
      const remove = screen.getByTestId('remove');

      expect(input).to.have.attribute('disabled');
      expect(chip).to.have.attribute('aria-disabled', 'true');
      expect(remove).to.have.attribute('disabled');

      await user.type(input, '{backspace}');
      expect(screen.getByTestId('chip')).not.to.equal(null);
    });

    it('should handle multiple selection with chips when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root multiple readOnly defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const chip = screen.getByTestId('chip');
      const remove = screen.getByTestId('remove');

      expect(input).to.have.attribute('aria-readonly', 'true');
      expect(chip).to.have.attribute('aria-readonly', 'true');
      expect(remove).to.have.attribute('aria-readonly', 'true');

      await user.type(input, '{backspace}');
      expect(screen.getByTestId('chip')).not.to.equal(null);
    });

    it('should move focus to clear button when pressing Escape and popup is closed', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} defaultValue="apple">
          <Combobox.Input data-testid="input" />
          <Combobox.Clear data-testid="clear" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).to.equal('');
      });

      await user.type(input, 'a');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });
      await user.click(screen.getByRole('option', { name: 'apple' }));

      await user.type(input, 'a');
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).to.equal('apple');
      });
      expect(screen.queryByRole('listbox')).to.equal(null);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).to.equal('');
      });
    });

    it('pressing Home moves caret to start', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.type(input, 'banana');
      expect(input.value).to.equal('banana');

      await user.keyboard('{Home}');

      expect(input.selectionStart).to.equal(0);
      expect(input.selectionEnd).to.equal(0);
    });

    it('pressing End moves caret to end', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.type(input, 'apple');
      expect(input.value).to.equal('apple');

      await user.keyboard('{End}');

      expect(input.selectionStart).to.equal(input.value.length);
      expect(input.selectionEnd).to.equal(input.value.length);
    });

    it('preserves caret position when controlled and inserting in the middle', async () => {
      function Controlled() {
        const [value, setValue] = React.useState('');
        return (
          <Combobox.Root inputValue={value} onInputValueChange={setValue}>
            <Combobox.Input />
          </Combobox.Root>
        );
      }

      const { user } = await render(<Controlled />);

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.type(input, 'abcd');
      expect(input.value).to.equal('abcd');

      // Move caret left twice to position after "ab"
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(input.selectionStart).to.equal(2);
      expect(input.selectionEnd).to.equal(2);

      await user.keyboard('xxx');
      expect(input.value).to.equal('abxxxcd');
      expect(input.selectionStart).to.equal(5);
      expect(input.selectionEnd).to.equal(5);

      await user.keyboard('y');
      expect(input.value).to.equal('abxxxycd');
      expect(input.selectionStart).to.equal(6);
      expect(input.selectionEnd).to.equal(6);
    });
  });
});
