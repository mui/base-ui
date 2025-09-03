import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

export default function ExamplePopoverCombobox() {
  return (
    <Combobox.Root items={countries} defaultValue={countries[0]}>
      <Combobox.Trigger className="flex bg-[canvas] h-10 min-w-[12rem] items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default">
        <Combobox.Value />
        <Combobox.Icon className="flex">
          <ChevronUpDownIcon />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={4}>
          <Combobox.Popup
            className="[--input-container-height:3rem] origin-[var(--transform-origin)] max-w-[var(--available-width)] max-h-[min(24rem,var(--available-height))] rounded-lg bg-[canvas] shadow-lg shadow-gray-200 text-gray-900 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300"
            aria-label="Select country"
          >
            <div className="w-80 h-[var(--input-container-height)] text-center p-2">
              <Combobox.Input
                placeholder="e.g. United Kingdom"
                className="h-10 w-full font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
              />
            </div>
            <Combobox.Empty className="p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No countries found.
            </Combobox.Empty>
            <Combobox.List className="overflow-y-auto scroll-py-2 py-2 overscroll-contain max-h-[min(calc(24rem-var(--input-container-height)),calc(var(--available-height)-var(--input-container-height)))] empty:p-0">
              {(country: Country) => (
                <Combobox.Item
                  key={country.code}
                  value={country}
                  className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
                >
                  <Combobox.ItemIndicator className="col-start-1">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                  <div className="col-start-2">{country.label ?? country.value}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

interface Country {
  code: string;
  value: string | null;
  continent: string;
  label: string;
}

const countries: Country[] = [
  { code: '', value: null, continent: '', label: 'Select country' },
  { code: 'af', value: 'afghanistan', label: 'Afghanistan', continent: 'Asia' },
  { code: 'al', value: 'albania', label: 'Albania', continent: 'Europe' },
  { code: 'dz', value: 'algeria', label: 'Algeria', continent: 'Africa' },
  { code: 'ad', value: 'andorra', label: 'Andorra', continent: 'Europe' },
  { code: 'ao', value: 'angola', label: 'Angola', continent: 'Africa' },
  { code: 'ar', value: 'argentina', label: 'Argentina', continent: 'South America' },
  { code: 'am', value: 'armenia', label: 'Armenia', continent: 'Asia' },
  { code: 'au', value: 'australia', label: 'Australia', continent: 'Oceania' },
  { code: 'at', value: 'austria', label: 'Austria', continent: 'Europe' },
  { code: 'az', value: 'azerbaijan', label: 'Azerbaijan', continent: 'Asia' },
  { code: 'bs', value: 'bahamas', label: 'Bahamas', continent: 'North America' },
  { code: 'bh', value: 'bahrain', label: 'Bahrain', continent: 'Asia' },
  { code: 'bd', value: 'bangladesh', label: 'Bangladesh', continent: 'Asia' },
  { code: 'bb', value: 'barbados', label: 'Barbados', continent: 'North America' },
  { code: 'by', value: 'belarus', label: 'Belarus', continent: 'Europe' },
  { code: 'be', value: 'belgium', label: 'Belgium', continent: 'Europe' },
  { code: 'bz', value: 'belize', label: 'Belize', continent: 'North America' },
  { code: 'bj', value: 'benin', label: 'Benin', continent: 'Africa' },
  { code: 'bt', value: 'bhutan', label: 'Bhutan', continent: 'Asia' },
  { code: 'bo', value: 'bolivia', label: 'Bolivia', continent: 'South America' },
  {
    code: 'ba',
    value: 'bosnia-and-herzegovina',
    label: 'Bosnia and Herzegovina',
    continent: 'Europe',
  },
  { code: 'bw', value: 'botswana', label: 'Botswana', continent: 'Africa' },
  { code: 'br', value: 'brazil', label: 'Brazil', continent: 'South America' },
  { code: 'bn', value: 'brunei', label: 'Brunei', continent: 'Asia' },
  { code: 'bg', value: 'bulgaria', label: 'Bulgaria', continent: 'Europe' },
  { code: 'bf', value: 'burkina-faso', label: 'Burkina Faso', continent: 'Africa' },
  { code: 'bi', value: 'burundi', label: 'Burundi', continent: 'Africa' },
  { code: 'kh', value: 'cambodia', label: 'Cambodia', continent: 'Asia' },
  { code: 'cm', value: 'cameroon', label: 'Cameroon', continent: 'Africa' },
  { code: 'ca', value: 'canada', label: 'Canada', continent: 'North America' },
  { code: 'cv', value: 'cape-verde', label: 'Cape Verde', continent: 'Africa' },
  {
    code: 'cf',
    value: 'central-african-republic',
    label: 'Central African Republic',
    continent: 'Africa',
  },
  { code: 'td', value: 'chad', label: 'Chad', continent: 'Africa' },
  { code: 'cl', value: 'chile', label: 'Chile', continent: 'South America' },
  { code: 'cn', value: 'china', label: 'China', continent: 'Asia' },
  { code: 'co', value: 'colombia', label: 'Colombia', continent: 'South America' },
  { code: 'km', value: 'comoros', label: 'Comoros', continent: 'Africa' },
  { code: 'cg', value: 'congo', label: 'Congo', continent: 'Africa' },
  { code: 'cr', value: 'costa-rica', label: 'Costa Rica', continent: 'North America' },
  { code: 'hr', value: 'croatia', label: 'Croatia', continent: 'Europe' },
  { code: 'cu', value: 'cuba', label: 'Cuba', continent: 'North America' },
  { code: 'cy', value: 'cyprus', label: 'Cyprus', continent: 'Asia' },
  { code: 'cz', value: 'czech-republic', label: 'Czech Republic', continent: 'Europe' },
  { code: 'dk', value: 'denmark', label: 'Denmark', continent: 'Europe' },
  { code: 'dj', value: 'djibouti', label: 'Djibouti', continent: 'Africa' },
  { code: 'dm', value: 'dominica', label: 'Dominica', continent: 'North America' },
  {
    code: 'do',
    value: 'dominican-republic',
    label: 'Dominican Republic',
    continent: 'North America',
  },
  { code: 'ec', value: 'ecuador', label: 'Ecuador', continent: 'South America' },
  { code: 'eg', value: 'egypt', label: 'Egypt', continent: 'Africa' },
  { code: 'sv', value: 'el-salvador', label: 'El Salvador', continent: 'North America' },
  { code: 'gq', value: 'equatorial-guinea', label: 'Equatorial Guinea', continent: 'Africa' },
  { code: 'er', value: 'eritrea', label: 'Eritrea', continent: 'Africa' },
  { code: 'ee', value: 'estonia', label: 'Estonia', continent: 'Europe' },
  { code: 'et', value: 'ethiopia', label: 'Ethiopia', continent: 'Africa' },
  { code: 'fj', value: 'fiji', label: 'Fiji', continent: 'Oceania' },
  { code: 'fi', value: 'finland', label: 'Finland', continent: 'Europe' },
  { code: 'fr', value: 'france', label: 'France', continent: 'Europe' },
  { code: 'ga', value: 'gabon', label: 'Gabon', continent: 'Africa' },
  { code: 'gm', value: 'gambia', label: 'Gambia', continent: 'Africa' },
  { code: 'ge', value: 'georgia', label: 'Georgia', continent: 'Asia' },
  { code: 'de', value: 'germany', label: 'Germany', continent: 'Europe' },
  { code: 'gh', value: 'ghana', label: 'Ghana', continent: 'Africa' },
  { code: 'gr', value: 'greece', label: 'Greece', continent: 'Europe' },
  { code: 'gd', value: 'grenada', label: 'Grenada', continent: 'North America' },
  { code: 'gt', value: 'guatemala', label: 'Guatemala', continent: 'North America' },
  { code: 'gn', value: 'guinea', label: 'Guinea', continent: 'Africa' },
  { code: 'gw', value: 'guinea-bissau', label: 'Guinea-Bissau', continent: 'Africa' },
  { code: 'gy', value: 'guyana', label: 'Guyana', continent: 'South America' },
  { code: 'ht', value: 'haiti', label: 'Haiti', continent: 'North America' },
  { code: 'hn', value: 'honduras', label: 'Honduras', continent: 'North America' },
  { code: 'hu', value: 'hungary', label: 'Hungary', continent: 'Europe' },
  { code: 'is', value: 'iceland', label: 'Iceland', continent: 'Europe' },
  { code: 'in', value: 'india', label: 'India', continent: 'Asia' },
  { code: 'id', value: 'indonesia', label: 'Indonesia', continent: 'Asia' },
  { code: 'ir', value: 'iran', label: 'Iran', continent: 'Asia' },
  { code: 'iq', value: 'iraq', label: 'Iraq', continent: 'Asia' },
  { code: 'ie', value: 'ireland', label: 'Ireland', continent: 'Europe' },
  { code: 'il', value: 'israel', label: 'Israel', continent: 'Asia' },
  { code: 'it', value: 'italy', label: 'Italy', continent: 'Europe' },
  { code: 'jm', value: 'jamaica', label: 'Jamaica', continent: 'North America' },
  { code: 'jp', value: 'japan', label: 'Japan', continent: 'Asia' },
  { code: 'jo', value: 'jordan', label: 'Jordan', continent: 'Asia' },
  { code: 'kz', value: 'kazakhstan', label: 'Kazakhstan', continent: 'Asia' },
  { code: 'ke', value: 'kenya', label: 'Kenya', continent: 'Africa' },
  { code: 'kw', value: 'kuwait', label: 'Kuwait', continent: 'Asia' },
  { code: 'kg', value: 'kyrgyzstan', label: 'Kyrgyzstan', continent: 'Asia' },
  { code: 'la', value: 'laos', label: 'Laos', continent: 'Asia' },
  { code: 'lv', value: 'latvia', label: 'Latvia', continent: 'Europe' },
  { code: 'lb', value: 'lebanon', label: 'Lebanon', continent: 'Asia' },
  { code: 'ls', value: 'lesotho', label: 'Lesotho', continent: 'Africa' },
  { code: 'lr', value: 'liberia', label: 'Liberia', continent: 'Africa' },
  { code: 'ly', value: 'libya', label: 'Libya', continent: 'Africa' },
  { code: 'li', value: 'liechtenstein', label: 'Liechtenstein', continent: 'Europe' },
  { code: 'lt', value: 'lithuania', label: 'Lithuania', continent: 'Europe' },
  { code: 'lu', value: 'luxembourg', label: 'Luxembourg', continent: 'Europe' },
  { code: 'mg', value: 'madagascar', label: 'Madagascar', continent: 'Africa' },
  { code: 'mw', value: 'malawi', label: 'Malawi', continent: 'Africa' },
  { code: 'my', value: 'malaysia', label: 'Malaysia', continent: 'Asia' },
  { code: 'mv', value: 'maldives', label: 'Maldives', continent: 'Asia' },
  { code: 'ml', value: 'mali', label: 'Mali', continent: 'Africa' },
  { code: 'mt', value: 'malta', label: 'Malta', continent: 'Europe' },
  { code: 'mh', value: 'marshall-islands', label: 'Marshall Islands', continent: 'Oceania' },
  { code: 'mr', value: 'mauritania', label: 'Mauritania', continent: 'Africa' },
  { code: 'mu', value: 'mauritius', label: 'Mauritius', continent: 'Africa' },
  { code: 'mx', value: 'mexico', label: 'Mexico', continent: 'North America' },
  { code: 'fm', value: 'micronesia', label: 'Micronesia', continent: 'Oceania' },
  { code: 'md', value: 'moldova', label: 'Moldova', continent: 'Europe' },
  { code: 'mc', value: 'monaco', label: 'Monaco', continent: 'Europe' },
  { code: 'mn', value: 'mongolia', label: 'Mongolia', continent: 'Asia' },
  { code: 'me', value: 'montenegro', label: 'Montenegro', continent: 'Europe' },
  { code: 'ma', value: 'morocco', label: 'Morocco', continent: 'Africa' },
  { code: 'mz', value: 'mozambique', label: 'Mozambique', continent: 'Africa' },
  { code: 'mm', value: 'myanmar', label: 'Myanmar', continent: 'Asia' },
  { code: 'na', value: 'namibia', label: 'Namibia', continent: 'Africa' },
  { code: 'nr', value: 'nauru', label: 'Nauru', continent: 'Oceania' },
  { code: 'np', value: 'nepal', label: 'Nepal', continent: 'Asia' },
  { code: 'nl', value: 'netherlands', label: 'Netherlands', continent: 'Europe' },
  { code: 'nz', value: 'new-zealand', label: 'New Zealand', continent: 'Oceania' },
  { code: 'ni', value: 'nicaragua', label: 'Nicaragua', continent: 'North America' },
  { code: 'ne', value: 'niger', label: 'Niger', continent: 'Africa' },
  { code: 'ng', value: 'nigeria', label: 'Nigeria', continent: 'Africa' },
  { code: 'kp', value: 'north-korea', label: 'North Korea', continent: 'Asia' },
  { code: 'mk', value: 'north-macedonia', label: 'North Macedonia', continent: 'Europe' },
  { code: 'no', value: 'norway', label: 'Norway', continent: 'Europe' },
  { code: 'om', value: 'oman', label: 'Oman', continent: 'Asia' },
  { code: 'pk', value: 'pakistan', label: 'Pakistan', continent: 'Asia' },
  { code: 'pw', value: 'palau', label: 'Palau', continent: 'Oceania' },
  { code: 'ps', value: 'palestine', label: 'Palestine', continent: 'Asia' },
  { code: 'pa', value: 'panama', label: 'Panama', continent: 'North America' },
  { code: 'pg', value: 'papua-new-guinea', label: 'Papua New Guinea', continent: 'Oceania' },
  { code: 'py', value: 'paraguay', label: 'Paraguay', continent: 'South America' },
  { code: 'pe', value: 'peru', label: 'Peru', continent: 'South America' },
  { code: 'ph', value: 'philippines', label: 'Philippines', continent: 'Asia' },
  { code: 'pl', value: 'poland', label: 'Poland', continent: 'Europe' },
  { code: 'pt', value: 'portugal', label: 'Portugal', continent: 'Europe' },
  { code: 'qa', value: 'qatar', label: 'Qatar', continent: 'Asia' },
  { code: 'ro', value: 'romania', label: 'Romania', continent: 'Europe' },
  { code: 'ru', value: 'russia', label: 'Russia', continent: 'Europe' },
  { code: 'rw', value: 'rwanda', label: 'Rwanda', continent: 'Africa' },
  { code: 'ws', value: 'samoa', label: 'Samoa', continent: 'Oceania' },
  { code: 'sm', value: 'san-marino', label: 'San Marino', continent: 'Europe' },
  { code: 'sa', value: 'saudi-arabia', label: 'Saudi Arabia', continent: 'Asia' },
  { code: 'sn', value: 'senegal', label: 'Senegal', continent: 'Africa' },
  { code: 'rs', value: 'serbia', label: 'Serbia', continent: 'Europe' },
  { code: 'sc', value: 'seychelles', label: 'Seychelles', continent: 'Africa' },
  { code: 'sl', value: 'sierra-leone', label: 'Sierra Leone', continent: 'Africa' },
  { code: 'sg', value: 'singapore', label: 'Singapore', continent: 'Asia' },
  { code: 'sk', value: 'slovakia', label: 'Slovakia', continent: 'Europe' },
  { code: 'si', value: 'slovenia', label: 'Slovenia', continent: 'Europe' },
  { code: 'sb', value: 'solomon-islands', label: 'Solomon Islands', continent: 'Oceania' },
  { code: 'so', value: 'somalia', label: 'Somalia', continent: 'Africa' },
  { code: 'za', value: 'south-africa', label: 'South Africa', continent: 'Africa' },
  { code: 'kr', value: 'south-korea', label: 'South Korea', continent: 'Asia' },
  { code: 'ss', value: 'south-sudan', label: 'South Sudan', continent: 'Africa' },
  { code: 'es', value: 'spain', label: 'Spain', continent: 'Europe' },
  { code: 'lk', value: 'sri-lanka', label: 'Sri Lanka', continent: 'Asia' },
  { code: 'sd', value: 'sudan', label: 'Sudan', continent: 'Africa' },
  { code: 'sr', value: 'suriname', label: 'Suriname', continent: 'South America' },
  { code: 'se', value: 'sweden', label: 'Sweden', continent: 'Europe' },
  { code: 'ch', value: 'switzerland', label: 'Switzerland', continent: 'Europe' },
  { code: 'sy', value: 'syria', label: 'Syria', continent: 'Asia' },
  { code: 'tw', value: 'taiwan', label: 'Taiwan', continent: 'Asia' },
  { code: 'tj', value: 'tajikistan', label: 'Tajikistan', continent: 'Asia' },
  { code: 'tz', value: 'tanzania', label: 'Tanzania', continent: 'Africa' },
  { code: 'th', value: 'thailand', label: 'Thailand', continent: 'Asia' },
  { code: 'tl', value: 'timor-leste', label: 'Timor-Leste', continent: 'Asia' },
  { code: 'tg', value: 'togo', label: 'Togo', continent: 'Africa' },
  { code: 'to', value: 'tonga', label: 'Tonga', continent: 'Oceania' },
  {
    code: 'tt',
    value: 'trinidad-and-tobago',
    label: 'Trinidad and Tobago',
    continent: 'North America',
  },
  { code: 'tn', value: 'tunisia', label: 'Tunisia', continent: 'Africa' },
  { code: 'tr', value: 'turkey', label: 'Turkey', continent: 'Asia' },
  { code: 'tm', value: 'turkmenistan', label: 'Turkmenistan', continent: 'Asia' },
  { code: 'tv', value: 'tuvalu', label: 'Tuvalu', continent: 'Oceania' },
  { code: 'ug', value: 'uganda', label: 'Uganda', continent: 'Africa' },
  { code: 'ua', value: 'ukraine', label: 'Ukraine', continent: 'Europe' },
  { code: 'ae', value: 'united-arab-emirates', label: 'United Arab Emirates', continent: 'Asia' },
  { code: 'gb', value: 'united-kingdom', label: 'United Kingdom', continent: 'Europe' },
  { code: 'us', value: 'united-states', label: 'United States', continent: 'North America' },
  { code: 'uy', value: 'uruguay', label: 'Uruguay', continent: 'South America' },
  { code: 'uz', value: 'uzbekistan', label: 'Uzbekistan', continent: 'Asia' },
  { code: 'vu', value: 'vanuatu', label: 'Vanuatu', continent: 'Oceania' },
  { code: 'va', value: 'vatican-city', label: 'Vatican City', continent: 'Europe' },
  { code: 've', value: 'venezuela', label: 'Venezuela', continent: 'South America' },
  { code: 'vn', value: 'vietnam', label: 'Vietnam', continent: 'Asia' },
  { code: 'ye', value: 'yemen', label: 'Yemen', continent: 'Asia' },
  { code: 'zm', value: 'zambia', label: 'Zambia', continent: 'Africa' },
  { code: 'zw', value: 'zimbabwe', label: 'Zimbabwe', continent: 'Africa' },
];
