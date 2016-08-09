const React = require('react');
const _ = require('lodash');

const Scrollable = require('./Scrollable');

function ScrollableWrapper() {
  const createRow = x => (<div key={x} style={{height: '20px'}}>{x}</div>);
  const rows = _.range(1000).map(createRow);
  return <Scrollable rowHeight={20} rows={rows} />;
}

module.exports = ScrollableWrapper;
