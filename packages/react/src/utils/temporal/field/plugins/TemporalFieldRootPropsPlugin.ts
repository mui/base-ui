import { createSelectorMemoized } from '@base-ui/utils/store';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { TemporalFieldStore } from '../TemporalFieldStore';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { selectors } from '../selectors';

const rootPropsSelectors = {
  rootState: createSelectorMemoized(
    selectors.required,
    selectors.readOnly,
    selectors.disabled,
    selectors.invalid,
    selectors.fieldContext,
    (required, readOnly, disabled, invalid, fieldContext: any) => ({
      ...(fieldContext?.state || {}),
      required,
      readOnly,
      disabled,
      invalid,
    }),
  ),
  hiddenInputProps: createSelectorMemoized(
    TemporalFieldValuePlugin.selectors.value,
    TemporalFieldSectionPlugin.selectors.sections,
    TemporalFieldFormatPlugin.selectors.parsedFormat,
    selectors.adapter,
    selectors.config,
    selectors.required,
    selectors.disabled,
    selectors.readOnly,
    selectors.name,
    selectors.id,
    selectors.validationProps,
    selectors.step,
    (
      value,
      sections,
      parsedFormat,
      adapter,
      config,
      required,
      disabled,
      readOnly,
      name,
      id,
      validationProps,
      step,
    ) => {
      const nativeValidationProps = config.stringifyValidationPropsForHiddenInput(
        adapter,
        validationProps,
        parsedFormat,
        step,
      );

      return {
        type: config.nativeInputType,
        value: config.stringifyValueForHiddenInput(adapter, value, sections),
        name,
        id,
        disabled,
        readOnly,
        required,
        min: nativeValidationProps.min,
        max: nativeValidationProps.max,
        step: nativeValidationProps.step,
        'aria-hidden': true,
        tabIndex: -1,
        style: visuallyHiddenInput,
      };
    },
  ),
};

/**
 * Plugin to build the props to pass to the root part.
 */
export class TemporalFieldRootPropsPlugin {
  private store: TemporalFieldStore<any, any>;

  public static selectors = rootPropsSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'rootProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public onHiddenInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Workaround for https://github.com/facebook/react/issues/9023
    if (event.nativeEvent.defaultPrevented) {
      return;
    }

    this.store.value.updateFromString(event.target.value);
  };

  public onHiddenInputFocus = () => {
    this.store.section.selectClosestDatePart(0);
  };
}
