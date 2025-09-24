import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';

export default function ExampleDecoratedInput() {
  const id = React.useId();
  const [inputValue, setInputValue] = React.useState('');
  const isTyping = inputValue.trim() !== '';

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Combobox.Root
      items={people}
      itemToStringLabel={(person) => person.name}
      inputValue={inputValue}
      onInputValueChange={(next, eventDetails) => {
        if (eventDetails.reason === 'item-press') {
          // Keep the input blank to display the custom selected value text.
          setInputValue('');
          containerRef.current?.focus();
          return;
        }

        setInputValue(next);
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Assignee</label>
        <div className={styles.Control}>
          <Combobox.Value>
            {(person: Person | null) => (
              <div className={styles.InputContainer} tabIndex={-1} ref={containerRef}>
                <Combobox.Input
                  id={id}
                  placeholder={person ? '' : 'Select person'}
                  className={styles.Input}
                  aria-label={person && !isTyping ? person.name : undefined}
                  onBlur={() => {
                    setInputValue('');
                  }}
                />
                <div className={styles.Value}>
                  <Combobox.Icon
                    className={`${styles.Avatar} ${!person ? styles.AvatarPlaceholder : ''}`}
                  >
                    {person ? initials(person.name) : <PersonIcon className={styles.AvatarIcon} />}
                  </Combobox.Icon>
                  {person && !isTyping && <span className={styles.Text}>{person.name}</span>}
                </div>

                <div className={styles.ActionButtons}>
                  <Combobox.Clear className={styles.Clear} aria-label="Clear selection">
                    <ClearIcon className={styles.ClearIcon} />
                  </Combobox.Clear>
                  <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
                    <ChevronDownIcon className={styles.TriggerIcon} />
                  </Combobox.Trigger>
                </div>
              </div>
            )}
          </Combobox.Value>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup} aria-label="Select a person">
            <Combobox.Empty className={styles.Empty}>No people found.</Combobox.Empty>
            <Combobox.List>
              {(person: Person) => (
                <Combobox.Item key={person.id} value={person} className={styles.Item}>
                  <Combobox.Icon className={styles.ItemAvatar}>
                    {initials(person.name)}
                  </Combobox.Icon>
                  <div className={styles.ItemText}>{person.name}</div>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" aria-hidden {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden width="12" height="12" {...props}>
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
    </svg>
  );
}

interface Person {
  id: string;
  name: string;
}

const people: Person[] = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Alan Turing' },
  { id: '3', name: 'Grace Hopper' },
  { id: '4', name: 'Katherine Johnson' },
  { id: '5', name: 'Donald Knuth' },
  { id: '6', name: 'Edsger Dijkstra' },
  { id: '7', name: 'Barbara Liskov' },
  { id: '8', name: 'Dennis Ritchie' },
  { id: '9', name: 'Guido van Rossum' },
  { id: '10', name: 'Margaret Hamilton' },
  { id: '11', name: 'Tim Berners-Lee' },
  { id: '12', name: 'Radia Perlman' },
  { id: '13', name: 'Bjarne Stroustrup' },
  { id: '14', name: 'James Gosling' },
  { id: '15', name: 'Ken Thompson' },
  { id: '16', name: 'Niklaus Wirth' },
  { id: '17', name: 'Adele Goldberg' },
  { id: '18', name: 'Hedy Lamarr' },
  { id: '19', name: 'Marie Curie' },
  { id: '20', name: 'Rosalind Franklin' },
  { id: '21', name: 'Jane Goodall' },
  { id: '22', name: 'Vera Rubin' },
  { id: '23', name: 'Sally Ride' },
  { id: '24', name: 'Mae Jemison' },
  { id: '25', name: 'Neil Armstrong' },
  { id: '26', name: 'David Attenborough' },
  { id: '27', name: 'Carl Sagan' },
  { id: '28', name: 'Mary Jackson' },
  { id: '29', name: 'Dorothy Vaughan' },
  { id: '30', name: 'Ellen Ochoa' },
];
