export enum AvatarFallbackDataAttributes {
  /**
   * Present while the image is loading and the fallback is the active visual (i.e. the
   * `delay` window has elapsed). Targets the `loading` slot for consumers who want to render or
   * style the fallback differently while the image is still being fetched.
   */
  loading = 'data-loading',
  /**
   * Present whenever the fallback is _not_ the active visual — either the image bitmap is on
   * screen, or the `delay` window has not yet elapsed. The fallback element stays mounted in
   * both cases; consumers should hide it via CSS using this attribute.
   */
  loaded = 'data-loaded',
  /**
   * Present once the image fails to decode (or no `src` was provided) and the fallback is the
   * active visual. Lets consumers swap fallback content (e.g. an error icon vs. initials)
   * without observing `Avatar.Image`'s state directly.
   */
  error = 'data-error',
}
