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

  _getRenderableGutter(side, index, { componentClass: ComponentClass } = {}, width) {
    const gutterStyle = utils.getWidthStyle(width);
    return ComponentClass && gutterStyle ?
      <span className='scrollable__gutter' style={gutterStyle}><ComponentClass key={`gutter-${side}`} /></span> :
      undefined;
  }

  _getRenderableHandle(side, { handleClassName } = {}, width) {
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
      'scrollable__handle',
      { 'scrollable__handle--grabbable': !!onGutterResize },
      `scrollable__handle--${side}`
    );
    return handleStyle ? (
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
      contentComponent: ContentComponent,
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
      gutters,
      horizontalTransform,
      index,
      rowHeight
    } = this.props;
    const rowStyle = {
      height: `${rowHeight}px`
    };

    const leftComponent = this._getRenderableGutter(
      constants.handleClass.LEFT,
      index,
      gutters.left,
      leftGutterWidth
    );
    const leftHandleComponent = this._getRenderableHandle(
      constants.handleClass.LEFT,
      gutters.left,
      leftHandleWidth
    );
    const rightComponent = this._getRenderableGutter(
      constants.handleClass.RIGHT,
      index,
      gutters.right,
      rightGutterWidth
    );
    const rightHandleComponent = this._getRenderableHandle(
      constants.handleClass.RIGHT,
      gutters.right,
      rightHandleWidth
    );
    const contentComponent = horizontalTransform !== undefined ?
      <ContentComponent key='content' offset={horizontalTransform} /> :
      <ContentComponent />;

    return (
      <div className='scrollable__row' style={rowStyle}>
        {leftComponent}
        {leftHandleComponent}
        <span className='scrollable__content' key='content-wrapper'>{contentComponent}</span>
        {rightHandleComponent}
        {rightComponent}
      </div>
    );
  }
}

Row.propTypes = {
  contentComponent: utils.types.renderableComponent,
  gutters: utils.types.gutters,
  guttersConfig: utils.types.guttersConfig,
  horizontalTransform: types.number,
  index: types.number.isRequired,
  onStartResize: types.func,
  rowHeight: types.number.isRequired
};

module.exports = Row;
