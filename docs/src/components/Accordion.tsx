'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { observeScrollableInner } from '../utils/observeScrollableInner';

const ARROW_UP = 'ArrowUp';
const ARROW_DOWN = 'ArrowDown';
const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';
const HOME = 'Home';
const END = 'End';

const SUPPORTED_KEYS = new Set([ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT, HOME, END]);

const AccordionContext = React.createContext<
  { rootRef: React.RefObject<HTMLElement | null> } | undefined
>(undefined);

export function Root(props: React.ComponentProps<'section'>) {
  const rootRef = React.useRef<HTMLElement>(null);

  const context = React.useMemo(() => ({ rootRef }), [rootRef]);

  return (
    <AccordionContext.Provider value={context}>
      <section {...props} ref={rootRef} className={clsx('AccordionRoot', props.className)} />
    </AccordionContext.Provider>
  );
}

export function Trigger({
  index: thisIndex,
  id,
  ...props
}: React.ComponentProps<'summary'> & {
  index: number;
}) {
  const context = React.useContext(AccordionContext);

  return (
    <summary
      {...props}
      id={id}
      className={clsx('AccordionTrigger', props.className)}
      onKeyDown={(event) => {
        if (!context || !SUPPORTED_KEYS.has(event.key)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const rootElement = context.rootRef?.current;
        if (!rootElement) {
          return;
        }

        const triggers = rootElement.querySelectorAll<HTMLElement>('summary');

        let nextIndex = -1;
        const lastIndex = triggers.length - 1;

        switch (event.key) {
          case ARROW_LEFT:
          case ARROW_UP:
            nextIndex = thisIndex === 0 ? lastIndex : thisIndex - 1;
            break;
          case ARROW_RIGHT:
          case ARROW_DOWN:
            nextIndex = thisIndex + 1 > lastIndex ? 0 : thisIndex + 1;
            break;
          case 'Home':
            nextIndex = 0;
            break;
          case 'End':
            nextIndex = lastIndex;
            break;
          default:
            break;
        }

        if (nextIndex > -1) {
          triggers.item(nextIndex).focus();
        }

        props.onKeyDown?.(event);
      }}
      onClick={(event) => {
        const selection = window.getSelection();
        if (!selection?.isCollapsed) {
          event.preventDefault();
        }
        props.onClick?.(event);
      }}
      onMouseDown={(event) => {
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault();
        }
      }}
    />
  );
}

export function Item(props: React.ComponentProps<'details'>) {
  const [open, setOpen] = React.useState<boolean>(false);
  // in Chrome, the <details> opens automatically when the hash part of a URL
  // matches the `id` on <summary> but needs to be manually handled for Safari
  // and Firefox
  const handleRef = useStableCallback((element: HTMLDetailsElement | null) => {
    if (element) {
      const trigger = element.querySelector<HTMLElement>('summary');
      const triggerId = trigger?.getAttribute('id');
      const hash = window.location.hash.slice(1);

      if (triggerId && hash && triggerId === hash) {
        setOpen(true);
      }
    }
  });

  return (
    <details
      {...props}
      ref={handleRef}
      open={open || undefined}
      className={clsx('AccordionItem', props.className)}
    />
  );
}

export function Panel(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionPanel', props.className)} />;
}

export function Content(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionContent', props.className)} />;
}

/* Scroll container with an overscroll overlay graphic for overflowing content inside the trigger */
export function Scrollable({
  children,
  className,
  tag: Tag = 'span',
  gradientColor = 'var(--color-content)',
  ...props
}: React.ComponentProps<'span'> & {
  gradientColor?: string;
  tag?: React.ElementType;
}) {
  return (
    <Tag
      ref={observeScrollableInner}
      className={clsx('AccordionScrollable', className)}
      style={{ '--scrollable-gradient-color': gradientColor } as React.CSSProperties}
      {...props}
    >
      <Tag className="AccordionScrollableInner">{children}</Tag>
    </Tag>
  );
}

/* Fake <tr> */
export function HeaderRow(props: React.ComponentProps<'div'>) {
  return <div {...props} aria-hidden className={clsx('AccordionHeaderRow', props.className)} />;
}

/* Fake <th scope="col"> */
export function HeaderCell(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionHeaderCell', props.className)} />;
}
