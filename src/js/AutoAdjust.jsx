import React, { PropTypes as types } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import * as customTypes from './propTypes';

export default class AutoAdjust extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      width: 0
    };
    this._autoAdjustDiv = null;
    this._getRef = this._getRef.bind(this);
    this._updateDimensions = this._updateDimensions.bind(this);
    this._resizeObserver = new ResizeObserver(this._updateDimensions);
  }

  componentDidMount() {
    window.addEventListener('resize', this._updateDimensions);
    this._resizeObserver.observe(this._autoAdjustDiv);
    this._updateDimensions();
  }

  componentDidUpdate() {
    this._updateDimensions();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateDimensions);
    this._resizeObserver.unobserve(this._autoAdjustDiv);
    this.setState({ height: 0, width: 0 });
    this.autoAdjustDiv = null;
  }

  _getRef(ref) {
    this._autoAdjustDiv = ref;
  }

  _updateDimensions() {
    const {
      _autoAdjustDiv,
      _autoAdjustDiv: {
        clientHeight: height,
        clientWidth: width
      },
      state: {
        height: prevHeight,
        width: prevWidth
      }
    } = this;

    if (!_autoAdjustDiv || (prevHeight === height && prevWidth === width)) {
      return;
    }

    this.setState({ height, width });
  }

  render() {
    const {
      props: {
        component: Component,
        heightAdjust,
        widthAdjust,
        ...props
      },
      state: {
        height,
        width
      },
      _autoAdjustDiv
    } = this;

    const style = {
      height: heightAdjust
        ? `calc(100% - ${heightAdjust}px)`
        : '100%',
      width: widthAdjust
        ? `calc(100% - ${widthAdjust}px)`
        : '100%'
    };

    const child = _autoAdjustDiv
      ? <Component height={height} {...props} width={width} />
      : null;

    return (
      <div className='autoadjust' ref={this._getRef} style={style}>
        {child}
      </div>
    );
  }
}

AutoAdjust.propTypes = {
  component: customTypes.renderableComponent,
  heightAdjust: types.number,
  widthAdjust: types.number
};
