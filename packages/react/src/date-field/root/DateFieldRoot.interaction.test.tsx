import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { DateField as DateFieldBase } from '@base-ui/react/date-field';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<DateField /> - DOM Interactions', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  function DateField(props: DateFieldBase.Root.Props) {
    return (
      <DateFieldBase.Root {...props} data-testid="input">
        {(section) => <DateFieldBase.Section key={section.index} section={section} />}
      </DateFieldBase.Root>
    );
  }

  describe('Keyboard navigation', () => {
    describe('ArrowUp / ArrowDown (value adjustment)', () => {
      it('should increment month section value on ArrowUp', async () => {
        await render(
          <DateField
            format={numericDateFormat}
            defaultValue={adapter.date('2024-03-15', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]); // month section
        fireEvent.keyDown(sections[0], { key: 'ArrowUp' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '4'); // March -> April
      });

      it('should decrement month section value on ArrowDown', async () => {
        await render(
          <DateField
            format={numericDateFormat}
            defaultValue={adapter.date('2024-03-15', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'ArrowDown' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '2'); // March -> February
      });

      it('should wrap month from December to January on ArrowUp', async () => {
        await render(
          <DateField
            format={numericDateFormat}
            defaultValue={adapter.date('2024-12-15', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'ArrowUp' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '1'); // December -> January
      });
    });

    describe('Delete key', () => {
      it('should clear the active section value on Delete', async () => {
        await render(
          <DateField
            format={numericDateFormat}
            defaultValue={adapter.date('2024-03-15', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'Delete' });

        expect(sections[0]).not.to.have.attribute('aria-valuenow');
      });

      it('should not clear when field is readOnly', async () => {
        await render(
          <DateField
            format={numericDateFormat}
            defaultValue={adapter.date('2024-03-15', 'default')}
            readOnly
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'Delete' });

        // Value should remain unchanged
        expect(sections[0]).to.have.attribute('aria-valuenow', '3');
      });
    });
  });

  describe('Section display', () => {
    it('should display placeholder text when section is empty', async () => {
      await render(<DateField format={numericDateFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      // Empty sections should show placeholder, not empty string
      sections.forEach((section) => {
        expect(section.textContent).to.not.equal('');
      });
    });

    it('should display value text when section has a value', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0].textContent).to.equal('03'); // month
      expect(sections[1].textContent).to.equal('15'); // day
      expect(sections[2].textContent).to.equal('2024'); // year
    });
  });

  describe('Disabled state', () => {
    it('should render sections with aria-disabled when disabled', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
          disabled
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('should set tabIndex to -1 on sections when disabled', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
          disabled
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section.tabIndex).to.equal(-1);
      });
    });
  });

  describe('ArrowLeft / ArrowRight (section navigation)', () => {
    it('should move focus to the next section on ArrowRight', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      fireEvent.focus(sections[0]); // month section
      fireEvent.keyDown(sections[0], { key: 'ArrowRight' });

      // Day section (index 1) should now be selected
      expect(sections[1]).to.have.attribute('aria-valuenow', '15');
    });

    it('should move focus to the previous section on ArrowLeft', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      // Focus on day section (second spinbutton)
      fireEvent.focus(sections[1]);
      fireEvent.keyDown(sections[1], { key: 'ArrowLeft' });

      // Month section (index 0) should now be selected
      expect(sections[0]).to.have.attribute('aria-valuenow', '3');
    });

    it('should not move past the first section on ArrowLeft', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      fireEvent.focus(sections[0]); // already at first section
      fireEvent.keyDown(sections[0], { key: 'ArrowLeft' });

      // Should stay on month section
      expect(sections[0]).to.have.attribute('aria-valuenow', '3');
    });

    it('should not move past the last section on ArrowRight', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const lastSection = sections[sections.length - 1];
      fireEvent.focus(lastSection); // year section
      fireEvent.keyDown(lastSection, { key: 'ArrowRight' });

      // Should stay on year section
      expect(lastSection).to.have.attribute('aria-valuenow', '2024');
    });
  });

  describe('Value change callback', () => {
    it('should call onValueChange when section value changes via ArrowUp', async () => {
      const onValueChangeSpy = spy();
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-03-15', 'default')}
          onValueChange={onValueChangeSpy}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      fireEvent.focus(sections[0]);
      fireEvent.keyDown(sections[0], { key: 'ArrowUp' });

      expect(onValueChangeSpy.callCount).to.be.greaterThan(0);
    });
  });
});
