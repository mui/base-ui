'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CompoundComponentContext } from '../../useCompound';
import { SliderContextValue, SliderProviderValue } from './SliderRoot.types';

export interface SliderProviderProps {
  value: SliderProviderValue;
  children: React.ReactNode;
}

export const SliderContext = React.createContext<SliderContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SliderContext.displayName = 'SliderContext';
}

export function useSliderContext() {
  const context = React.useContext(SliderContext);
  if (context === undefined) {
    throw new Error('useSliderContext must be used inside a Slider component');
  }
  return context;
}

/**
 * Sets up contexts for the Slider and its subcomponents.
 *
 * @ignore - do not document.
 */
const SliderProvider: React.FC<SliderProviderProps> = function SliderProvider(props) {
  const { value: valueProp, children } = props;

  const { compoundComponentContextValue, ...contextValue } = valueProp;

  return (
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <SliderContext.Provider value={contextValue}>{children}</SliderContext.Provider>
    </CompoundComponentContext.Provider>
  );
};

SliderProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  value: PropTypes /* @typescript-to-proptypes-ignore */.shape({
    active: PropTypes.number.isRequired,
    areValuesEqual: PropTypes.func.isRequired,
    'aria-labelledby': PropTypes.string,
    axis: PropTypes.oneOf(['horizontal-reverse', 'horizontal', 'vertical']).isRequired,
    changeValue: PropTypes.func.isRequired,
    compoundComponentContextValue: PropTypes.shape({
      getItemIndex: PropTypes.func.isRequired,
      registerItem: PropTypes.func.isRequired,
      totalSubitemCount: PropTypes.number.isRequired,
    }).isRequired,
    direction: PropTypes.oneOf(['ltr', 'rtl']).isRequired,
    disabled: PropTypes.bool.isRequired,
    dragging: PropTypes.bool.isRequired,
    getFingerNewValue: PropTypes.func.isRequired,
    handleValueChange: PropTypes.func.isRequired,
    largeStep: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    minStepsBetweenValues: PropTypes.number.isRequired,
    name: PropTypes.string,
    onValueCommitted: PropTypes.func,
    orientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
    ownerState: PropTypes.shape({
      activeThumbIndex: PropTypes.number.isRequired,
      direction: PropTypes.oneOf(['ltr', 'rtl']).isRequired,
      disabled: PropTypes.bool.isRequired,
      dragging: PropTypes.bool.isRequired,
      max: PropTypes.number.isRequired,
      min: PropTypes.number.isRequired,
      minStepsBetweenValues: PropTypes.number.isRequired,
      orientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
      step: PropTypes.number.isRequired,
      values: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    percentageValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    registerSliderControl: PropTypes.func.isRequired,
    setActive: PropTypes.func.isRequired,
    setDragging: PropTypes.func.isRequired,
    setValueState: PropTypes.func.isRequired,
    step: PropTypes.number.isRequired,
    subitems: PropTypes.object.isRequired,
    tabIndex: PropTypes.number,
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
} as any;

export { SliderProvider };
