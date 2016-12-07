import { AnimationTimer } from 'animation-timer';
import classnames from 'classnames';
import { Easer } from 'functional-easing';
import React, { PropTypes as types } from 'react';
import _ from 'lodash';

import * as constants from './constants';
import * as customTypes from './propTypes';
import { Point } from './models';
import Row from './Row';
import {
  buildRowConfig,
  getMaxHeight,
  getResizeWidth,
  getVerticalScrollValues,
  returnWidthIfComponentExists,
  triggerAnimationFrameCreator
} from './utils';

const easer = new Easer()
  .using('out-cubic');

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    [
      '_applyScrollChange',
      '_getContentWidth',
      '_getDimensions',
      '_getThrottledAnimationFrameFn',
      '_getWeightedWidth',
      '_onHorizontalScroll',
      '_onResize',
      '_onMouseWheel',
      '_onVerticalScroll',
      '_renderContents',
      '_renderCorner',
      '_renderHorizontalScrollbar',
      '_renderHeader',
      '_renderVerticalScrollbar',
      '_shouldRenderScrollbars',
      '_startResize',
      '_stopResize',
      'scrollToHeader',
      'toggleSection'
    ].forEach(method => { this[method] = this[method].bind(this); });
    this._onThrottledMouseWheel = triggerAnimationFrameCreator(this._applyScrollChange);

    const {
      headerType = constants.headerType.DEFAULT,
      height,
      list,
      lists,
      width
    } = props;
    const stackingHeaders = headerType === constants.headerType.STACKING;
    const listContainer = list || lists;
    const {
      avgRowHeight,
      collapsedSections,
      contentHeight,
      headers,
      partitions,
      rows
    } = buildRowConfig(listContainer, stackingHeaders);
    const {
      displayBuffer,
      shouldRender
    } = this._getDimensions(avgRowHeight, contentHeight, height, width);

    this.state = {
      animation: null,
      avgRowHeight,
      collapsedSections,
      contentHeight,
      displayBuffer,
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
      shouldRender,
      topPartitionIndex: 0,
      verticalTransform: 0
    };
  }

  componentWillReceiveProps({
    guttersConfig,
    headerType = constants.headerType.DEFAULT,
    height,
    horizontalScrollConfig,
    list: nextList,
    lists: nextLists,
    verticalScrollConfig,
    width
  }) {
    const {
      props: {
        guttersConfig: prevGuttersConfig,
        height: prevHeight,
        horizontalScrollConfig: prevHorizontalScrollConfig,
        list: prevList,
        lists: prevLists,
        verticalScrollConfig: prevVerticalScrollConfig,
        width: prevWidth
      },
      state: {
        avgRowHeight: prevAvgRowHeight,
        collapsedSections: oldCollapsedSections,
        contentHeight: prevContentHeight
      }
    } = this;

    const stackingHeaders = headerType === constants.headerType.STACKING;
    const prevListContainer = prevList || prevLists;
    const nextListContainer = nextList || nextLists;

    if (prevListContainer !== nextListContainer || !_.isEqual(prevListContainer, nextListContainer)) {
      const {
        avgRowHeight,
        collapsedSections,
        contentHeight,
        headers,
        partitions,
        rows
      } = buildRowConfig(nextListContainer, stackingHeaders, oldCollapsedSections);
      this.setState({
        avgRowHeight,
        collapsedSections,
        contentHeight,
        headers,
        partitions,
        rows,
        ...this._getDimensions(avgRowHeight, contentHeight, height, width)
      });
    } else if (
      height !== prevHeight
      || width !== prevWidth
      || !_.isEqual(prevGuttersConfig, guttersConfig)
      || !_.isEqual(prevHorizontalScrollConfig, horizontalScrollConfig)
      || !_.isEqual(prevVerticalScrollConfig, verticalScrollConfig)
    ) {
      this.setState(this._getDimensions(prevAvgRowHeight, prevContentHeight, height, width));
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) ||
      !_.isEqual(this.state, nextState);
  }

  // private

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
      const maxHeight = getMaxHeight(contentHeight, _verticalScrollbar.offsetHeight);
      const verticalTransform = this.state.verticalTransform + deltaY;
      _.assign(scrollChanges, getVerticalScrollValues(verticalTransform, maxHeight, partitions));
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
            position: leftGutterPosition = constants.LEFT_GUTTER_WIDTH
          } = {},
          right: {
            handleWidth: rightHandleWidth = constants.RIGHT_HANDLE_WIDTH,
            position: rightGutterPosition = constants.RIGHT_GUTTER_WIDTH
          } = {}
        } = {},
        horizontalScrollConfig: {
          contentWidth = 0
        } = {},
        width
      }
    } = this;
    return _.sum([
      contentWidth,
      leftGutterPosition,
      leftHandleWidth,
      rightHandleWidth,
      width - rightGutterPosition
    ]);
  }

  _getDimensions(avgRowHeight, contentHeight, height, width) {
    const {
      scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
    } = this.props.horizontalScrollConfig || {};
    const shouldRender = this._shouldRenderScrollbars(contentHeight, height, width);
    const contentsDivHeight = height - (shouldRender.horizontalScrollbar ? scrollbarHeight : 0);
    const numRowsInContents = _.ceil(contentsDivHeight / avgRowHeight);

    let displayBuffer = numRowsInContents + (2 * constants.OFFSET_BUFFER);
    displayBuffer += constants.OFFSET_BUFFER - (displayBuffer % constants.OFFSET_BUFFER);

    const newState = {
      displayBuffer,
      shouldRender
    };

    if (!shouldRender.verticalScrollbar) {
      newState.verticalTransform = 0;
      newState.topPartitionIndex = 0;
      if (this._verticalScrollbar) {
        this._verticalScrollbar.scrollTop = 0;
      }
    }

    if (!shouldRender.horizontalScrollbar) {
      newState.horizontalTransform = 0;
      if (this._horizontalScrollbar) {
        this._horizontalScrollbar.scrollLeft = 0;
      }
    }

    return newState;
  }

  _getThrottledAnimationFrameFn(scrollTo) {
    const { horizontalTransform, verticalTransform } = this.state;
    const delta = _.clone(scrollTo)
      .sub(new Point(horizontalTransform, verticalTransform));

    return _.throttle(easer(easedElapsedTime => {
      const {
        props: {
          horizontalScrollConfig
        },
        state: {
          contentHeight,
          partitions,
          scrollingToPosition: latestScrollingToPosition,
          shouldRender
        },
        _horizontalScrollbar,
        _verticalScrollbar
      } = this;
      if (!_.isEqual(scrollTo, latestScrollingToPosition)) {
        return;
      }

      const withHorizontalScrolling = !!horizontalScrollConfig && shouldRender.horizontalScrollbar;
      const elapsedTime = easedElapsedTime > 0.999 ? 1 : easedElapsedTime;
      const deltaScrolled = new Point(delta.x, delta.y)
        .scale(elapsedTime);
      const newTransform = new Point(horizontalTransform, verticalTransform)
        .add(deltaScrolled);

      const scrollChanges = {};

      // vertical
      if (shouldRender.verticalScrollbar) {
        const maxHeight = getMaxHeight(contentHeight, _verticalScrollbar.offsetHeight);
        _.assign(scrollChanges, getVerticalScrollValues(newTransform.y, maxHeight, partitions));
      }

      // horizontal scrolling
      if (withHorizontalScrolling) {
        scrollChanges.horizontalTransform = _.clamp(
          newTransform.x,
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
    }), constants.ANIMATION_FPS_120, { leading: true });
  }

  _getWeightedWidth() {
    const {
      props: {
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        width
      },
      state: { shouldRender }
    } = this;

    return width - (shouldRender.horizontalScrollbar ? scrollbarHeight : 0);
  }

  _onHorizontalScroll() {
    const {
      horizontalScrollConfig: {
        onScroll = () => {}
      } = {}
    } = this.props;

    const { scrollLeft = 0 } = this._horizontalScrollbar || {};
    this.setState({ horizontalTransform: scrollLeft });
    onScroll(scrollLeft);
  }

  _onMouseWheel({ deltaX, deltaY }) {
    this._onThrottledMouseWheel({ deltaX, deltaY });
  }

  /**
   * Performs a calculation to determine the size difference between each movement of the mouse cursor. Only occurs when
   * a resize is active. Will call the onResize handler for the gutter that is being resized with the new width of the
   * gutter.
   * @param  {number} clientX the position of the mouse cursor horizontally
   */
  _onResize({ clientX }) {
    const { baseWidth, performing, side, startingPosition } = this.state.resize;
    const {
      guttersConfig: {
        [side]: {
          onResize = (() => {})
        } = {}
      } = {}
    } = this.props;
    if (performing) {
      onResize(getResizeWidth(0, baseWidth, startingPosition, clientX));
    }
  }

  _onVerticalScroll() {
    const {
      props: {
        verticalScrollConfig: {
          onScroll = () => {}
        } = {}
      },
      state: { contentHeight, partitions },
      _verticalScrollbar,
      _verticalScrollbar: { offsetHeight, scrollTop } = {}
    } = this;

    if (!_verticalScrollbar) {
      return;
    }

    const maxHeight = getMaxHeight(contentHeight, offsetHeight);

    const nextScrollState = getVerticalScrollValues(scrollTop, maxHeight, partitions);

    this.setState(nextScrollState);
    onScroll(nextScrollState.verticalTransform);
  }

  _renderContents() {
    const {
      props: {
        guttersConfig,
        horizontalScrollConfig: {
          passthroughOffsets = false
        } = {},
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {}
      },
      state: {
        displayBuffer,
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

    const weightedPartitionIndex = topPartitionIndex * constants.OFFSET_BUFFER;
    const startingRowIndex = Math.min(weightedPartitionIndex, rows.length);
    const endingRowIndex = weightedPartitionIndex + displayBuffer;
    const weightedWidth = this._getWeightedWidth();

    const rowsWeWillRender = _.slice(rows, startingRowIndex, endingRowIndex);
    const partitionedRows = _.chunk(rowsWeWillRender, constants.OFFSET_BUFFER);
    const renderedPartitions = _.map(partitionedRows, (row, outerIndex) => {
      const partitionIndex = outerIndex + topPartitionIndex;
      const basePartitionOffset = partitions[partitionIndex];
      const partitionStyle = {
        transform: `translate3d(-0px, ${basePartitionOffset - verticalTransform}px, 0px)`
      };

      return (
        <div className='rickscroll__partition' key={partitionIndex} style={partitionStyle}>
          {_.map(
            row,
            ({
              className,
              contentComponent,
              contentClassName,
              gutters,
              height,
              isHeader,
              key,
              props: rowProps
            }, innerIndex) => (
              <Row
                className={className}
                contentClassName={contentClassName}
                contentComponent={contentComponent}
                gutters={gutters}
                guttersConfig={guttersConfig}
                horizontalTransform={horizontalTransform}
                index={innerIndex}
                isHeader={isHeader}
                key={key || innerIndex}
                onStartResize={this._startResize}
                passthroughOffsets={passthroughOffsets}
                rowHeight={height}
                rowProps={rowProps}
                width={weightedWidth}
              />
            )
          )}
        </div>
      );
    });

    const { bottomHeaderGutter, header, topHeaderGutter } = this._renderHeader();

    // TODO remove partitions and shift the contents of the div
    return (
      <div className='rickscroll__contents' key='contents' style={contentsStyle}>
        {header}
        {topHeaderGutter}
        {renderedPartitions}
        {bottomHeaderGutter}
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

    return <div className='rickscroll__corner' style={cornerStyle} />;
  }

  _renderHeader() {
    const {
      props: {
        guttersConfig,
        headerType = constants.headerType.DEFAULT,
        height,
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {}
      },
      state: {
        headers,
        rows,
        shouldRender,
        verticalTransform
      }
    } = this;

    if (!headers || headers.length === 0) {
      return {};
    }

    const { lockPosition: maxLockPosition } = headers[headers.length - 1];
    const findNextHeaderIndex = _.findIndex(headers, ({ lockPosition }) => lockPosition > verticalTransform);
    const nextHeaderIndex = findNextHeaderIndex === -1 ? headers.length : findNextHeaderIndex;
    const weightedWidth = this._getWeightedWidth();

    if (headerType === constants.headerType.STACKING) {
      const topHeaderGutter = (
        <div className='rickscroll__header-gutter rickscroll__header-gutter--top' key='top-header-gutter'>
          {_.times(nextHeaderIndex, headerIndex => {
            const { index: headerRowIndex } = headers[headerIndex];
            const { className, contentComponent, height: rowHeight, key, props: rowProps } = rows[headerRowIndex];

            return (
              <Row
                className={className}
                contentComponent={contentComponent}
                guttersConfig={guttersConfig}
                horizontalTransform={0}
                index={headerRowIndex}
                key={key || headerIndex}
                rowHeight={rowHeight}
                rowProps={rowProps}
                width={weightedWidth}
              />
            );
          })}
        </div>
      );

      let bottomGutterStartIndex = nextHeaderIndex;
      /* We want to erase headers as they come into view in the contents view from the header gutter
       * We solve for the vertical transform that we need to remove a header from the bottom gutter:
       * height: height of the header we are transitioning
       * topHeight: height of all other gutters pinned to the top, not including baseHeight
       * realOffset: the verticalTransform that aligns the next header with the top of the rickscroll__contents
       * bottomHeight: the height of the bottom gutter of combined headers
       * adjustedBottomHeight: the total height of the headers in the bottom gutter with the baseHeight
       * adjustedTransform: the vertical transform that is adjusted to the scale of viewable contents
       * ------------------------------------------------------------------------------------------------------------
       * we should delete the top header from the bottom gutter if the adjusted transform is smaller than the
       * height of contents window
       */
      const contentsDivHeight = height - (shouldRender.horizontalScrollbar ? scrollbarHeight : 0);
      const { height: baseHeight } = headers[0];
      const {
        adjustHeaderOffset: topHeight,
        realOffset: removeFirstHeaderOffset
      } = headers[nextHeaderIndex] || headers[nextHeaderIndex - 1];
      const { adjustHeaderOffset: bottomHeight } = headers[headers.length - 1];
      const adjustedBottomHeight = (baseHeight + bottomHeight) - topHeight;
      const adjustedTransform = (removeFirstHeaderOffset - verticalTransform) + adjustedBottomHeight;
      if (bottomGutterStartIndex !== headers.length && adjustedTransform <= contentsDivHeight - 1) {
        bottomGutterStartIndex++;
        const skipHeadersUntil = _(headers)
          .slice(bottomGutterStartIndex)
          .findIndex(({ adjustHeaderOffset, realOffset }) => {
            const restHeight = bottomHeight - adjustHeaderOffset;
            return realOffset + topHeight >= ((contentsDivHeight + verticalTransform) - restHeight);
          });

        if (skipHeadersUntil >= 0) {
          bottomGutterStartIndex += skipHeadersUntil;
        } else {
          bottomGutterStartIndex = headers.length;
        }
      }

      const bottomHeaderGutter = (
        <div className='rickscroll__header-gutter rickscroll__header-gutter--bottom' key='bottom-header-gutter'>
          {_(headers).slice(bottomGutterStartIndex).map(({ index: headerRowIndex, lockPosition }, index) => {
            const headerIndex = bottomGutterStartIndex + index;
            const { className, contentComponent, height: rowHeight, key, props: rowProps } = rows[headerRowIndex];

            return (
              <Row
                className={className}
                contentComponent={contentComponent}
                guttersConfig={guttersConfig}
                horizontalTransform={0}
                index={headerRowIndex}
                key={key || headerIndex}
                rowHeight={rowHeight}
                rowProps={rowProps}
                width={weightedWidth}
              />
            );
          }).value()}
        </div>
      );

      return { bottomHeaderGutter, topHeaderGutter };
    } else if (headerType === constants.headerType.LOCKING) {
      const headerIndex = nextHeaderIndex - 1;
      const { lockPosition } = headers[nextHeaderIndex] || headers[headerIndex];

      const { index: headerRowIndex } = headers[headerIndex];
      const { className, contentComponent, height: rowHeight, key, props: rowProps } = rows[headerRowIndex];

      const headerStyle = {
        height: `${rowHeight}px`,
        transform: 'translate3d(0px, 0px, 0px)'
      };

      if (verticalTransform < maxLockPosition && verticalTransform >= lockPosition - rowHeight) {
        const overlap = (lockPosition - verticalTransform);
        const headerOffset = rowHeight - overlap;
        headerStyle.transform = `translate3d(0px, -${headerOffset}px, 0px)`;
      }


      const header = (
        <div className='rickscroll__header' key={`header-${headerRowIndex}`} style={headerStyle}>
          <Row
            className={className}
            contentComponent={contentComponent}
            guttersConfig={guttersConfig}
            horizontalTransform={0}
            index={headerRowIndex}
            key={key || headerRowIndex}
            rowHeight={rowHeight}
            rowProps={rowProps}
            width={weightedWidth}
          />
        </div>
      );

      return { header };
    }

    return {};
  }

  /**
   * Decides whether or not to render the horizontal scroll bar
   * @return null or a container with horizontal scrollbar and maybe the corner piece
   */
  _renderHorizontalScrollbar() {
    const {
      props: {
        guttersConfig: {
          left,
          left: {
            handleWidth: leftHandleWidth = constants.LEFT_HANDLE_WIDTH,
            width: leftGutterWidth = constants.LEFT_GUTTER_WIDTH
          } = {},
          right,
          right: {
            handleWidth: rightHandleWidth = constants.RIGHT_HANDLE_WIDTH,
            width: rightGutterWidth = constants.RIGHT_GUTTER_WIDTH
          } = {}
        } = {},
        horizontalScrollConfig,
        horizontalScrollConfig: {
          className,
          scaleWithCenterContent = false,
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {}
      },
      state: { shouldRender }
    } = this;

    const withHorizontalScrolling = !!horizontalScrollConfig && shouldRender.horizontalScrollbar;

    if (!withHorizontalScrolling) {
      return null;
    }

    // TODO fix scaleWithCenterContent
    const contentWidth = this._getContentWidth() - (shouldRender.verticalScrollbar ? scrollbarWidth : 0);
    let adjustedContentWidth = contentWidth;
    let leftWidth;
    let position;
    let scaledWidth;

    // If the scale with center content flag is enabled, we will adjust the scrollbar to be in the correct position
    // and set up the width to be equivelant to the center content
    // we will also have to adjust the size of the filler content by the gutters
    if (scaleWithCenterContent) {
      const shouldRenderCorner = !!horizontalScrollConfig && shouldRender.verticalScrollbar;
      const rightWidth = returnWidthIfComponentExists(rightHandleWidth + rightGutterWidth, right);
      const cornerWidth = returnWidthIfComponentExists(scrollbarWidth, shouldRenderCorner);

      leftWidth = returnWidthIfComponentExists(leftHandleWidth + leftGutterWidth, left);
      adjustedContentWidth -= leftWidth + rightWidth + cornerWidth;
      position = 'relative';
      scaledWidth = `calc(100% - ${leftWidth}px - ${rightWidth}px - ${cornerWidth}px)`;
    }

    const wrapperStyle = {
      height: `${scrollbarHeight}px`
    };

    const scrollBarDivStyle = {
      height: `${scrollbarHeight}px`,
      left: leftWidth,
      position,
      width: scaledWidth
    };

    const fillerStyle = { height: '1px', width: `${adjustedContentWidth}px` };

    const getHorizontalScrollbarRef = r => { this._horizontalScrollbar = r; };
    const horizontalScrollbarClassName = classnames('rickscroll__horizontal-scrollbar', className);

    return (
      <div className='rickscroll__bottom-wrapper' style={wrapperStyle}>
        <div
          className={horizontalScrollbarClassName}
          key='scrollable'
          onScroll={this._onHorizontalScroll}
          ref={getHorizontalScrollbarRef}
          style={scrollBarDivStyle}
        >
          <div style={fillerStyle} /> {/* this causes the scrollbar to appear */}
        </div>
        {this._renderCorner()}
      </div>
    );
  }

  /**
   * Decides whether or not to render the vertical scroll bar
   * @return null or a container with vertical scrollbar
   */
  _renderVerticalScrollbar() {
    const {
      props: {
        verticalScrollConfig: {
          className,
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
    const verticalScrollbarCassName = classnames('rickscroll__vertical-scrollbar', className);
    return (
      <div
        className={verticalScrollbarCassName}
        onScroll={this._onVerticalScroll}
        ref={getVerticalScrollbarRef}
        style={verticalScrollbarStyle}
      >
        <div style={fillerStyle} /> {/* this causes the scrollbar to appear */}
      </div>
    );
  }

  /**
   * Decides which scrollbars should be showing based off of the dimensions of the content and rickscroll container.
   * @return { horizontalScrollbar, verticalScrollbar } a pair of booleans that tell rickscroll whether or not to render
   *                                                    the horizontal and vertical scrollbars
   */
  _shouldRenderScrollbars(contentHeight, height, width) {
    const {
      props: {
        horizontalScrollConfig: {
          scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
        } = {},
        verticalScrollConfig: {
          scrollbarWidth = constants.VERTICAL_SCROLLBAR_WIDTH
        } = {}
      }
    } = this;

    const clientHeightTooSmall = height < contentHeight;
    const clientHeightTooSmallWithHorizontalScrollbar = height < (contentHeight + scrollbarHeight);

    const contentWidth = this._getContentWidth();
    const clientWidthTooSmall = width < contentWidth;
    const clientWidthTooSmallWithVerticalScrollbar = width < (contentWidth + scrollbarWidth);

    const shouldRenderVerticalScrollbar = clientHeightTooSmall || (
      clientWidthTooSmall && clientHeightTooSmallWithHorizontalScrollbar
    );
    const shouldRenderHorizontalScrollbar = clientWidthTooSmall || (
      clientHeightTooSmall && clientWidthTooSmallWithVerticalScrollbar
    );

    return {
      horizontalScrollbar: shouldRenderHorizontalScrollbar,
      verticalScrollbar: shouldRenderVerticalScrollbar
    };
  }

  _startResize(side) {
    return ({ clientX }) => {
      const {
        guttersConfig: {
          [side]: {
            position: baseWidth
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
    const { side } = this.state.resize;
    const {
      guttersConfig: {
        [side]: {
          onResizeEnd = (() => {}),
          position
        } = {}
      } = {}
    } = this.props;
    this.setState({
      resize: {
        baseWidth: 0,
        performing: false,
        side: '',
        startingPosition: 0
      }
    });
    onResizeEnd(position);
  }

  // public

  scrollTo({ x = 0, y = 0 }) {
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

  scrollToHeader(headerIndex) {
    const {
      props: { lists },
      state: { headers }
    } = this;

    if (!lists || headerIndex >= lists.length || headerIndex < 0) {
      return;
    }

    this.scrollTo({ y: headers[headerIndex].lockPosition });
  }

  toggleSection(sectionIndex) {
    const {
      props: {
        headerType = constants.headerType.DEFAULT,
        lists
      },
      state: { collapsedSections: oldCollapsedSections }
    } = this;
    const stackHeaders = headerType === constants.headerType.STACKING;

    if (!lists || sectionIndex >= lists.length || sectionIndex < 0) {
      return;
    }

    const collapsedState = !oldCollapsedSections[sectionIndex];
    oldCollapsedSections[sectionIndex] = collapsedState;

    const {
      avgRowHeight,
      collapsedSections,
      contentHeight,
      headers,
      partitions,
      rows
    } = buildRowConfig(lists, stackHeaders, oldCollapsedSections);
    this.setState({ avgRowHeight, collapsedSections, contentHeight, headers, partitions, rows });
  }

  render() {
    const {
      className,
      height,
      horizontalScrollConfig,
      horizontalScrollConfig: {
        scrollbarHeight = constants.HORIZONTAL_SCROLLBAR_HEIGHT
      } = {},
      style = {},
      width
    } = this.props;
    const {
      resize: { performing },
      shouldRender
    } = this.state;

    const scrollableClassName = classnames('rickscroll', {
      'rickscroll--performing-resize': performing
    }, className);
    const topWrapperStyle = !!horizontalScrollConfig && shouldRender.horizontalScrollbar ? {
      height: `calc(100% - ${scrollbarHeight}px)`
    } : undefined;

    const rickscrollStyle = {
      ...style,
      height: `${height}px`,
      width: `${width}px`
    };

    return (
      <div className={scrollableClassName} style={rickscrollStyle}>
        <div
          className='rickscroll__top-wrapper'
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
  className: types.string,
  guttersConfig: customTypes.guttersConfig,
  headerType: customTypes.headerType,
  height: types.number.isRequired,
  horizontalScrollConfig: customTypes.horizontalScrollConfig,
  list: customTypes.list,
  lists: customTypes.lists,
  style: types.object,
  verticalScrollConfig: customTypes.verticalScrollConfig,
  width: types.number.isRequired
};
