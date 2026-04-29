export const dynamic = 'force-dynamic';

/**
 * Always responds with 404 + a tiny non-image body, so an `<img>` pointed at this URL fires its
 * `error` event a few ms after the request lands. Used by the Avatar playground's "broken src"
 * demo to exercise the real `loading → error` network path deterministically — relying on a remote
 * 404 (e.g. `example.com/missing.png`) is flaky because the response can hang for tens of seconds,
 * and pointing at an undefined route forces Next.js dev to compile the global not-found handler on
 * first hit, which can also block for several seconds.
 */
export function GET() {
  return new Response('not an image', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
