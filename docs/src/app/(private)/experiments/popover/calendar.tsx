'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react';
import { Ellipsis, X } from 'lucide-react';
import { eventPopover, type EventData } from './calendar-shared';
import styles from './calendar.module.css';

const EVENTS: EventData[] = [
  {
    title: 'React Conf 2025 talk',
    dayOfWeek: 2,
    startTime: 15.4167,
    endTime: 15.5833,
    dateString: 'October 7, 2025',
    location: 'The Westin Lake Las Vegas Resort & Spa, Main Stage',
    imageUrl:
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
    id: 1,
  },
  {
    title: 'Booth time',
    dayOfWeek: 3,
    startTime: 9.5,
    endTime: 17,
    dateString: 'October 8, 2025',
    location: 'The Westin Lake Las Vegas Resort & Spa, MUI booth',
    imageUrl:
      'https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
    id: 2,
  },
  {
    title: 'Chilling out',
    dayOfWeek: 4,
    startTime: 9,
    endTime: 12,
    id: 3,
    dateString: 'October 9, 2025',
    description: 'Pool, spa, and more',
  },
  // Top-left corner, small text-only popup.
  {
    title: 'Morning run',
    dayOfWeek: 1,
    startTime: 6,
    endTime: 7,
    id: 4,
    dateString: 'October 6, 2025',
    description: 'Lakeside loop',
  },
  // Bottom-left corner, medium popup near the bottom edge.
  {
    title: 'Late dinner',
    dayOfWeek: 1,
    startTime: 20.5,
    endTime: 21.75,
    id: 5,
    dateString: 'October 6, 2025',
    location: 'Marssa Steak & Sushi, Lake Las Vegas',
    description:
      'Team dinner with the DX crew. Long-winded multi-course tasting menu, so expect this one to run late into the evening.',
  },
  // 15-minute sliver at the top of a middle column.
  {
    title: 'Coffee chat',
    dayOfWeek: 2,
    startTime: 6.25,
    endTime: 6.5,
    id: 6,
    dateString: 'October 7, 2025',
    description: 'Quick sync before the day starts',
  },
  // Same column as the talk, long text content.
  {
    title: 'Workshop',
    dayOfWeek: 2,
    startTime: 11,
    endTime: 13,
    id: 7,
    dateString: 'October 7, 2025',
    location:
      'The Westin Lake Las Vegas Resort & Spa, Breakout Room 2 (lower mezzanine, past the second fountain)',
    description:
      'Hands-on styling workshop covering render props, data attributes, and animation patterns. Bring a laptop; pairing encouraged. We will build a popover-heavy dashboard from scratch and profile it.',
  },
  // Below the all-day booth block.
  {
    title: 'Retro',
    dayOfWeek: 3,
    startTime: 18,
    endTime: 19,
    id: 8,
    dateString: 'October 8, 2025',
    description: 'What went well, what did not',
  },
  // Tall image popup mid-height.
  {
    title: 'Hike',
    dayOfWeek: 4,
    startTime: 14,
    endTime: 16.5,
    id: 9,
    dateString: 'October 9, 2025',
    location: 'River Mountains Loop Trail',
    imageUrl:
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  // Bottom of a middle column, long text, no image.
  {
    title: 'Stargazing',
    dayOfWeek: 4,
    startTime: 21.25,
    endTime: 22,
    id: 10,
    dateString: 'October 9, 2025',
    description:
      'Telescopes on the rooftop terrace. The moon sets early, so conditions should be good for deep-sky objects if the wind cooperates.',
  },
  // Right column: popup must flip to the left side.
  {
    title: 'Standup',
    dayOfWeek: 5,
    startTime: 8,
    endTime: 9.5,
    id: 11,
    dateString: 'October 10, 2025',
    description: 'Async recap and blockers',
  },
  // Right column, tall image popup.
  {
    title: 'Demo prep',
    dayOfWeek: 5,
    startTime: 16,
    endTime: 18,
    id: 12,
    dateString: 'October 10, 2025',
    location: 'The Westin Lake Las Vegas Resort & Spa, MUI booth',
    imageUrl:
      'https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  // Bottom-right corner: cramped on both axes, image content.
  {
    title: 'Wrap party',
    dayOfWeek: 5,
    startTime: 21,
    endTime: 22,
    id: 13,
    dateString: 'October 10, 2025',
    location: 'Rooftop bar',
    imageUrl:
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  {
    title: 'Deep work',
    dayOfWeek: 1,
    startTime: 8,
    endTime: 12,
    id: 14,
    dateString: 'October 6, 2025',
    description:
      'Heads-down block for the positioning refactor. No meetings, notifications muted, door closed.',
  },
  {
    title: 'Design review',
    dayOfWeek: 1,
    startTime: 13,
    endTime: 16,
    id: 15,
    dateString: 'October 6, 2025',
    location: 'Figma huddle',
    imageUrl:
      'https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  {
    title: 'Docs sprint',
    dayOfWeek: 1,
    startTime: 16.5,
    endTime: 19.5,
    id: 16,
    dateString: 'October 6, 2025',
    description:
      'Rewrite the anchoring guide and add the new animation recipes. Screenshots need re-capturing after the theme refresh.',
  },
  {
    title: 'Emails and triage',
    dayOfWeek: 2,
    startTime: 7,
    endTime: 10.5,
    id: 17,
    dateString: 'October 7, 2025',
    description: 'Issue triage, PR reviews, and the community forum backlog.',
  },
  {
    title: 'Recording session',
    dayOfWeek: 2,
    startTime: 17,
    endTime: 20.5,
    id: 18,
    dateString: 'October 7, 2025',
    location: 'Studio B',
    imageUrl:
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  {
    title: 'Breakfast briefing',
    dayOfWeek: 3,
    startTime: 6.5,
    endTime: 9,
    id: 19,
    dateString: 'October 8, 2025',
    location: 'Hotel restaurant, terrace side',
    description: 'Walk through the booth schedule and demo scripts over breakfast.',
  },
  {
    title: 'Afterparty planning',
    dayOfWeek: 3,
    startTime: 19.5,
    endTime: 22,
    id: 20,
    dateString: 'October 8, 2025',
    description:
      'Venue shortlist, budget, and the playlist argument nobody wins. Bring strong opinions and stronger coffee.',
  },
  {
    title: 'Gym',
    dayOfWeek: 4,
    startTime: 6,
    endTime: 8.5,
    id: 21,
    dateString: 'October 9, 2025',
    description: 'Push day. Do not skip the warm-up again.',
  },
  {
    title: 'Board games',
    dayOfWeek: 4,
    startTime: 17,
    endTime: 20.5,
    id: 22,
    dateString: 'October 9, 2025',
    location: 'Lobby lounge',
    imageUrl:
      'https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  {
    title: 'Flight home prep',
    dayOfWeek: 5,
    startTime: 6,
    endTime: 7.75,
    id: 23,
    dateString: 'October 10, 2025',
    description: 'Pack, check out, and print the boarding passes.',
  },
  {
    title: 'Deep dive: positioning',
    dayOfWeek: 5,
    startTime: 10,
    endTime: 14,
    id: 24,
    dateString: 'October 10, 2025',
    location: 'The Westin Lake Las Vegas Resort & Spa, Breakout Room 1',
    imageUrl:
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1000',
  },
  {
    title: 'One-on-ones',
    dayOfWeek: 5,
    startTime: 14.25,
    endTime: 15.5,
    id: 25,
    dateString: 'October 10, 2025',
    description: 'Back-to-back catch-ups before the demo prep block.',
  },
];

export default function CalendarDemo() {
  return (
    <div className={styles.Page}>
      <Calendar startHour={6} endHour={22} events={EVENTS} />
    </div>
  );
}

interface CalendarProps {
  startHour?: number;
  endHour?: number;
  events: EventData[];
}

function Calendar(props: CalendarProps) {
  const { startHour = 0, endHour = 24, events } = props;
  const hoursShown = endHour - startHour;

  return (
    <React.Fragment>
      <div
        className={styles.Calendar}
        style={{ '--hours-shown': hoursShown } as React.CSSProperties}
      >
        <div className={styles.HourLabels}>
          {[...Array(hoursShown)].map((_, i) => (
            <div key={i} style={{ '--hour': i } as React.CSSProperties}>
              {startHour + i}:00
            </div>
          ))}
        </div>
        {events.map((event) => (
          <Event
            key={event.id}
            event={event}
            calendarStartHour={startHour}
            calendarEndHour={endHour}
          />
        ))}
      </div>
      <EventDetails />
    </React.Fragment>
  );
}

interface EventProps {
  event: EventData;
  calendarStartHour: number;
  calendarEndHour: number;
}

function Event(props: EventProps) {
  const { event, calendarStartHour, calendarEndHour } = props;
  const hoursShown = calendarEndHour - calendarStartHour;

  return (
    <Popover.Trigger
      handle={eventPopover}
      className={styles.Event}
      payload={event}
      style={{
        top: `${(event.startTime - calendarStartHour) * (100 / hoursShown)}%`,
        height: `${(event.endTime - event.startTime) * (100 / hoursShown)}%`,
        gridColumn: event.dayOfWeek,
      }}
      render={<div />}
      nativeButton={false}
    >
      <span className={styles.Title}>{event.title}</span>
      <span className={styles.Time}>
        {formatTime(event.startTime)} - {formatTime(event.endTime)}
      </span>
    </Popover.Trigger>
  );
}

function EventDetails() {
  return (
    <Popover.Root handle={eventPopover}>
      {({ payload }) => {
        if (!payload) {
          return null;
        }

        return (
          <Popover.Portal>
            <Popover.Positioner side="right" sideOffset={8} className={styles.Positioner}>
              <Popover.Popup className={styles.EventDetails}>
                <Popover.Viewport className={styles.Viewport}>
                  <div className={styles.Header}>
                    <Popover.Title className={styles.EventTitle}>{payload.title}</Popover.Title>
                    <div className={styles.EventActions}>
                      <button type="button">
                        <Ellipsis />
                      </button>
                      <Popover.Close>
                        <X />
                      </Popover.Close>
                    </div>
                  </div>
                  <p className={styles.EventTime}>
                    {payload.dateString} &middot; {formatTime(payload.startTime)} -{' '}
                    {formatTime(payload.endTime)}
                  </p>

                  {payload.description && (
                    <p className={styles.EventDescription}>{payload.description}</p>
                  )}
                  {payload.location && (
                    <p className={styles.EventLocation}>Location: {payload.location}</p>
                  )}
                  {payload.imageUrl && (
                    <div className={styles.EventImageWrapper}>
                      <img
                        src={payload.imageUrl}
                        alt={payload.location}
                        className={styles.EventImage}
                      />
                    </div>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        );
      }}
    </Popover.Root>
  );
}

// Convert time as number (e.g. 13.5) to string (e.g. "13:30")
function formatTime(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}
