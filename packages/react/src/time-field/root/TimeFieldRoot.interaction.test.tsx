import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { TimeField as TimeFieldBase } from '@base-ui/react/time-field';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<TimeField /> - DOM Interactions', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  function TimeField(props: TimeFieldBase.Root.Props) {
    return (
      <TimeFieldBase.Root {...props} data-testid="input">
        {(section) => <TimeFieldBase.Section key={section.index} section={section} />}
      </TimeFieldBase.Root>
    );
  }

  describe('Keyboard navigation', () => {
    describe('ArrowUp / ArrowDown (value adjustment)', () => {
      it('should increment hours section value on ArrowUp', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]); // hours section
        fireEvent.keyDown(sections[0], { key: 'ArrowUp' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '15'); // 14 -> 15
      });

      it('should decrement hours section value on ArrowDown', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'ArrowDown' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '13'); // 14 -> 13
      });

      it('should wrap hours from 23 to 0 on ArrowUp', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T23:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'ArrowUp' });

        expect(sections[0]).to.have.attribute('aria-valuenow', '0'); // 23 -> 0
      });

      it('should increment minutes section value on ArrowUp', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[1]); // minutes section
        fireEvent.keyDown(sections[1], { key: 'ArrowUp' });

        expect(sections[1]).to.have.attribute('aria-valuenow', '31'); // 30 -> 31
      });
    });

    describe('ArrowLeft / ArrowRight (section navigation)', () => {
      it('should move focus to the next section on ArrowRight', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]); // hours section
        fireEvent.keyDown(sections[0], { key: 'ArrowRight' });

        // Minutes section should now be selected
        expect(sections[1]).to.have.attribute('aria-valuenow', '30');
      });

      it('should move focus to the previous section on ArrowLeft', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[1]); // minutes section
        fireEvent.keyDown(sections[1], { key: 'ArrowLeft' });

        // Hours section should now be selected
        expect(sections[0]).to.have.attribute('aria-valuenow', '14');
      });
    });

    describe('Delete key', () => {
      it('should clear the active section value on Delete', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'Delete' });

        expect(sections[0]).not.to.have.attribute('aria-valuenow');
      });

      it('should not clear when field is readOnly', async () => {
        await render(
          <TimeField
            format={time24Format}
            defaultValue={adapter.date('2024-01-01T14:30', 'default')}
            readOnly
          />,
        );

        const sections = screen.getAllByRole('spinbutton');
        fireEvent.focus(sections[0]);
        fireEvent.keyDown(sections[0], { key: 'Delete' });

        // Value should remain unchanged
        expect(sections[0]).to.have.attribute('aria-valuenow', '14');
      });
    });
  });

  describe('12-hour format', () => {
    it('should display meridiem section', async () => {
      await render(
        <TimeField
          format={time12Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      // 12-hour format should have 3 spinbuttons: hours, minutes, meridiem
      expect(sections.length).to.equal(3);
    });

    it('should toggle meridiem with ArrowUp', async () => {
      await render(
        <TimeField
          format={time12Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const meridiemSection = sections[sections.length - 1]; // last spinbutton
      fireEvent.focus(meridiemSection);

      const initialValue = meridiemSection.textContent;
      fireEvent.keyDown(meridiemSection, { key: 'ArrowUp' });
      const newValue = meridiemSection.textContent;

      // Should have toggled
      expect(newValue).to.not.equal(initialValue);
    });
  });

  describe('Section display', () => {
    it('should display placeholder text when section is empty', async () => {
      await render(<TimeField format={time24Format} />);

      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section.textContent).to.not.equal('');
      });
    });

    it('should display value text when section has a value', async () => {
      await render(
        <TimeField
          format={time24Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0].textContent).to.equal('14'); // hours
      expect(sections[1].textContent).to.equal('30'); // minutes
    });
  });

  describe('Disabled state', () => {
    it('should render sections with aria-disabled when disabled', async () => {
      await render(
        <TimeField
          format={time24Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
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
        <TimeField
          format={time24Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
          disabled
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section.tabIndex).to.equal(-1);
      });
    });
  });

  describe('Value change callback', () => {
    it('should call onValueChange when section value changes via ArrowUp', async () => {
      const onValueChangeSpy = spy();
      await render(
        <TimeField
          format={time24Format}
          defaultValue={adapter.date('2024-01-01T14:30', 'default')}
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
