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
        <Tooltip.Trigger aria-label="Video timeline" className={styles.Timeline}>
          {CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.title}
              ref={segmentRefs[index]}
              className={styles.Segment}
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
            className={styles.Positioner}
          >
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Viewport className={styles.Viewport} transitionKey={chapterIndex}>
                <span className={styles.Content}>{CHAPTERS[chapterIndex].title}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
