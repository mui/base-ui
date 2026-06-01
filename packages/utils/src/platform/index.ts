/**
 * Platform-detection flags. SSR-safe — every flag is `false` when `navigator`
 * is undefined, except `pointer.hover`, which defaults to `true` (assume
 * desktop).
 *
 * Import as a namespace and pick the most precise group for the quirk:
 *
 * ```ts
 * import { platform } from '@base-ui/utils/platform';
 * if (platform.os.mac) { ... }
 * if (platform.engine.webkit) { ... }
 * ```
 *
 * Each category is its own module under `./platform/*`, so unused namespaces
 * tree-shake away.
 *
 *   - `os.*` for OS-specific behavior (keyboard shortcuts, native menus).
 *   - `engine.*` for rendering-engine bugs (CSS, layout, focus).
 *   - `pointer.*` for input-modality assumptions.
 *   - `screenReader.*` for AT-specific accessibility workarounds.
 *   - `env.*` for test-environment gating.
 */

export * as platform from './parts';
