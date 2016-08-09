const React = require('react');
const _ = require('lodash');

const Scrollable = require('./Scrollable');

function createRow(x) {
  return () => <div key={x} style={{height: '20px'}}>{x}</div>;
}

function ScrollableWrapper() {
  const rows = _.range(1000000).map(createRow);
  return <Scrollable rowHeight={20} rows={rows} />;
}

module.exports = ScrollableWrapper;
