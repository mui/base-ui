import { Combobox } from '@base-ui/react/combobox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'chai';

describe('<Combobox.Chips />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Chips />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  it('does not set role="toolbar" when there are no chips', async () => {
    await render(
      <Combobox.Root multiple>
        <Combobox.Chips data-testid="chips" />
      </Combobox.Root>,
    );

    const chips = screen.getByTestId('chips');
    expect(chips).not.to.have.attribute('role');
  });

  it('sets role="toolbar" when there is at least one chip', async () => {
    await render(
      <Combobox.Root multiple defaultValue={['apple']}>
        <Combobox.Chips data-testid="chips">
          <Combobox.Chip>apple</Combobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );

    const chips = screen.getByTestId('chips');
    expect(chips).to.have.attribute('role', 'toolbar');
  });
});
