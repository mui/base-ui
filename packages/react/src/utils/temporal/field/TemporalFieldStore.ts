import { Store } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalAdapter, TemporalFieldDatePartType, TemporalSupportedValue } from '../../../types';
import {
  TemporalFieldModelUpdater,
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldConfiguration,
} from './types';
import { FormatParser } from './formatParser';
import { buildSections, deriveStateFromParameters, getTimezoneToRender, isToken } from './utils';
import { TextDirection } from '../../../direction-provider';
import { TemporalFieldValueAdjustmentPlugin } from './TemporalFieldValueAdjustmentPlugin';
import { TemporalFieldCharacterEditingPlugin } from './TemporalFieldCharacterEditingPlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TimeoutManager } from '../../TimeoutManager';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldInputPropsPlugin } from './TemporalFieldInputPropsPlugin';
import { TemporalFieldSectionPropsPlugin } from './TemporalFieldSectionPropsPlugin';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { TemporalFieldDOMPlugin } from './TemporalFieldDOMPlugin';
import { TemporalFieldRootPropsPlugin } from './TemporalFieldRootPropsPlugin';

const SECTION_TYPE_GRANULARITY: { [key in TemporalFieldDatePartType]?: number } = {
  year: 1,
  month: 2,
  day: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
};

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends object,
> extends Store<TemporalFieldState<TValue, TError, TValidationProps>> {
  public parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

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
    parameters: TemporalFieldStoreParameters<TValue, TError>,
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
      granularity: Math.max(
        ...parsedFormat.elements
          .filter(isToken)
          .map((token) => SECTION_TYPE_GRANULARITY[token.config.part] ?? 1),
      ),
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

    super({
      ...deriveStateFromParameters(parameters, validationProps, adapter, config, direction),
      manager,
      value,
      sections,
      referenceValue,
      characterQuery: null,
      selectedSection: null,
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
  }

  /**
   * Updates the state of the Tree View based on the new parameters provided to the root component.
   */
  public updateStateFromParameters(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    config: TemporalFieldConfiguration<TValue, TError, TValidationProps>,
    direction: TextDirection,
  ) {
    const updateModel: TemporalFieldModelUpdater<
      TemporalFieldState<TValue, TError, TValidationProps>,
      TemporalFieldStoreParameters<TValue, TError>
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

  public disposeEffect = () => {
    return this.timeoutManager.clearAll;
  };
}
