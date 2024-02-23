import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { Link } from '@mui/docs/Link';
import ROUTES from 'docs/src/route';

export default function StylingInfo({
  appeared,
  stylingContent,
  ...props
}: { appeared: boolean; stylingContent?: React.ReactElement } & BoxProps) {
  const [hidden, setHidden] = React.useState(false);
  const defaultContent = (
    <React.Fragment>
      <Typography fontWeight="bold" variant="body2">
        Own the styling!
      </Typography>
      <Typography color="text.secondary" variant="body2">
        Build your own design system using the{' '}
        <Link href={ROUTES.theming}>sophisticated theming features</Link>. You can also start by
        using Google&apos;s Material Design.
      </Typography>
    </React.Fragment>
  );
  return (
    <Box
      data-mui-color-scheme="dark"
      {...props}
      sx={{
        position: 'absolute',
        bottom: 0,
        transform: hidden || !appeared ? 'translateY(100%)' : 'translateY(0)',
        transition: '0.3s',
        left: 0,
        right: 0,
        p: 2,
        background: ({ palette }) => alpha(palette.common.black, 0.5),
        backdropFilter: 'blur(8px)',
        zIndex: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: '0 0 10px 10px',
        ...props.sx,
      }}
    >
      <IconButton
        aria-label={hidden ? 'show' : 'hide'}
        onClick={() => setHidden((bool) => !bool)}
        sx={{
          position: 'absolute',
          zIndex: 2,
          transition: '0.3s',
          right: 16,
          bottom: '100%',
          transform: hidden || !appeared ? 'translateY(-10px)' : 'translateY(50%)',
          opacity: appeared ? 1 : 0,
          bgcolor: 'primary.600',
          '&:hover, &.Mui-focused': {
            bgcolor: 'primary.700',
          },
        }}
      >
        {hidden ? (
          <KeyboardArrowUpRounded fontSize="small" />
        ) : (
          <KeyboardArrowDownRounded fontSize="small" />
        )}
      </IconButton>
      {stylingContent || defaultContent}
    </Box>
  );
}
