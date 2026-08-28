'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import type { BaseUIComponentProps, Orientation } from '../../internals/types';
import {
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { useValueChanged } from '../../internals/useValueChanged';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useFormContext } from '../../internals/form-context/FormContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { resolveAriaLabelledBy, getDefaultLabelId } from '../../utils/resolveAriaLabelledBy';
import { sliderStateAttributesMapping } from './stateAttributesMapping';
import {
  SliderRootContext,
  SliderRootPropsContext,
  type SliderRootPropsContextValue,
} from './SliderRootContext';
import { SliderStore } from '../store';
import type { REASONS } from '../../internals/reasons';

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderRoot = React.forwardRef(function SliderRoot<
  Value extends number | readonly number[],
>(componentProps: SliderRoot.Props<Value>, forwardedRef: React.ForwardedRef<HTMLDivElement>) {
  const {
    'aria-labelledby': ariaLabelledByProp,
    className,
    defaultValue,
    disabled: disabledProp = false,
    id: idProp,
    format,
    largeStep = 10,
    locale,
    render,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    form,
    name: nameProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    orientation = 'horizontal',
    step = 1,
    thumbCollisionBehavior = 'push',
    thumbAlignment = 'center',
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);
  const defaultLabelId = getDefaultLabelId(id);

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
    setTouched,
    setDirty,
    validityData,
    validation,
  } = useFieldRootContext();
  const { labelId: fieldLabelId } = useLabelableContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const sliderRef = React.useRef<HTMLElement>(null);

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    if (min >= max) {
      warn('Slider `max` must be greater than `min`.');
    }
  }

  const store = useRefWithInit(() => {
    return new SliderStore({
      value: defaultValue ?? min,
      valueProp,
      disabled,
      max,
      min,
      minStepsBetweenValues,
      name,
      step,
      active: -1,
      dragging: false,
      lastUsedThumbIndex: -1,
      indicatorPosition: [undefined, undefined],
      registeredLabelId: undefined,
      thumbMap: new Map(),
    });
  }).current;

  store.useControlledProp('valueProp', valueProp);
  const valueUnwrapped = store.useState('renderValue', valueProp);
  const range = Array.isArray(valueUnwrapped);

  // Derived from the render-time value and bounds so descendants (including ref callbacks) see
  // the current props in this commit, before the store is synchronized in a layout effect.
  const values = store.useState('values', valueUnwrapped, min, max);

  const fieldValue = range ? values : values[0];

  useRegisterFieldControl(validation.inputRef, id, fieldValue, undefined, !disabled, nameProp);

  useValueChanged(fieldValue, () => {
    clearErrors(name);

    validation.change(fieldValue);

    const initialValue = validityData.initialValue as number | readonly number[] | undefined;
    let isDirty: boolean;
    if (Array.isArray(fieldValue) && Array.isArray(initialValue)) {
      isDirty = !areArraysEqual(fieldValue, initialValue);
    } else {
      isDirty = fieldValue !== initialValue;
    }
    setDirty(isDirty);
  });

  const active = store.useState('active');
  const dragging = store.useState('dragging');
  const registeredLabelId = store.useState('registeredLabelId');
  const ariaLabelledby =
    ariaLabelledByProp ?? resolveAriaLabelledBy(fieldLabelId, registeredLabelId);

  const state: SliderRootState = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: active,
      disabled,
      dragging,
      orientation,
      max,
      min,
      minStepsBetweenValues,
      step,
      values,
    }),
    [
      fieldState,
      active,
      disabled,
      dragging,
      max,
      min,
      minStepsBetweenValues,
      orientation,
      step,
      values,
    ],
  );

  store.useContextCallback(
    'onValueChange',
    onValueChangeProp as
      ((value: number | number[], eventDetails: SliderRoot.ChangeEventDetails) => void) | undefined,
  );
  store.useContextCallback(
    'onValueCommitted',
    onValueCommittedProp as
      | ((value: number | readonly number[], eventDetails: SliderRoot.CommitEventDetails) => void)
      | undefined,
  );
  store.useContextCallback('setTouched', setTouched);
  store.useSyncedValues({
    disabled,
    max,
    min,
    minStepsBetweenValues,
    name,
    step,
  });

  useIsoLayoutEffect(() => {
    if (!disabled) {
      return;
    }

    const activeEl = activeElement(ownerDocument(sliderRef.current));
    if (contains(sliderRef.current, activeEl)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      (activeEl as HTMLElement).blur();
    }
  }, [disabled]);

  const rootPropsContextValue: SliderRootPropsContextValue = React.useMemo(
    () => ({
      disabled,
      state,
      validation,
      format,
      inset: thumbAlignment !== 'center',
      labelId: ariaLabelledby,
      rootLabelId: defaultLabelId,
      largeStep,
      locale,
      form,
      name,
      renderBeforeHydration: thumbAlignment === 'edge',
      thumbCollisionBehavior,
    }),
    [
      ariaLabelledby,
      defaultLabelId,
      disabled,
      format,
      form,
      largeStep,
      locale,
      name,
      state,
      thumbAlignment,
      thumbCollisionBehavior,
      validation,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sliderRef],
    props: [
      {
        'aria-labelledby': ariaLabelledby,
        id,
        role: 'group',
      },
      elementProps,
      (props) => validation.getValidationProps(disabled, props),
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return (
    <SliderRootContext.Provider value={store}>
      <SliderRootPropsContext.Provider value={rootPropsContextValue}>
        <CompositeList elementsRef={store.context.thumbRefs} onMapChange={store.setThumbMap}>
          {element}
        </CompositeList>
      </SliderRootPropsContext.Provider>
    </SliderRootContext.Provider>
  );
}) as {
  <Value extends number | readonly number[]>(
    props: SliderRoot.Props<Value> & {
      ref?: React.Ref<HTMLDivElement> | undefined;
    },
  ): React.JSX.Element;
};

