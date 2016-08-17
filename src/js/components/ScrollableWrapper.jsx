const React = require('react');
const _ = require('lodash');

const Scrollable = require('./Scrollable');

class LeftGutter extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  }

  render() {
    return <span className='gutter left'>{this.props.x}</span>;
  }
}

class RightGutter extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  }

  render() {
    return <span className='gutter right'>Right gutter for {this.props.x}</span>;
  }
}

function leftGutter(x) {
  return () => <LeftGutter x={x} />;
}

function rightGutter(x) {
    return () => <RightGutter x={x} />;
}

function row(x) {
  return props => (
    <Scrollable.HorizontalWrapper {...props}>
      <span className='whitespace'>The content in row {x} is very long and has an incredibly long signature that we will use to test the horizontal scrolling in this new version of scrollable. It's a good thing that we're gouing to test this, because we don't know if it will work right.</span>
    </Scrollable.HorizontalWrapper>
  );
}

function createRow(x) {
  return {
    contentComponent: row(x),
    gutters: {
      left: {
        componentClass: leftGutter(x),
        handleClassName: 'left-resizer'
      },
      right: {
        componentClass: rightGutter(x)
      }
    }
  };
}

function calculateWidthOfSpan(text) {
  const elementWithActualWidth = document.createElement('span');
  elementWithActualWidth.className = 'line-width-hack';
  elementWithActualWidth.setAttribute(
    'data-comment',
    'If you found me in the visible area of the app, check FileContentsPanelWrapper'
  );
  elementWithActualWidth.textContent = text;

  document.body.appendChild(elementWithActualWidth);
  const actualChildWidth = elementWithActualWidth.getClientRects()[0].width;
  document.body.removeChild(elementWithActualWidth);

  return actualChildWidth;
}

function getMock(numRows) {
  return _.range(numRows).map(createRow);
}

class ScrollableWrapper extends React.Component {
  constructor(props) {
    super(props);
    this._onLeftGutterResize = this._onLeftGutterResize.bind(this);
    this._onRightGutterResize = this._onRightGutterResize.bind(this);
    const mock = getMock(100000);
    const contentWidth = calculateWidthOfSpan(`The content in row 99999 is very long and has an incredibly long signatur` +
      `e that we will use to test the horizontal scrolling in this new version of scrollable. It's a good thing that we` +
      `'re gouing to test this, because we don't know if it will work right.`
    );

    const leftWidth = calculateWidthOfSpan(`99999`) + 6;
    const rightWidth = calculateWidthOfSpan('Right gutter for 99999') + 100;
    const horizontalScrollConfig = {
      contentWidth
    };
    const verticalScrollConfig = {
      rowHeight: 20
    };
    this.state = {
      mock,
      contentWidth,
      leftMinWidth: leftWidth,
      leftWidth,
      horizontalScrollConfig,
      rightMinWidth: rightWidth,
      rightWidth,
      verticalScrollConfig
    };
  }

  _onLeftGutterResize(leftWidth) {
    this.setState({ leftWidth });
  }

  _onRightGutterResize(rightWidth) {
    this.setState({ rightWidth });
  }

  render() {
    const {
      mock,
      contentWidth,
      leftMinWidth,
      leftWidth,
      horizontalScrollConfig,
      rightMinWidth,
      rightWidth,
      scrollTo,
      verticalScrollConfig
    } = this.state;

    const gutterConfig = {
      left: {
        handleWidth: 3,
        onGutterResize: this._onLeftGutterResize,
        minWidth: leftMinWidth,
        width: leftWidth
      },
      right: {
        handleWidth: 3,
        onGutterResize: this._onRightGutterResize,
        minWidth: rightMinWidth,
        width: rightWidth
      }
    };

    return (
      <Scrollable
        gutterConfig={gutterConfig}
        horizontalScrollConfig={horizontalScrollConfig}
        rows={mock}
        scrollTo={scrollTo}
        verticalScrollConfig={verticalScrollConfig}
      />
    );
  }
}

module.exports = ScrollableWrapper;
