import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.RadioGroup />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    await render(<Menu.RadioGroup />);
    expect(screen.getByRole('group')).toBeVisible();
  });
});
