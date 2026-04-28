'use client';

import { AvatarExperimentDemo } from '../_components/AvatarExperimentDemo';
import styles from '../_components/AvatarExperimentDemo.module.css';

/** Pauses on the server before returning the image bytes — see `src/app/api/experiments/slow-avatar/route.tsx`. */
const SLOW_LOAD_MS = 2000;

const SLOW_AVATAR_SRC = `/api/experiments/slow-avatar?ms=${SLOW_LOAD_MS}`;

export default function AvatarExperimentRowOne() {
  /** Slow API URL — server delays before bytes; intrinsic `<img>` still loads after response. */
  return (
    <AvatarExperimentDemo
      src={SLOW_AVATAR_SRC}
      pageClassName={styles.pageRowOne}
      fallbackClassName={styles.avatarFallbackRowOne}
    />
  );
}
