import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRenderer, isJSDOM } from '#test-utils';
import { useOpenMethodTriggerProps } from './useOpenInteractionType';

describe('useOpenInteractionType', () => {
  const { render } = createRenderer();

  it.skipIf(isJSDOM)('classifies assistive technology pointer events as virtual', async () => {
    const setOpenMethod = vi.fn();

    function Test() {
      const triggerProps = useOpenMethodTriggerProps(false, setOpenMethod);
      return <button {...triggerProps}>Open</button>;
    }

    await render(<Test />);

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger, {
      pointerType: 'touch',
      width: 0.333,
      height: 0.333,
      pressure: 0,
      detail: 0,
    });
    fireEvent.click(trigger, { detail: 0 });

    expect(setOpenMethod).toHaveBeenLastCalledWith('virtual');
  });
});
