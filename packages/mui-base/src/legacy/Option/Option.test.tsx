import * as React from 'react';
import { createMount, createRenderer } from '@mui/internal-test-utils';
import { Option, optionClasses } from '@base_ui/react/legacy/Option';
import { SelectContext } from '../useSelect/SelectContext';
import { describeConformanceUnstyled } from '../../../test/describeConformanceUnstyled';
import { SelectInternalState } from '../useSelect';
import { IndexableMap } from '../../utils/IndexableMap';
import { CompoundParentContextValue } from '../../useCompound';
import { SelectOption } from '../useOption';

const DUMMY_STATE: SelectInternalState<string> = {
  highlightedValue: null,
  open: true,
  selectedValues: [],
  items: new IndexableMap(),
  settings: {
    direction: 'ltr',
    orientation: 'vertical',
    disabledItemsFocusable: false,
    disableListWrap: false,
    focusManagement: 'DOM',
    pageSize: 1,
    selectionMode: 'single',
  },
};

// TODO: re-enable once Select is fully migrated to the new API
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('<Option />', () => {
  const mount = createMount();
  const { render } = createRenderer();

  describeConformanceUnstyled(<Option value={42} />, () => ({
    inheritComponent: 'li',
    render: (node) => {
      return render(
        <SelectContext.Provider
          value={{
            dispatch: () => {},
            state: DUMMY_STATE,
            compoundParentContext: {} as CompoundParentContextValue<any, SelectOption<string>>,
            keyExtractor: (option) => option.value,
          }}
        >
          {node}
        </SelectContext.Provider>,
      );
    },
    mount: (node: React.ReactNode) => {
      const wrapper = mount(
        <SelectContext.Provider
          value={{
            dispatch: () => {},
            state: DUMMY_STATE,
            compoundParentContext: {} as CompoundParentContextValue<any, SelectOption<string>>,
            keyExtractor: (option) => option.value,
          }}
        >
          {node}
        </SelectContext.Provider>,
      );
      return wrapper.childAt(0);
    },
    refInstanceof: window.HTMLLIElement,
    testComponentPropWith: 'span',
    slots: {
      root: {
        expectedClassName: optionClasses.root,
      },
    },
    skip: [
      'componentProp',
      'reactTestRenderer', // Need to be wrapped in SelectContext
    ],
  }));
});
