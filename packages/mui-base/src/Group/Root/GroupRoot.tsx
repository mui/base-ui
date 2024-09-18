'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { GroupRootContext } from './GroupRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

/**
 *
 * Demos:
 *
 * - [Group](https://base-ui.netlify.app/components/react-group/)
 *
 * API:
 *
 * - [GroupRoot API](https://base-ui.netlify.app/components/react-group/#api-reference-groupRoot)
 */
const GroupRoot = React.forwardRef(function GroupRootComponent(
  props: GroupRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...other } = props;
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const context = React.useMemo(() => ({ setLabelId }), [setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState: EMPTY_OBJECT,
    extraProps: { role: 'group', 'aria-labelledby': labelId, ...other },
    ref: forwardedRef,
  });

  return <GroupRootContext.Provider value={context}>{renderElement()}</GroupRootContext.Provider>;
});

GroupRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace GroupRoot {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}

  export interface OwnerState {}
}

export { GroupRoot };
