import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { DateField } from '@base-ui/react/date-field';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<DateField.SectionList />', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  it('renders all sections', async () => {
    await render(
      <DateField.Root format={numericDateFormat} data-testid="root">
        <DateField.SectionList>
          {(section) => (
            <DateField.Section
              key={section.index}
              section={section}
              data-testid={`section-${section.index}`}
            />
          )}
        </DateField.SectionList>
      </DateField.Root>,
    );

    // 3 date parts (month, day, year) + 2 separators = 5 sections
    expect(screen.getByTestId('section-0')).not.to.equal(null);
    expect(screen.getByTestId('section-1')).not.to.equal(null);
    expect(screen.getByTestId('section-2')).not.to.equal(null);
    expect(screen.getByTestId('section-3')).not.to.equal(null);
    expect(screen.getByTestId('section-4')).not.to.equal(null);
  });

  it('renders only date part sections (spinbuttons)', async () => {
    await render(
      <DateField.Root format={numericDateFormat} data-testid="root">
        <DateField.SectionList>
          {(section) => <DateField.Section key={section.index} section={section} />}
        </DateField.SectionList>
      </DateField.Root>,
    );

    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons).to.have.length(3); // month, day, year
  });

  it('allows sibling elements', async () => {
    await render(
      <DateField.Root format={numericDateFormat} data-testid="root">
        <DateField.SectionList>
          {(section) => <DateField.Section key={section.index} section={section} />}
        </DateField.SectionList>
        <button type="button" data-testid="clear-button">
          Clear
        </button>
      </DateField.Root>,
    );

    expect(screen.getByTestId('clear-button')).not.to.equal(null);
    expect(screen.getAllByRole('spinbutton')).to.have.length(3);
  });

  it('does not render a wrapper element', async () => {
    await render(
      <DateField.Root format={numericDateFormat} data-testid="root">
        <DateField.SectionList>
          {(section) => <DateField.Section key={section.index} section={section} />}
        </DateField.SectionList>
      </DateField.Root>,
    );

    const root = screen.getByTestId('root');
    // SectionList should not add any wrapper - sections should be direct children
    const sections = root.querySelectorAll('[role="spinbutton"], [aria-hidden="true"]');
    expect(sections.length).to.be.greaterThan(0);

    // Verify no extra wrapper elements between root and sections
    sections.forEach((section) => {
      expect(section.parentElement).to.equal(root);
    });
  });
});
