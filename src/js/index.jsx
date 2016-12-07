import React from 'react';
import AutoAdjust from './AutoAdjust';
import HorizontalWrapper from './HorizontalWrapper';
import Scrollable from './Scrollable';

const RickScroll = props => <AutoAdjust component={Scrollable} {...props} />;
RickScroll.Static = Scrollable;

module.exports = {
  RickScroll,
  HorizontalWrapper
};
