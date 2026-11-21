// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPosts } from '../posts';
import { GET } from './route';

vi.mock('../posts', () => ({ getPosts: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
});

function getText(parent: Readonly<ParentNode>, selector: string) {
  return parent.querySelector(selector)?.textContent;
}

describe('blog RSS feed', () => {
  beforeEach(() => {
    vi.stubEnv('BASE_URL', 'https://base-ui.com');
    const mockedGetPosts = vi.mocked(getPosts);
    mockedGetPosts.mockResolvedValue([
      {
        slug: 'new-post',
        title: 'Design & <interfaces> "today"',
        description: "A summary with <markup> & 'quotes'.",
        publishedAt: new Date('2026-10-20T00:00:00Z'),
        authors: [],
        metadata: {},
        Content: () => null,
      },
      {
        slug: 'older-post',
        title: 'Older post',
        description: undefined,
        publishedAt: new Date('2026-10-19T00:00:00Z'),
        authors: [],
        metadata: {},
        Content: () => null,
      },
    ]);
  });

  async function getXml() {
    const response = await GET();
    const feedText = await response.text();
    return new DOMParser().parseFromString(feedText, 'application/xml');
  }

  it('serves well-formed RSS XML with the RSS content type', async () => {
    const response = await GET();
    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
    const feedText = await response.text();
    const xml = new DOMParser().parseFromString(feedText, 'application/xml');
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.querySelector('rss')?.getAttribute('version')).toBe('2.0');
  });

  it('includes the channel title and canonical feed URLs', async () => {
    const xml = await getXml();
    expect(getText(xml, 'channel > title')).toBe('Notes on interfaces · Base UI');
    expect(getText(xml, 'channel > link')).toBe('https://base-ui.com/blog');
    const selfLink = xml.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
    expect(selfLink.getAttribute('href')).toBe('https://base-ui.com/blog/rss.xml');
    expect(selfLink.getAttribute('rel')).toBe('self');
  });

  it('escapes item titles and summaries', async () => {
    const xml = await getXml();
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(getText(xml, 'item > title')).toBe('Design & <interfaces> "today"');
    expect(getText(xml, 'item > description')).toBe("A summary with <markup> & 'quotes'.");
  });

  it('includes every post with canonical links and stable permalink GUIDs', async () => {
    const xml = await getXml();
    const items = xml.querySelectorAll('item');
    expect(items).toHaveLength(2);
    expect(getText(items[0], 'link')).toBe('https://base-ui.com/blog/new-post');
    expect(getText(items[0], 'guid')).toBe('https://base-ui.com/blog/new-post');
    expect(items[0].querySelector('guid')?.getAttribute('isPermaLink')).toBe('true');
    expect(getText(items[1], 'title')).toBe('Older post');
    expect(getText(items[1], 'link')).toBe('https://base-ui.com/blog/older-post');
    expect(getText(items[1], 'guid')).toBe('https://base-ui.com/blog/older-post');
  });

  it('includes publication dates in RFC 822 format', async () => {
    const xml = await getXml();
    expect(getText(xml, 'item > pubDate')).toBe('Tue, 20 Oct 2026 00:00:00 GMT');
  });

  it('omits descriptions for posts without a summary', async () => {
    const xml = await getXml();
    const items = xml.querySelectorAll('item');
    expect(items[0].querySelector('description')).not.toBeNull();
    expect(items[1].querySelector('description')).toBeNull();
  });

  it('serves a valid channel when there are no posts', async () => {
    vi.mocked(getPosts).mockResolvedValue([]);
    const xml = await getXml();
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.querySelector('rss')?.getAttribute('version')).toBe('2.0');
    expect(xml.querySelector('channel')).not.toBeNull();
    expect(xml.querySelectorAll('item')).toHaveLength(0);
  });
});
