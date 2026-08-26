'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import styles from './index.module.css';

export default function ExampleAsyncFilterMenu() {
  const [assignee, setAssignee] = React.useState<Person | null>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Person[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [isPending, startTransition] = React.useTransition();

  const abortControllerRef = React.useRef<AbortController | null>(null);

  function runSearch(query: string) {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    startTransition(async () => {
      setError(null);

      const result = await searchPeople(query);
      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => {
        setSearchResults(result.people);
        setError(result.error);
      });
    });
  }

  const status = isPending ? (
    <React.Fragment>
      <span className={styles.Spinner} aria-hidden />
      Searching…
    </React.Fragment>
  ) : (
    error
  );

  return (
    <FilterMenu.Root
      filter={null}
      inputValue={searchValue}
      onInputValueChange={(value, details) => {
        if (details.reason !== 'popup-close') {
          setSearchValue(value);
          runSearch(value);
        }
      }}
      onOpenChange={(open) => {
        if (open) {
          runSearch('');
        }
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setSearchValue('');
        }
      }}
    >
      <FilterMenu.Trigger className={styles.Trigger}>
        {assignee ? `Assigned to ${assignee.name}` : 'Assign to…'}
      </FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <FilterMenu.Popup className={styles.Popup} aria-busy={isPending || undefined}>
            <div className={styles.InputContainer}>
              <FilterMenu.Input
                className={styles.Input}
                aria-label="Search people"
                placeholder="e.g. Ada"
              />
            </div>
            <FilterMenu.Status className={styles.Status}>{status}</FilterMenu.Status>
            {!isPending && !error && (
              <FilterMenu.Empty className={styles.Empty}>No people found.</FilterMenu.Empty>
            )}
            <FilterMenu.List className={styles.List}>
              {searchResults.map((person) => (
                <FilterMenu.Item
                  key={person.id}
                  className={styles.Item}
                  onClick={() => setAssignee(person)}
                >
                  {person.name}
                  <span className={styles.PersonRole}>{person.role}</span>
                </FilterMenu.Item>
              ))}
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

async function searchPeople(query: string): Promise<{ people: Person[]; error: string | null }> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 400 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    return {
      people: [],
      error: 'Failed to fetch people. Please try again.',
    };
  }

  const loweredQuery = query.trim().toLowerCase();
  const people = team.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(loweredQuery),
  );

  return {
    people,
    error: null,
  };
}

interface Person {
  id: string;
  name: string;
  role: string;
}

const team: Person[] = [
  { id: '1', name: 'Ada Sitompul', role: 'Design' },
  { id: '2', name: 'Bruno Costa', role: 'Engineering' },
  { id: '3', name: 'Chidi Okafor', role: 'Engineering' },
  { id: '4', name: 'Dana Whitfield', role: 'Support' },
  { id: '5', name: 'Emil Novak', role: 'Engineering' },
  { id: '6', name: 'Farah Haddad', role: 'Product' },
  { id: '7', name: 'Grete Lindqvist', role: 'Design' },
  { id: '8', name: 'Hiro Tanaka', role: 'Engineering' },
  { id: '9', name: 'Imani Njoroge', role: 'Product' },
  { id: '10', name: 'Jonas Berg', role: 'Support' },
  { id: '11', name: 'Katya Morozova', role: 'Engineering' },
  { id: '12', name: 'Luca Moretti', role: 'Design' },
  { id: '13', name: 'Maren Vogel', role: 'Product' },
  { id: '14', name: 'Nadia Rahal', role: 'Engineering' },
  { id: '15', name: 'Oskar Jensen', role: 'Support' },
];
