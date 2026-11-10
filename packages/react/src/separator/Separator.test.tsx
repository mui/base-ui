import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Separator } from '@base-ui/react/separator';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Separator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `separator` role', async () => {
    await render(<Separator />);
    expect(screen.getByRole('separator')).toBeVisible();
  });

  describe('prop: orientation', () => {
    it.each([{ orientation: 'horizontal' }, { orientation: 'vertical' }] as const)(
      'sets aria-orientation="$orientation"',
      async ({ orientation }) => {
        await render(<Separator orientation={orientation} />);

        expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', orientation);
      },
    );
  });
});
