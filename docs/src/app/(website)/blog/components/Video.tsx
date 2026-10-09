'use client';

import * as React from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { ownerWindow } from '@base-ui/utils/owner';

import './Video.css';

type PlaybackState = 'initializing' | 'playing' | 'paused' | 'error';

interface VideoProps extends React.ComponentProps<'video'> {
  src: string;
  darkSrc?: string;
  label: string;
}

export function Video({ src, darkSrc, label, autoPlay = false, ...props }: VideoProps) {
  const [state, setState] = React.useState<PlaybackState>(autoPlay ? 'initializing' : 'paused');
  const ref = React.useRef<HTMLVideoElement>(null);
  const id = React.useId();

  React.useEffect(() => {
    const video = ref.current;
    if (!video) {
      return undefined;
    }

    const media = darkSrc ? ownerWindow(video).matchMedia('(prefers-color-scheme: dark)') : null;
    const reducedMotion = ownerWindow(video).matchMedia('(prefers-reduced-motion: reduce)');
    const selectedSrc = darkSrc && media?.matches ? darkSrc : src;
    const currentSrc = video.currentSrc;
    const selectedSrcUrl = new URL(selectedSrc, video.baseURI).href;
    const selectionChanged = Boolean(currentSrc) && currentSrc !== selectedSrcUrl;

    let request = 0;

    const startPlayback = async (reload: boolean, shouldPlay: boolean) => {
      request += 1;
      const currentRequest = request;
      setState(!reload && video.error ? 'error' : 'initializing');

      try {
        if (reload) {
          video.load();
        }

        if (shouldPlay && !video.error) {
          await video.play();
        }

        if (request === currentRequest) {
          setState(getPlaybackState(video));
        }
      } catch (error) {
        if (request === currentRequest) {
          const name = getErrorName(error);
          if (name === 'AbortError') {
            setState((prev) => (prev === 'error' ? prev : 'paused'));
          } else {
            setState(video.error || name !== 'NotAllowedError' ? 'error' : 'paused');
          }
        }
      }
    };

    const handleThemeChange = () => startPlayback(true, !video.paused && !video.ended);
    media?.addEventListener('change', handleThemeChange);
    startPlayback(selectionChanged, autoPlay && !reducedMotion.matches);

    return () => {
      request += 1;
      media?.removeEventListener('change', handleThemeChange);
    };
  }, [src, darkSrc, autoPlay]);

  async function togglePlayback() {
    const video = ref.current;
    if (video && state !== 'initializing') {
      if (state !== 'error' && !video.paused) {
        video.pause();
        return;
      }

      setState('paused');
      try {
        if (video.error) {
          video.load();
        }

        await video.play();
      } catch (error) {
        // Pausing or changing the source can interrupt a pending play request.
        if (getErrorName(error) !== 'AbortError') {
          setState('error');
        }
      }
    }
  }

  return (
    <div
      className="BlogVideo"
      data-paused={state === 'playing' || state === 'initializing' ? undefined : true}
      data-error={state === 'error' ? true : undefined}
    >
      <video
        {...props}
        className="BlogVideoElement"
        ref={ref}
        id={id}
        aria-label={label}
        controls={false}
        autoPlay={false}
        playsInline
        loop
        muted
        preload="metadata"
        onPlaying={() => setState('playing')}
        onPause={() => {
          setState((prev) => (prev === 'playing' ? 'paused' : prev));
        }}
        onEnded={() => {
          setState((prev) => (prev === 'playing' ? 'paused' : prev));
        }}
        onEmptied={() => {
          setState((prev) => (prev === 'initializing' ? prev : 'paused'));
        }}
        onError={(event) => {
          if (event.currentTarget.error) {
            setState('error');
          }
        }}
        style={{ pointerEvents: 'none' }}
      >
        {darkSrc && <source src={darkSrc} media="(prefers-color-scheme: dark)" />}
        <source src={src} />
      </video>

      <button
        type="button"
        className="BlogVideoControl"
        aria-label={`${getPlaybackAction(state)} video: ${label}`}
        aria-controls={id}
        onClick={togglePlayback}
      >
        <span className="BlogVideoControlFaux">
          <VideoControlIcon
            status={state}
            size={20}
            aria-hidden="true"
            className="BlogVideoControlIcon"
          />
        </span>
      </button>

      {state === 'error' && (
        <p className="BlogVideoError" role="alert">
          The video could not be played. Press try again.
        </p>
      )}
    </div>
  );
}

interface VideoControlIconProps extends React.ComponentProps<typeof Play> {
  status: PlaybackState;
}

function VideoControlIcon({ status, ...props }: VideoControlIconProps) {
  switch (status) {
    case 'initializing':
    case 'paused':
      return <Play {...props} />;
    case 'playing':
      return <Pause {...props} />;
    case 'error':
      return <RefreshCw {...props} />;
    default:
      return status satisfies never;
  }
}

function getPlaybackAction(status: PlaybackState) {
  switch (status) {
    case 'initializing':
    case 'paused':
      return 'Play';
    case 'playing':
      return 'Pause';
    case 'error':
      return 'Retry';
    default:
      return status satisfies never;
  }
}

function getPlaybackState(element: HTMLVideoElement): PlaybackState {
  if (element.error) {
    return 'error';
  }
  return element.paused || element.ended ? 'paused' : 'playing';
}

function getErrorName(error: unknown) {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return error.name;
  }
  return undefined;
}
