import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import type { createRenderer } from '#test-utils';
import { isJSDOM } from '#test-utils';

/**
 * The visually hidden input of a control without a native input is `type="hidden"` unless it
 * takes part in a form, so password managers don't treat each instance as a form field.
 */
export function hiddenInputTypeTests(config: HiddenInputTypeTestsConfig) {
  const { render, createComponent, getFocusTarget } = config;

  describe('hidden input type', () => {
    it('is hidden when the control takes no part in a form', async () => {
      const { container } = await render(createComponent({}));

      // eslint-disable-next-line testing-library/no-container -- `type="hidden"` inputs have no role
      expect(container.querySelector('input[aria-hidden]')).toHaveAttribute('type', 'hidden');
    });

    it.each([
      { name: 'name', props: { name: 'field' } },
      { name: 'autoComplete', props: { autoComplete: 'country' } },
      { name: 'required', props: { required: true } },
    ])('is a text input when $name is set', async ({ props }) => {
      await render(createComponent(props));

      expect(screen.getByRole('textbox', { hidden: true })).not.toHaveAttribute('type');
    });

    it('is a text input inside Field.Root', async () => {
      await render(<Field.Root>{createComponent({})}</Field.Root>);

      expect(screen.getByRole('textbox', { hidden: true })).not.toHaveAttribute('type');
    });

    // jsdom lets `type="hidden"` inputs take focus.
    it.skipIf(isJSDOM)('stays focusable through inputRef', async () => {
      const inputRef = React.createRef<HTMLInputElement>();
      await render(createComponent({ inputRef }));

      const focusTarget = getFocusTarget();
      expect(focusTarget).not.toHaveFocus();

      // Form libraries focus invalid fields through the ref, and focus has to reach the control.
      await act(async () => {
        inputRef.current!.focus();
      });

      await waitFor(() => {
        expect(focusTarget).toHaveFocus();
      });
    });
  });
}

export interface HiddenInputTypeTestsConfig {
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Returns the component tree with the form props spread on its root.
   */
  createComponent: (props: {
    name?: string;
    autoComplete?: string;
    required?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
  }) => React.JSX.Element;
  /**
   * Returns the element that receives focus when the hidden input is focused.
   */
  getFocusTarget: () => HTMLElement;
}
