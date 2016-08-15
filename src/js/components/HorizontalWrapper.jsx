const React = require('react');
const { PropTypes: types } = React;

function HorizontalWrapper({ children, offset }) {
  const transformStyle = {
    transform: `translate3d(-${offset}px, -0px, 0px)`
  };
  return <span className='scrollable__horizontal-wrapper' style={transformStyle}>{children}</span>;
}

HorizontalWrapper.propTypes = {
  children: types.node.isRequired,
  offset: types.number.isRequired
};

module.exports = HorizontalWrapper;
