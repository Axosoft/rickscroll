const _ = require('lodash');

const constants = require('./constants');
const types = require('./propTypes');

function buildRowConfig(rowsOrList) {
  if (rowsOrList[0] && rowsOrList[0].header) {
    return _.reduce(rowsOrList, ({ contentHeight: prevHeight, headers, rows }, { headerComponent, height, list }) => {
      let contentHeight = prevHeight;
      headers.push({ index: rows.length, height });
      contentHeight += height;
      rows.push({ contentComponent: headerComponent, height });
      rows.push(..._.map(list, row => {
        contentHeight += row.height;
        return row;
      }));
      return { contentHeight, headers, rows };
    }, { contentHeight: 0, headers: [], rows: [] });
  }

  const contentHeight = _.reduce(rowsOrList, (prevHeight, row) => prevHeight + row.height, 0);

  return { contentHeight, headers: null, rows: rowsOrList };
}

function getMaxHeight(rowHeight, numRows, offsetHeight) {
  return (rowHeight * numRows) - offsetHeight;
}

function getResizeWidth(side, minWidth = 0, baseWidth, startingPosition, currentPosition) {
  const deltaWidth = startingPosition - currentPosition;
  const modifier = side === constants.handleClass.LEFT ? -1 : 1;
  return Math.max(minWidth, baseWidth + (modifier * deltaWidth));
}

function getScrollValues(preClampTransform, rowHeight, maxHeight, offsetBuffer) {
  const verticalTransform = _.clamp(preClampTransform, 0, maxHeight);
  const topIndex = _.floor(verticalTransform / (rowHeight * offsetBuffer)) * offsetBuffer;
  return { topIndex, verticalTransform };
}

function getWidthStyle(width = 0) {
  return _.isNumber(width) && width > 0 ? {
    minWidth: `${width}px`,
    width: `${width}px`
  } : undefined;
}

module.exports = {
  buildRowConfig,
  getMaxHeight,
  getResizeWidth,
  getScrollValues,
  getWidthStyle,
  types
};
