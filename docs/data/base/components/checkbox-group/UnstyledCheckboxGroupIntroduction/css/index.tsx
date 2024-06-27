import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Checkbox from '@base_ui/react/Checkbox';
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
import Check from '@mui/icons-material/Check';

export default function UnstyledCheckboxIndeterminateGroup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <CheckboxGroup.Root defaultValue={['red']}>
        <CheckboxGroup.Label className="CheckboxGroup-label">
          Colors
        </CheckboxGroup.Label>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label className="Checkbox-label">
            <Checkbox.Root className="Checkbox" name="red">
              <Checkbox.Indicator className="Checkbox-indicator">
                <Check className="Check" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Red
          </Label>
          <Label className="Checkbox-label">
            <Checkbox.Root className="Checkbox" name="green">
              <Checkbox.Indicator className="Checkbox-indicator">
                <Check className="Check" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Green
          </Label>
          <Label className="Checkbox-label">
            <Checkbox.Root className="Checkbox" name="blue">
              <Checkbox.Indicator className="Checkbox-indicator">
                <Check className="Check" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Blue
          </Label>
        </div>
      </CheckboxGroup.Root>
      <Styles />
    </div>
  );
}

const grey = {
  100: '#E5EAF2',
  300: '#C7D0DD',
  500: '#9DA8B7',
  600: '#6B7A90',
  800: '#303740',
  900: '#1C2025',
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Label(props: React.ComponentPropsWithoutRef<'label'>) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions
  return <label onMouseDown={(e) => e.preventDefault()} {...props} />;
}

function Styles() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <style>
      {`
      .Check {
        height: 100%;
        width: 100%;
      }

      .CheckboxGroup-label {
        display: flex;
        font-weight: bold;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 17px;
      }

      .Checkbox-label {
        display: flex;
        font-weight: 500;
        gap: 8px;
        margin-bottom: 8px;
      }

      .Checkbox {
        all: unset;
        box-sizing: border-box;
        text-align: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border-radius: 4px;
        border: 2px solid ${grey[600]};
        background: none;
        transition-property: background, border-color;
        transition-duration: 0.15s;
      }

      .Checkbox[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .Checkbox:focus-visible {
        outline: 2px solid ${isDarkMode ? grey[600] : grey[500]};
        outline-offset: 2px;
      }

      .Checkbox[data-state="checked"] {
        border-color: ${grey[800]};
        background: ${grey[800]};
      }

      .Checkbox-indicator {
        height: 100%;
        display: inline-block;
        visibility: hidden;
        color: ${isDarkMode ? grey[900] : grey[100]};
      }

      .Checkbox-indicator[data-state="checked"] {
        visibility: visible;
      }

      .Checkbox-icon {
        width: 100%;
        height: 100%;
      }

      @media (prefers-color-scheme: dark) {
        .Checkbox {
          border-color: ${grey[500]};
        }

        .Checkbox[data-state="checked"] {
          border-color: ${grey[300]};
          background: ${grey[300]};
        }

        .Checkbox:hover:not([data-disabled]) {
          border-color: ${grey[100]};
        }

        .Checkbox-indicator {
          color: ${grey[900]};
        }
      }
    `}
    </style>
  );
}
