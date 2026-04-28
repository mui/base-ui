'use client';
import * as React from 'react';
import { Avatar } from '@base-ui/react/avatar';
import styles from './AvatarExperimentDemo.module.css';

/** Same apple image + transition styles as `transition-attrs` Avatar.Image / Avatar.Fallback demo. */
const DEFAULT_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

interface AvatarExperimentDemoProps {
  /** When unset, the default apple image URL is used. Ignored when `avatars` is set. */
  src?: string;
  /** When set, renders one avatar per entry (e.g. row demos); `src` is ignored. */
  avatars?: ReadonlyArray<{ src: string; fallbackDelay?: number }>;
  /** Extra class for the outer page wrapper (e.g. row-one background). */
  pageClassName?: string;
  /** Extra class for each `Avatar.Fallback` (e.g. row-one experiment styling). */
  fallbackClassName?: string;
}

export function AvatarExperimentDemo({
  src = DEFAULT_SRC,
  avatars,
  pageClassName,
  fallbackClassName,
}: AvatarExperimentDemoProps = {}) {
  const items = avatars?.length ? [...avatars] : [{ src }];
  const stackClassName =
    items.length > 1 ? [styles.stack, styles.stackRow].join(' ') : styles.stack;

  return (
    <div className={[styles.page, pageClassName].filter(Boolean).join(' ')}>
      <div className={stackClassName}>
        {items.map((item, index) => (
          <Avatar.Root key={`${item.src}-${index}`} className={styles.avatarRoot}>
            <Avatar.Image className={styles.avatarImage} src={item.src} />
            <Avatar.Fallback
              className={[styles.avatarFallback, fallbackClassName].filter(Boolean).join(' ')}
              delay={item.fallbackDelay}
            >
              AV
            </Avatar.Fallback>
          </Avatar.Root>
        ))}
      </div>
    </div>
  );
}
