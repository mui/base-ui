import { createSitemap } from '@mui/internal-docs-infra/createSitemap';
import React from '../(docs)/react/page.mdx';

export const sitemap = createSitemap(import.meta.url, { React });
