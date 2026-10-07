'use client';

import * as React from 'react';
import { Pause, Play } from 'lucide-react';

import './Video.css';

interface VideoProps extends Pick<React.ComponentProps<'video'>, 'poster' | 'width' | 'height'> {
  src: string;
  label: string;
}

export function Video({ src, label, ...props }: VideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const id = React.useId();
  const [playing, setPlaying] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  async function togglePlayback() {
    const video = videoRef.current;
    if (video) {
      if (!video.paused) {
        video.pause();
        return;
      }

      setFailed(false);
      try {
        await video.play();
      } catch (error) {
        // Pausing or changing the source can interrupt a pending play request.
        if (
          typeof error !== 'object' ||
          error === null ||
          !('name' in error) ||
          error.name !== 'AbortError'
        ) {
          setFailed(true);
        }
      }
    }
  }

  return (
    <div className="VideoBlogRoot" data-paused={playing ? undefined : true}>
      <video
        {...props}
        className="VideoBlogVideo"
        ref={videoRef}
        id={id}
        src={src}
        aria-label={label}
        controls={false}
        autoPlay
        playsInline
        loop
        muted
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setFailed(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onEmptied={() => {
          setPlaying(false);
          setFailed(false);
        }}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
        onClick={togglePlayback}
      />
      <button
        type="button"
        className="VideoBlogControl"
        aria-label={`${playing ? 'Pause' : 'Play'} video: ${label}`}

        aria-controls={id}
        onClick={togglePlayback}
      >
        {playing ? (
          <Pause size={20} aria-hidden="true" className="VideoBlogControlIcon" />
        ) : (
          <Play size={20} aria-hidden="true" className="VideoBlogControlIcon" />
        )}
      </button>
      {failed && (
        <p className="VideoBlogError" role="alert">
          The video could not be played. Try again or <a href={src}>download the video</a>.
        </p>
      )}
    </div>
  );
}
