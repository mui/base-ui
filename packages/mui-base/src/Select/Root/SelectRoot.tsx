'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectRootContext } from './SelectRootContext';
import { useSelectRoot } from './useSelectRoot';
/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectRoot API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectRoot)
 */
function SelectRoot(props: SelectRoot.Props) {
  const {
    animated = true,
    id,
    name,
    children,
    value,
    onValueChange,
    defaultValue,
    defaultOpen = false,
    disabled = false,
    readOnly = false,
    required = false,
    loop = true,
    onOpenChange,
    open,
    alignMethod = 'item',
  } = props;

  const selectRoot = useSelectRoot({
    animated,
    disabled,
    onOpenChange,
    loop,
    defaultOpen,
    open,
    alignMethod,
    defaultValue,
    value,
    onValueChange,
  });

  const context: SelectRootContext = React.useMemo(
    () => ({
      ...selectRoot,
      disabled,
      alignMethod,
      id,
      name,
      required,
      readOnly,
    }),
    [selectRoot, disabled, alignMethod, id, name, required, readOnly],
  );

  return <SelectRootContext.Provider value={context}>{children}</SelectRootContext.Provider>;
}

namespace SelectRoot {
  export interface Props {
    /**
     * If `true`, the Select supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     *
     * @default true
     */
    animated?: boolean;
    children: React.ReactNode;
    /**
     * The name of the Select in the owning form.
     */
    name?: string;
    /**
     * The id of the Select.
     */
    id?: string;
    /**
     * If `true`, the Select is required.
     * @default false
     */
    required?: boolean;
    /**
     * If `true`, the Select is read-only.
     * @default false
     */
    readOnly?: boolean;
    /**
     * If `true`, the Select is disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * The value of the select.
     */
    value?: string;
    /**
     * Callback fired when the value of the select changes. Use when controlled.
     */
    onValueChange?: (value: string, event?: Event) => void;
    /**
     * The default value of the select.
     */
    defaultValue?: string;
    /**
     * If `true`, the Select is initially open.
     *
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     * @default true
     */
    loop?: boolean;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange?: (open: boolean, event: Event | undefined) => void;
    /**
     * Allows to control whether the dropdown is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * Determines if the select should align to the selected item inside the popup or the trigger
     * element.
     * @default 'item'
     */
    alignMethod?: 'item' | 'trigger';
  }
}

SelectRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Determines if the select should align to the selected item inside the popup or the trigger
   * element.
   * @default 'item'
   */
  alignMethod: PropTypes.oneOf(['item', 'trigger']),
  /**
   * If `true`, the Select supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the Select is initially open.
   *
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The default value of the select.
   */
  defaultValue: PropTypes.string,
  /**
   * If `true`, the Select is disabled.
   *
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the Select.
   */
  id: PropTypes.string,
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * The name of the Select in the owning form.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
  /**
   * If `true`, the Select is read-only.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * If `true`, the Select is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The value of the select.
   */
  value: PropTypes.string,
} as any;

export { SelectRoot };
