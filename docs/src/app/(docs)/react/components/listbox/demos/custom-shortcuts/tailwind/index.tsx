'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import type { ListboxRootActions } from '@base-ui/react/listbox';

type IconType = 'image' | 'text' | 'component';

const initialItems = [
  { label: 'Header', value: 'header', icon: 'text' as IconType },
  { label: 'Hero image', value: 'hero-image', icon: 'image' as IconType },
  { label: 'Body text', value: 'body-text', icon: 'text' as IconType },
  { label: 'Call to action', value: 'call-to-action', icon: 'component' as IconType },
  { label: 'Background', value: 'background', icon: 'image' as IconType },
];

function reorder(
  prev: typeof initialItems,
  event: { items: string[]; referenceItem: string; edge: 'before' | 'after' },
) {
  const movedValues = new Set(event.items);
  const movedItems = prev.filter((item) => movedValues.has(item.value));
  const rest = prev.filter((item) => !movedValues.has(item.value));
  const refIndex = rest.findIndex((item) => item.value === event.referenceItem);
  rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
  return rest;
}

export default function ExampleListboxCustomShortcuts() {
  const [items, setItems] = React.useState(initialItems);
  const actionsRef = React.useRef<ListboxRootActions<string>>(null);
  const highlightedRef = React.useRef<{ value: string; element: HTMLElement } | null>(null);

  function handleKeyDown(event: React.KeyboardEvent) {
    const highlighted = highlightedRef.current;
    if (!highlighted) {
      return;
    }

    if (event.key === ']') {
      event.preventDefault();
      const first = items[0];
      if (!first || first.value === highlighted.value) {
        return;
      }
      setItems((prev) =>
        reorder(prev, {
          items: [highlighted.value],
          referenceItem: first.value,
          edge: 'before',
        }),
      );
      actionsRef.current?.highlightValue(highlighted.value, highlighted.element);
    }

    if (event.key === '[') {
      event.preventDefault();
      const last = items[items.length - 1];
      if (!last || last.value === highlighted.value) {
        return;
      }
      setItems((prev) =>
        reorder(prev, {
          items: [highlighted.value],
          referenceItem: last.value,
          edge: 'after',
        }),
      );
      actionsRef.current?.highlightValue(highlighted.value, highlighted.element);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Listbox.Root
        defaultValue={['header']}
        actionsRef={actionsRef}
        onHighlightChange={(value, element) => {
          highlightedRef.current = value != null && element != null ? { value, element } : null;
        }}
      >
        <Listbox.Label className="cursor-default text-sm leading-5 font-medium text-gray-900">
          Layers
        </Listbox.Label>
        <Listbox.DragAndDropProvider
          onItemsReorder={(event) => setItems((prev) => reorder(prev, event))}
        >
          <Listbox.List
            className="box-border w-56 max-h-80 overflow-y-auto py-1 rounded-md outline outline-1 outline-gray-200 dark:outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800"
            onKeyDown={handleKeyDown}
          >
            {items.map(({ label, value, icon }) => (
              <Listbox.Item
                key={value}
                value={value}
                className="relative z-0 grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 text-gray-900 outline-hidden select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-xs data-[highlighted]:before:bg-gray-100 data-[selected]:before:bg-blue-800/10 data-[selected]:data-[highlighted]:before:bg-blue-800/18 data-[dragging]:opacity-50 data-[drop-target-edge=before]:after:absolute data-[drop-target-edge=before]:after:top-[-1px] data-[drop-target-edge=before]:after:left-1 data-[drop-target-edge=before]:after:right-1 data-[drop-target-edge=before]:after:h-0.5 data-[drop-target-edge=before]:after:bg-blue-800 data-[drop-target-edge=before]:after:content-[''] data-[drop-target-edge=after]:after:absolute data-[drop-target-edge=after]:after:bottom-[-1px] data-[drop-target-edge=after]:after:left-1 data-[drop-target-edge=after]:after:right-1 data-[drop-target-edge=after]:after:h-0.5 data-[drop-target-edge=after]:after:bg-blue-800 data-[drop-target-edge=after]:after:content-[''] pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
              >
                <LayerIcon type={icon} className="size-4 text-gray-400" />
                <Listbox.ItemText>{label}</Listbox.ItemText>
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>
    </div>
  );
}

const iconPaths: Record<IconType, React.ReactNode> = {
  image: (
    <React.Fragment>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21" />
    </React.Fragment>
  ),
  text: (
    <React.Fragment>
      <path d="m15 16 2.536-7.328a1.02 1.02 0 011.928 0L22 16" />
      <path d="M15.697 14h5.606" />
      <path d="m2 16 4.039-9.69a.5.5 0 01.923 0L11 16" />
      <path d="M3.304 13h6.392" />
    </React.Fragment>
  ),
  component: (
    <React.Fragment>
      <path d="M15.536 11.293a1 1 0 000 1.414l2.376 2.377a1 1 0 001.414 0l2.377-2.377a1 1 0 000-1.414l-2.377-2.377a1 1 0 00-1.414 0z" />
      <path d="M2.297 11.293a1 1 0 000 1.414l2.377 2.377a1 1 0 001.414 0l2.377-2.377a1 1 0 000-1.414L6.088 8.916a1 1 0 00-1.414 0z" />
      <path d="M8.916 17.912a1 1 0 000 1.415l2.377 2.376a1 1 0 001.414 0l2.377-2.376a1 1 0 000-1.415l-2.377-2.376a1 1 0 00-1.414 0z" />
      <path d="M8.916 4.674a1 1 0 000 1.414l2.377 2.376a1 1 0 001.414 0l2.377-2.376a1 1 0 000-1.414l-2.377-2.377a1 1 0 00-1.414 0z" />
    </React.Fragment>
  ),
};

function LayerIcon({ type, ...props }: React.ComponentProps<'svg'> & { type: IconType }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {iconPaths[type]}
    </svg>
  );
}