export interface SliderRootState extends FieldRootState {
  /**
   * The index of the active thumb.
   */
  activeThumbIndex: number;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the thumb is currently being dragged.
   */
  dragging: boolean;
  /**
   * The maximum value.
   */
  max: number;
  /**
   * The minimum value.
   */
  min: number;
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: number;
  /**
   * The component orientation.
   */
  orientation: Orientation;
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number;
  /**
   * The raw number value of the slider.
   */
  values: readonly number[];
}

export interface SliderRootProps<
  Value extends number | readonly number[] = number | readonly number[],
> extends BaseUIComponentProps<'div', SliderRootState> {
  /**
   * The uncontrolled value of the slider when it's initially rendered.
   *
   * To render a controlled slider, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Whether the slider should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The maximum allowed value of the slider.
   * Should not be equal to min.
   * @default 100
   */
  max?: number | undefined;
  /**
   * The minimum allowed value of the slider.
   * Should not be equal to max.
   * @default 0
   */
  min?: number | undefined;
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues?: number | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * Identifies the form that owns the slider inputs.
   * Useful when the slider is rendered outside the form.
   */
  form?: string | undefined;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   * @default 1
   */
  step?: number | undefined;
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep?: number | undefined;
  /**
   * How the thumb(s) are aligned relative to `Slider.Control` when the value is at `min` or `max`:
   * - `center`: The center of the thumb is aligned with the control edge
   * - `edge`: The thumb is inset within the control such that its edge is aligned with the control edge
   * - `edge-client-only`: Same as `edge` but renders after React hydration on the client, reducing bundle size in return
   * @default 'center'
   */
  thumbAlignment?: 'center' | 'edge' | 'edge-client-only' | undefined;
  /**
   * Controls how thumbs behave when they collide during pointer interactions.
   *
   * - `'push'` (default): Thumbs push each other without restoring their previous positions when dragged back.
   * - `'swap'`: Thumbs swap places when dragged past each other.
   * - `'none'`: Thumbs cannot move past each other; excess movement is ignored.
   *
   * @default 'push'
   */
  thumbCollisionBehavior?: 'push' | 'swap' | 'none' | undefined;
  /**
   * The value of the slider.
   * For range sliders, provide an array with one value per thumb.
   */
  value?: Value | undefined;
  /**
   * Callback function that is fired when the slider's value changed.
   * Receives the new value as the first argument; the originating event is
   * available as `eventDetails.event`. The value is also reflected on
   * `eventDetails.event.target.value` for form integration.
   *
   * The `eventDetails.reason` indicates what triggered the change:
   *
   * - `'input-change'` when the hidden range input emits a change event (for example, via form integration)
   * - `'track-press'` when the control track is pressed
   * - `'drag'` while dragging a thumb
   * - `'keyboard'` for keyboard input
   * - `'none'` when the change is triggered without a specific interaction
   */
  onValueChange?:
    | ((
        value: Value extends number ? number : Value,
        eventDetails: SliderRoot.ChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Callback function that is fired when a value change is committed.
   * Does not fire if the value did not change, or if the change was canceled.
   * **Warning**: This is a generic event, not a change event.
   *
   * The `eventDetails.reason` indicates what triggered the commit:
   *
   * - `'drag'` while dragging a thumb
   * - `'track-press'` when the control track is pressed
   * - `'keyboard'` for keyboard input
   * - `'input-change'` when the hidden range input emits a change event (for example, via form integration)
   * - `'none'` when the commit occurs without a specific interaction
   */
  onValueCommitted?:
    | ((
        value: Value extends number ? number : Value,
        eventDetails: SliderRoot.CommitEventDetails,
      ) => void)
    | undefined;
}

export interface SliderRootChangeEventCustomProperties {
  /**
   * The index of the active thumb at the time of the change.
   */
  activeThumbIndex: number;
}

export type SliderRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none;
export type SliderRootChangeEventDetails = BaseUIChangeEventDetails<
  SliderRoot.ChangeEventReason,
  SliderRootChangeEventCustomProperties
>;

export type SliderRootCommitEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.trackPress
  | typeof REASONS.drag
  | typeof REASONS.keyboard
  | typeof REASONS.none;
export type SliderRootCommitEventDetails = BaseUIGenericEventDetails<SliderRoot.CommitEventReason>;

export namespace SliderRoot {
  export type State = SliderRootState;
  export type Props<Value extends number | readonly number[] = number | readonly number[]> =
    SliderRootProps<Value>;
  export type ChangeEventReason = SliderRootChangeEventReason;
  export type ChangeEventDetails = SliderRootChangeEventDetails;
  export type CommitEventReason = SliderRootCommitEventReason;
  export type CommitEventDetails = SliderRootCommitEventDetails;
}
