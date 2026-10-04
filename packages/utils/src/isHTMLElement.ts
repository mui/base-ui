// `@floating-ui/utils` is already a dependency and its check is the one
// `packages/react` uses directly, so re-export rather than keep a second
// cross-realm implementation in the repo.
export { isHTMLElement } from '@floating-ui/utils/dom';
