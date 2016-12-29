import classnames from 'classnames';
import React, { PropTypes as types } from 'react';

import HorizontalWrapper from './HorizontalWrapper';
import * as customTypes from './propTypes';

const LightweightRow = ({
  className: thisRowClassName,
  contentComponent: ContentComponent,
  contentClassName: thisContentClassName,
  horizontalTransform,
  isFastScrolling = false,
  isHeader,
  isScrolling = false,
  onClick,
  passthroughOffsets,
  rowHeight,
  rowProps = {},
  width
}) => {
  const rowStyle = {
    height: `${rowHeight}px`,
    width: `${width}px`
  };

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
      <span className={contentClassName} key='content-wrapper'>{contentComponent}</span>
    </div>
  );
};

export default LightweightRow;

LightweightRow.propTypes = {
  className: types.string,
  contentClassName: types.string,
  contentComponent: customTypes.renderableComponent,
  horizontalTransform: types.number,
  isFastScrolling: types.bool,
  isHeader: types.bool,
  isScrolling: types.bool,
  onClick: types.func,
  passthroughOffsets: types.bool,
  rowHeight: types.number.isRequired,
  rowProps: types.object,
  width: types.number.isRequired
};
