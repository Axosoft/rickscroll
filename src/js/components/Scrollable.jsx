const React = require('react');
const _ = require('lodash');

const { PropTypes: types } = React;

const helpers = {
  buildGutter({ component: ComponentClass, width: minWidth } = {}) {
    const widthStyle = minWidth ? { minWidth } : undefined;
    return ComponentClass ?
      <span className='scrollable__gutter' style={widthStyle}><ComponentClass /></span> :
      undefined;
  },

  getMaxHeight(rowHeight, numRows, offsetHeight) {
    return (rowHeight * numRows) - offsetHeight;
  },

  getScrollValues(preClampTransform, rowHeight, maxHeight) {
    const transform = _.clamp(preClampTransform, 0, maxHeight);
    const topIndex = _.floor(transform / rowHeight);
    return { topIndex, transform };
  },

  getRenderableRow(translateStyle) {
    return ({ contentComponent: ContentComponent, gutters = {} }, index) => {
      const leftComponent = helpers.buildGutter(gutters.left);
      const rightComponent = helpers.buildGutter(gutters.right);
      return (
        <div className='scrollable__row' key={index} style={translateStyle}>
          {leftComponent}
          <span className='scrollable__content'><ContentComponent /></span>
          {rightComponent}
        </div>
      );
    };
  }
};

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
        scrollbar: { offsetHeight, scrollTop }
      },
      props: {
        rowHeight,
        rows
      }
    } = this;

    const maxHeight = helpers.getMaxHeight(rowHeight, rows.length, offsetHeight);

    this.setState(helpers.getScrollValues(scrollTop, rowHeight, maxHeight));
  }

  _onMouseWheel({ deltaY }) {
    const {
      refs: { scrollbar },
      props: { rowHeight, rows }
    } = this;

    const maxHeight = helpers.getMaxHeight(rowHeight, rows.length, scrollbar.offsetHeight);
    const transform = this.state.transform + deltaY;

    this.setState(
      helpers.getScrollValues(transform, rowHeight, maxHeight),
      () => { scrollbar.scrollTop = transform }
    );
  }

  render() {
    const {
      rowHeight,
      rows,
    } = this.props;
    const {
      topIndex,
      transform
    } = this.state;

    const offset = transform % rowHeight;
    const scrollbarHeightStyle = {
      height: `${rowHeight * rows.length}px`
    };
    const translateStyle = {
      transform: `translate3d(-0px, -${offset}px, 0px)`,
      height: `${rowHeight}px`
    };

    const showRows = _(rows)
      .slice(Math.min(topIndex, rows.length), topIndex + 100)
      .map(helpers.getRenderableRow(translateStyle)).value();

    return (
      <div className='scrollable' ref='scrollable'>
        <div className='scrollable__contents' onWheel={this._onMouseWheel}>
          {showRows}
        </div>
        <div className='scrollable__scrollbar' onScroll={this._onScroll} ref='scrollbar'>
          <div style={scrollbarHeightStyle} />
        </div>
      </div>
    );
  }
}

Scrollable.propTypes = {
  rowHeight: types.number.isRequired,
  rows: types.array.isRequired,
};

module.exports = Scrollable;
