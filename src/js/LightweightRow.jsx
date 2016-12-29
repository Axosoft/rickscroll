import classnames from 'classnames';
import React, { PropTypes as types } from 'react';

import HorizontalWrapper from './HorizontalWrapper';
import * as customTypes from './propTypes';

export default class LightweightRow extends React.Component {
  constructor(props) {
    super(props);

    this._buildContentComponent = this._buildContentComponent.bind(this);
    this._cacheMiss = this._cacheMiss.bind(this);
    this._getContentComponentWithShallowCaching = this._getContentComponentWithShallowCaching.bind(this);
    this._shouldWrapComponent = this._shouldWrapComponent.bind(this);

    this._cache = {
      props: {},
      renderedRow: null
    };
  }

  _buildContentComponent() {
    const {
      contentComponent: ContentComponent,
      horizontalTransform,
      isFastScrolling,
      isHeader,
      isScrolling,
      passthroughOffsets,
      rowProps
    } = this.props;

    // save from last render
    this._cache.props = {
      horizontalTransform,
      isFastScrolling,
      isScrolling,
      passthroughOffsets,
      rowProps
    };

    if (horizontalTransform === undefined || isHeader || !passthroughOffsets) {
      this._cache.renderedRow = (
        <ContentComponent
          isFastScrolling={isFastScrolling}
          isScrolling={isScrolling}
          key='content'
          offset={0}
          {...rowProps}
        />
      );
    } else {
      this._cache.renderedRow = (
        <ContentComponent
          isFastScrolling={isFastScrolling}
          isScrolling={isScrolling}
          key='content'
          offset={horizontalTransform || 0}
          {...rowProps}
        />
      );
    }

    return this._cache.renderedRow;
  }

  _cacheMiss() {
    return !this._cache.renderedRow
      || this._cache.props.horizontalTransform !== this.props.horizontalTransform
      || this._cache.props.isFastScrolling !== this.props.isFastScrolling
      || this._cache.props.isScrolling !== this.props.isScrolling
      || this._cache.props.passthroughOffsets !== this.props.passthroughOffsets
      || this._cache.props.rowProps !== this.props.rowProps;
  }

  _getContentComponentWithShallowCaching() {
    return this._cacheMiss()
      ? this._buildContentComponent()
      : this._cache.renderedRow;
  }

  _shouldWrapComponent() {
    return this.props.horizontalTransform !== undefined
      || this.props.isHeader
      || this.props.passthroughOffsets;
  }

  render() {
    const {
      className: thisRowClassName,
      contentClassName: thisContentClassName,
      horizontalTransform,
      onClick,
      rowHeight,
      width
    } = this.props;
    const rowStyle = {
      height: `${rowHeight}px`,
      width: `${width}px`
    };

    const contentComponent = this._getContentComponentWithShallowCaching();

    const horizontallyWrappedContentComponent =
      this._shouldWrapComponent()
        ? (
          <HorizontalWrapper key='content' offset={horizontalTransform || 0}>
            {contentComponent}
          </HorizontalWrapper>
        )
        : contentComponent;

    const rowClassName = classnames('rickscroll__row', thisRowClassName);
    const contentClassName = classnames('rickscroll__content', thisContentClassName);

    return (
      <div className={rowClassName} onClick={onClick} style={rowStyle}>
        <span className={contentClassName} key='content-wrapper'>
          {horizontallyWrappedContentComponent}
        </span>
      </div>
    );
  }
}

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
