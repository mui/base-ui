import '@mui/internal-test-utils/init';
import '@mui/internal-test-utils/setupKarma';

const baseUiUnitContext = require.context('../packages/react/src/', true, /\.test\.(js|ts|tsx)$/);
baseUiUnitContext.keys().forEach(baseUiUnitContext);
