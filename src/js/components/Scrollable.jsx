const React = require('react');
const _ = require('lodash');

const { PropTypes: types } = React;

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this.state = {
      transform: 0
    };
  }


  _onScroll() {
    const { scrollbar } = this.refs;
    this.setState({ transform: scrollbar.scrollTop });
  }

  _onMouseWheel(event) {
    const { transform } = this.state;
    this.setState({ transform: event.deltaY + transform });
  }

  render() {
    const { rowHeight, rows } = this.props;
    const { transform } = this.state;

    const scrollbarHeightStyle = { height: `${rowHeight * rows.length}px` };
    const translateStyle = { transform: `translate3d(-0px, -${transform}px, 0px)` };

    return (
      <div className='scrollable'>
        <div className='contents' onWheel={this._onMouseWheel}>
          {rows.map((row, index) => (<div key={index} style={translateStyle}>{row}</div>))}
        </div>
        <div className='scrollbar' onScroll={this._onScroll} ref='scrollbar'>
          <div style={scrollbarHeightStyle} />
        </div>
      </div>
    );
  }
}

Scrollable.propTypes = {
  rowHeight: types.number.isRequired,
  rows: types.array.isRequired
};

module.exports = Scrollable;
