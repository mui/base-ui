import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { OTPField } from '@base-ui/react/otp-field';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      os: { ...actual.platform.os, android: true },
    },
  };
});

describe('<OTPField.Input /> Android', () => {
  const { render } = createRenderer();

  it('commits each change during an IME composition', async () => {
    const onValueChange = vi.fn();

    await render(
      <OTPField.Root length={3} validationType="alphanumeric" onValueChange={onValueChange}>
        <OTPField.Input />
        <OTPField.Input />
        <OTPField.Input />
      </OTPField.Root>,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    fireEvent.compositionStart(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('a', expect.anything());
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.compositionEnd(inputs[0]);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(inputs.map((input) => input.value)).toEqual(['a', '', '']);
  });
});
