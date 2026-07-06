import { Popover } from '@base-ui/react/popover';
import { useLingui } from '@lingui/react/macro';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import ButtonIcon from '../elements/ButtonIcon';
import { usePlayerState } from '../hooks/usePlayer';
import usePlayingTrack from '../hooks/usePlayingTrack';
import PlayerControls from './PlayerControls';
import PlayingBar from './PlayingBar';
import Queue from './Queue';
import Search from './Search';

export default function Header() {
  const queue = usePlayerState((state) => state.queue);
  const queueCursor = usePlayerState((state) => state.queueCursor);
  const trackPlaying = usePlayingTrack();
  const { t } = useLingui();
  const platform = window.__MUSEEKS_PLATFORM;
  const queueAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <header
      aria-label={t`Header`}
      {...stylex.props(
        styles.header,
        (platform === 'windows' || platform === 'linux') &&
          styles.headerBorderTop,
      )}
      data-tauri-drag-region
    >
      <div
        {...stylex.props(
          styles.headerMainControls,
          platform === 'macos' && styles.headerMainControlsMacos,
        )}
        data-tauri-drag-region
      >
        <PlayerControls />
      </div>
      <div {...stylex.props(styles.headerPlayingBar)} data-tauri-drag-region>
        {trackPlaying != null && (
          <>
            <PlayingBar trackPlaying={trackPlaying} />
            <Popover.Root>
              <div ref={queueAnchorRef} {...stylex.props(styles.queue)}>
                <Popover.Trigger
                  render={(triggerProps) => (
                    <ButtonIcon
                      {...triggerProps}
                      icon="list"
                      iconSize={20}
                      label={t`Queue`}
                      data-tauri-drag-region
                    />
                  )}
                />
              </div>
              <Popover.Portal>
                <Popover.Positioner
                  side="bottom"
                  alignOffset={-16}
                  align="end"
                  anchor={queueAnchorRef}
                >
                  <Popover.Popup {...stylex.props(styles.queueContainer)}>
                    <Queue queue={queue} queueCursor={queueCursor} />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </>
        )}
      </div>
      <div {...stylex.props(styles.headerSearch)} data-tauri-drag-region>
        <Search />
      </div>
    </header>
  );
}

const styles = stylex.create({
  header: {
    boxSizing: 'border-box',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border-color)',
    backgroundColor: 'var(--header-bg)',
    color: 'var(--header-color)',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: '10px',
    paddingRight: '10px',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    height: '50px',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  headerBorderTop: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--border-color)',
  },
  headerMainControls: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    display: 'flex',
    alignItems: 'center',
    paddingRight: '10px',
    minWidth: '200px',
    paddingLeft: '12px',
  },
  headerMainControlsMacos: {
    paddingLeft: '72px',
  },
  headerSearch: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  headerPlayingBar: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0,
    maxWidth: '600px',
    display: 'flex',
  },
  queue: {
    marginTop: 0,
    marginBottom: 0,
    marginLeft: '16px',
    marginRight: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  queueContainer: {
    zIndex: 1000,
    display: {
      ':is([data-open])': 'block',
    },
  },
});
