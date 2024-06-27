import { expect } from 'chai';
import { selectReducer } from './selectReducer';
import { SelectAction, SelectActionTypes, SelectInternalState } from './useSelect.types';
import { ListItemMetadata, ListSettings } from '../../useList';
import { IndexableMap } from '../../utils/IndexableMap';

describe('selectReducer', () => {
  const irrelevantSettings: ListSettings = {
    disableListWrap: false,
    disabledItemsFocusable: false,
    focusManagement: 'activeDescendant' as const,
    orientation: 'vertical' as const,
    pageSize: 5,
    selectionMode: 'single' as const,
    direction: 'ltr' as const,
  };

  describe('action: buttonClick', () => {
    it('opens the select if it was closed', () => {
      const state: SelectInternalState<string> = {
        highlightedValue: null,
        selectedValues: [],
        items: new IndexableMap<string, ListItemMetadata>(),
        open: false,
        settings: irrelevantSettings,
      };

      const action: SelectAction<string> = {
        type: SelectActionTypes.buttonClick,
        event: {} as any, // not relevant
      };

      const result = selectReducer(state, action);
      expect(result.open).to.equal(true);
    });

    it('closes the select if it was open', () => {
      const state: SelectInternalState<string> = {
        highlightedValue: null,
        selectedValues: [],
        items: new IndexableMap<string, ListItemMetadata>(),
        open: true,
        settings: irrelevantSettings,
      };

      const action: SelectAction<string> = {
        type: SelectActionTypes.buttonClick,
        event: {} as any, // not relevant
      };

      const result = selectReducer(state, action);
      expect(result.open).to.equal(false);
    });

    it('highlights the first selected value if the select was closed', () => {
      const state: SelectInternalState<string> = {
        highlightedValue: null,
        selectedValues: ['2'],
        items: new IndexableMap<string, ListItemMetadata>([
          ['1', { disabled: false, ref: { current: null } }],
          ['2', { disabled: false, ref: { current: null } }],
          ['3', { disabled: false, ref: { current: null } }],
        ]),
        open: false,
        settings: irrelevantSettings,
      };

      const action: SelectAction<string> = {
        type: SelectActionTypes.buttonClick,
        event: {} as any, // not relevant
      };

      const result = selectReducer(state, action);
      expect(result.highlightedValue).to.equal('2');
    });

    it('highlights the first value if the select was closed and nothing was selected', () => {
      const state: SelectInternalState<string> = {
        highlightedValue: null,
        selectedValues: [],
        items: new IndexableMap<string, ListItemMetadata>([
          ['1', { disabled: false, ref: { current: null } }],
          ['2', { disabled: false, ref: { current: null } }],
          ['3', { disabled: false, ref: { current: null } }],
        ]),
        open: false,
        settings: irrelevantSettings,
      };

      const action: SelectAction<string> = {
        type: SelectActionTypes.buttonClick,
        event: {} as any, // not relevant
      };

      const result = selectReducer(state, action);
      expect(result.highlightedValue).to.equal('1');
    });
  });

  describe('action: browserAutoFill', () => {
    it('selects the item and highlights it', () => {
      const state: SelectInternalState<string> = {
        highlightedValue: null,
        selectedValues: [],
        items: new IndexableMap<string, ListItemMetadata>([
          ['1', { disabled: false, ref: { current: null } }],
          ['2', { disabled: false, ref: { current: null } }],
          ['3', { disabled: false, ref: { current: null } }],
        ]),
        open: false,
        settings: irrelevantSettings,
      };

      const action: SelectAction<string> = {
        type: SelectActionTypes.browserAutoFill,
        event: {} as any, // not relevant
        item: '1',
      };

      const result = selectReducer(state, action);
      expect(result.highlightedValue).to.equal('1');
      expect(result.selectedValues).to.deep.equal(['1']);
    });
  });
});
