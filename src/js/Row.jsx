const classnames = require('classnames');
const constants = require('./constants');
const React = require('react');
const utils = require('./utils');
const _ = require('lodash');

const { PropTypes: types } = React;

class Row extends React.Component {
  constructor(props) {
    super(props);
    this._getRenderableHandle = this._getRenderableHandle.bind(this);
    this._getRenderableGutter = this._getRenderableGutter.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  }

  _getRenderableGutter(side, index, {
    className: thisGutterClassName,
    componentClass: ComponentClass,
    props = {}
  } = {}, width, gutterClassName) {
    const gutterStyle = utils.getWidthStyle(width);
    const className = classnames('rickscroll__gutter', gutterClassName, thisGutterClassName);
    return ComponentClass && gutterStyle ? (
      <span className={className} style={gutterStyle}>
        <ComponentClass key={`gutter-${side}`} {...props} />
      </span>
    ) : undefined;
  }

  _getRenderableHandle(side, { componentClass, handleClassName: thisHandleClassName } = {}, width, handleClassName) {
    const {
      guttersConfig: {
        [side]: {
          onGutterResize
        } = {}
      },
      onStartResize = (() => () => {})
    } = this.props;
    const handleStyle = utils.getWidthStyle(width);
    const className = classnames(
      handleClassName,
      thisHandleClassName,
      'rickscroll__handle',
      { 'rickscroll__handle--grabbable': !!onGutterResize },
      `rickscroll__handle--${side}`
    );
    return componentClass && handleStyle ? (
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
      guttersConfig: {
        left: {
          className: leftGutterClassName,
          handleClassName: leftHandleClassName,
          handleWidth: leftHandleWidth = constants.LEFT_HANDLE_WIDTH,
          width: leftGutterWidth = constants.LEFT_GUTTER_WIDTH
        } = {},
        right: {
          className: rightGutterClassName,
          handleClassName: rightHandleClassName,
          handleWidth: rightHandleWidth = constants.RIGHT_HANDLE_WIDTH,
          width: rightGutterWidth = constants.RIGHT_GUTTER_WIDTH
        } = {}
      } = {},
      gutters = {},
      horizontalTransform,
      index,
      onClick,
      rowHeight,
      rowProps = {}
    } = this.props;
    const rowStyle = {
      height: `${rowHeight}px`
    };

    const leftComponent = this._getRenderableGutter(
      constants.handleClass.LEFT,
      index,
      gutters.left,
      leftGutterWidth,
      leftGutterClassName
    );
    const leftHandleComponent = this._getRenderableHandle(
      constants.handleClass.LEFT,
      gutters.left,
      leftHandleWidth,
      leftHandleClassName
    );
    const rightComponent = this._getRenderableGutter(
      constants.handleClass.RIGHT,
      index,
      gutters.right,
      rightGutterWidth,
      rightGutterClassName
    );
    const rightHandleComponent = this._getRenderableHandle(
      constants.handleClass.RIGHT,
      gutters.right,
      rightHandleWidth,
      rightHandleClassName
    );
    const contentComponent = horizontalTransform !== undefined ?
      <ContentComponent key='content' offset={horizontalTransform} {...rowProps} /> :
      <ContentComponent />;

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
  contentComponent: utils.types.renderableComponent,
  gutters: utils.types.gutters,
  guttersConfig: utils.types.guttersConfig,
  horizontalTransform: types.number,
  index: types.number.isRequired,
  onClick: types.func,
  onStartResize: types.func,
  rowHeight: types.number.isRequired,
  rowProps: types.object
};

module.exports = Row;
