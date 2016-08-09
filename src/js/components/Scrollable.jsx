const React = require('react');
const _ = require('lodash');

const { PropTypes: types } = React;

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this.state = {
      topIndex: 0,
      transform: 0
    };
  }

  _onScroll() {
    const {
      refs: {
        scrollbar: { scrollTop: transform }
      },
      props: { rowHeight }
    } = this;
    const topIndex = _.floor(transform / rowHeight);
    this.setState({ topIndex, transform });
  }

  _onMouseWheel({ deltaY }) {
    const {
      refs: { scrollbar },
      props: { rowHeight, rows }
    } = this;
    const maxHeight = (rowHeight * rows.length) - scrollbar.offsetHeight;

    let { transform } = this.state;
    transform += deltaY;
    transform = _.clamp(transform, 0, maxHeight);

    const topIndex = _.floor(transform / rowHeight);
    this.setState({ topIndex, transform }, () => { scrollbar.scrollTop = transform });
  }

  render() {
    const { rowHeight, rows } = this.props;
    const { topIndex, transform } = this.state;
    const offset = transform % rowHeight;

    const scrollbarHeightStyle = { height: `${rowHeight * rows.length}px` };
    const translateStyle = { transform: `translate3d(-0px, -${offset}px, 0px)` };

    const showRows = _(rows)
      .slice(topIndex, topIndex + 100)
      .map((row, index) => (<div key={index} style={translateStyle}>{row()}</div>))
      .value();

    return (
      <div className='scrollable' ref='scrollable'>
        <div className='contents' onWheel={this._onMouseWheel}>
          {showRows}
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
