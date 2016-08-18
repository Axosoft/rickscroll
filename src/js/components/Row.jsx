const React = require('react');
const { PropTypes: types } = React;
const classnames = require('classnames');
const _ = require('lodash');

const constants = require('../constants');
const utils = require('../utils');

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
    const widthStyle = utils.getWidthStyle(width);
    return ComponentClass && widthStyle ?
      <span className='scrollable__gutter' style={widthStyle}><ComponentClass key={`gutter-${side}`} /></span> :
      undefined;
  }

  _getRenderableHandle(side, { handleClassName } = {}, width) {
    const {
      gutterConfig: {
        [side]: {
          onGutterResize
        } = {}
      },
      onStartResize = (() => () => {})
    } = this.props;
    const widthStyle = utils.getWidthStyle(width);
    const className = classnames(
      handleClassName,
      'scrollable__handle',
      { 'scrollable__handle--grabbable': !!onGutterResize },
      `scrollable__handle--${side}`
    );
    return widthStyle ? (
      <span
        className={className}
        key={`handle-${side}`}
        onMouseDown={onStartResize(side)}
        style={widthStyle}
      />
    ) : undefined;
  }

  render() {
    const {
      contentComponent: ContentComponent,
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
      gutters,
      horizontalTransform,
      index,
      rowHeight
    } = this.props;
    const heightStyle = {
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
      <div className='scrollable__row' style={heightStyle}>
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
  contentComponent: types.oneOfType([types.func, types.element]),
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
  gutters: types.shape({
    left: types.shape({
      componentClass: types.oneOfType([types.func, types.element]).isRequired,
      handleClassName: types.string
    }),
    right: types.shape({
      componentClass: types.oneOfType([types.func, types.element]).isRequired,
      handleClassName: types.string
    })
  }),
  horizontalTransform: types.number,
  index: types.number.isRequired,
  onStartResize: types.func,
  rowHeight: types.number.isRequired
};

module.exports = Row;
