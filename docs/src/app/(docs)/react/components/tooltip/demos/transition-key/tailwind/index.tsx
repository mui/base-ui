'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';

const CHAPTERS = [
  { title: 'Intro', duration: 60 },
  { title: 'Designing the layout', duration: 210 },
  { title: 'Adding interactions', duration: 150 },
  { title: 'Publishing', duration: 90 },
];

export default function TooltipTransitionKeyDemo() {
  const [chapterIndex, setChapterIndex] = React.useState(0);
  const segmentRefs = React.useRef(CHAPTERS.map(() => React.createRef<HTMLSpanElement>())).current;

  return (
    <Tooltip.Provider>
      <Tooltip.Root
        onOpenChangeComplete={(nextOpen) => {
          // Reset after the exit animation so the content freezes in place while fading out
          if (!nextOpen) {
            setChapterIndex(0);
          }
        }}
      >
        <Tooltip.Trigger
          aria-label="Video timeline"
          className="group flex h-6 w-64 items-center gap-1 border-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          {CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.title}
              ref={segmentRefs[index]}
              className="flex items-center self-stretch before:h-1.5 before:w-full before:bg-neutral-400 before:content-[''] group-hover:before:bg-neutral-500 dark:before:bg-neutral-700 dark:group-hover:before:bg-neutral-600"
              style={{ flexGrow: chapter.duration }}
              onPointerEnter={() => setChapterIndex(index)}
            />
          ))}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          {/* Anchoring to the hovered segment makes the tooltip glide between chapters in sync
              with the width morph, and gives the swap its `data-activation-direction` tokens */}
          <Tooltip.Positioner
            anchor={segmentRefs[chapterIndex]}
            sideOffset={8}
            className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <Tooltip.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-sm text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,scale,opacity] duration-[0.35s,0.35s,100ms,100ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease-out,ease-out] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Tooltip.Viewport
                transitionKey={chapterIndex}
                className={`
                  relative h-full w-full overflow-clip px-2 py-1.5
                  [--direction:1] [&[data-activation-direction~='left']]:[--direction:-1]
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
                <span className="block whitespace-nowrap">{CHAPTERS[chapterIndex].title}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
