import * as React from 'react';
import PropTypes from 'prop-types';
import { SwitchThumbProps } from './Switch.types';
import { SwitchContext } from './SwitchContext';
import { resolveClassName } from '../utils/resolveClassName';
import { useSwitchStyleHooks } from './useSwitchStyleHooks';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumbProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className: classNameProp, ...other } = props;
  const render = renderProp ?? defaultRender;

  const ownerState = React.useContext(SwitchContext);
  if (ownerState === null) {
    throw new Error('Base UI: Switch.Thumb is not placed inside the Switch component.');
  }

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useSwitchStyleHooks(ownerState);

  const elementProps = {
    className,
    ref: forwardedRef,
    ...styleHooks,
    ...other,
  };

  return render(elementProps, ownerState);
});

SwitchThumb.propTypes /* remove-proptypes */ = {
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
  render: PropTypes.func,
} as any;

export { SwitchThumb };
