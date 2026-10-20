import { getPosts } from '../posts';
import { BLOG_DESCRIPTION, BLOG_TITLE } from '../constants';

export const dynamic = 'force-static';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await getPosts();
  const blogUrl = new URL('/blog', process.env.BASE_URL).href;
  const feedUrl = new URL('/blog/rss.xml', process.env.BASE_URL).href;
  const items = posts.map((post) => {
    const url = escapeXml(new URL(`/blog/${post.slug}`, process.env.BASE_URL).href);

    return `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description ?? '')}</description>
      <pubDate>${post.publishedAt.toUTCString()}</pubDate>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${BLOG_TITLE} · Base UI`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(BLOG_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
