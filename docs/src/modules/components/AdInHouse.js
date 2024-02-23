import * as React from 'react';
import PropTypes from 'prop-types';
import AdDisplay from 'docs/src/modules/components/AdDisplay';

export default function AdInHouse(props) {
  const { ad } = props;

  return <AdDisplay ad={{ poweredby: 'MUI', label: `in-house-${ad.name}`, ...ad }} />;
}

AdInHouse.propTypes = {
  ad: PropTypes.object.isRequired,
};
