import remarkHeadingTags from '../remarkHeadingTags.mjs';
import { routePipeline } from './routePipeline.mjs';

export default function remarkPreprocess({ baseDir }) {
  // Strip docs badges after metadata extraction so the page index keeps the tags.
  return routePipeline(this, { blog: [], docs: [remarkHeadingTags] }, baseDir);
}
