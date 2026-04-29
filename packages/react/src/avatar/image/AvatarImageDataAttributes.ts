export enum AvatarImageDataAttributes {
  /**
   * Present while the image is loading (no decoded bitmap yet).
   */
  loading = 'data-loading',
  /**
   * Present once the image bitmap has decoded and is on screen.
   */
  loaded = 'data-loaded',
  /**
   * Present when no `src` was provided or the bitmap failed to decode.
   */
  error = 'data-error',
  /**
   * Present after the component has hydrated on the client.
   */
  hydrated = 'data-hydrated',
}
