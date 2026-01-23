import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';

describe('<Combobox.ChipRemove />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.ChipRemove />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(
        <Combobox.Root multiple>
          <Combobox.Chips>
            <Combobox.Chip>{node}</Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('should render disabled attribute when disabled', async () => {
      await render(
        <Combobox.Root multiple disabled>
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove">×</Combobox.ChipRemove>
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');
      expect(remove).to.have.attribute('aria-disabled', 'true');
    });

    it('should not remove chip when disabled', async () => {
      const handleValueChange = spy();
      const { user } = await render(
        <Combobox.Root
          multiple
          disabled
          defaultValue={['apple', 'banana']}
          onValueChange={handleValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip-apple">
              apple
              <Combobox.ChipRemove data-testid="remove-apple" />
            </Combobox.Chip>
            <Combobox.Chip data-testid="chip-banana">
              banana
              <Combobox.ChipRemove data-testid="remove-banana" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const removeApple = screen.getByTestId('remove-apple');

      await user.click(removeApple);

      expect(handleValueChange.callCount).to.equal(0);
      expect(screen.getByTestId('chip-apple')).not.to.equal(null);
    });
  });

  describe('prop: readOnly', () => {
    it('should render aria-readonly attribute when readOnly', async () => {
      await render(
        <Combobox.Root multiple readOnly>
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');
      expect(remove).to.have.attribute('aria-readonly', 'true');
    });

    it('should not remove chip when readOnly', async () => {
      const handleValueChange = spy();
      const { user } = await render(
        <Combobox.Root
          multiple
          readOnly
          defaultValue={['apple', 'banana']}
          onValueChange={handleValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip-apple">
              apple
              <Combobox.ChipRemove data-testid="remove-apple" />
            </Combobox.Chip>
            <Combobox.Chip data-testid="chip-banana">
              banana
              <Combobox.ChipRemove data-testid="remove-banana" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const removeApple = screen.getByTestId('remove-apple');

      await user.click(removeApple);

      expect(handleValueChange.callCount).to.equal(0);
      expect(screen.getByTestId('chip-apple')).not.to.equal(null);
    });

    it('should be focusable but not functional when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root multiple readOnly>
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');

      // Should be focusable
      remove.focus();
      expect(remove).toHaveFocus();

      // But should not trigger action
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('remove')).not.to.equal(null);
    });
  });

  describe('interaction behavior', () => {
    it('should remove chip on click when enabled', async () => {
      const handleValueChange = spy();
      const { user } = await render(
        <Combobox.Root
          multiple
          defaultValue={['apple', 'banana']}
          onValueChange={handleValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip-apple">
              apple
              <Combobox.ChipRemove data-testid="remove-apple" />
            </Combobox.Chip>
            <Combobox.Chip data-testid="chip-banana">
              banana
              <Combobox.ChipRemove data-testid="remove-banana" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const removeApple = screen.getByTestId('remove-apple');

      await user.click(removeApple);

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(['banana']);
    });

    it('should focus input after removing chip', async () => {
      const { user } = await render(
        <Combobox.Root multiple defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');
      const input = screen.getByTestId('input');

      await user.click(remove);

      expect(input).toHaveFocus();
    });

    it('should prevent event propagation', async () => {
      const handleChipClick = spy();
      const handleRemoveClick = spy();
      const { user } = await render(
        <Combobox.Root multiple defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip onClick={handleChipClick}>
              apple
              <Combobox.ChipRemove data-testid="remove" onClick={handleRemoveClick} />
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');

      await user.click(remove);

      // Remove click should happen but not propagate to chip
      expect(handleRemoveClick.callCount).to.equal(1);
      expect(handleChipClick.callCount).to.equal(0);
    });

    it('should handle keyboard activation', async () => {
      const handleValueChange = spy();
      const { user } = await render(
        <Combobox.Root
          multiple
          defaultValue={['apple', 'banana']}
          onValueChange={handleValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove">×</Combobox.ChipRemove>
            </Combobox.Chip>
            <Combobox.Chip>banana</Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');

      remove.focus();
      await user.keyboard('{Enter}');

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(['banana']);
    });

    it('should have proper tab index', async () => {
      await render(
        <Combobox.Root multiple>
          <Combobox.Chips>
            <Combobox.Chip>
              apple
              <Combobox.ChipRemove data-testid="remove">×</Combobox.ChipRemove>
            </Combobox.Chip>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const remove = screen.getByTestId('remove');
      expect(remove).to.have.attribute('tabindex', '-1');
    });
  });
});
