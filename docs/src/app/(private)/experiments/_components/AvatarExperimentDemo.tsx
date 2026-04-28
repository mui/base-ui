'use client';
import * as React from 'react';
import { Avatar } from '@base-ui/react/avatar';
import styles from './AvatarExperimentDemo.module.css';

/** Same apple image + transition styles as `transition-attrs` Avatar.Image / Avatar.Fallback demo. */
const DEFAULT_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

interface AvatarExperimentDemoProps {
  /** When unset, the default apple image URL is used. */
  src?: string;
  /** Extra class for `Avatar.Fallback` (e.g. row-one experiment styling). */
  fallbackClassName?: string;
}

export function AvatarExperimentDemo({
  src = DEFAULT_SRC,
  fallbackClassName,
}: AvatarExperimentDemoProps = {}) {
  return (
    <div className={styles.page}>
      <div className={styles.stack}>
        <Avatar.Root className={styles.avatarRoot}>
          <Avatar.Image className={styles.avatarImage} src={src} />
          <Avatar.Fallback
            className={[styles.avatarFallback, fallbackClassName].filter(Boolean).join(' ')}
          >
            AV
          </Avatar.Fallback>
        </Avatar.Root>
      </div>
    </div>
  );
}
