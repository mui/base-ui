import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const UPSTREAM_AVATAR =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

/** 1×1 PNG fallback if upstream fetch fails (no outbound deps for a successful decode). */
const SAMPLE_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Waits `ms` (query, default 2000, max 30_000), then returns image bytes.
 * Tries the Wikimedia apple JPEG first (with a browser-like User-Agent); falls back to a tiny PNG
 * so the Avatar preload always gets a 200 + valid image (some environments block bare Node fetches).
 */
export async function GET(request: NextRequest) {
  const msParam = request.nextUrl.searchParams.get('ms');
  const ms = Math.min(Math.max(Number(msParam ?? '2000') || 0, 0), 30_000);

  await sleep(ms);

  try {
    const upstream = await fetch(UPSTREAM_AVATAR, {
      cache: 'no-store',
      headers: {
        Accept: 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; Base-UI-docs/1; +https://base-ui.com)',
      },
    });

    if (upstream.ok) {
      const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
      const buffer = await upstream.arrayBuffer();
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch {
    // ignore; use fallback
  }

  return new Response(SAMPLE_PNG_BYTES, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}
