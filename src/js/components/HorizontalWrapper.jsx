const React = require('react');
const { PropTypes: types } = React;

class HorizontalWrapper extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  }

  render() {
    const { children, offset } = this.props;
    const transformStyle = {
      transform: `translate3d(-${offset}px, -0px, 0px)`
    };
    return <span className='scrollable__horizontal-wrapper' style={transformStyle}>{children}</span>;
  }
}

HorizontalWrapper.propTypes = {
  children: types.node.isRequired,
  offset: types.number.isRequired
};

module.exports = HorizontalWrapper;
