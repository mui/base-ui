'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';

const limit = 8;

export default function ExampleAutocompleteLimit() {
  const [value, setValue] = React.useState('');

  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  const totalMatches = React.useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return tags.length;
    }
    return tags.filter((t) => contains(t.value, trimmed)).length;
  }, [value, contains]);

  const moreCount = Math.max(0, totalMatches - limit);

  return (
    <Autocomplete.Root items={tags} value={value} onValueChange={setValue} limit={limit}>
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        Limit results to 8
        <Autocomplete.Input
          placeholder="e.g. component"
          className="bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="outline-hidden" sideOffset={4}>
          <Autocomplete.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Autocomplete.Empty className="px-4 py-2 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No results found for "{value}"
            </Autocomplete.Empty>

            <Autocomplete.List>
              {(tag: Tag) => (
                <Autocomplete.Item
                  key={tag.id}
                  className="flex cursor-default py-2 pr-8 pl-4 text-base leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
                  value={tag}
                >
                  {tag.value}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>

            <Autocomplete.Status className="mt-1 px-4 py-2 text-sm leading-5 text-gray-600 empty:m-0 empty:p-0">
              {moreCount > 0
                ? `Hiding ${moreCount} results (type a more specific query to narrow results)`
                : null}
            </Autocomplete.Status>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

interface Tag {
  id: string;
  value: string;
}

// Larger dataset to make the limit visible.
const tags: Tag[] = [
  { id: 't1', value: 'feature' },
  { id: 't2', value: 'fix' },
  { id: 't3', value: 'bug' },
  { id: 't4', value: 'docs' },
  { id: 't5', value: 'internal' },
  { id: 't6', value: 'mobile' },
  { id: 't7', value: 'frontend' },
  { id: 't8', value: 'backend' },
  { id: 't9', value: 'performance' },
  { id: 't10', value: 'accessibility' },
  { id: 't11', value: 'design' },
  { id: 't12', value: 'research' },
  { id: 't13', value: 'testing' },
  { id: 't14', value: 'infrastructure' },
  { id: 't15', value: 'documentation' },
  { id: 'c-accordion', value: 'component: accordion' },
  { id: 'c-alert-dialog', value: 'component: alert dialog' },
  { id: 'c-autocomplete', value: 'component: autocomplete' },
  { id: 'c-avatar', value: 'component: avatar' },
  { id: 'c-checkbox', value: 'component: checkbox' },
  { id: 'c-checkbox-group', value: 'component: checkbox group' },
  { id: 'c-collapsible', value: 'component: collapsible' },
  { id: 'c-combobox', value: 'component: combobox' },
  { id: 'c-context-menu', value: 'component: context menu' },
  { id: 'c-dialog', value: 'component: dialog' },
  { id: 'c-field', value: 'component: field' },
  { id: 'c-fieldset', value: 'component: fieldset' },
  { id: 'c-filterable-menu', value: 'component: filterable menu' },
  { id: 'c-form', value: 'component: form' },
  { id: 'c-input', value: 'component: input' },
  { id: 'c-menu', value: 'component: menu' },
  { id: 'c-menubar', value: 'component: menubar' },
  { id: 'c-meter', value: 'component: meter' },
  { id: 'c-navigation-menu', value: 'component: navigation menu' },
  { id: 'c-number-field', value: 'component: number field' },
  { id: 'c-popover', value: 'component: popover' },
  { id: 'c-preview-card', value: 'component: preview card' },
  { id: 'c-progress', value: 'component: progress' },
  { id: 'c-radio', value: 'component: radio' },
  { id: 'c-scroll-area', value: 'component: scroll area' },
  { id: 'c-select', value: 'component: select' },
  { id: 'c-separator', value: 'component: separator' },
  { id: 'c-slider', value: 'component: slider' },
  { id: 'c-switch', value: 'component: switch' },
  { id: 'c-tabs', value: 'component: tabs' },
  { id: 'c-toast', value: 'component: toast' },
  { id: 'c-toggle', value: 'component: toggle' },
  { id: 'c-toggle-group', value: 'component: toggle group' },
  { id: 'c-toolbar', value: 'component: toolbar' },
  { id: 'c-tooltip', value: 'component: tooltip' },
];
