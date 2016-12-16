import React, { PropTypes as types } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import Rickscroll from './Scrollable';

export default class AutoAdjust extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      width: 0
    };
    this._autoAdjustDiv = null;
    this._getRef = this._getRef.bind(this);
    this._getRickscroll = this._getRickscroll.bind(this);
    this._updateDimensions = this._updateDimensions.bind(this);
    this._resizeObserver = new ResizeObserver(this._updateDimensions);
    this.scrollRowToMiddle = this.scrollRowToMiddle.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.scrollToHeader = this.scrollToHeader.bind(this);
    this.toggleSection = this.toggleSection.bind(this);
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

  _getRickscroll(ref) {
    this._rickscroll = ref;
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

  // forward rickscroll public functions
  scrollRowToMiddle(...args) {
    return this._rickscroll && this._rickscroll.scrollRowToMiddle(...args);
  }

  scrollTo(...args) {
    return this._rickscroll && this._rickscroll.scrollTo(...args);
  }

  scrollToHeader(...args) {
    return this._rickscroll && this._rickscroll.scrollToHeader(...args);
  }

  toggleSection(...args) {
    return this._rickscroll && this._rickscroll.toggleSection(...args);
  }

  render() {
    const {
      props: {
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
        ? `calc(100% - ${heightAdjust})`
        : '100%',
      width: widthAdjust
        ? `calc(100% - ${widthAdjust})`
        : '100%'
    };

    const child = _autoAdjustDiv
      ? <Rickscroll height={height} {...props} ref={this._getRickscroll} width={width} wrappedWithAutoAdjust />
      : null;

    return (
      <div className='autoadjust' ref={this._getRef} style={style}>
        {child}
      </div>
    );
  }
}

AutoAdjust.propTypes = {
  heightAdjust: types.string,
  widthAdjust: types.string
};
