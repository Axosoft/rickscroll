const _ = require('lodash');

const constants = require('./constants');
const types = require('./propTypes');

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

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(dPoint) {
    this.x += dPoint.x;
    this.y += dPoint.y;
    return this;
  }

  sub(dPoint) {
    this.x -= dPoint.x;
    this.y -= dPoint.y;
    return this;
  }

  scale(c) {
    this.x *= c;
    this.y *= c;
    return this;
  }
}

module.exports = {
  getMaxHeight,
  getResizeWidth,
  getScrollValues,
  getWidthStyle,
  Point,
  types
};
