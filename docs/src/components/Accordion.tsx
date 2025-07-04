'use client';
import * as React from 'react';
import clsx from 'clsx';

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
  ...props
}: React.ComponentProps<'summary'> & {
  index: number;
}) {
  const context = React.useContext(AccordionContext);

  return (
    <summary
      {...props}
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
  return <details {...props} className={clsx('AccordionItem', props.className)} />;
}

export function Panel(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionPanel', props.className)} />;
}

export function Content(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionContent', props.className)} />;
}

export function HeaderRow(props: React.ComponentProps<'div'>) {
  return <div {...props} aria-hidden className={clsx('AccordionHeaderRow', props.className)} />;
}

export function HeaderCell(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionHeaderCell', props.className)} />;
}
