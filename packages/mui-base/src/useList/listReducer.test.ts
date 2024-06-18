import * as React from 'react';
import { expect } from 'chai';
import { listReducer } from './listReducer';
import { ListState } from './useList.types';
import { ListAction, ListActionTypes } from './listActions.types';
import { IndexableMap } from '../utils/indexableMap';

describe('listReducer', () => {
  describe('action: blur', () => {
    it('resets the highlightedValue', () => {
      const state: ListState<string> = {
        highlightedValue: 'a',
        selectedValues: [],
        items: new IndexableMap(),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.blur,
        event: {} as any, // not relevant
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal(null);
    });
  });

  describe('action: itemClick', () => {
    it('sets the selectedValues to the clicked value', () => {
      const state: ListState<string> = {
        highlightedValue: 'a',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant
        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['two']);
    });

    it('does not select a disabled item', () => {
      const state: ListState<string> = {
        highlightedValue: null,
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: true }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant

        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal(null);
      expect(result.selectedValues).to.deep.equal([]);
    });

    it('replaces the selectedValues with the clicked value if selectionMode = "single"', () => {
      const state: ListState<string> = {
        highlightedValue: 'a',
        selectedValues: ['one'],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant
        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['two']);
    });

    it('add the clicked value to the selection if selectionMode = "multiple"', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: ['one'],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'multiple',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant

        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['one', 'two']);
    });

    it('remove the clicked value from the selection if selectionMode = "multiple" and it was selected already', () => {
      const state: ListState<string> = {
        highlightedValue: 'three',
        selectedValues: ['one', 'two'],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'multiple',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant

        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['one']);
    });

    it('does not select the clicked value to the selection if selectionMode = "none"', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemClick,
        event: {} as any, // not relevant
        item: 'two',
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal([]);
    });
  });

  describe('action: keyDown', () => {
    interface KeydownTestCase {
      description: string;
      key: string;
      initialHighlightedItem: string | null;
      disabledItemFocusable: boolean;
      disabledItems: string[];
      disableListWrap: boolean;
      expected: string | null;
    }

    const testCases: KeydownTestCase[] = [
      {
        description: 'happy path',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'highlights the first enabled item',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1'],
        disableListWrap: false,
        expected: '2',
      },
      {
        description: 'highlights the first enabled item',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1', '2'],
        disableListWrap: false,
        expected: '3',
      },
      {
        description: 'highlights the first item even if it is disabled',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1'],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'all disabled',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: null,
      },
      {
        description: 'all disabled but focusable',
        key: 'Home',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'happy path',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'highlights the last enabled item',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['5'],
        disableListWrap: false,
        expected: '4',
      },
      {
        description: 'highlights the last enabled item',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['4', '5'],
        disableListWrap: false,
        expected: '3',
      },
      {
        description: 'highlights the last item even if it is disabled',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['5'],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'all disabled',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: null,
      },
      {
        description: 'all disabled but focusable',
        key: 'End',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'happy path',
        key: 'ArrowDown',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'happy path',
        key: 'ArrowDown',
        initialHighlightedItem: '1',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '2',
      },
      {
        description: 'skips the disabled item',
        key: 'ArrowDown',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1'],
        disableListWrap: false,
        expected: '2',
      },
      {
        description: 'skips multiple disabled items',
        key: 'ArrowDown',
        initialHighlightedItem: '1',
        disabledItemFocusable: false,
        disabledItems: ['2', '3'],
        disableListWrap: false,
        expected: '4',
      },
      {
        description: 'skips the disabled items and wraps around',
        key: 'ArrowDown',
        initialHighlightedItem: '3',
        disabledItemFocusable: false,
        disabledItems: ['1', '4', '5'],
        disableListWrap: false,
        expected: '2',
      },
      {
        description: 'focuses the disabled item',
        key: 'ArrowDown',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1'],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'does not wrap around',
        key: 'ArrowDown',
        initialHighlightedItem: '5',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: true,
        expected: '5',
      },
      {
        description: 'remains on the same item when all the next are disabled',
        key: 'ArrowDown',
        initialHighlightedItem: '3',
        disabledItemFocusable: false,
        disabledItems: ['4', '5'],
        disableListWrap: true,
        expected: '3',
      },
      {
        description: 'all disabled',
        key: 'ArrowDown',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: null,
      },
      {
        description: 'all disabled but focusable',
        key: 'ArrowDown',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'happy path',
        key: 'ArrowUp',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'happy path',
        key: 'ArrowUp',
        initialHighlightedItem: '2',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'skips the disabled item',
        key: 'ArrowUp',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['5'],
        disableListWrap: false,
        expected: '4',
      },
      {
        description: 'skips multiple disabled items',
        key: 'ArrowUp',
        initialHighlightedItem: '1',
        disabledItemFocusable: false,
        disabledItems: ['4', '5'],
        disableListWrap: false,
        expected: '3',
      },
      {
        description: 'skips the disabled items and wraps around',
        key: 'ArrowUp',
        initialHighlightedItem: '2',
        disabledItemFocusable: false,
        disabledItems: ['1', '4', '5'],
        disableListWrap: false,
        expected: '3',
      },
      {
        description: 'focuses the disabled item',
        key: 'ArrowUp',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['5'],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'does not wrap around',
        key: 'ArrowUp',
        initialHighlightedItem: '1',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: true,
        expected: '1',
      },
      {
        description: 'remains on the same item when all the previous are disabled',
        key: 'ArrowUp',
        initialHighlightedItem: '3',
        disabledItemFocusable: false,
        disabledItems: ['1', '2'],
        disableListWrap: true,
        expected: '3',
      },
      {
        description: 'all disabled',
        key: 'ArrowUp',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: null,
      },
      {
        description: 'all disabled but focusable',
        key: 'ArrowUp',
        initialHighlightedItem: null,
        disabledItemFocusable: true,
        disabledItems: ['1', '2', '3', '4', '5'],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'happy path',
        key: 'PageDown',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '3',
      },
      {
        description: 'skips the disabled item',
        key: 'PageDown',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: ['3'],
        disableListWrap: false,
        expected: '4',
      },
      {
        description: 'does not wrap around, no matter the setting',
        key: 'PageDown',
        initialHighlightedItem: '4',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '5',
      },
      {
        description: 'does not wrap around, no matter the setting, and skips the disabled item',
        key: 'PageDown',
        initialHighlightedItem: '3',
        disabledItemFocusable: false,
        disabledItems: ['5'],
        disableListWrap: false,
        expected: '4',
      },
      {
        description: 'happy path',
        key: 'PageUp',
        initialHighlightedItem: null,
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'skips the disabled item',
        key: 'PageUp',
        initialHighlightedItem: '5',
        disabledItemFocusable: false,
        disabledItems: ['2'],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'does not wrap around, no matter the setting',
        key: 'PageUp',
        initialHighlightedItem: '2',
        disabledItemFocusable: false,
        disabledItems: [],
        disableListWrap: false,
        expected: '1',
      },
      {
        description: 'does not wrap around, no matter the setting, and skips the disabled item',
        key: 'PageUp',
        initialHighlightedItem: '3',
        disabledItemFocusable: false,
        disabledItems: ['1'],
        disableListWrap: false,
        expected: '2',
      },
    ];

    testCases.forEach((spec: KeydownTestCase) => {
      describe(`given initialHighlightedItem: '${
        spec.initialHighlightedItem
      }', disabledItemsFocusable: ${spec.disabledItemFocusable}, disableListWrap: ${
        spec.disableListWrap
      }, disabledItems: [${spec.disabledItems.join()}]`, () => {
        it(`${spec.description}: should highlight the '${spec.expected}' item after the ${spec.key} is pressed`, () => {
          const state: ListState<string> = {
            highlightedValue: spec.initialHighlightedItem,
            selectedValues: [],
            items: new IndexableMap([
              ['1', { value: '1', disabled: spec.disabledItems.includes('1') }],
              ['2', { value: '2', disabled: spec.disabledItems.includes('2') }],
              ['3', { value: '3', disabled: spec.disabledItems.includes('3') }],
              ['4', { value: '4', disabled: spec.disabledItems.includes('4') }],
              ['5', { value: '5', disabled: spec.disabledItems.includes('5') }],
            ]),
            settings: {
              disableListWrap: spec.disableListWrap,
              disabledItemsFocusable: spec.disabledItemFocusable,
              focusManagement: 'activeDescendant',
              orientation: 'vertical',
              pageSize: 3,
              selectionMode: 'single',
            },
          };

          const action: ListAction<string> = {
            type: ListActionTypes.keyDown,
            key: spec.key,
            event: null as any, // not relevant
          };

          const result = listReducer(state, action);
          expect(result.highlightedValue).to.equal(spec.expected);
        });
      });
    });

    describe('Enter key is pressed', () => {
      it('selects the highlighted option', () => {
        const state: ListState<string> = {
          highlightedValue: 'two',
          selectedValues: [],
          items: new IndexableMap([
            ['one', { value: 'one', disabled: false }],
            ['two', { value: 'two', disabled: false }],
            ['three', { value: 'three', disabled: false }],
          ]),
          settings: {
            disableListWrap: false,
            disabledItemsFocusable: false,
            focusManagement: 'activeDescendant',
            orientation: 'vertical',
            pageSize: 5,
            selectionMode: 'single',
          },
        };

        const action: ListAction<string> = {
          type: ListActionTypes.keyDown,
          key: 'Enter',
          event: {} as any,
        };

        const result = listReducer(state, action);
        expect(result.selectedValues).to.deep.equal(['two']);
      });

      it('replaces the selectedValues with the highlighted value if selectionMode = "single"', () => {
        const state: ListState<string> = {
          highlightedValue: 'two',
          selectedValues: ['one'],
          items: new IndexableMap([
            ['one', { value: 'one', disabled: false }],
            ['two', { value: 'two', disabled: false }],
            ['three', { value: 'three', disabled: false }],
          ]),
          settings: {
            disableListWrap: false,
            disabledItemsFocusable: false,
            focusManagement: 'activeDescendant',
            orientation: 'vertical',
            pageSize: 5,
            selectionMode: 'single',
          },
        };

        const action: ListAction<string> = {
          type: ListActionTypes.keyDown,
          key: 'Enter',
          event: {} as any,
        };

        const result = listReducer(state, action);
        expect(result.selectedValues).to.deep.equal(['two']);
      });

      it('add the highlighted value to the selection if selectionMode = "multiple"', () => {
        const state: ListState<string> = {
          highlightedValue: 'two',
          selectedValues: ['one'],
          items: new IndexableMap([
            ['one', { value: 'one', disabled: false }],
            ['two', { value: 'two', disabled: false }],
            ['three', { value: 'three', disabled: false }],
          ]),
          settings: {
            disableListWrap: false,
            disabledItemsFocusable: false,
            focusManagement: 'activeDescendant',
            orientation: 'vertical',
            pageSize: 5,
            selectionMode: 'multiple',
          },
        };

        const action: ListAction<string> = {
          type: ListActionTypes.keyDown,
          key: 'Enter',
          event: {} as any,
        };

        const result = listReducer(state, action);
        expect(result.selectedValues).to.deep.equal(['one', 'two']);
      });
    });
  });

  describe('action: textNavigation', () => {
    it('should navigate to next match', () => {
      const state: ListState<string> = {
        highlightedValue: 'two',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
          ['four', { value: 'four', disabled: false }],
          ['five', { value: 'five', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.textNavigation,
        searchString: 'th',
        event: {} as React.KeyboardEvent,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('three');
    });

    it('should not move the highlight when there are no matched items', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
          ['four', { value: 'four', disabled: false }],
          ['five', { value: 'five', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.textNavigation,
        searchString: 'z',
        event: {} as React.KeyboardEvent,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('one');
    });

    it('should highlight first match that is not disabled', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: true }],
          ['three', { value: 'three', disabled: false }],
          ['four', { value: 'four', disabled: false }],
          ['five', { value: 'five', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.textNavigation,
        searchString: 't',
        event: {} as React.KeyboardEvent,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('three');
    });

    it('should move highlight to disabled items if disabledItemsFocusable=true', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: true }],
          ['three', { value: 'three', disabled: false }],
          ['four', { value: 'four', disabled: false }],
          ['five', { value: 'five', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: true,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.textNavigation,
        searchString: 't',
        event: {} as React.KeyboardEvent,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('two');
    });

    it('should not move highlight when disabled wrap and match is before highlighted option', () => {
      const state: ListState<string> = {
        highlightedValue: 'three',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
          ['four', { value: 'four', disabled: false }],
          ['five', { value: 'five', disabled: false }],
        ]),
        settings: {
          disableListWrap: true,
          disabledItemsFocusable: false,
          focusManagement: 'activeDescendant',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'single',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.textNavigation,
        searchString: 'one',
        event: {} as React.KeyboardEvent,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('three');
    });
  });

  describe('action: itemsChange', () => {
    const irrelevantConfig = {
      disableListWrap: false,
      disabledItemsFocusable: false,
      focusManagement: 'activeDescendant' as const,
      orientation: 'vertical' as const,
      pageSize: 5,
      selectionMode: 'single' as const,
    };

    it('keeps the highlighted value if it is present among the new items', () => {
      const state: ListState<string> = {
        highlightedValue: '1',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
        ]),
        settings: irrelevantConfig,
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemsChange,
        event: null,
        items: [
          { value: '0', disabled: false },
          { value: '1', disabled: false },
          { value: '2', disabled: false },
        ],
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('1');
    });

    it('resets the highlighted value if it is not present among the new items', () => {
      const state: ListState<string> = {
        highlightedValue: '0',
        selectedValues: [],
        items: new IndexableMap([
          ['0', { value: '0', disabled: false }],
          ['1', { value: '1', disabled: false }],
          ['2', { value: '2', disabled: false }],
        ]),
        settings: irrelevantConfig,
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemsChange,
        event: null,
        items: [
          { value: '1', disabled: false },
          { value: '2', disabled: false },
        ],
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal(null);
    });

    it('keeps the selected values if they are present among the new items', () => {
      const state: ListState<string> = {
        highlightedValue: '1',
        selectedValues: ['1', '2'],
        items: new IndexableMap([
          ['0', { value: '0', disabled: false }],
          ['1', { value: '1', disabled: false }],
          ['2', { value: '2', disabled: false }],
        ]),
        settings: irrelevantConfig,
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemsChange,
        event: null,
        items: [
          { value: '1', disabled: false },
          { value: '2', disabled: false },
        ],
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['1', '2']);
    });

    it('removes the values from the selection if they are no longer present among the new items', () => {
      const state: ListState<string> = {
        highlightedValue: '1',
        selectedValues: ['0', '2'],
        items: new IndexableMap([
          ['0', { value: '0', disabled: false }],
          ['1', { value: '1', disabled: false }],
          ['2', { value: '2', disabled: false }],
        ]),
        settings: irrelevantConfig,
      };

      const action: ListAction<string> = {
        type: ListActionTypes.itemsChange,
        event: null,
        items: [
          { value: '1', disabled: false },
          { value: '2', disabled: false },
        ],
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal(['2']);
    });

    describe('after the items are initialized', () => {
      it('highlights the first item when using DOM focus management', () => {
        const state: ListState<string> = {
          highlightedValue: null,
          selectedValues: [],
          items: new IndexableMap(),
          settings: {
            ...irrelevantConfig,
            focusManagement: 'DOM',
          },
        };

        const action: ListAction<string> = {
          type: ListActionTypes.itemsChange,
          items: [
            { value: '1', disabled: false },
            { value: '2', disabled: false },
          ],
          event: null,
        };

        const result = listReducer(state, action);
        expect(result.highlightedValue).to.equal('1');
      });

      it('highlights the first enabled item when using DOM focus management', () => {
        const state: ListState<string> = {
          highlightedValue: null,
          selectedValues: [],
          items: new IndexableMap(),

          settings: {
            ...irrelevantConfig,
            focusManagement: 'DOM',
          },
        };

        const action: ListAction<string> = {
          type: ListActionTypes.itemsChange,
          event: null,
          items: [
            { value: '1', disabled: true },
            { value: '2', disabled: true },
            { value: '3', disabled: false },
          ],
        };

        const result = listReducer(state, action);
        expect(result.highlightedValue).to.equal('3');
      });
    });
  });

  describe('action: resetHighlight', () => {
    it('highlights the first item', () => {
      const state: ListState<string> = {
        highlightedValue: 'three',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'DOM',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.resetHighlight,
        event: null,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('one');
    });

    it('highlights the first non-disabled item', () => {
      const state: ListState<string> = {
        highlightedValue: 'three',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: true }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'DOM',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.resetHighlight,
        event: null,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('two');
    });
  });

  describe('action: highlightLast', () => {
    it('highlights the last item', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: false }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'DOM',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.highlightLast,
        event: null,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('three');
    });

    it('highlights the last non-disabled item', () => {
      const state: ListState<string> = {
        highlightedValue: 'one',
        selectedValues: [],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: true }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'DOM',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.highlightLast,
        event: null,
      };

      const result = listReducer(state, action);
      expect(result.highlightedValue).to.equal('two');
    });
  });

  describe('action: clearSelection', () => {
    it('clears the selection', () => {
      const state: ListState<string> = {
        highlightedValue: null,
        selectedValues: ['one', 'two'],
        items: new IndexableMap([
          ['one', { value: 'one', disabled: false }],
          ['two', { value: 'two', disabled: false }],
          ['three', { value: 'three', disabled: true }],
        ]),
        settings: {
          disableListWrap: false,
          disabledItemsFocusable: false,
          focusManagement: 'DOM',
          orientation: 'vertical',
          pageSize: 5,
          selectionMode: 'none',
        },
      };

      const action: ListAction<string> = {
        type: ListActionTypes.clearSelection,
      };

      const result = listReducer(state, action);
      expect(result.selectedValues).to.deep.equal([]);
    });
  });
});
