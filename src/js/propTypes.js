const { PropTypes: types } = require('react');

const renderableComponent = types.oneOfType([types.func, types.element]);

const gutterConfig = types.shape({
  handleWidth: types.number,
  width: types.number
});

const guttersConfig = types.shape({
  left: gutterConfig,
  onGutterResize: types.func,
  right: gutterConfig
});

const horizontalScrollConfig = types.shape({
  contentWidth: types.number.isRequired,
  scrollbarHeight: types.number
});

const rowGutter = types.shape({
  componentClass: renderableComponent.isRequired,
  handleClassName: types.string
});

const gutters = types.shape({
  left: rowGutter,
  right: rowGutter
});

const row = types.shape({
  contentComponent: renderableComponent.isRequired,
  gutters
});

const scrollTo = types.shape({
  x: types.number,
  y: types.number
});

const verticalScrollConfig = types.shape({
  rowHeight: types.number.isRequired,
  scrollbarWidth: types.number
});

module.exports = {
  gutterConfig,
  gutters,
  guttersConfig,
  horizontalScrollConfig,
  renderableComponent,
  row,
  rowGutter,
  scrollTo,
  verticalScrollConfig
};
