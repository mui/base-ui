import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { Toggle, Indicator } from '@base-ui/react/toggle';
import { createRenderer } from '#test-utils';

describe('<Toggle />', () => {
  const { render } = createRenderer();

  it('still renders the root part for backwards compatibility', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    const { user } = await render(
      <Toggle ref={ref}>
        <Indicator>on</Indicator>
      </Toggle>,
    );

    const button = screen.getByRole('button');
    expect(ref.current).toBe(button);
    expect(button.textContent).toBe('');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.textContent).toBe('on');
  });
});
