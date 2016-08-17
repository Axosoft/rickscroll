const React = require('react');
require('../../../static/css/scrollable');
const classnames = require('classnames');
const { AnimationTimer } = require('animation-timer');
const { Easer } = require('functional-easing');
const _ = require('lodash');
const { PropTypes: types } = React;
const easer = new Easer()
  .using('out-cubic');

const constants = require('../constants');
const HorizontalWrapper = require('./HorizontalWrapper');
const Row = require('./Row');
const utils = require('../utils');

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this._applyScrollChange = this._applyScrollChange.bind(this);
    this._getThrottledAnimationFrameFn = this._getThrottledAnimationFrameFn.bind(this);
    this._onHorizontalScroll = this._onHorizontalScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onThrottledMouseWheel = _.throttle(this._applyScrollChange, constants.ANIMATION_FPS_30, { trailing: true });
    this._onVerticalScroll = this._onVerticalScroll.bind(this);
    this._scrollTo = this._scrollTo.bind(this);
    this._startResize = this._startResize.bind(this);
    this._stopResize = this._stopResize.bind(this);
    this.state = {
      animation: null,
      displayBuffer: 54,
      horizontalTransform: 0,
      offsetBuffer: 6,
      resize: {
        baseWidth: 0,
        currentPosition: 0,
        performing: false,
        side: '',
        startingPosition: 0
      },
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

  _applyScrollChange({ deltaX, deltaY }) {
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
      this._applyScrollChange({
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
    this._onThrottledMouseWheel({ deltaX, deltaY });
  }

  _onResize({ clientX }) {
    const { baseWidth, performing, side, startingPosition } = this.state.resize;
    const {
      [side]: {
        minWidth,
        onGutterResize = (() => {})
      } = {}
    } = this.props.gutterConfig;
    if (performing) {
      onGutterResize(utils.getResizeWidth(side, minWidth, baseWidth, startingPosition, clientX));
    }
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

  _startResize(side) {
    return ({ clientX }) => {
      const {
        gutterConfig: {
          [side]: {
            width: baseWidth
          }
        } = {}
      } = this.props;
      this.setState({
        resize: {
          baseWidth,
          performing: true,
          side,
          startingPosition: clientX
        }
      });
    }
  }

  _stopResize({ clientX }) {
    const { baseWidth, side, startingPosition } = this.state.resize;
    const {
      [side]: {
        minWidth,
        onGutterResize = () => {}
      } = {}
    } = this.props.gutterConfig;
    this.setState({
      resize: {
        baseWidth: 0,
        performing: false,
        side: '',
        startingPosition: 0
      }
    });
  }

  render() {
    const {
      gutterConfig,
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
      resize: { performing },
      topIndex,
      verticalTransform
    } = this.state;

    const withHorizontalScrolling = !!horizontalScrollConfig;
    const offset = verticalTransform % (rowHeight * offsetBuffer);
    const scrollbarHeightStyle = {
      height: `${rowHeight * rows.length}px`
    };
    const translateStyle = {
      transform: `translate3d(-0px, -${offset}px, 0px)`
    };

    const renderableRows = _(rows)
      .slice(Math.min(topIndex, rows.length), topIndex + displayBuffer)
      .map(({ contentComponent, gutters }, index) => (
        <Row
          contentComponent={contentComponent}
          gutterConfig={gutterConfig}
          gutters={gutters}
          horizontalTransform={horizontalTransform}
          index={index}
          key={index}
          onStartResize={this._startResize}
          rowHeight={rowHeight}
        />
      )).value();
    const showRows = _.chunk(renderableRows, offsetBuffer)
      .map((rows, index) => (<div key={index} style={translateStyle}>{rows}</div>));

    const verticalScrollbarContainerWidth = {
      minWidth: `${scrollbarWidth}px`
    };
    const horizontalScrollbarContainerHeight = {
      minHeight: `${scrollbarHeight}px`
    };
    const contentWidthStyle = {
      width: `calc(100% - ${scrollbarWidth}px)`
    };

    const scrollbarWidthStyle = { height: '1px', width: `${contentWidth + leftGutterWidth + rightGutterWidth}px` };
    const horizontalScrollbar = withHorizontalScrolling ? (
      <div
        className='scrollable__horizontal-scrollbar'
        key='scrollable'
        onScroll={this._onHorizontalScroll}
        ref='horizontalScrollbar'
        style={horizontalScrollbarContainerHeight}
      >
        <div style={scrollbarWidthStyle} />
      </div>
    ) : undefined;

    return (
      <div className={classnames('scrollable', { ['scrollable--performing']: performing })} ref='scrollable'>
        <div
          className='scrollable__content-wrapper'
          key='content-wrapper'
          onMouseMove={this._onResize}
          onMouseUp={this._stopResize}
          onWheel={this._onMouseWheel}
        >
          <div className='scrollable__contents' key='contents' style={contentWidthStyle}>
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
      handleWidth: types.number,
      width: types.number
    }),
    onGutterResize: types.func,
    right: types.shape({
      handleWidth: types.number,
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
