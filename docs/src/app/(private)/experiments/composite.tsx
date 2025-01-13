'use client';
import * as React from 'react';
import { Composite } from '@base-ui-components/react/composite';
import styles from './composite.module.css';

export default function ExampleGrid() {
  const [column, setColumn] = React.useState(0);
  const [row, setRow] = React.useState(0);

  const rootHandleHighligtedIndexChange = (index: number) => {
    setRow(index);
  };

  const handleHighligtedIndexChange = (index: number) => {
    setColumn(index);
  };

  return (
    <Composite.Root
      highlightedIndex={row}
      onHighlightedIndexChange={rootHandleHighligtedIndexChange}
      orientation="vertical"
      className={styles.Grid}
    >
      <Composite.Item>
        <Composite.Root
          highlightedIndex={row === 0 ? column : -1}
          onHighlightedIndexChange={handleHighligtedIndexChange}
          loop={false}
          orientation="horizontal"
          className={styles.GridRow}
        >
          <Composite.Item className={styles.GridItem}>A</Composite.Item>
          <Composite.Item className={styles.GridItem}>B</Composite.Item>
          <Composite.Item className={styles.GridItem}>C</Composite.Item>
          <Composite.Item className={styles.GridItem}>D</Composite.Item>
        </Composite.Root>
      </Composite.Item>
      <Composite.Item>
        <Composite.Root
          highlightedIndex={row === 1 ? column : -1}
          onHighlightedIndexChange={handleHighligtedIndexChange}
          loop={false}
          orientation="horizontal"
          className={styles.GridRow}
        >
          <Composite.Item className={styles.GridItem}>E</Composite.Item>
          <Composite.Item className={styles.GridItem}>F</Composite.Item>
          <Composite.Item className={styles.GridItem}>G</Composite.Item>
          <Composite.Item className={styles.GridItem}>H</Composite.Item>
        </Composite.Root>
      </Composite.Item>
      <Composite.Item>
        <Composite.Root
          highlightedIndex={row === 2 ? column : -1}
          onHighlightedIndexChange={handleHighligtedIndexChange}
          loop={false}
          orientation="horizontal"
          className={styles.GridRow}
        >
          <Composite.Item className={styles.GridItem}>I</Composite.Item>
          <Composite.Item className={styles.GridItem}>J</Composite.Item>
          <Composite.Item className={styles.GridItem}>K</Composite.Item>
          <Composite.Item className={styles.GridItem}>L</Composite.Item>
        </Composite.Root>
      </Composite.Item>
      <Composite.Item>
        <Composite.Root
          highlightedIndex={row === 3 ? column : -1}
          onHighlightedIndexChange={handleHighligtedIndexChange}
          loop={false}
          orientation="horizontal"
          className={styles.GridRow}
        >
          <Composite.Item className={styles.GridItem}>M</Composite.Item>
          <Composite.Item className={styles.GridItem}>N</Composite.Item>
        </Composite.Root>
      </Composite.Item>
    </Composite.Root>
  );
}
