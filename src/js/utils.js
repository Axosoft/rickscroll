const _ = require('lodash');

const constants = require('./constants');
const types = require('./propTypes');

function reduceRowsIntoRowConfig(prevState, { headerComponent, height, rows: inRows }) {
  const {
    adjustHeaderOffset,
    contentHeight: prevHeight,
    headers,
    lockHeaders,
    offsetBuffer,
    offsetCount: prevOffset,
    partitions,
    rows: outRows
  } = prevState;
  let contentHeight = prevHeight;
  let nextOffset = prevOffset;
  let newHeaderOffset = adjustHeaderOffset;

  if (headerComponent) {
    nextOffset++;
    nextOffset %= offsetBuffer;

    if (nextOffset === 0) {
      partitions.push(contentHeight);
    }

    headers.push({
      adjustHeaderOffset,
      index: outRows.length,
      height,
      lockPosition: contentHeight - adjustHeaderOffset,
      realOffset: contentHeight
    });

    if (lockHeaders) {
      newHeaderOffset += height;
    }

    contentHeight += height;
    outRows.push({ contentComponent: headerComponent, height });
  }

  outRows.push(..._.map(inRows, row => {
    nextOffset++;
    nextOffset %= offsetBuffer;

    if (nextOffset === 0) {
      partitions.push(contentHeight);
    }

    contentHeight += row.height;
    return row;
  }));

  return {
    adjustHeaderOffset: newHeaderOffset,
    contentHeight,
    headers,
    lockHeaders,
    offsetBuffer,
    offsetCount: nextOffset,
    partitions,
    rows: outRows
  };
}

function buildRowConfig(list, offsetBuffer, lockHeaders) {
  const offsetCount = offsetBuffer - 1;

  if (list.length === 0) {
    return { contentHeight: 0, headers: null, partitions: [], rows: [] };
  }

  function avgRowHeight(config) {
    const {
      contentHeight,
      rows: { length }
    } = config;
    return _.assign(config, {
      avgRowHeight: length && _.ceil(contentHeight / length)
    });
  }

  if (list[0] && list[0].headerComponent) {
    return avgRowHeight(_.reduce(list, reduceRowsIntoRowConfig, {
      adjustHeaderOffset: 0,
      contentHeight: 0,
      headers: [],
      lockHeaders,
      offsetBuffer,
      offsetCount,
      partitions: [],
      rows: []
    }));
  }

  return avgRowHeight(_.reduce([{ rows: list }], reduceRowsIntoRowConfig, {
    contentHeight: 0,
    headers: null,
    offsetBuffer,
    offsetCount,
    partitions: [],
    rows: []
  }));
}

function getMaxHeight(contentHeight, offsetHeight) {
  return contentHeight - offsetHeight;
}

function getResizeWidth(side, minWidth = 0, baseWidth, startingPosition, currentPosition) {
  const deltaWidth = startingPosition - currentPosition;
  const modifier = side === constants.handleClass.LEFT ? -1 : 1;
  return Math.max(minWidth, baseWidth + (modifier * deltaWidth));
}

function getScrollValues(preClampTransform, maxHeight, partitions) {
  const verticalTransform = _.clamp(preClampTransform, 0, maxHeight);
  const topPartitionIndex = _.findIndex(
    partitions, partitionStartingIndex => partitionStartingIndex > verticalTransform
  ) - 1;
  return { topPartitionIndex, verticalTransform };
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
