// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  it('serves summaries with escaped text, canonical URLs, stable GUIDs, and publication dates', async () => {
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

    const response = await GET();
    const feedText = await response.text();
    const xml = new DOMParser().parseFromString(feedText, 'application/xml');

    const contentType = response.headers.get('Content-Type');
    expect(contentType).toBe('application/rss+xml; charset=utf-8');
    const parseError = xml.querySelector('parsererror');
    expect(parseError).toBeNull();
    const channelTitle = getText(xml, 'channel > title');
    expect(channelTitle).toBe('Notes on interfaces · Base UI');
    const channelLink = getText(xml, 'channel > link');
    expect(channelLink).toBe('https://base-ui.com/blog');
    const selfLink = xml.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
    const selfHref = selfLink.getAttribute('href');
    expect(selfHref).toBe('https://base-ui.com/blog/rss.xml');
    const selfRel = selfLink.getAttribute('rel');
    expect(selfRel).toBe('self');

    const items = xml.querySelectorAll('item');
    expect(items).toHaveLength(2);
    const firstTitle = getText(items[0], 'title');
    expect(firstTitle).toBe('Design & <interfaces> "today"');
    const firstSummary = getText(items[0], 'description');
    expect(firstSummary).toBe("A summary with <markup> & 'quotes'.");
    const firstLink = getText(items[0], 'link');
    expect(firstLink).toBe('https://base-ui.com/blog/new-post');
    const firstGuid = getText(items[0], 'guid');
    expect(firstGuid).toBe('https://base-ui.com/blog/new-post');
    const firstGuidPermalink = items[0].querySelector('guid')?.getAttribute('isPermaLink');
    expect(firstGuidPermalink).toBe('true');
    const firstPublishedAt = getText(items[0], 'pubDate');
    expect(firstPublishedAt).toBe('Tue, 20 Oct 2026 00:00:00 GMT');
    const secondTitle = getText(items[1], 'title');
    expect(secondTitle).toBe('Older post');
    const secondSummary = getText(items[1], 'description');
    expect(secondSummary).toBe('');
  });

  it('serves a valid channel when there are no posts', async () => {
    vi.stubEnv('BASE_URL', 'https://base-ui.com');
    const mockedGetPosts = vi.mocked(getPosts);
    mockedGetPosts.mockResolvedValue([]);

    const response = await GET();
    const feedText = await response.text();
    const xml = new DOMParser().parseFromString(feedText, 'application/xml');

    const emptyParseError = xml.querySelector('parsererror');
    expect(emptyParseError).toBeNull();
    const rssVersion = xml.querySelector('rss')?.getAttribute('version');
    expect(rssVersion).toBe('2.0');
    const emptyChannel = xml.querySelector('channel');
    expect(emptyChannel).not.toBeNull();
    const emptyItems = xml.querySelectorAll('item');
    expect(emptyItems).toHaveLength(0);
  });
});
