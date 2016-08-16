const React = require('react');
require('../../../static/css/scrollable');
const { AnimationTimer } = require('animation-timer');
const { Easer } = require('functional-easing');
const _ = require('lodash');
const { PropTypes: types } = React;
const easer = new Easer()
  .using('out-cubic');

const constants = require('../constants');
const HorizontalWrapper = require('./HorizontalWrapper');
const utils = require('../utils');

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this._getThrottledAnimationFrameFn = this._getThrottledAnimationFrameFn.bind(this);
    this._getRenderableGutter = this._getRenderableGutter.bind(this);
    this._getRenderableRow = this._getRenderableRow.bind(this);
    this._onHorizontalScroll = this._onHorizontalScroll.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onVerticalScroll = this._onVerticalScroll.bind(this);
    this._scrollTo = this._scrollTo.bind(this);
    this.state = {
      animation: null,
      displayBuffer: 100,
      horizontalTransform: 0,
      offsetBuffer: 8,
      scrollingToPosition: new utils.Point(0, 0),
      topIndex: 0,
      verticalTransform: 0
    };
  }

  componentWillReceiveProps({ scrollTo: nextScrollTo = {} }) {
    const { scrollTo: prevScrollTo = {} } = this.props;
    if (!_.isEqual(prevScrollTo, nextScrollTo)) {
      this._scrollTo(nextScrollTo);
    }
  }

  _getRenderableGutter(ComponentClass, minWidth) {
    const widthStyle = minWidth ? { minWidth } : undefined;
    return ComponentClass ?
      <span className='scrollable__gutter' style={widthStyle}><ComponentClass /></span> :
      undefined;
  }

  _getRenderableRow(translateStyle) {
    return ({ contentComponent: ContentComponent, gutters = {} }, index) => {
      const {
        gutterConfig: {
          left: {
            width: leftGutterWidth = constants.LEFT_GUTTER_WIDTH
          } = {},
          right: {
            width: rightGutterWidth = constants.RIGHT_GUTTER_WIDTH
          } = {}
        } = {}
      } = this.props;
      const {
        horizontalTransform
      } = this.state;

      const leftComponent = this._getRenderableGutter(gutters.left, leftGutterWidth);
      const rightComponent = this._getRenderableGutter(gutters.right, rightGutterWidth);
      const contentComponent = horizontalTransform !== undefined ?
        <ContentComponent offset={horizontalTransform} /> :
        <ContentComponent />;

      return (
        <div className='scrollable__row' key={index} style={translateStyle}>
          {leftComponent}
          <span className='scrollable__content'>{contentComponent}</span>
          {rightComponent}
        </div>
      );
    };
  }

  _getThrottledAnimationFrameFn(scrollTo) {
    const { horizontalTransform, verticalTransform } = this.state;
    const delta = _.clone(scrollTo)
      .sub(new utils.Point(horizontalTransform, verticalTransform));
    const transition = new utils.Point(0, 0);

    return _.throttle(easer(elapsedTime => {
      if (!_.isEqual(scrollTo, this.state.scrollingToPosition)) {
        return;
      }

      const deltaScrolled = new utils.Point(delta.x, delta.y)
        .scale(elapsedTime)
        .sub(transition);

      transition.add(deltaScrolled);
      this._onMouseWheel({
        deltaX: deltaScrolled.x,
        deltaY: deltaScrolled.y
      });
    }), constants.ANIMATION_FPS_30, { leading: true });
  }

  _onHorizontalScroll() {
    const {
      refs: {
        horizontalScrollbar: { scrollLeft }
      }
    } = this;
    this.setState({ horizontalTransform: scrollLeft });
  }

  _onMouseWheel({ deltaX, deltaY }) {
    const {
      refs: { horizontalScrollbar, verticalScrollbar },
      props: {
        horizontalScrollConfig,
        verticalScrollConfig: {
          rowHeight,
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        },
        rows
      },
      state: { offsetBuffer }
    } = this;
    const withHorizontalScrolling = !!horizontalScrollConfig;

    // vertical
    const maxHeight = utils.getMaxHeight(rowHeight, rows.length, verticalScrollbar.offsetHeight);
    const verticalTransform = this.state.verticalTransform + deltaY;
    const scrollChanges = utils.getScrollValues(verticalTransform, rowHeight, maxHeight, offsetBuffer);

    // horizontal scrolling
    if (withHorizontalScrolling) {
      scrollChanges.horizontalTransform = _.clamp(
        this.state.horizontalTransform + deltaX,
        0,
        (horizontalScrollbar.scrollWidth - horizontalScrollbar.offsetWidth) + scrollbarWidth
      );
    }

    this.setState(scrollChanges, () => {
      verticalScrollbar.scrollTop = verticalTransform;
      if (withHorizontalScrolling) {
        horizontalScrollbar.scrollLeft = scrollChanges.horizontalTransform;
      }
    });
  }

  _onVerticalScroll() {
    const {
      refs: {
        verticalScrollbar: { offsetHeight, scrollTop }
      },
      props: {
        verticalScrollConfig: { rowHeight },
        rows
      },
      state: { offsetBuffer }
    } = this;

    const maxHeight = utils.getMaxHeight(rowHeight, rows.length, offsetHeight);

    this.setState(utils.getScrollValues(scrollTop, rowHeight, maxHeight, offsetBuffer));
  }

  _scrollTo({ x = 0, y = 0 }) {
    let { animation } = this.state;
    if (animation) {
      animation.stop();
    }

    const scrollingToPosition = new utils.Point(x, y);

    animation = new AnimationTimer()
    .on('tick', this._getThrottledAnimationFrameFn(scrollingToPosition))
    .play();

    this.setState({ animation, scrollingToPosition });
  }

  render() {
    const {
      gutterConfig: {
        left: {
          width: leftGutterWidth = constants.LEFT_GUTTER_WIDTH
        } = {},
        right: {
          width: rightGutterWidth = constants.RIGHT_GUTTER_WIDTH
        } = {}
      } = {},
      horizontalScrollConfig,
      horizontalScrollConfig: {
        contentWidth,
        scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
      } = {},
      verticalScrollConfig: {
        rowHeight,
        scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
      },
      rows
    } = this.props;
    const {
      displayBuffer,
      horizontalTransform,
      offsetBuffer,
      topIndex,
      verticalTransform
    } = this.state;

    const withHorizontalScrolling = !!horizontalScrollConfig;
    const offset = verticalTransform % (rowHeight * offsetBuffer);
    const scrollbarHeightStyle = {
      height: `${rowHeight * rows.length}px`
    };
    const translateStyle = {
      transform: `translate3d(-0px, -${offset}px, 0px)`,
      height: `${rowHeight}px`
    };

    const showRows = _(rows)
      .slice(Math.min(topIndex, rows.length), topIndex + displayBuffer)
      .map(this._getRenderableRow(translateStyle)).value();

    const verticalScrollbarContainerWidth = {
      width: `${scrollbarWidth}px`
    };
    const horizontalScrollbarContainerHeight = {
      height: `${scrollbarHeight}px`
    };

    const scrollbarWidthStyle = { height: '1px', width: `${contentWidth + leftGutterWidth + rightGutterWidth}px` };
    const horizontalScrollbar = withHorizontalScrolling ? (
      <div
        className='scrollable__horizontal-scrollbar'
        onScroll={this._onHorizontalScroll}
        ref='horizontalScrollbar'
        style={horizontalScrollbarContainerHeight}
      >
        <div style={scrollbarWidthStyle} />
      </div>
    ) : undefined;

    return (
      <div className='scrollable' ref='scrollable'>
        <div className='scrollable__content-wrapper'>
          <div className='scrollable__contents' onWheel={this._onMouseWheel}>
            {showRows}
          </div>
          <div
            className='scrollable__vertical-scrollbar'
            onScroll={this._onVerticalScroll}
            ref='verticalScrollbar'
            style={verticalScrollbarContainerWidth}
          >
            <div style={scrollbarHeightStyle} />
          </div>
        </div>
        {horizontalScrollbar}
      </div>
    );
  }
}

Scrollable.propTypes = {
  gutterConfig: types.shape({
    left: types.shape({
      width: types.number
    }),
    right: types.shape({
      width: types.number
    })
  }),
  horizontalScrollConfig: types.shape({
    contentWidth: types.number.isRequired,
    scrollbarHeight: types.number
  }),
  rows: types.array.isRequired,
  scrollTo: types.shape({
    x: types.number,
    y: types.number
  }),
  verticalScrollConfig: types.shape({
    rowHeight: types.number.isRequired,
    scrollbarWidth: types.number
  }).isRequired
};

Scrollable.HorizontalWrapper = HorizontalWrapper;

module.exports = Scrollable;
