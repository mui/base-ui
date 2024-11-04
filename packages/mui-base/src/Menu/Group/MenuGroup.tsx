'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuGroupContext } from './MenuGroupContext';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuGroup API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuGroup)
 */
const MenuGroup = React.forwardRef(function MenuGroup(
  props: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const context = React.useMemo(() => ({ setLabelId }), [setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    extraProps: {
      role: 'group',
      'aria-labelledby': labelId,
      ...other,
    },
    ref: forwardedRef,
  });

  return <MenuGroupContext.Provider value={context}>{renderElement()}</MenuGroupContext.Provider>;
});

MenuGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.object,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toExponential: PropTypes.func.isRequired,
      toFixed: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toPrecision: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      then: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace MenuGroup {
  export type Props = BaseUIComponentProps<'div', OwnerState> & {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  };

  export interface OwnerState {}
}

export { MenuGroup };
