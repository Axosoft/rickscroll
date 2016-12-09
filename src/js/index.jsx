import AutoAdjust from './AutoAdjust';
import HorizontalWrapper from './HorizontalWrapper';
import Scrollable from './Scrollable';

const Rickscroll = AutoAdjust;
Rickscroll.Static = Scrollable;

module.exports = {
  Rickscroll,
  HorizontalWrapper
};
