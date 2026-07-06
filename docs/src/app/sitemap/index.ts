import { createSitemap } from '@mui/internal-docs-infra/createSitemap';
import Overview from '../(docs)/react/(overview)/index.mdx';
import Handbook from '../(docs)/react/(handbook)/index.mdx';
import Components from '../(docs)/react/(components)/index.mdx';
import Utils from '../(docs)/react/(utils)/index.mdx';

export const sitemap = createSitemap(import.meta.url, {
  Overview,
  Handbook,
  Components,
  Utils,
});
