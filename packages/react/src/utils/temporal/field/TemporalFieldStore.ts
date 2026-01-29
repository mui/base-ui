import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalAdapter, TemporalSupportedValue } from '../../../types';
import {
  TemporalFieldModelUpdater,
  TemporalFieldState,
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  TemporalFieldValidationProps,
} from './types';
import { FormatParser } from './formatParser';
import { buildSections, deriveStateFromParameters, getTimezoneToRender } from './utils';
import { TextDirection } from '../../../direction-provider';
import { TemporalFieldValueAdjustmentPlugin } from './plugins/TemporalFieldValueAdjustmentPlugin';
import { TemporalFieldCharacterEditingPlugin } from './plugins/TemporalFieldCharacterEditingPlugin';
import { TemporalFieldSectionPlugin } from './plugins/TemporalFieldSectionPlugin';
import { TimeoutManager } from '../../TimeoutManager';
import { TemporalFieldValuePlugin } from './plugins/TemporalFieldValuePlugin';
import { TemporalFieldFormatPlugin } from './plugins/TemporalFieldFormatPlugin';
import { TemporalFieldDOMPlugin } from './plugins/TemporalFieldDOMPlugin';
import { TemporalFieldElementsPropsPlugin } from './plugins/TemporalFieldElementsPropsPlugin';

export class TemporalFieldStore<TValue extends TemporalSupportedValue> extends Store<
  TemporalFieldState<TValue>
