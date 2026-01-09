import plugin from 'tailwindcss/plugin.js';

interface Options {
  /**
   * The prefix used for the variants. This defaults to `ui`.
   *
   * Usage example:
   * ```html
   *  <div class="ui-open:underline"></div>
   *  ```
   **/
  prefix?: string;
}

/**
 * A Tailwind CSS plugin for Base UI components.
 * 
 * This plugin provides state-based variants for styling Base UI components.
 * 
 * @example
 * ```js
 * // tailwind.config.js
 * module.exports = {
 *   plugins: [
 *     require('@base-ui/tailwindcss')
 *   ],
 * }
 * ```
 * 
 * @example
 * ```js
 * // With custom prefix
 * module.exports = {
 *   plugins: [
 *     require('@base-ui/tailwindcss')({ prefix: 'base' })
 *   ],
 * }
 * ```
 */
export default plugin.withOptions<Options>(({ prefix = 'ui' } = {}) => {
  return ({ addVariant }) => {
    // Boolean state attributes that can be present or absent
    const states = [
      'open',
      'closed',
      'checked',
      'unchecked',
      'indeterminate',
      'disabled',
      'readonly',
      'required',
      'valid',
      'invalid',
      'touched',
      'dirty',
      'filled',
      'focused',
      'selected',
      'highlighted',
      'active',
      'pressed',
      'dragging',
      'scrubbing',
      'nested',
      'expanded',
      'hidden',
      'panel-open',
    ];

    for (const state of states) {
      const dataAttribute = `data-${state}`;

      // Positive variant (e.g., ui-open:)
      addVariant(`${prefix}-${state}`, [
        `&[${dataAttribute}]`,
        `:where([${dataAttribute}]) &`,
      ]);

      // Negative variant (e.g., ui-not-open:)
      addVariant(`${prefix}-not-${state}`, [
        `&:not([${dataAttribute}])`,
        `:where(:not([${dataAttribute}])) &:not([${dataAttribute}])`,
      ]);
    }

    // Special attributes with values
    addVariant(`${prefix}-starting-style`, [
      `&[data-starting-style]`,
      `:where([data-starting-style]) &`,
    ]);

    addVariant(`${prefix}-ending-style`, [
      `&[data-ending-style]`,
      `:where([data-ending-style]) &`,
    ]);

    addVariant(`${prefix}-popup-open`, [
      `&[data-popup-open]`,
      `:where([data-popup-open]) &`,
    ]);

    addVariant(`${prefix}-anchor-hidden`, [
      `&[data-anchor-hidden]`,
      `:where([data-anchor-hidden]) &`,
    ]);

    addVariant(`${prefix}-nested-dialog-open`, [
      `&[data-nested-dialog-open]`,
      `:where([data-nested-dialog-open]) &`,
    ]);
  };
});
