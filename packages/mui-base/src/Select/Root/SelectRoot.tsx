'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectRootContext } from './SelectRootContext';
import { useSelectRoot } from './useSelectRoot';

function SelectRoot(props: SelectRoot.Props) {
  const {
    animated = true,
    id,
    name,
    children,
    value,
    defaultValue,
    defaultOpen = false,
    disabled = false,
    readOnly = false,
    required = false,
    loop = true,
    onOpenChange,
    open,
    alignMethod = 'selected-item',
  } = props;

  const selectRoot = useSelectRoot({
    animated,
    disabled,
    onOpenChange,
    loop,
    defaultOpen,
    open,
    alignMethod,
    value,
    defaultValue,
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
     * Determines the type of alignment mode. `selected-item` aligns the popup so that the selected
     * item appears over the trigger, while `trigger` aligns the popup using standard anchor
     * positioning.
     * @default 'selected-item'
     */
    alignMethod?: 'trigger' | 'selected-item';
  }
}

SelectRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Determines the type of alignment mode. `selected-item` aligns the popup so that the selected
   * item appears over the trigger, while `trigger` aligns the popup using standard anchor
   * positioning.
   * @default 'selected-item'
   */
  alignMethod: PropTypes.oneOf(['selected-item', 'trigger']),
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
