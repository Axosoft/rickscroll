import React from 'react';
import AutoAdjust from './AutoAdjust';
import HorizontalWrapper from './HorizontalWrapper';
import Scrollable from './Scrollable';

const Rickscroll = props => <AutoAdjust component={Scrollable} {...props} />;
Rickscroll.Static = Scrollable;

module.exports = {
  Rickscroll,
  HorizontalWrapper
};
