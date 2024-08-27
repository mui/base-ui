import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectRootContext } from '../Root/SelectRootContext';

function SelectValue(props: SelectValue.Props) {
  const { children, placeholder } = props;
  const { label } = useSelectRootContext();
  return (
    <React.Fragment>
      {typeof children === 'function' ? children(label) : label || placeholder}
    </React.Fragment>
  );
}

namespace SelectValue {
  export interface Props {
    children?: React.ReactNode | ((value: string) => React.ReactNode);
    /**
     * The placeholder value to display when the value is empty (such as during SSR).
     */
    placeholder?: string;
  }
}

SelectValue.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@iterator@68': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * The placeholder value to display when the value is empty (such as during SSR).
   */
  placeholder: PropTypes.string,
} as any;

export { SelectValue };
