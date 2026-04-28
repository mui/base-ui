'use client';

import { AvatarExperimentDemo } from '../_components/AvatarExperimentDemo';

/** Deliberately broken — no image at this path; Fallback shows after `@error`. */
const BROKEN_AVATAR_SRC = 'https://example.com/base-ui-avatar-experiment-broken-image.png';

export default function AvatarExperimentRowTwo() {
  return <AvatarExperimentDemo src={BROKEN_AVATAR_SRC} />;
}
