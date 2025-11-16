import { createSitemap } from '../../utils/createSitemap';
import Overview from '../(public)/(content)/react/overview/page.mdx';
import Handbook from '../(public)/(content)/react/handbook/page.mdx';
import Components from '../(public)/(content)/react/components/page.mdx';
import Utils from '../(public)/(content)/react/utils/page.mdx';

export const sitemap = createSitemap(import.meta.url, {
  Overview,
  Handbook,
  Components,
  Utils,
});
