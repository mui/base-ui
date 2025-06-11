import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';

export default function VirtualFocusCombobox() {
  const [inputValue, setInputValue] = React.useState('');
  const [inputHighlightValue, setInputHighlightValue] = React.useState('');
  const [value, setValue] = React.useState('');

  const filteredCountries = React.useMemo(() => {
    if (inputValue.trim() === '') {
      return countries;
    }
    return countries.filter((country) =>
      country.name.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue]);

  return (
    <div className={styles.Container}>
      <Combobox.Root
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          setInputValue(nextValue);
          setInputHighlightValue('');
        }}
      >
        <label className={styles.Label}>
          Enter country
          <Combobox.Input
            placeholder="e.g. United Kingdom"
            className={styles.Input}
            value={inputHighlightValue === '' ? inputValue : inputHighlightValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setInputHighlightValue('');
            }}
          />
        </label>

        {filteredCountries.length > 0 && (
          <Combobox.Portal>
            <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
              <Combobox.Popup className={styles.Popup}>
                {filteredCountries.map((country) => (
                  <Combobox.Item
                    key={country.code}
                    className={styles.Item}
                    value={country.name}
                    onHighlightedChange={(highlighted, keyboard) => {
                      if (highlighted && keyboard) {
                        setInputHighlightValue(country.name);
                      }
                    }}
                  >
                    {country.name}
                  </Combobox.Item>
                ))}
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
}

interface Country {
  code: string;
  name: string;
  continent: string;
}

const countries: Country[] = [
  { code: 'af', name: 'Afghanistan', continent: 'Asia' },
  { code: 'al', name: 'Albania', continent: 'Europe' },
  { code: 'dz', name: 'Algeria', continent: 'Africa' },
  { code: 'ad', name: 'Andorra', continent: 'Europe' },
  { code: 'ao', name: 'Angola', continent: 'Africa' },
  { code: 'ar', name: 'Argentina', continent: 'South America' },
  { code: 'am', name: 'Armenia', continent: 'Asia' },
  { code: 'au', name: 'Australia', continent: 'Oceania' },
  { code: 'at', name: 'Austria', continent: 'Europe' },
  { code: 'az', name: 'Azerbaijan', continent: 'Asia' },
  { code: 'bs', name: 'Bahamas', continent: 'North America' },
  { code: 'bh', name: 'Bahrain', continent: 'Asia' },
  { code: 'bd', name: 'Bangladesh', continent: 'Asia' },
  { code: 'bb', name: 'Barbados', continent: 'North America' },
  { code: 'by', name: 'Belarus', continent: 'Europe' },
  { code: 'be', name: 'Belgium', continent: 'Europe' },
  { code: 'bz', name: 'Belize', continent: 'North America' },
  { code: 'bj', name: 'Benin', continent: 'Africa' },
  { code: 'bt', name: 'Bhutan', continent: 'Asia' },
  { code: 'bo', name: 'Bolivia', continent: 'South America' },
  { code: 'ba', name: 'Bosnia and Herzegovina', continent: 'Europe' },
  { code: 'bw', name: 'Botswana', continent: 'Africa' },
  { code: 'br', name: 'Brazil', continent: 'South America' },
  { code: 'bn', name: 'Brunei', continent: 'Asia' },
  { code: 'bg', name: 'Bulgaria', continent: 'Europe' },
  { code: 'bf', name: 'Burkina Faso', continent: 'Africa' },
  { code: 'bi', name: 'Burundi', continent: 'Africa' },
  { code: 'kh', name: 'Cambodia', continent: 'Asia' },
  { code: 'cm', name: 'Cameroon', continent: 'Africa' },
  { code: 'ca', name: 'Canada', continent: 'North America' },
  { code: 'cv', name: 'Cape Verde', continent: 'Africa' },
  { code: 'cf', name: 'Central African Republic', continent: 'Africa' },
  { code: 'td', name: 'Chad', continent: 'Africa' },
  { code: 'cl', name: 'Chile', continent: 'South America' },
  { code: 'cn', name: 'China', continent: 'Asia' },
  { code: 'co', name: 'Colombia', continent: 'South America' },
  { code: 'km', name: 'Comoros', continent: 'Africa' },
  { code: 'cg', name: 'Congo', continent: 'Africa' },
  { code: 'cr', name: 'Costa Rica', continent: 'North America' },
  { code: 'hr', name: 'Croatia', continent: 'Europe' },
  { code: 'cu', name: 'Cuba', continent: 'North America' },
  { code: 'cy', name: 'Cyprus', continent: 'Asia' },
  { code: 'cz', name: 'Czech Republic', continent: 'Europe' },
  { code: 'dk', name: 'Denmark', continent: 'Europe' },
  { code: 'dj', name: 'Djibouti', continent: 'Africa' },
  { code: 'dm', name: 'Dominica', continent: 'North America' },
  { code: 'do', name: 'Dominican Republic', continent: 'North America' },
  { code: 'ec', name: 'Ecuador', continent: 'South America' },
  { code: 'eg', name: 'Egypt', continent: 'Africa' },
  { code: 'sv', name: 'El Salvador', continent: 'North America' },
  { code: 'gq', name: 'Equatorial Guinea', continent: 'Africa' },
  { code: 'er', name: 'Eritrea', continent: 'Africa' },
  { code: 'ee', name: 'Estonia', continent: 'Europe' },
  { code: 'et', name: 'Ethiopia', continent: 'Africa' },
  { code: 'fj', name: 'Fiji', continent: 'Oceania' },
  { code: 'fi', name: 'Finland', continent: 'Europe' },
  { code: 'fr', name: 'France', continent: 'Europe' },
  { code: 'ga', name: 'Gabon', continent: 'Africa' },
  { code: 'gm', name: 'Gambia', continent: 'Africa' },
  { code: 'ge', name: 'Georgia', continent: 'Asia' },
  { code: 'de', name: 'Germany', continent: 'Europe' },
  { code: 'gh', name: 'Ghana', continent: 'Africa' },
  { code: 'gr', name: 'Greece', continent: 'Europe' },
  { code: 'gd', name: 'Grenada', continent: 'North America' },
  { code: 'gt', name: 'Guatemala', continent: 'North America' },
  { code: 'gn', name: 'Guinea', continent: 'Africa' },
  { code: 'gw', name: 'Guinea-Bissau', continent: 'Africa' },
  { code: 'gy', name: 'Guyana', continent: 'South America' },
  { code: 'ht', name: 'Haiti', continent: 'North America' },
  { code: 'hn', name: 'Honduras', continent: 'North America' },
  { code: 'hu', name: 'Hungary', continent: 'Europe' },
  { code: 'is', name: 'Iceland', continent: 'Europe' },
  { code: 'in', name: 'India', continent: 'Asia' },
  { code: 'id', name: 'Indonesia', continent: 'Asia' },
  { code: 'ir', name: 'Iran', continent: 'Asia' },
  { code: 'iq', name: 'Iraq', continent: 'Asia' },
  { code: 'ie', name: 'Ireland', continent: 'Europe' },
  { code: 'il', name: 'Israel', continent: 'Asia' },
  { code: 'it', name: 'Italy', continent: 'Europe' },
  { code: 'jm', name: 'Jamaica', continent: 'North America' },
  { code: 'jp', name: 'Japan', continent: 'Asia' },
  { code: 'jo', name: 'Jordan', continent: 'Asia' },
  { code: 'kz', name: 'Kazakhstan', continent: 'Asia' },
  { code: 'ke', name: 'Kenya', continent: 'Africa' },
  { code: 'kw', name: 'Kuwait', continent: 'Asia' },
  { code: 'kg', name: 'Kyrgyzstan', continent: 'Asia' },
  { code: 'la', name: 'Laos', continent: 'Asia' },
  { code: 'lv', name: 'Latvia', continent: 'Europe' },
  { code: 'lb', name: 'Lebanon', continent: 'Asia' },
  { code: 'ls', name: 'Lesotho', continent: 'Africa' },
  { code: 'lr', name: 'Liberia', continent: 'Africa' },
  { code: 'ly', name: 'Libya', continent: 'Africa' },
  { code: 'li', name: 'Liechtenstein', continent: 'Europe' },
  { code: 'lt', name: 'Lithuania', continent: 'Europe' },
  { code: 'lu', name: 'Luxembourg', continent: 'Europe' },
  { code: 'mg', name: 'Madagascar', continent: 'Africa' },
  { code: 'mw', name: 'Malawi', continent: 'Africa' },
  { code: 'my', name: 'Malaysia', continent: 'Asia' },
  { code: 'mv', name: 'Maldives', continent: 'Asia' },
  { code: 'ml', name: 'Mali', continent: 'Africa' },
  { code: 'mt', name: 'Malta', continent: 'Europe' },
  { code: 'mh', name: 'Marshall Islands', continent: 'Oceania' },
  { code: 'mr', name: 'Mauritania', continent: 'Africa' },
  { code: 'mu', name: 'Mauritius', continent: 'Africa' },
  { code: 'mx', name: 'Mexico', continent: 'North America' },
  { code: 'fm', name: 'Micronesia', continent: 'Oceania' },
  { code: 'md', name: 'Moldova', continent: 'Europe' },
  { code: 'mc', name: 'Monaco', continent: 'Europe' },
  { code: 'mn', name: 'Mongolia', continent: 'Asia' },
  { code: 'me', name: 'Montenegro', continent: 'Europe' },
  { code: 'ma', name: 'Morocco', continent: 'Africa' },
  { code: 'mz', name: 'Mozambique', continent: 'Africa' },
  { code: 'mm', name: 'Myanmar', continent: 'Asia' },
  { code: 'na', name: 'Namibia', continent: 'Africa' },
  { code: 'nr', name: 'Nauru', continent: 'Oceania' },
  { code: 'np', name: 'Nepal', continent: 'Asia' },
  { code: 'nl', name: 'Netherlands', continent: 'Europe' },
  { code: 'nz', name: 'New Zealand', continent: 'Oceania' },
  { code: 'ni', name: 'Nicaragua', continent: 'North America' },
  { code: 'ne', name: 'Niger', continent: 'Africa' },
  { code: 'ng', name: 'Nigeria', continent: 'Africa' },
  { code: 'kp', name: 'North Korea', continent: 'Asia' },
  { code: 'mk', name: 'North Macedonia', continent: 'Europe' },
  { code: 'no', name: 'Norway', continent: 'Europe' },
  { code: 'om', name: 'Oman', continent: 'Asia' },
  { code: 'pk', name: 'Pakistan', continent: 'Asia' },
  { code: 'pw', name: 'Palau', continent: 'Oceania' },
  { code: 'ps', name: 'Palestine', continent: 'Asia' },
  { code: 'pa', name: 'Panama', continent: 'North America' },
  { code: 'pg', name: 'Papua New Guinea', continent: 'Oceania' },
  { code: 'py', name: 'Paraguay', continent: 'South America' },
  { code: 'pe', name: 'Peru', continent: 'South America' },
  { code: 'ph', name: 'Philippines', continent: 'Asia' },
  { code: 'pl', name: 'Poland', continent: 'Europe' },
  { code: 'pt', name: 'Portugal', continent: 'Europe' },
  { code: 'qa', name: 'Qatar', continent: 'Asia' },
  { code: 'ro', name: 'Romania', continent: 'Europe' },
  { code: 'ru', name: 'Russia', continent: 'Europe' },
  { code: 'rw', name: 'Rwanda', continent: 'Africa' },
  { code: 'ws', name: 'Samoa', continent: 'Oceania' },
  { code: 'sm', name: 'San Marino', continent: 'Europe' },
  { code: 'sa', name: 'Saudi Arabia', continent: 'Asia' },
  { code: 'sn', name: 'Senegal', continent: 'Africa' },
  { code: 'rs', name: 'Serbia', continent: 'Europe' },
  { code: 'sc', name: 'Seychelles', continent: 'Africa' },
  { code: 'sl', name: 'Sierra Leone', continent: 'Africa' },
  { code: 'sg', name: 'Singapore', continent: 'Asia' },
  { code: 'sk', name: 'Slovakia', continent: 'Europe' },
  { code: 'si', name: 'Slovenia', continent: 'Europe' },
  { code: 'sb', name: 'Solomon Islands', continent: 'Oceania' },
  { code: 'so', name: 'Somalia', continent: 'Africa' },
  { code: 'za', name: 'South Africa', continent: 'Africa' },
  { code: 'kr', name: 'South Korea', continent: 'Asia' },
  { code: 'ss', name: 'South Sudan', continent: 'Africa' },
  { code: 'es', name: 'Spain', continent: 'Europe' },
  { code: 'lk', name: 'Sri Lanka', continent: 'Asia' },
  { code: 'sd', name: 'Sudan', continent: 'Africa' },
  { code: 'sr', name: 'Suriname', continent: 'South America' },
  { code: 'se', name: 'Sweden', continent: 'Europe' },
  { code: 'ch', name: 'Switzerland', continent: 'Europe' },
  { code: 'sy', name: 'Syria', continent: 'Asia' },
  { code: 'tw', name: 'Taiwan', continent: 'Asia' },
  { code: 'tj', name: 'Tajikistan', continent: 'Asia' },
  { code: 'tz', name: 'Tanzania', continent: 'Africa' },
  { code: 'th', name: 'Thailand', continent: 'Asia' },
  { code: 'tl', name: 'Timor-Leste', continent: 'Asia' },
  { code: 'tg', name: 'Togo', continent: 'Africa' },
  { code: 'to', name: 'Tonga', continent: 'Oceania' },
  { code: 'tt', name: 'Trinidad and Tobago', continent: 'North America' },
  { code: 'tn', name: 'Tunisia', continent: 'Africa' },
  { code: 'tr', name: 'Turkey', continent: 'Asia' },
  { code: 'tm', name: 'Turkmenistan', continent: 'Asia' },
  { code: 'tv', name: 'Tuvalu', continent: 'Oceania' },
  { code: 'ug', name: 'Uganda', continent: 'Africa' },
  { code: 'ua', name: 'Ukraine', continent: 'Europe' },
  { code: 'ae', name: 'United Arab Emirates', continent: 'Asia' },
  { code: 'gb', name: 'United Kingdom', continent: 'Europe' },
  { code: 'us', name: 'United States', continent: 'North America' },
  { code: 'uy', name: 'Uruguay', continent: 'South America' },
  { code: 'uz', name: 'Uzbekistan', continent: 'Asia' },
  { code: 'vu', name: 'Vanuatu', continent: 'Oceania' },
  { code: 'va', name: 'Vatican City', continent: 'Europe' },
  { code: 've', name: 'Venezuela', continent: 'South America' },
  { code: 'vn', name: 'Vietnam', continent: 'Asia' },
  { code: 'ye', name: 'Yemen', continent: 'Asia' },
  { code: 'zm', name: 'Zambia', continent: 'Africa' },
  { code: 'zw', name: 'Zimbabwe', continent: 'Africa' },
];
