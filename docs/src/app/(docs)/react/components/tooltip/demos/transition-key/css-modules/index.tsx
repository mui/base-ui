'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './index.module.css';

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
          className={styles.Timeline}
          onPointerMove={handlePointerMove}
        >
          {CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.title}
              ref={(node) => {
                segmentRefs.current[index] = node;
              }}
              className={styles.Segment}
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
            className={styles.Positioner}
          >
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Viewport
                className={styles.Viewport}
                transitionKey={chapter.index}
                data-direction={chapter.direction}
              >
                <span className={styles.Content}>{CHAPTERS[chapter.index].title}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
