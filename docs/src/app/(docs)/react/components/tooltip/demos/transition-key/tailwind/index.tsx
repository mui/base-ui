'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';

const CHAPTERS = [
  { title: 'Intro', duration: 60 },
  { title: 'Designing the layout', duration: 210 },
  { title: 'Adding interactions', duration: 150 },
  { title: 'Publishing', duration: 90 },
];

const TOTAL_DURATION = CHAPTERS.reduce((total, chapter) => total + chapter.duration, 0);

export default function TooltipTransitionKeyDemo() {
  const [chapter, setChapter] = React.useState({ index: 0, direction: 'forward' });
  const segmentRefs = React.useRef<Array<HTMLSpanElement | null>>([]);

  // The pointer position along the timeline selects a chapter; `transitionKey`
  // morphs the tooltip between chapter titles as the pointer crosses a boundary.
  // In-place changes set no `data-activation-direction`, so the slide direction is
  // derived from the chapter order instead and styled through a custom attribute.
  function handlePointerMove(event: React.PointerEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;

    let index = CHAPTERS.length - 1;
    let end = 0;
    for (let i = 0; i < CHAPTERS.length; i += 1) {
      end += CHAPTERS[i].duration / TOTAL_DURATION;
      if (position < end) {
        index = i;
        break;
      }
    }

    setChapter((previous) =>
      previous.index === index
        ? previous
        : { index, direction: index > previous.index ? 'forward' : 'back' },
    );
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root
        onOpenChangeComplete={(nextOpen) => {
          // Reset after the exit animation so the content freezes in place while fading out
          if (!nextOpen) {
            setChapter({ index: 0, direction: 'forward' });
          }
        }}
      >
        <Tooltip.Trigger
          aria-label="Video timeline"
          className="group flex h-6 w-64 cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          onPointerMove={handlePointerMove}
        >
          {CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.title}
              ref={(node) => {
                segmentRefs.current[index] = node;
              }}
              className="h-1.5 bg-neutral-300 group-hover:bg-neutral-400 dark:bg-neutral-800 dark:group-hover:bg-neutral-600"
              style={{ flexGrow: chapter.duration }}
            />
          ))}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          {/* Anchoring to the hovered segment makes the tooltip glide between chapters
              in sync with the width morph, since the positioner transitions its position */}
          <Tooltip.Positioner
            anchor={segmentRefs.current[chapter.index] ?? undefined}
            sideOffset={8}
            className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <Tooltip.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-sm text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,scale,opacity] duration-[0.35s,0.35s,100ms,100ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease-out,ease-out] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Tooltip.Viewport
                transitionKey={chapter.index}
                data-direction={chapter.direction}
                className={`
                  relative h-full w-full overflow-clip px-2 py-1.5
                  [--direction:1] data-[direction=back]:[--direction:-1]
                  [&_[data-current]]:w-[calc(var(--popup-width)-1rem)]
                  [&_[data-current]]:opacity-100
                  [&_[data-current]]:transition-[opacity,transform]
                  [&_[data-current]]:duration-[175ms,0.35s]
                  [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                  [&_[data-current][data-starting-style]]:opacity-0
                  [&_[data-current][data-starting-style]]:translate-x-[calc(100%*var(--direction))]
                  [&_[data-previous]]:w-[calc(var(--popup-width)-1rem)]
                  [&_[data-previous]]:opacity-100
                  [&_[data-previous]]:transition-[opacity,transform]
                  [&_[data-previous]]:duration-[175ms,0.35s]
                  [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                  [&_[data-previous][data-ending-style]]:opacity-0
                  [&_[data-previous][data-ending-style]]:translate-x-[calc(-100%*var(--direction))]`}
              >
                <span className="block whitespace-nowrap">{CHAPTERS[chapter.index].title}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
