const React = require('react');
const _ = require('lodash');

const Scrollable = require('./Scrollable');

function leftGutter(x) {
  return () => <span>{x} |</span>
}

function row(x) {
  return () => <span>The content in row {x}.</span>;
}

function createRow(width) {
  return x => ({
      contentComponent: row(x),
      gutters: {
        left: {
          component: leftGutter(x),
          width
        },
      }
    });
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
  const width = calculateWidthOfSpan(`${numRows} |`);
  return _.range(numRows).map(createRow(width));
}

function ScrollableWrapper() {
  const mock = getMock(10000);
  return (
    <Scrollable
      rowHeight={20}
      rows={mock}
    />
  );
}

module.exports = ScrollableWrapper;
