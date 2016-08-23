const { AnimationTimer } = require('animation-timer');
const classnames = require('classnames');
const constants = require('./constants');
const { Easer } = require('functional-easing');
const { Point } = require('./models');
const React = require('react');
const Row = require('./Row');
const utils = require('./utils');
const _ = require('lodash');

const { PropTypes: types } = React;
const easer = new Easer()
  .using('out-cubic');

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

    const offset = 6;
    const {
      contentHeight,
      headers,
      partitions, rows
    } = utils.buildRowConfig(this.props.list, offset, props.withLockingHeaders);

    this.state = {
      animation: null,
      buffers: {
        display: 60,
        offset
      },
      contentHeight,
      headers,
      horizontalTransform: 0,
      partitions,
      resize: {
        baseWidth: 0,
        currentPosition: 0,
        performing: false,
        side: '',
        startingPosition: 0
      },
      rows,
      scrollingToPosition: new Point(0, 0),
      shouldRender: {
        horizontalScrollbar: false,
        verticalScrollbar: false
      },
      topPartitionIndex: 0,
      verticalTransform: 0,
      window: {
        height: 0,
        width: 0
      }
    };
  }

  componentDidMount() {
    this._updateDimensions(this.props);
  }

  componentWillReceiveProps({ list: nextList, scrollTo: nextScrollTo = {}, withLockingHeaders }) {
    const {
      props: {
        list: prevList,
        scrollTo: prevScrollTo = {}
      },
      state: { buffers }
    } = this;

    if (!_.isEqual(prevScrollTo, nextScrollTo)) {
      this._scrollTo(nextScrollTo);
    }

    if (prevList !== nextList || !_.isEqual(prevList, nextList)) {
      const {
        contentHeight,
        headers,
        partitions,
        rows
      } = utils.buildRowConfig(nextList, buffers.offset, withLockingHeaders);
      this.setState({ contentHeight, headers, partitions, rows });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState);
  }

  componentDidUpdate(prevProps) {
    this._updateDimensions(prevProps);
  }

  _applyScrollChange({ deltaX, deltaY }) {
    const {
      props: {
        horizontalScrollConfig
      },
      state: { contentHeight, partitions, shouldRender },
      _horizontalScrollbar,
      _verticalScrollbar
    } = this;
    const withHorizontalScrolling = !!horizontalScrollConfig && shouldRender.horizontalScrollbar;

    const scrollChanges = {};

    // vertical
    if (shouldRender.verticalScrollbar) {
      const maxHeight = utils.getMaxHeight(contentHeight, _verticalScrollbar.offsetHeight);
      const verticalTransform = this.state.verticalTransform + deltaY;
      _.assign(scrollChanges, utils.getScrollValues(verticalTransform, maxHeight, partitions));
    }

    // horizontal scrolling
    if (withHorizontalScrolling) {
      scrollChanges.horizontalTransform = _.clamp(
        this.state.horizontalTransform + deltaX,
        0,
        _horizontalScrollbar.scrollWidth - _horizontalScrollbar.offsetWidth
      );
    }

    this.setState(scrollChanges, () => {
      if (shouldRender.verticalScrollbar) {
        _verticalScrollbar.scrollTop = scrollChanges.verticalTransform;
      }
      if (withHorizontalScrolling) {
        _horizontalScrollbar.scrollLeft = scrollChanges.horizontalTransform;
      }
    });
  }

  _getContentWidth() {
    const {
      props: {
        guttersConfig: {
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
        } = {}
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
      .sub(new Point(horizontalTransform, verticalTransform));
    const transition = new Point(0, 0);

    return _.throttle(easer(elapsedTime => {
      if (!_.isEqual(scrollTo, this.state.scrollingToPosition)) {
        return;
      }

      const deltaScrolled = new Point(delta.x, delta.y)
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
    const { scrollLeft } = this._horizontalScrollbar;
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
    } = this.props.guttersConfig;
    if (performing) {
      onGutterResize(utils.getResizeWidth(side, minWidth, baseWidth, startingPosition, clientX));
    }
  }

  _onVerticalScroll() {
    const {
      state: { contentHeight, partitions },
      _verticalScrollbar: { offsetHeight, scrollTop }
    } = this;

    const maxHeight = utils.getMaxHeight(contentHeight, offsetHeight);

    this.setState(utils.getScrollValues(scrollTop, maxHeight, partitions));
  }

  _renderContents() {
    const {
      props: {
        guttersConfig,
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {},
        withLockingHeaders
      },
      state: {
        buffers,
        headers,
        horizontalTransform,
        partitions,
        rows,
        shouldRender,
        topPartitionIndex,
        verticalTransform
      }
    } = this;

    const contentsStyle = shouldRender.verticalScrollbar ? {
      width: `calc(100% - ${scrollbarWidth}px)`
    } : undefined;

    const weightedPartitionIndex = topPartitionIndex * buffers.offset;
    const startingRowIndex = Math.min(weightedPartitionIndex, rows.length);
    const endingRowIndex = weightedPartitionIndex + buffers.display;

    const rowsWeWillRender = _.slice(rows, startingRowIndex, endingRowIndex);
    const partitionedRows = _.chunk(rowsWeWillRender, buffers.offset);
    const renderedPartitions = _.map(partitionedRows, (row, outerIndex) => {
      const partitionIndex = outerIndex + topPartitionIndex;
      const basePartitionOffset = partitions[partitionIndex];
      const partitionStyle = {
        transform: `translate3d(-0px, ${basePartitionOffset - verticalTransform}px, 0px)`
      };

      return (
        <div className='scrollable__partition' key={partitionIndex} style={partitionStyle}>
          {_.map(row, ({ contentComponent, gutters, height }, innerIndex) => (
            <Row
              contentComponent={contentComponent}
              gutters={gutters}
              guttersConfig={guttersConfig}
              horizontalTransform={horizontalTransform}
              index={innerIndex}
              key={innerIndex}
              onStartResize={this._startResize}
              rowHeight={height}
            />
          ))}
        </div>
      );
    });

    let header;
    if (headers) {
      const { lockPosition: maxLockPosition } = headers[headers.length - 1];
      const findNextHeaderIndex = _.findIndex(headers, ({ lockPosition }) => lockPosition > verticalTransform);
      const nextHeaderIndex = findNextHeaderIndex === -1 ? headers.length : findNextHeaderIndex;

      if (withLockingHeaders) {
        header = (
          <div className='scrollable__header' key='header'>
            {_.times(nextHeaderIndex, headerIndex => {
              const { index: headerRowIndex } = headers[headerIndex];
              const { contentComponent, height } = rows[headerRowIndex];

              return (
                <Row
                  contentComponent={contentComponent}
                  guttersConfig={guttersConfig}
                  horizontalTransform={0}
                  index={headerRowIndex}
                  key={headerIndex}
                  rowHeight={height}
                />
              );
            })}
          </div>
        );
      } else {
        const headerIndex = nextHeaderIndex - 1;
        const { lockPosition } = headers[nextHeaderIndex] || headers[headerIndex];

        const { index: headerRowIndex } = headers[headerIndex];
        const { contentComponent, height } = rows[headerRowIndex];

        const headerStyle = {
          height: `${height}px`,
          transform: 'translate3d(0px, 0px, 0px)'
        };
        if (verticalTransform < maxLockPosition && verticalTransform >= lockPosition - height) {
          const headerOffset = height - lockPosition - verticalTransform;
          headerStyle.transform = `translate3d(0px, -${headerOffset}px, 0px)`;
        }

        header = (
          <div className='scrollable__header' key={`header-${headerRowIndex}`} style={headerStyle}>
            <Row
              contentComponent={contentComponent}
              guttersConfig={guttersConfig}
              horizontalTransform={0}
              index={headerRowIndex}
              rowHeight={height}
            />
          </div>
        );
      }
    }

    return (
      <div className='scrollable__contents' key='contents' style={contentsStyle}>
        {header}
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
        } = {}
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

    const getHorizontalScrollbarRef = r => { this._horizontalScrollbar = r; };

    return (
      <div className='scrollable__bottom-wrapper' style={sharedStyle}>
        <div
          className='scrollable__horizontal-scrollbar'
          key='scrollable'
          onScroll={this._onHorizontalScroll}
          ref={getHorizontalScrollbarRef}
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
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {}
      },
      state: { contentHeight, shouldRender }
    } = this;

    if (!shouldRender.verticalScrollbar) {
      return null;
    }

    const fillerStyle = {
      height: `${contentHeight}px`,
      width: '1px'
    };
    const verticalScrollbarStyle = {
      minWidth: `${scrollbarWidth}px`
    };

    const getVerticalScrollbarRef = r => { this._verticalScrollbar = r; };

    return (
      <div
        className='scrollable__vertical-scrollbar'
        onScroll={this._onVerticalScroll}
        ref={getVerticalScrollbarRef}
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

    const scrollingToPosition = new Point(x, y);

    animation = new AnimationTimer()
    .on('tick', this._getThrottledAnimationFrameFn(scrollingToPosition))
    .play();

    this.setState({ animation, scrollingToPosition });
  }

  _startResize(side) {
    return ({ clientX }) => {
      const {
        guttersConfig: {
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
    };
  }

  _stopResize() {
    this.setState({
      resize: {
        baseWidth: 0,
        performing: false,
        side: '',
        startingPosition: 0
      }
    });
  }

  _updateDimensions(prevProps, prevState) {
    const {
      props: {
        horizontalScrollConfig,
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        verticalScrollConfig,
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {}
      },
      state: {
        contentHeight,
        rows,
        window: { height, width }
      },
      _scrollable: { clientHeight, clientWidth }
    } = this;

    const gutter = ['left', 'right'];
    const gutterIsEqual = side => {
      const accessor = `guttersConfig.${side}`;
      return _.isEqual(_.get(prevProps, accessor), _.get(this.props, accessor));
    };

    if (
      clientHeight === height &&
      clientWidth === width &&
      _.isEqual(prevProps.horizontalScrollConfig, horizontalScrollConfig) &&
      _.isEqual(prevProps.verticalScrollConfig, verticalScrollConfig) &&
      _.get(prevState, 'rows.length') === rows.length &&
      _.every(gutter, gutterIsEqual)
    ) {
      return;
    }

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

    const scrollableClassName = classnames('scrollable', {
      'scrollable--performing-resize': performing
    });
    const topWrapperStyle = !!horizontalScrollConfig && shouldRender.horizontalScrollbar ? {
      height: `calc(100% - ${scrollbarHeight}px)`
    } : undefined;

    const getScrollableRef = r => { this._scrollable = r; };

    return (
      <div className={scrollableClassName} ref={getScrollableRef}>
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
  guttersConfig: utils.types.guttersConfig,
  horizontalScrollConfig: utils.types.horizontalScrollConfig,
  list: types.oneOfType([utils.types.list, utils.types.listOfLists]).isRequired,
  scrollTo: utils.types.scrollTo,
  verticalScrollConfig: utils.types.verticalScrollConfig,
  withLockingHeaders: types.bool
};

module.exports = Scrollable;
