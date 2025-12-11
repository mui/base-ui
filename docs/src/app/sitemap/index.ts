import { createSitemap } from '@mui/internal-docs-infra/createSitemap';
import Overview from '../(docs)/(content)/react/overview/page.mdx';
import Handbook from '../(docs)/(content)/react/handbook/page.mdx';
import Components from '../(docs)/(content)/react/components/page.mdx';
import Utils from '../(docs)/(content)/react/utils/page.mdx';

export const sitemap = createSitemap(import.meta.url, {
  Overview,
  Handbook,
  Components,
  Utils,
});
