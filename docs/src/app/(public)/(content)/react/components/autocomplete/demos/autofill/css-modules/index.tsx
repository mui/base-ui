import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';

export default function ExampleAutofillAutocomplete() {
  const [searchValue, setSearchValue] = React.useState('');
  const [inputHighlightValue, setInputHighlightValue] = React.useState('');

  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  const filteredTags = React.useMemo(() => {
    if (searchValue.trim() === '') {
      return tags;
    }
    return tags.filter((tag) => contains(tag.label, searchValue));
  }, [searchValue, contains]);

  return (
    <div className={styles.Container}>
      <Autocomplete.Root
        value={inputHighlightValue || searchValue}
        onValueChange={(nextValue) => {
          setInputHighlightValue('');
          setSearchValue(nextValue);
        }}
        onItemHighlighted={(highlightedValue, { type }) => {
          if (type !== 'keyboard') {
            return;
          }

          if (!highlightedValue) {
            setInputHighlightValue('');
            return;
          }

          setInputHighlightValue(highlightedValue);
        }}
      >
        <label className={styles.Label}>
          Enter tag
          <Autocomplete.Input placeholder="e.g. feature" className={styles.Input} />
        </label>

        {filteredTags.length > 0 && (
          <Autocomplete.Portal>
            <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
              <Autocomplete.Popup className={styles.Popup}>
                <Autocomplete.List>
                  {filteredTags.map((tag) => (
                    <Autocomplete.Item
                      key={tag.id}
                      value={tag.label}
                      className={styles.Item}
                      onClick={() => {
                        setInputHighlightValue('');
                        setSearchValue(tag.label ?? '');
                      }}
                    >
                      {tag.label}
                    </Autocomplete.Item>
                  ))}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        )}
      </Autocomplete.Root>
    </div>
  );
}

const tags = [
  { id: 't1', label: 'feature' },
  { id: 't2', label: 'fix' },
  { id: 't3', label: 'bug' },
  { id: 't4', label: 'docs' },
  { id: 't5', label: 'internal' },
  { id: 't6', label: 'mobile' },
  { id: 'c-accordion', label: 'component: accordion' },
  { id: 'c-alert-dialog', label: 'component: alert dialog' },
  { id: 'c-autocomplete', label: 'component: autocomplete' },
  { id: 'c-avatar', label: 'component: avatar' },
  { id: 'c-checkbox', label: 'component: checkbox' },
  { id: 'c-checkbox-group', label: 'component: checkbox group' },
  { id: 'c-collapsible', label: 'component: collapsible' },
  { id: 'c-combobox', label: 'component: combobox' },
  { id: 'c-context-menu', label: 'component: context menu' },
  { id: 'c-dialog', label: 'component: dialog' },
  { id: 'c-field', label: 'component: field' },
  { id: 'c-fieldset', label: 'component: fieldset' },
  { id: 'c-filterable-menu', label: 'component: filterable menu' },
  { id: 'c-form', label: 'component: form' },
  { id: 'c-input', label: 'component: input' },
  { id: 'c-menu', label: 'component: menu' },
  { id: 'c-menubar', label: 'component: menubar' },
  { id: 'c-meter', label: 'component: meter' },
  { id: 'c-navigation-menu', label: 'component: navigation menu' },
  { id: 'c-number-field', label: 'component: number field' },
  { id: 'c-popover', label: 'component: popover' },
  { id: 'c-preview-card', label: 'component: preview card' },
  { id: 'c-progress', label: 'component: progress' },
  { id: 'c-radio', label: 'component: radio' },
  { id: 'c-scroll-area', label: 'component: scroll area' },
  { id: 'c-select', label: 'component: select' },
  { id: 'c-separator', label: 'component: separator' },
  { id: 'c-slider', label: 'component: slider' },
  { id: 'c-switch', label: 'component: switch' },
  { id: 'c-tabs', label: 'component: tabs' },
  { id: 'c-toast', label: 'component: toast' },
  { id: 'c-toggle', label: 'component: toggle' },
  { id: 'c-toggle-group', label: 'component: toggle group' },
  { id: 'c-toolbar', label: 'component: toolbar' },
  { id: 'c-tooltip', label: 'component: tooltip' },
];
