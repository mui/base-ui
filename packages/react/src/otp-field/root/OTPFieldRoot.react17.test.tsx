import { expect, vi } from 'vitest';
import { OTPField } from '@base-ui/react/otp-field';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      captureOwnerStack: undefined,
      useId: undefined,
    },
  };
});

describe('<OTPField.Root /> with the React 17 id fallback', () => {
  const { renderToString } = createRenderer();

  it('omits generated slot ids during SSR until the client fallback is assigned', () => {
    renderToString(
      <OTPField.Root length={2}>
        <OTPField.Input />
        <OTPField.Input />
      </OTPField.Root>,
    );

    const inputs = screen.getAllByRole('textbox');

    expect(inputs[0]).not.toHaveAttribute('id');
    expect(inputs[1]).not.toHaveAttribute('id');
  });
});
