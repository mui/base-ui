'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Accordion } from '@base-ui-components/react/accordion';
import styles from './horizontal.module.css';

const displayValueMap = {
  one: '一',
  two: '二',
  three: '三',
} as any;

export default function App() {
  const [val, setVal] = React.useState(['one']);
  return (
    <div className={styles.wrapper}>
      <h2>Horizontal LTR</h2>
      <Accordion.Root
        className={styles.Root}
        aria-label="Uncontrolled Horizontal Accordion"
        openMultiple={false}
      >
        {['one', 'two', 'three'].map((value) => (
          <Accordion.Item className={styles.Item} key={value}>
            <Accordion.Header className={styles.Header}>
              <Accordion.Trigger className={styles.Trigger} data-value={value}>
                <span className={styles.Label}>{displayValueMap[value]}</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={styles.Panel}>
              <div className={styles.Content}>
                <p>
                  因為中國傳統政治，只有一個模式，就是君主政體。所謂朝代更替，只不過是由這一位君主換成那一位君主，而政道完全未有改變。人民所關心的，並不是這個政治權力本身是否恰當，即這個政權是怎樣取得的；而是政治權力的運行是否適當，即所謂德治，君是否明君，臣是否賢臣，對人民的生活，是否會帶來好的影響。所以人民希望政治有改進時，只是希望有聖君賢相出現。這完全是一個理性的標準，而不是一個理性的規律。這種期望，就是屬於道義上的。人民限制國君的唯一辦法，就是「德」與「天命靡常」的警誡。但是道德的教訓是完全靠自律的，而天命靡常的警誡更是渺茫難知的，沒有道德感的國君，不能以德自律，人民便對他毫無辦法了。由於政權本身的成立及轉移，沒有法理可以依據，沒有制度可以遵循，人民不可能根據現存的制度，限制君主的權力，甚至推翻不稱職的君主，而另選賢能，因此人民沒有可能從法律上對人君加以限制。
                </p>
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <span>
        <h2>Horizontal RTL</h2>
        <p>one section must remain open</p>
      </span>
      <DirectionProvider direction="rtl">
        <Accordion.Root
          className={styles.Root}
          aria-label="Controlled Horizontal RTL Accordion"
          openMultiple={false}
          orientation="horizontal"
          value={val}
          onValueChange={(newValue: Accordion.Root.Props['value']) => {
            if (Array.isArray(newValue) && newValue.length > 0) {
              setVal(newValue);
            }
          }}
        >
          {['one', 'two', 'three'].map((value) => (
            <Accordion.Item className={styles.Item} key={value} value={value}>
              <Accordion.Header className={styles.Header}>
                <Accordion.Trigger className={styles.Trigger} data-value={value}>
                  <span className={styles.Label}>{displayValueMap[value]}</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className={styles.Panel}>
                <div className={styles.Content}>
                  <p>
                    因為中國傳統政治，只有一個模式，就是君主政體。所謂朝代更替，只不過是由這一位君主換成那一位君主，而政道完全未有改變。人民所關心的，並不是這個政治權力本身是否恰當，即這個政權是怎樣取得的；而是政治權力的運行是否適當，即所謂德治，君是否明君，臣是否賢臣，對人民的生活，是否會帶來好的影響。所以人民希望政治有改進時，只是希望有聖君賢相出現。這完全是一個理性的標準，而不是一個理性的規律。這種期望，就是屬於道義上的。人民限制國君的唯一辦法，就是「德」與「天命靡常」的警誡。但是道德的教訓是完全靠自律的，而天命靡常的警誡更是渺茫難知的，沒有道德感的國君，不能以德自律，人民便對他毫無辦法了。由於政權本身的成立及轉移，沒有法理可以依據，沒有制度可以遵循，人民不可能根據現存的制度，限制君主的權力，甚至推翻不稱職的君主，而另選賢能，因此人民沒有可能從法律上對人君加以限制。
                  </p>
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </DirectionProvider>
    </div>
  );
}
