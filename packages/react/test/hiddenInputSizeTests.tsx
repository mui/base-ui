import type * as React from 'react';
import { expect, describe, it } from 'vitest';
import { act } from '@mui/internal-test-utils';
import type { createRenderer } from '#test-utils';
import { isJSDOM } from '#test-utils';

/**
 * The hidden input of a control without a `name` is zero-size, so Chrome doesn't give each one a
 * compositor layer. It grows to 1px when reported invalid, as Chrome doesn't show the native
 * validation message for a zero-size input.
 */
export function hiddenInputSizeTests(config: HiddenInputSizeTestsConfig) {
  const { render, createComponent } = config;

  // Sizes need layout.
  describe.skipIf(isJSDOM)('hidden input size', () => {
    it('grows from zero size to 1px when reported invalid', async () => {
      const { container } = await render(createComponent({ required: true }));

      // eslint-disable-next-line testing-library/no-container -- the hidden input is `aria-hidden`
      const input = container.querySelector<HTMLInputElement>('input[aria-hidden]')!;
      // Unnamed radios are never missing a value, so fail the way Field validation does.
      input.setCustomValidity('Invalid');
      expect(input.validity.valid).toBe(false);
      expect(getSize(input)).toEqual({ width: 0, height: 0 });

      await act(async () => {
        input.reportValidity();
      });

      expect(getSize(input)).toEqual({ width: 1, height: 1 });
    });
  });
}

function getSize(element: HTMLElement) {
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
}

export interface HiddenInputSizeTestsConfig {
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Returns the component tree, without a `name`, with the form props spread on its root.
   * `required` makes Select and Combobox render a real input instead of `type="hidden"`.
   */
  createComponent: (props: { required?: boolean }) => React.JSX.Element;
}
