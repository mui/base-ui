import { createSelectorMemoized } from '@base-ui/utils/store';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { selectors } from './selectors';
import { NOOP } from '../../noop';
import { FieldRoot } from '../../../field';

const rootPropsSelectors = {
  rootState: createSelectorMemoized(
    selectors.required,
    selectors.readOnly,
    selectors.disabled,
    (required, readOnly, disabled, fieldState: FieldRoot.State) => ({
      ...fieldState,
      required,
      readOnly,
      disabled,
    }),
  ),
  hiddenInputProps: createSelectorMemoized(
    TemporalFieldValuePlugin.selectors.value,
    selectors.adapter,
    selectors.config,
    selectors.required,
    selectors.disabled,
    selectors.readOnly,
    (value, adapter, config, required, disabled, readOnly) => ({
      value: config.stringifyValue(adapter, value),
      // ref: mergedInputRef,
      // id,
      // name: serializedCheckedValue ? name : undefined,
      disabled,
      readOnly,
      required,
      // 'aria-labelledby': elementProps['aria-labelledby'] ?? fieldsetContext?.legendId,
      'aria-hidden': true,
      tabIndex: -1,
      style: visuallyHiddenInput,
      onChange: NOOP, // suppress a Next.js error
      // onFocus() {
      //   controlRef.current?.focus();
      // },
    }),
  ),
};

/**
 * Plugin to build the props to pass to the root part.
 */
export class TemporalFieldRootPropsPlugin {
  private store: TemporalFieldStore<any, any, any>;

  public static selectors = rootPropsSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'rootProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }
}
