'use client';

import { AvatarExperimentDemo } from '../_components/AvatarExperimentDemo';
import styles from '../_components/AvatarExperimentDemo.module.css';

/** Pauses on the server before returning the image bytes — see `src/app/api/experiments/slow-avatar/route.tsx`. */
const SLOW_LOAD_MS = 2000;

const SLOW_AVATAR_SRC = `/api/experiments/slow-avatar?ms=${SLOW_LOAD_MS}`;

/** Same apple as `AvatarExperimentDemo` default — no artificial delay (contrast with `SLOW_AVATAR_SRC`). */
const FAST_AVATAR_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

/** Same broken URL pattern as `row-two.tsx` — no asset; Fallback after `@error`. */
const BROKEN_AVATAR_SRC = 'https://example.com/base-ui-avatar-experiment-broken-image.png';

export default function AvatarExperimentRowOne() {
  return (
    <AvatarExperimentDemo
      pageClassName={styles.pageRowOne}
      fallbackClassName={styles.avatarFallbackRowOne}
      avatars={[
        { src: FAST_AVATAR_SRC },
        { src: SLOW_AVATAR_SRC },
        { src: BROKEN_AVATAR_SRC },
      ]}
    />
  );
}
