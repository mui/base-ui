import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalAdapter, TemporalSupportedValue } from '../../../types';
import {
  TemporalFieldModelUpdater,
  TemporalFieldState,
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
} from './types';
import { FormatParser } from './formatParser';
import { buildSections, deriveStateFromParameters, getTimezoneToRender } from './utils';
import { TextDirection } from '../../../direction-provider';
import { TemporalFieldValueAdjustmentPlugin } from './plugins/TemporalFieldValueAdjustmentPlugin';
import { TemporalFieldCharacterEditingPlugin } from './plugins/TemporalFieldCharacterEditingPlugin';
import { TemporalFieldSectionPlugin } from './plugins/TemporalFieldSectionPlugin';
import { TimeoutManager } from '../../TimeoutManager';
import { TemporalFieldValuePlugin } from './plugins/TemporalFieldValuePlugin';
import { TemporalFieldInputPropsPlugin } from './plugins/TemporalFieldInputPropsPlugin';
import { TemporalFieldSectionPropsPlugin } from './plugins/TemporalFieldSectionPropsPlugin';
import { TemporalFieldFormatPlugin } from './plugins/TemporalFieldFormatPlugin';
import { TemporalFieldDOMPlugin } from './plugins/TemporalFieldDOMPlugin';
import { TemporalFieldRootPropsPlugin } from './plugins/TemporalFieldRootPropsPlugin';

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends object,
> extends Store<TemporalFieldState<TValue, TError, TValidationProps>> {
  public parameters: TemporalFieldStoreSharedParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreSharedParameters<TValue, TError> | null = null;

  public instanceName: string;

  public timeoutManager = new TimeoutManager();

  public characterEditing: TemporalFieldCharacterEditingPlugin<TValue>;

  public valueAdjustment: TemporalFieldValueAdjustmentPlugin<TValue>;

  public value: TemporalFieldValuePlugin<TValue, TError, TValidationProps>;

  public section: TemporalFieldSectionPlugin<TValue>;

  public format: TemporalFieldFormatPlugin<TValue>;

  public dom: TemporalFieldDOMPlugin;

  public rootProps: TemporalFieldRootPropsPlugin;

  public inputProps: TemporalFieldInputPropsPlugin<TValue, TError>;

  public sectionProps: TemporalFieldSectionPropsPlugin<TValue>;

  constructor(
    parameters: TemporalFieldStoreSharedParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    config: TemporalFieldConfiguration<TValue, TError, TValidationProps>,
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
    this.value = new TemporalFieldValuePlugin<TValue, TError, TValidationProps>(this);
    this.section = new TemporalFieldSectionPlugin<TValue>(this);
    this.format = new TemporalFieldFormatPlugin<TValue>(this);
    this.dom = new TemporalFieldDOMPlugin(this);
    this.rootProps = new TemporalFieldRootPropsPlugin(this);
    this.inputProps = new TemporalFieldInputPropsPlugin<TValue, TError>(this);
    this.sectionProps = new TemporalFieldSectionPropsPlugin<TValue>(this);

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
   * Updates the state of the Tree View based on the new parameters provided to the root component.
   */
  protected updateStateFromParameters(
    parameters: TemporalFieldStoreSharedParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    config: TemporalFieldConfiguration<TValue, TError, TValidationProps>,
    direction: TextDirection,
  ) {
    const updateModel: TemporalFieldModelUpdater<
      TemporalFieldState<TValue, TError, TValidationProps>,
      TemporalFieldStoreSharedParameters<TValue, TError>
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
    ) as Partial<TemporalFieldState<TValue, TError, TValidationProps>>;

    // If the format changed, we need to rebuild the sections
    if (parameters.format !== this.state.format) {
      newState.sections = config.getSectionsFromValue(this.state.value, (date) =>
        buildSections(
          adapter,
          FormatParser.parse(adapter, parameters.format, direction, parameters.placeholderGetters),
          date,
        ),
      );
    }

    if (parameters.value !== undefined && parameters.value !== this.parameters.value) {
      Object.assign(newState, this.value.deriveStateFromNewValue(parameters.value));
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
    selector: (state: TemporalFieldState<TValue, TError, TValidationProps>) => Value,
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
