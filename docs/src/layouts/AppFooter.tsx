import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import { alpha } from '@mui/material/styles';
import SvgMuiLogotype from 'docs/src/icons/SvgMuiLogotype';
import EmailSubscribe from 'docs/src/components/footer/EmailSubscribe';
import ROUTES from 'docs/src/route';
import DiscordIcon from 'docs/src/icons/DiscordIcon';
import { Link } from '@mui/docs/Link';
import SvgStackOverflow from 'docs/src/icons/SvgStackOverflow';

interface AppFooterProps {
  stackOverflowUrl?: string;
}

export default function AppFooter(props: AppFooterProps) {
  const { stackOverflowUrl } = props;

  return (
    <Container component="footer">
      <Box
        sx={{
          py: { xs: 4, sm: 8 },
          display: 'grid',
          gridAutoColumns: '1fr',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 4,
          gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr 1.75fr', lg: '1fr 1fr' },
          gridTemplateRows: 'auto',
          '& a:not(.MuiIconButton-root)': {
            pt: 0.5,
            pb: 0.5,
            color: 'text.secondary',
            typography: 'body2',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          },
        }}
      >
        <div>
          <Link prefetch={false} href="/" aria-label="Go to homepage" sx={{ mb: 2 }}>
            <SvgMuiLogotype height={28} width={91} />
          </Link>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Keep up to date
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Join our newsletter for regular updates. No spam ever.
          </Typography>
          <EmailSubscribe />
        </div>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gridAutoColumns: '1fr',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.5 }}>
              Products
            </Typography>
            <Link prefetch={false} href={ROUTES.productMaterial}>
              Material UI
            </Link>
            <Link prefetch={false} href={ROUTES.productBase}>
              Base UI
            </Link>
            <Link prefetch={false} href={ROUTES.productAdvanced}>
              MUI X
            </Link>
            <Link prefetch={false} href={ROUTES.productToolpad}>
              MUI Toolpad
            </Link>
            <Link prefetch={false} href={ROUTES.productTemplates}>
              Templates
            </Link>
            <Link prefetch={false} href={ROUTES.productDesignKits}>
              Design kits
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.5 }}>
              Resources
            </Typography>
            <Link prefetch={false} href={ROUTES.materialIcons}>
              Material Icons
            </Link>
            <Link prefetch={false} href={ROUTES.freeTemplates}>
              Free templates
            </Link>
            <Link prefetch={false} href={ROUTES.components}>
              Components
            </Link>
            <Link prefetch={false} href={ROUTES.customization}>
              Customization
            </Link>
            <Link prefetch={false} href={ROUTES.theming}>
              Theming
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.5 }}>
              Explore
            </Typography>
            <Link prefetch={false} href={ROUTES.documentation}>
              Documentation
            </Link>
            <Link prefetch={false} href={ROUTES.store}>
              Store
            </Link>
            <Link prefetch={false} href={ROUTES.blog}>
              Blog
            </Link>
            <Link prefetch={false} href={ROUTES.showcase}>
              Showcase
            </Link>
            <Link prefetch={false} href={ROUTES.coreRoadmap}>
              Roadmap
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.5 }}>
              Company
            </Typography>
            <Link prefetch={false} href={ROUTES.about}>
              About
            </Link>
            <Link prefetch={false} href={ROUTES.vision}>
              Vision
            </Link>
            <Box sx={{ display: 'flex', alignItems: 'end' }}>
              <Link prefetch={false} href={ROUTES.careers}>
                Careers{' '}
              </Link>
              <Box
                sx={(theme) => ({
                  px: 0.5,
                  py: 0.1,
                  ml: 1,
                  mb: '1px',
                  position: 'relative',
                  top: theme.spacing(-0.5),
                  fontSize: theme.typography.pxToRem(10),
                  fontWeight: 'Bold',
                  textTransform: 'uppercase',
                  letterSpacing: '.04rem',
                  borderRadius: 8,
                  border: 1,
                  borderColor: 'success.300',
                  bgcolor: alpha(theme.palette.success[100], 0.4),
                  color: 'success.700',
                  ...theme.applyDarkStyles({
                    borderColor: alpha(theme.palette.success[800], 0.5),
                    bgcolor: alpha(theme.palette.success[800], 0.2),
                    color: 'success.200',
                  }),
                })}
              >
                Hiring
              </Box>
            </Box>
            <Link prefetch={false} href={ROUTES.support}>
              Support
            </Link>
            <Link prefetch={false} href={ROUTES.privacyPolicy}>
              Privacy policy
            </Link>
            <Link prefetch={false} target="_blank" rel="noopener" href="mailto:contact@mui.com">
              Contact us
            </Link>
          </Box>
        </Box>
      </Box>
      <Divider />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent={{ sm: 'space-between' }}
        gap={{ xs: 2, sm: 1 }}
        sx={{ my: 4 }}
      >
        <Typography color="text.tertiary" variant="caption" fontWeight={400}>
          Copyright © {new Date().getFullYear()} Material UI SAS, trading as MUI.
        </Typography>
        <Stack spacing={1} direction="row" flexWrap="wrap" useFlexGap>
          <IconButton
            target="_blank"
            rel="noopener"
            href="https://github.com/mui"
            aria-label="github"
            title="GitHub"
            size="small"
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
          <IconButton
            target="_blank"
            rel="noopener"
            href={ROUTES.rssFeed}
            aria-label="RSS Feed"
            title="RSS Feed"
            size="small"
          >
            <RssFeedIcon fontSize="small" />
          </IconButton>
          <IconButton
            target="_blank"
            rel="noopener"
            href="https://twitter.com/MUI_hq"
            aria-label="twitter"
            title="X"
            size="small"
          >
            <XIcon fontSize="small" />
          </IconButton>
          <IconButton
            target="_blank"
            rel="noopener"
            href="https://www.linkedin.com/company/mui/"
            aria-label="linkedin"
            title="LinkedIn"
            size="small"
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
          <IconButton
            target="_blank"
            rel="noopener"
            href="https://www.youtube.com/@MUI_hq"
            aria-label="YouTube"
            title="YouTube"
            size="small"
          >
            <YouTubeIcon fontSize="small" />
          </IconButton>
          <IconButton
            target="_blank"
            rel="noopener"
            href="https://mui.com/r/discord/"
            aria-label="Discord"
            title="Discord"
            size="small"
          >
            <DiscordIcon fontSize="small" />
          </IconButton>
          {stackOverflowUrl ? (
            <IconButton
              target="_blank"
              rel="noopener"
              href={stackOverflowUrl}
              aria-label="Stack Overflow"
              title="Stack Overflow"
              size="small"
            >
              <SvgStackOverflow fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      </Stack>
    </Container>
  );
}
