'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './index.module.css';

export default function ExampleAsyncMultipleCombobox() {
  const id = React.useId();

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [searchResults, setSearchResults] = React.useState<DirectoryUser[]>([]);
  const [selectedValues, setSelectedValues] = React.useState<DirectoryUser[]>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [blockStartStatus, setBlockStartStatus] = React.useState(false);

  const [isPending, startTransition] = React.useTransition();

  const { contains } = Combobox.useFilter();

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const selectedValuesRef = React.useRef<DirectoryUser[]>([]);

  const trimmedSearchValue = searchValue.trim();

  const items = React.useMemo(() => {
    if (selectedValues.length === 0) {
      return searchResults;
    }

    const merged = [...searchResults];

    selectedValues.forEach((user) => {
      if (!searchResults.some((result) => result.id === user.id)) {
        merged.push(user);
      }
    });

    return merged;
  }, [searchResults, selectedValues]);

  function getStatus() {
    if (isPending) {
      return (
        <React.Fragment>
          <span className={styles.Spinner} aria-hidden />
          Searching…
        </React.Fragment>
      );
    }

    if (error) {
      return error;
    }

    if (trimmedSearchValue === '' && !blockStartStatus) {
      return selectedValues.length > 0 ? null : 'Start typing to search people…';
    }

    if (searchResults.length === 0 && !blockStartStatus) {
      return `No matches for "${trimmedSearchValue}".`;
    }

    return null;
  }

  function getEmptyMessage() {
    if (trimmedSearchValue === '' || isPending || searchResults.length > 0 || error) {
      return null;
    }

    return 'Try a different search term.';
  }

  return (
    <Combobox.Root
      items={items}
      itemToStringLabel={(user: DirectoryUser) => user.name}
      multiple
      filter={null}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setSearchResults(selectedValuesRef.current);
          setBlockStartStatus(false);
        }
      }}
      onValueChange={(nextSelectedValues) => {
        selectedValuesRef.current = nextSelectedValues;
        setSelectedValues(nextSelectedValues);
        setSearchValue('');
        setError(null);

        if (nextSelectedValues.length === 0) {
          setSearchResults([]);
          setBlockStartStatus(false);
        } else {
          setBlockStartStatus(true);
        }
      }}
      onInputValueChange={(nextSearchValue, { reason }) => {
        setSearchValue(nextSearchValue);

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        if (nextSearchValue === '') {
          setSearchResults(selectedValuesRef.current);
          setError(null);
          setBlockStartStatus(false);
          return;
        }

        if (reason === 'item-press') {
          return;
        }

        startTransition(async () => {
          setError(null);

          const result = await searchUsers(nextSearchValue, contains);

          if (controller.signal.aborted) {
            return;
          }

          startTransition(() => {
            setSearchResults(result.users);
            setError(result.error);
          });
        });
      }}
    >
      <div className={styles.Container}>
        <label className={styles.Label} htmlFor={id}>
          Assign reviewers
        </label>
        <Combobox.Chips className={styles.Chips} ref={containerRef}>
          <Combobox.Value>
            {(value: DirectoryUser[]) => (
              <React.Fragment>
                {value.map((user) => (
                  <Combobox.Chip key={user.id} className={styles.Chip} aria-label={user.name}>
                    {user.name}
                    <Combobox.ChipRemove className={styles.ChipRemove} aria-label="Remove">
                      <XIcon />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
                <Combobox.Input
                  id={id}
                  placeholder={value.length > 0 ? '' : 'e.g. Michael'}
                  className={styles.Input}
                />
              </React.Fragment>
            )}
          </Combobox.Value>
        </Combobox.Chips>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} anchor={containerRef} sideOffset={4}>
          <Combobox.Popup className={styles.Popup} aria-busy={isPending || undefined}>
            <Combobox.Status className={styles.Status}>{getStatus()}</Combobox.Status>
            <Combobox.Empty className={styles.Empty}>{getEmptyMessage()}</Combobox.Empty>
            <Combobox.List>
              {(user: DirectoryUser) => (
                <Combobox.Item key={user.id} className={styles.Item} value={user}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>
                    <div className={styles.ItemTitle}>{user.name}</div>
                    <div className={styles.ItemSubtitle}>
                      <span className={styles.ItemUsername}>@{user.username}</span>
                      <span>{user.title}</span>
                    </div>
                    <div className={styles.ItemEmail}>{user.email}</div>
                  </div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

interface DirectoryUser {
  id: string;
  name: string;
  username: string;
  email: string;
  title: string;
}

async function searchUsers(
  query: string,
  filter: (item: string, query: string) => boolean,
): Promise<{ users: DirectoryUser[]; error: string | null }> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 500 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    return {
      users: [],
      error: 'Failed to fetch people. Please try again.',
    };
  }

  const users = allUsers.filter((user) => {
    return (
      filter(user.name, query) ||
      filter(user.username, query) ||
      filter(user.email, query) ||
      filter(user.title, query)
    );
  });

  return {
    users,
    error: null,
  };
}

const allUsers: DirectoryUser[] = [
  {
    id: 'leslie-alexander',
    name: 'Leslie Alexander',
    username: 'leslie',
    email: 'leslie.alexander@example.com',
    title: 'Product Manager',
  },
  {
    id: 'kathryn-murphy',
    name: 'Kathryn Murphy',
    username: 'kathryn',
    email: 'kathryn.murphy@example.com',
    title: 'Marketing Lead',
  },
  {
    id: 'courtney-henry',
    name: 'Courtney Henry',
    username: 'courtney',
    email: 'courtney.henry@example.com',
    title: 'Design Systems',
  },
  {
    id: 'michael-foster',
    name: 'Michael Foster',
    username: 'michael',
    email: 'michael.foster@example.com',
    title: 'Engineering Manager',
  },
  {
    id: 'lindsay-walton',
    name: 'Lindsay Walton',
    username: 'lindsay',
    email: 'lindsay.walton@example.com',
    title: 'Product Designer',
  },
  {
    id: 'tom-cook',
    name: 'Tom Cook',
    username: 'tom',
    email: 'tom.cook@example.com',
    title: 'Frontend Engineer',
  },
  {
    id: 'whitney-francis',
    name: 'Whitney Francis',
    username: 'whitney',
    email: 'whitney.francis@example.com',
    title: 'Customer Success',
  },
  {
    id: 'jacob-jones',
    name: 'Jacob Jones',
    username: 'jacob',
    email: 'jacob.jones@example.com',
    title: 'Security Engineer',
  },
  {
    id: 'arlene-mccoy',
    name: 'Arlene McCoy',
    username: 'arlene',
    email: 'arlene.mccoy@example.com',
    title: 'Data Analyst',
  },
  {
    id: 'marvin-mckinney',
    name: 'Marvin McKinney',
    username: 'marvin',
    email: 'marvin.mckinney@example.com',
    title: 'QA Specialist',
  },
  {
    id: 'eleanor-pena',
    name: 'Eleanor Pena',
    username: 'eleanor',
    email: 'eleanor.pena@example.com',
    title: 'Operations',
  },
  {
    id: 'jerome-bell',
    name: 'Jerome Bell',
    username: 'jerome',
    email: 'jerome.bell@example.com',
    title: 'DevOps Engineer',
  },
];
