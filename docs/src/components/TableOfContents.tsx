import * as React from 'react';
import { type Toc, type TocEntry } from '@stefanprobst/rehype-extract-toc';
import classes from './TableOfContents.module.css';

interface Props {
  toc: Toc;
  renderDepth?: number;
  skipFirstLevel?: boolean;
}

function renderTocEntry(entry: TocEntry, renderDepth: number, skipFirstLevel: boolean) {
  if (entry.depth > renderDepth) {
    return null;
  }

  return (
    <React.Fragment key={entry.id}>
      {entry.depth === 1 && skipFirstLevel ? null : (
        <a
          href={`#${entry.id}`}
          style={{ '--indent-level': entry.depth - 2 } as React.CSSProperties}
          className={classes.link}
        >
          {entry.value}
        </a>
      )}
      {entry.children?.map((child) => renderTocEntry(child, renderDepth, skipFirstLevel))}
    </React.Fragment>
  );
}

export function TableOfContents(props: Props) {
  const { toc, renderDepth = 2, skipFirstLevel = true } = props;

  return (
    <div className={classes.root}>
      <h4 className={classes.sectionTitle}>Contents</h4>
      <nav>{toc.map((item) => renderTocEntry(item, renderDepth, skipFirstLevel))}</nav>
    </div>
  );
}