> {
  public parameters: TemporalFieldStoreSharedParameters<TValue>;

  private initialParameters: TemporalFieldStoreSharedParameters<TValue> | null = null;

  public instanceName: string;

  public timeoutManager = new TimeoutManager();

  public characterEditing: TemporalFieldCharacterEditingPlugin<TValue>;

  public valueAdjustment: TemporalFieldValueAdjustmentPlugin<TValue>;

  public value: TemporalFieldValuePlugin<TValue>;

  public section: TemporalFieldSectionPlugin<TValue>;

  public format: TemporalFieldFormatPlugin<TValue>;

  public dom: TemporalFieldDOMPlugin;

  public elementsProps: TemporalFieldElementsPropsPlugin<TValue>;

  constructor(
    parameters: TemporalFieldStoreSharedParameters<TValue>,
    validationProps: TemporalFieldValidationProps,
    adapter: TemporalAdapter,
    config: TemporalFieldConfiguration<TValue>,
    direction: TextDirection,
    instanceName: string,
  ) {
    const manager = config.getManager(adapter);
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;

    const parsedFormat = FormatParser.parse(
      adapter,
      parameters.format,
      direction,
      parameters.placeholderGetters,
      validationProps,
    );

    const referenceValue = config.getInitialReferenceValue({
      externalReferenceDate: parameters.referenceDate,
      value,
      adapter,
      validationProps,
      granularity: parsedFormat.granularity,
      timezone: getTimezoneToRender(
        adapter,
        manager,
        value,
        parameters.referenceDate,
        parameters.timezone,
      ),
    });

    const sections = config.getSectionsFromValue(value, (date) =>
      buildSections(adapter, parsedFormat, date),
    );

    const inputRef = React.createRef<HTMLElement>();

    super({
      ...deriveStateFromParameters(parameters, validationProps, adapter, config, direction),
      manager,
      value,
      sections,
      referenceValue,
      characterQuery: null,
      selectedSection: null,
      inputRef,
    });

    this.parameters = parameters;
    this.instanceName = instanceName;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }

    this.characterEditing = new TemporalFieldCharacterEditingPlugin<TValue>(this);
    this.valueAdjustment = new TemporalFieldValueAdjustmentPlugin<TValue>(this);
    this.value = new TemporalFieldValuePlugin<TValue>(this);
    this.section = new TemporalFieldSectionPlugin<TValue>(this);
    this.format = new TemporalFieldFormatPlugin<TValue>(this);
    this.dom = new TemporalFieldDOMPlugin(this);
    this.elementsProps = new TemporalFieldElementsPropsPlugin<TValue>(this);

    // Register effect to update Field's filled state when value changes
    this.registerStoreEffect(
      (state) => state.value,
      (_previousValue, nextValue) => {
        const fieldContext = this.state.fieldContext;
        if (fieldContext) {
          fieldContext.setFilled(nextValue !== null);
        }
      },
    );
  }

  /**
   * Updates the field context in the store.
   */
  public updateFieldContext(fieldContext: any | null) {
    this.update({ fieldContext });
  }

  /**
   * Updates the state of the field based on the new parameters provided to the root component.
   */
  protected updateStateFromParameters(
    parameters: TemporalFieldStoreSharedParameters<TValue>,
    validationProps: TemporalFieldValidationProps,
    adapter: TemporalAdapter,
    config: TemporalFieldConfiguration<TValue>,
    direction: TextDirection,
  ) {
    const updateModel: TemporalFieldModelUpdater<
      TemporalFieldState<TValue>,
      TemporalFieldStoreSharedParameters<TValue>
    > = (mutableNewState, controlledProp, defaultProp) => {
      if (parameters[controlledProp] !== undefined) {
        mutableNewState[controlledProp] = parameters[controlledProp] as any;
      }

      if (process.env.NODE_ENV !== 'production') {
        const defaultValue = parameters[defaultProp];
        const isControlled = parameters[controlledProp] !== undefined;
        const initialDefaultValue = this.initialParameters?.[defaultProp];
        const initialIsControlled = this.initialParameters?.[controlledProp] !== undefined;

        if (initialIsControlled !== isControlled) {
          warn(
            `Base UI: A component is changing the ${
              initialIsControlled ? '' : 'un'
            }controlled ${controlledProp} state of ${this.instanceName} to be ${initialIsControlled ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${controlledProp} element for the lifetime of the component.`,
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          );
        } else if (JSON.stringify(initialDefaultValue) !== JSON.stringify(defaultValue)) {
          warn(
            `Base UI: A component is changing the default ${controlledProp} state of an uncontrolled ${this.instanceName} after being initialized. `,
            `To suppress this warning opt to use a controlled ${this.instanceName}.`,
          );
        }
      }
    };

    const newState = deriveStateFromParameters(
      parameters,
      validationProps,
      adapter,
      config,
      direction,
    ) as Partial<TemporalFieldState<TValue>>;

    // If the format changed, we need to rebuild the sections
    const hasFormatChanged =
      parameters.format !== this.state.format ||
      parameters.placeholderGetters !== this.state.placeholderGetters ||
      direction !== this.state.direction ||
      adapter !== this.state.adapter ||
      validationProps !== this.state.validationProps;
    const hasValueChanged =
      parameters.value !== undefined && parameters.value !== this.parameters.value;

    if (hasFormatChanged) {
      const parsedFormat = FormatParser.parse(
        adapter,
        parameters.format,
        direction,
        parameters.placeholderGetters,
        validationProps,
      );

      // When both format and value change, build sections from the new value directly.
      // deriveStateFromNewValue cannot be used here because it reads parsedFormat from
      // the store state which still contains the old format at this point.
      const valueToUse = hasValueChanged ? (parameters.value as TValue) : this.state.value;
      newState.sections = config.getSectionsFromValue(valueToUse, (date) =>
        buildSections(adapter, parsedFormat, date),
      );

      // The pending invalid-date section patch references indices from the old format,
      // so it must be discarded when sections are rebuilt.
      this.section.sectionToUpdateOnNextInvalidDate = null;

      if (hasValueChanged) {
        newState.referenceValue = config.updateReferenceValue(
          adapter,
          parameters.value as TValue,
          this.state.referenceValue,
        );
      }
    } else if (hasValueChanged) {
      Object.assign(newState, this.value.deriveStateFromNewValue(parameters.value as TValue));
    }

    // If the adapter changed, we need to rebuild the manager
    if (adapter !== this.state.adapter) {
      newState.manager = config.getManager(adapter);
    }

    updateModel(newState, 'value', 'defaultValue');

    this.update(newState);
    this.parameters = parameters;
  }

  /**
   * Registers an effect to be run when the value returned by the selector changes.
   */
  public registerStoreEffect = <Value>(
    selector: (state: TemporalFieldState<TValue>) => Value,
    effect: (previous: Value, next: Value) => void,
  ) => {
    let previousValue = selector(this.state);

    this.subscribe((state) => {
      const nextValue = selector(state);
      if (nextValue !== previousValue) {
        effect(previousValue, nextValue);
        previousValue = nextValue;
      }
    });
  };

  public mountEffect = () => {
    // Sync selection to DOM on mount and whenever the selected section changes.
    this.dom.syncSelectionToDOM();
    this.registerStoreEffect(
      TemporalFieldSectionPlugin.selectors.selectedSection,
      this.dom.syncSelectionToDOM,
    );

    return this.timeoutManager.clearAll;
  };
}
