'use client';
import { Autocomplete } from '@base-ui/react/autocomplete';

export default function ExampleGroupAutocomplete() {
  return (
    <Autocomplete.Root items={groupedTags}>
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        Select a tag
        <Autocomplete.Input
          placeholder="e.g. feature"
          className="bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="outline-hidden" sideOffset={4}>
          <Autocomplete.Popup className="w-[var(--anchor-width)] max-h-[22.5rem] max-w-[var(--available-width)] rounded-lg bg-[canvas] text-gray-900 outline-1 outline-gray-200 shadow-lg shadow-gray-200 dark:outline-gray-300 dark:shadow-none">
            <Autocomplete.Empty className="px-4 py-2 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No tags found.
            </Autocomplete.Empty>
            <Autocomplete.List className="outline-0 overflow-y-auto scroll-pt-[2.25rem] scroll-pb-[0.5rem] overscroll-contain max-h-[min(22.5rem,var(--available-height))] data-[empty]:p-0">
              {(group: TagGroup) => (
                <Autocomplete.Group key={group.value} items={group.items} className="block pb-2">
                  <Autocomplete.GroupLabel className="sticky top-0 z-[1] mb-0 mr-2 mt-0 ml-0 w-[calc(100%-0.5rem)] bg-[canvas] px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider">
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(tag: Tag) => (
                      <Autocomplete.Item
                        key={tag.id}
                        className="flex cursor-default items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900"
                        value={tag}
                      >
                        {tag.label}
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

interface Tag {
  id: string;
  label: string;
  group: 'Type' | 'Component';
}

interface TagGroup {
  value: string;
  items: Tag[];
}

const tagsData: Tag[] = [
  { id: 't1', label: 'feature', group: 'Type' },
  { id: 't2', label: 'fix', group: 'Type' },
  { id: 't3', label: 'bug', group: 'Type' },
  { id: 't4', label: 'docs', group: 'Type' },
  { id: 't5', label: 'internal', group: 'Type' },
  { id: 't6', label: 'mobile', group: 'Type' },
  { id: 'c-accordion', label: 'component: accordion', group: 'Component' },
  { id: 'c-alert-dialog', label: 'component: alert dialog', group: 'Component' },
  { id: 'c-autocomplete', label: 'component: autocomplete', group: 'Component' },
  { id: 'c-avatar', label: 'component: avatar', group: 'Component' },
  { id: 'c-checkbox', label: 'component: checkbox', group: 'Component' },
  { id: 'c-checkbox-group', label: 'component: checkbox group', group: 'Component' },
  { id: 'c-collapsible', label: 'component: collapsible', group: 'Component' },
  { id: 'c-combobox', label: 'component: combobox', group: 'Component' },
  { id: 'c-context-menu', label: 'component: context menu', group: 'Component' },
  { id: 'c-dialog', label: 'component: dialog', group: 'Component' },
  { id: 'c-field', label: 'component: field', group: 'Component' },
  { id: 'c-fieldset', label: 'component: fieldset', group: 'Component' },
  { id: 'c-filterable-menu', label: 'component: filterable menu', group: 'Component' },
  { id: 'c-form', label: 'component: form', group: 'Component' },
  { id: 'c-input', label: 'component: input', group: 'Component' },
  { id: 'c-menu', label: 'component: menu', group: 'Component' },
  { id: 'c-menubar', label: 'component: menubar', group: 'Component' },
  { id: 'c-meter', label: 'component: meter', group: 'Component' },
  { id: 'c-navigation-menu', label: 'component: navigation menu', group: 'Component' },
  { id: 'c-number-field', label: 'component: number field', group: 'Component' },
  { id: 'c-popover', label: 'component: popover', group: 'Component' },
  { id: 'c-preview-card', label: 'component: preview card', group: 'Component' },
  { id: 'c-progress', label: 'component: progress', group: 'Component' },
  { id: 'c-radio', label: 'component: radio', group: 'Component' },
  { id: 'c-scroll-area', label: 'component: scroll area', group: 'Component' },
  { id: 'c-select', label: 'component: select', group: 'Component' },
  { id: 'c-separator', label: 'component: separator', group: 'Component' },
  { id: 'c-slider', label: 'component: slider', group: 'Component' },
  { id: 'c-switch', label: 'component: switch', group: 'Component' },
  { id: 'c-tabs', label: 'component: tabs', group: 'Component' },
  { id: 'c-toast', label: 'component: toast', group: 'Component' },
  { id: 'c-toggle', label: 'component: toggle', group: 'Component' },
  { id: 'c-toggle-group', label: 'component: toggle group', group: 'Component' },
  { id: 'c-toolbar', label: 'component: toolbar', group: 'Component' },
  { id: 'c-tooltip', label: 'component: tooltip', group: 'Component' },
];

function groupTags(tags: Tag[]): TagGroup[] {
  const groups: { [key: string]: Tag[] } = {};
  tags.forEach((t) => {
    (groups[t.group] ??= []).push(t);
  });
  const order = ['Type', 'Component'];
  return order.map((value) => ({ value, items: groups[value] ?? [] }));
}

const groupedTags: TagGroup[] = groupTags(tagsData);
