const React = require('react');
const ReactDOM = require('react-dom');

require('../../static/css/index');

const ScrollableWrapper = require('./components/ScrollableWrapper');

ReactDOM.render(
  <ScrollableWrapper />,
  document.getElementById('scrollable')
);
