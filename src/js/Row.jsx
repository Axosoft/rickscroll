import classnames from 'classnames';
import React, { PropTypes as types } from 'react';
import _ from 'lodash';

import * as constants from './constants';
import HorizontalWrapper from './HorizontalWrapper';
import * as customTypes from './propTypes';
import { getGutterWidths, getWidthStyle } from './utils';

export default class Row extends React.Component {
  constructor(props) {
    super(props);
    this._getRenderableHandle = this._getRenderableHandle.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  }

  _getRenderableGutter(side, index, {
    className: thisGutterClassName,
    contentComponent: ContentComponent,
    props = {}
  } = {}, width, gutterClassName) {
    const {
      isFastScrolling = false,
      isScrolling = false
    } = this.props;
    const gutterStyle = getWidthStyle(width);
    const className = classnames('rickscroll__gutter', gutterClassName, thisGutterClassName);
    return ContentComponent && gutterStyle ? (
      <span className={className} style={gutterStyle}>
        <ContentComponent
          isFastScrolling={isFastScrolling}
          isScrolling={isScrolling}
          key={`gutter-${side}`}
          {...props}
        />
      </span>
    ) : undefined;
  }

  _getRenderableHandle(side, { contentComponent, handleClassName: thisHandleClassName } = {}, width, handleClassName) {
    const {
      guttersConfig: {
        [side]: {
          onResize
        } = {}
      } = {},
      onStartResize = (() => () => {})
    } = this.props;
    const handleStyle = getWidthStyle(width);
    const className = classnames(
      handleClassName,
      thisHandleClassName,
      'rickscroll__handle',
      { 'rickscroll__handle--grabbable': !!onResize },
      `rickscroll__handle--${side}`
    );
    return contentComponent && handleStyle ? (
      <span
        className={className}
        key={`handle-${side}`}
        onMouseDown={onStartResize(side)}
        style={handleStyle}
      />
    ) : undefined;
  }

  render() {
    const {
      className: thisRowClassName,
      contentComponent: ContentComponent,
      contentClassName: thisContentClassName,
      dynamicColumn = constants.columns.MIDDLE,
      guttersConfig,
      guttersConfig: {
        left: leftCanExist,
        left: {
          className: leftGutterClassName,
          handleClassName: leftHandleClassName,
          handleWidth: leftHandleWidth,
          position: leftHandlePosition
        } = {},
        right: rightCanExist,
        right: {
          className: rightGutterClassName,
          handleClassName: rightHandleClassName,
          handleWidth: rightHandleWidth = constants.RIGHT_HANDLE_WIDTH,
          position: rightHandlePosition
        } = {}
      } = {},
      gutters = {},
      horizontalTransform,
      index,
      isFastScrolling = false,
      isHeader,
      isScrolling = false,
      onClick,
      passthroughOffsets,
      rowHeight,
      rowProps = {},
      width
    } = this.props;
    const rowStyle = {
      height: `${rowHeight}px`,
      width: `${width}px`
    };

    const { leftGutterWidth, rightGutterWidth } = getGutterWidths({
      dynamicColumn: guttersConfig
        ? dynamicColumn
        : constants.columns.MIDDLE,
      leftHandlePosition,
      leftHandleWidth,
      rightHandlePosition,
      rightHandleWidth,
      width
    });

    const leftComponent = leftCanExist
      ? this._getRenderableGutter(
        constants.columns.LEFT,
        index,
        gutters.left,
        leftGutterWidth,
        leftGutterClassName
      )
      : null;
    const leftHandleComponent = leftCanExist
      ? this._getRenderableHandle(
        constants.columns.LEFT,
        gutters.left,
        leftHandleWidth,
        leftHandleClassName
      )
      : null;
    const rightComponent = rightCanExist
      ? this._getRenderableGutter(
        constants.columns.RIGHT,
        index,
        gutters.right,
        rightGutterWidth,
        rightGutterClassName
      )
      : null;
    const rightHandleComponent = rightCanExist
      ? this._getRenderableHandle(
        constants.columns.RIGHT,
        gutters.right,
        rightHandleWidth,
        rightHandleClassName
      )
      : null;

    let contentComponent;
    if (horizontalTransform !== undefined && !isHeader) {
      contentComponent = passthroughOffsets
        ? (
          <ContentComponent
            isFastScrolling={isFastScrolling}
            isScrolling={isScrolling}
            key='content'
            offset={horizontalTransform || 0}
            {...rowProps}
          />
        )
        : (
            <HorizontalWrapper key='content' offset={horizontalTransform || 0}>
              <ContentComponent isFastScrolling={isFastScrolling} isScrolling={isScrolling} {...rowProps} />
            </HorizontalWrapper>
          );
    } else {
      contentComponent = (
        <ContentComponent isFastScrolling={isFastScrolling} isScrolling={isScrolling} key='content' {...rowProps} />
      );
    }

    const rowClassName = classnames('rickscroll__row', thisRowClassName);
    const contentClassName = classnames('rickscroll__content', thisContentClassName);

    return (
      <div className={rowClassName} onClick={onClick} style={rowStyle}>
        {leftComponent}
        {leftHandleComponent}
        <span className={contentClassName} key='content-wrapper'>{contentComponent}</span>
        {rightHandleComponent}
        {rightComponent}
      </div>
    );
  }
}

Row.propTypes = {
  className: types.string,
  contentClassName: types.string,
  contentComponent: customTypes.renderableComponent,
  dynamicColumn: customTypes.column,
  gutters: customTypes.gutters,
  guttersConfig: customTypes.guttersConfig,
  horizontalTransform: types.number,
  index: types.number.isRequired,
  isFastScrolling: types.bool,
  isHeader: types.bool,
  isScrolling: types.bool,
  onClick: types.func,
  onStartResize: types.func,
  passthroughOffsets: types.bool,
  rowHeight: types.number.isRequired,
  rowProps: types.object,
  width: types.number.isRequired
};
