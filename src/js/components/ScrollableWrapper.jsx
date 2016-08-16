const React = require('react');
const _ = require('lodash');

const Scrollable = require('./Scrollable');

function leftGutter(x) {
  return () => <span className='gutter left'>{x}</span>
}

function rightGutter(x) {
    return () => <span className='gutter right'>Right gutter for {x}</span>;
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
      left: leftGutter(x),
      right: rightGutter(x)
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
    const mock = getMock(10000);
    const contentWidth = calculateWidthOfSpan(`The content in row 9999 is very long and has an incredibly long signatur` +
      `e that we will use to test the horizontal scrolling in this new version of scrollable. It's a good thing that we` +
      `'re gouing to test this, because we don't know if it will work right.`
    );

    const gutterConfig = {
      left: {
        width: calculateWidthOfSpan(`9999`) + 6
      },
      right: {
        width: calculateWidthOfSpan('Right gutter for 9999') + 100
      }
    };
    const horizontalScrollConfig = {
      contentWidth
    };
    const verticalScrollConfig = {
      rowHeight: 20
    };
    this.state = {
      mock,
      contentWidth,
      gutterConfig,
      horizontalScrollConfig,
      verticalScrollConfig
    };
  }

  componentDidMount() {
    setInterval(() => {
      this.setState({
        scrollTo: {
          y: Math.random() * this.state.mock.length * 20
        }
      });
    }, Math.random() * 6000);
  }

  render() {
    const {
      mock,
      contentWidth,
      gutterConfig,
      horizontalScrollConfig,
      scrollTo,
      verticalScrollConfig
    } = this.state;

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
