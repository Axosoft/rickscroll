const React = require('react');
const classnames = require('classnames');
const { AnimationTimer } = require('animation-timer');
const { Easer } = require('functional-easing');
const _ = require('lodash');
const { PropTypes: types } = React;
const easer = new Easer()
  .using('out-cubic');

const constants = require('./constants');
const Row = require('./Row');
const utils = require('./utils');

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this._applyScrollChange = this._applyScrollChange.bind(this);
    this._getContentWidth = this._getContentWidth.bind(this);
    this._getThrottledAnimationFrameFn = this._getThrottledAnimationFrameFn.bind(this);
    this._onHorizontalScroll = this._onHorizontalScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onThrottledMouseWheel = _.throttle(this._applyScrollChange, constants.ANIMATION_FPS_120, { trailing: true });
    this._onVerticalScroll = this._onVerticalScroll.bind(this);
    this._renderContents = this._renderContents.bind(this);
    this._renderCorner = this._renderCorner.bind(this);
    this._renderHorizontalScrollbar = this._renderHorizontalScrollbar.bind(this);
    this._renderVerticalScrollbar = this._renderVerticalScrollbar.bind(this);
    this._scrollTo = this._scrollTo.bind(this);
    this._startResize = this._startResize.bind(this);
    this._stopResize = this._stopResize.bind(this);
    this._updateDimensions = this._updateDimensions.bind(this);
    this.state = {
      animation: null,
      buffers: {
        display: 60,
        offset: 6
      },
      horizontalTransform: 0,
      resize: {
        baseWidth: 0,
        currentPosition: 0,
        performing: false,
        side: '',
        startingPosition: 0
      },
      scrollingToPosition: new utils.Point(0, 0),
      shouldRender: {
        horizontalScrollbar: false,
        verticalScrollbar: false
      },
      topIndex: 0,
      verticalTransform: 0,
      window: {
        height: 0,
        width: 0
      }
    };
  }

  componentWillReceiveProps({ scrollTo: nextScrollTo = {} }) {
    const { scrollTo: prevScrollTo = {} } = this.props;
    if (!_.isEqual(prevScrollTo, nextScrollTo)) {
      this._scrollTo(nextScrollTo);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState);
  }

  componentDidMount() {
    this._updateDimensions(this.props);
  }

  componentDidUpdate(prevProps) {
    this._updateDimensions(prevProps);
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
      state: { buffers, shouldRender }
    } = this;
    const withHorizontalScrolling = !!horizontalScrollConfig && shouldRender.horizontalScrollbar;

    const scrollChanges = {};

    // vertical
    if (shouldRender.verticalScrollbar) {
      const maxHeight = utils.getMaxHeight(rowHeight, rows.length, verticalScrollbar.offsetHeight);
      const verticalTransform = this.state.verticalTransform + deltaY;
      _.assign(scrollChanges, utils.getScrollValues(verticalTransform, rowHeight, maxHeight, buffers.offset));
    }

    // horizontal scrolling
    if (withHorizontalScrolling) {
      scrollChanges.horizontalTransform = _.clamp(
        this.state.horizontalTransform + deltaX,
        0,
        horizontalScrollbar.scrollWidth - horizontalScrollbar.offsetWidth
      );
    }

    this.setState(scrollChanges, () => {
      if (shouldRender.verticalScrollbar) {
        verticalScrollbar.scrollTop = scrollChanges.verticalTransform;
      }
      if (withHorizontalScrolling) {
        horizontalScrollbar.scrollLeft = scrollChanges.horizontalTransform;
      }
    });
  }

  _getContentWidth() {
    const {
      props: {
        gutterConfig: {
          left: {
            handleWidth: leftHandleWidth = constants.LEFT_HANDLE_WIDTH,
            width: leftGutterWidth = constants.LEFT_GUTTER_WIDTH
          } = {},
          right: {
            handleWidth: rightHandleWidth = constants.RIGHT_HANDLE_WIDTH,
            width: rightGutterWidth = constants.RIGHT_GUTTER_WIDTH
          } = {}
        } = {},
        horizontalScrollConfig: {
          contentWidth = 0
        } = {},
      }
    } = this;
    return _.sum([
      contentWidth,
      leftGutterWidth,
      leftHandleWidth,
      rightHandleWidth,
      rightGutterWidth
    ]);
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
    }), constants.ANIMATION_FPS_120, { leading: true });
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
      state: { buffers }
    } = this;

    const maxHeight = utils.getMaxHeight(rowHeight, rows.length, offsetHeight);

    this.setState(utils.getScrollValues(scrollTop, rowHeight, maxHeight, buffers.offset));
  }

  _renderContents() {
    const {
      props: {
        gutterConfig,
        rows,
        verticalScrollConfig: {
          rowHeight,
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        }
      },
      state: {
        buffers,
        horizontalTransform,
        shouldRender,
        topIndex,
        verticalTransform
      }
    } = this;

    const contentsStyle = shouldRender.verticalScrollbar ? {
      width: `calc(100% - ${scrollbarWidth}px)`
    } : undefined;
    const offset = verticalTransform % (rowHeight * buffers.offset);
    const partitionStyle = {
      transform: `translate3d(-0px, -${offset}px, 0px)`
    };

    const rowsWeWillRender = _.slice(rows, Math.min(topIndex, rows.length), topIndex + buffers.display);
    const partitionedRows = _.chunk(rowsWeWillRender, buffers.offset);
    const renderedPartitions = _.map(partitionedRows, (row, outerIndex) => (
      <div className='scrollable__partition' key={outerIndex + (topIndex / buffers.offset)} style={partitionStyle}>
        {_.map(row, ({ contentComponent, gutters }, innerIndex) => (
          <Row
            contentComponent={contentComponent}
            gutterConfig={gutterConfig}
            gutters={gutters}
            horizontalTransform={horizontalTransform}
            index={innerIndex}
            key={innerIndex}
            onStartResize={this._startResize}
            rowHeight={rowHeight}
          />
        ))}
      </div>
    ));

    return (
      <div className='scrollable__contents' key='contents' style={contentsStyle}>
        {renderedPartitions}
      </div>
    );
  }

  _renderCorner() {
    const {
      props: {
        horizontalScrollConfig,
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        }
      },
      state: { shouldRender }
    } = this;

    const shouldRenderCorner = !!horizontalScrollConfig && shouldRender.verticalScrollbar;

    if (!shouldRenderCorner) {
      return null;
    }

    const cornerStyle = {
      height: `${scrollbarHeight}px`,
      width: `${scrollbarWidth}px`
    };

    return <div className='scrollable__corner' style={cornerStyle} />;
  }

  _renderHorizontalScrollbar() {
    const {
      props: {
        horizontalScrollConfig,
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {}
      },
      state: { shouldRender }
    } = this;

    const withHorizontalScrolling = !!horizontalScrollConfig && shouldRender.horizontalScrollbar;

    if (!withHorizontalScrolling) {
      return null;
    }

    const sharedStyle = {
      height: `${scrollbarHeight}px`
    };
    const contentWidth = this._getContentWidth();
    const fillerStyle = { height: '1px', width: `${contentWidth}px` };

    return (
      <div className='scrollable__bottom-wrapper' style={sharedStyle}>
        <div
          className='scrollable__horizontal-scrollbar'
          key='scrollable'
          onScroll={this._onHorizontalScroll}
          ref='horizontalScrollbar'
          style={sharedStyle}
        >
          <div style={fillerStyle} />
        </div>
        {this._renderCorner()}
      </div>
    );
  }

  _renderVerticalScrollbar() {
    const {
      props: {
        rows,
        verticalScrollConfig: {
          rowHeight,
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        }
      },
      state: { shouldRender }
    } = this;

    if (!shouldRender.verticalScrollbar) {
      return null;
    }

    const fillerStyle = {
      height: `${rowHeight * rows.length}px`,
      width: '1px'
    };
    const verticalScrollbarStyle = {
      minWidth: `${scrollbarWidth}px`
    };

    return (
      <div
        className='scrollable__vertical-scrollbar'
        onScroll={this._onVerticalScroll}
        ref='verticalScrollbar'
        style={verticalScrollbarStyle}
      >
        <div style={fillerStyle} />
      </div>
    );
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

  _updateDimensions(prevProps) {
    const {
      props: {
        horizontalScrollConfig,
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        verticalScrollConfig,
        verticalScrollConfig: {
          rowHeight,
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        },
        rows
      },
      refs: {
        scrollable: { clientHeight, clientWidth }
      },
      state: {
        window: { height, width }
      }
    } = this;

    const gutter = ['left', 'right'];
    const gutterIsEqual = side => {
      const accessor = `gutterConfig.${side}`;
      return _.isEqual(_.get(prevProps, accessor), _.get(this.props, accessor));
    };

    if (
      clientHeight === height &&
      clientWidth === width &&
      _.isEqual(prevProps.horizontalScrollConfig, horizontalScrollConfig) &&
      _.isEqual(prevProps.verticalScrollConfig, verticalScrollConfig) &&
      prevProps.rows.length === rows.length &&
      _.every(gutter, gutterIsEqual)
    ) {
      return;
    }

    const contentHeight = rows.length * rowHeight;
    const clientHeightTooSmall = clientHeight < contentHeight;
    const clientHeightTooSmallWithHorizontalScrollbar = clientHeight < (contentHeight + scrollbarHeight);

    const contentWidth = this._getContentWidth();
    const clientWidthTooSmall = clientWidth < contentWidth;
    const clientWidthTooSmallWithVerticalScrollbar = clientWidth < (contentWidth + scrollbarWidth);

    const shouldRenderVerticalScrollbar = clientHeightTooSmall || (
      clientWidthTooSmall && clientHeightTooSmallWithHorizontalScrollbar
    );
    const shouldRenderHorizontalScrollbar = clientWidthTooSmall || (
      clientHeightTooSmall && clientWidthTooSmallWithVerticalScrollbar
    );

    this.setState({
      shouldRender: {
        horizontalScrollbar: shouldRenderHorizontalScrollbar,
        verticalScrollbar: shouldRenderVerticalScrollbar
      },
      window: {
        height: clientHeight,
        width: clientWidth
      }
    });
  }

  render() {
    const {
      horizontalScrollConfig,
      horizontalScrollConfig: {
        scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
      }
    } = this.props;
    const {
      resize: { performing },
      shouldRender
    } = this.state;

    const topWrapperStyle = !!horizontalScrollConfig && shouldRender.horizontalScrollbar ? {
      height: `calc(100% - ${scrollbarHeight}px)`
    } : undefined;

    return (
      <div className={classnames('scrollable', { ['scrollable--performing-resize']: performing })} ref='scrollable'>
        <div
          className='scrollable__top-wrapper'
          key='top-wrapper'
          onMouseMove={this._onResize}
          onMouseUp={this._stopResize}
          onWheel={this._onMouseWheel}
          style={topWrapperStyle}
        >
          {this._renderContents()}
          {this._renderVerticalScrollbar()}
        </div>
        {this._renderHorizontalScrollbar()}
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

module.exports = Scrollable;
