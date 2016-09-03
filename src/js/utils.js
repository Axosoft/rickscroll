const _ = require('lodash');

const constants = require('./constants');
const types = require('./propTypes');

/**
 * Reduces list or lists type into a single array of rows, as well as collect useful information about rows as they are
 * collected.
 * @param  {object} prevState             The previous state of the reduce function. Matches the return value.
 * @param  {string} headerClassName       className to attach to the row containing the header component of a given list
 * @param  {renderable} headerComponent   a React renderable component that will be the header of a given list
 * @param  {object} headerProps           props to pass to the header component
 * @param  {number} height                The height of the header component
 * @param  {boolean} initCollapsed        whether a given list is collapsed or not. This only applies when constructing
 *                                        the first row state
 * @param  {array} rows                   List of rows to copy into state
 * @param  {number} index                 index of the reduce operation
 * @return {object}                       see comment at the return
 */
function reduceRowsIntoRowConfig(
  prevState, { headerClassName, headerComponent, headerProps, height, initCollapsed, rows: inRows }, index
) {
  const {
    adjustHeaderOffset,
    collapsedSections,
    contentHeight: prevHeight,
    headers,
    stackHeaders,
    offsetBuffer,
    offsetCount: prevOffset,
    partitions
  } = prevState;
  let { rows: outRows } = prevState;
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

    if (stackHeaders) {
      newHeaderOffset += height;
    }

    if (_.isUndefined(collapsedSections[index])) {
      collapsedSections[index] = !!initCollapsed;
    }

    contentHeight += height;
    outRows.push({ className: headerClassName, contentComponent: headerComponent, height, props: headerProps });
  }

  if (!headerComponent || !collapsedSections[index]) {
    outRows = _.concat(outRows, _.map(inRows, row => {
      nextOffset++;
      nextOffset %= offsetBuffer;

      if (nextOffset === 0) {
        partitions.push(contentHeight);
      }

      contentHeight += row.height;
      return row;
    }));
  }

  return {
    adjustHeaderOffset: newHeaderOffset, // keeps a running tally of the headeroffsets, used for locking/stagnig headers
    collapsedSections, // an array of boolean values corresponding to each section in the lists object
    contentHeight, // the height of the content contained by this list
    headers, // an array containing header data, (offsets, row index, height, lockPosition)
    stackHeaders, // should we be calculating headerOffsets from height
    offsetBuffer, // number of rows to display per partition
    offsetCount: nextOffset, // keeps track of partition size inbetween reductions
    partitions, // an array mapping the starting partition indices to starting vertical transforms
    rows: outRows // the rows that we will use as state
  };
}

/**
 * Initializes the reduce call to reduceRowsIntoRowConfig. The step where we convert a list prop into lists is done here
 * @param  {array} list                     List or lists prop.
 * @param  {number} offsetBuffer            The number of rows per partition
 * @param  {boolean} stackHeaders           Signifies that we should do the math to calculate stacking header offsets
 * @param  {Array}  [collapsedSections=[]]  The collapsedSection state from the scrollable class
 * @return {object}                         Reduces the list/lists into consumable state for the scrollable
 */
function buildRowConfig(list, offsetBuffer, stackHeaders, collapsedSections = []) {
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
      collapsedSections,
      contentHeight: 0,
      headers: [],
      stackHeaders,
      offsetBuffer,
      offsetCount,
      partitions: [],
      rows: []
    }));
  }

  return avgRowHeight(_.reduce([{ rows: list }], reduceRowsIntoRowConfig, {
    contentHeight: 0,
    collapsedSections,
    headers: null,
    offsetBuffer,
    offsetCount,
    partitions: [],
    rows: []
  }));
}

/**
 * assign meaning to math
 * @param  {number} contentHeight the height of the content
 * @param  {number} offsetHeight  the offsetHeight from the vertical scrollbar
 * @return {number}               the difference between contentHeight and offsetHeight
 */
function getMaxHeight(contentHeight, offsetHeight) {
  return contentHeight - offsetHeight;
}

/**
 * calculates the width of a gutter via mouse movement. Also takes into account minWidth bound of a gutter.
 * @param  {string} side             which side are we resizing
 * @param  {Number} [minWidth=0]     the minimum value the gutter may be resized to
 * @param  {number} baseWidth        the width we started with when we began resizing
 * @param  {number} startingPosition position our mouse was in when we started resizing
 * @param  {number} currentPosition  current position of our mouse
 * @return {number}                  the next width of the gutter
 */
function getResizeWidth(side, minWidth = 0, baseWidth, startingPosition, currentPosition) {
  const deltaWidth = startingPosition - currentPosition;
  const modifier = side === constants.handleClass.LEFT ? -1 : 1;
  return Math.max(minWidth, baseWidth + (modifier * deltaWidth));
}

/**
 * calculates which partition is the top of our renderable content and clamps verticalTransform to within min/max values
 * @param  {number} preClampTransform vertical transform before we clamp it between min / max values
 * @param  {number} maxHeight         maximum height our vertical transform can reach
 * @param  {array} partitions         list of numbers which represent the starting vertical transformation of partitions
 *                                    by index (partitions[5] is the starting vertical transform of the 6th partition)
 * @return {object}                   topPartionIndex and the clamped verticalTransform
 */
function getScrollValues(preClampTransform, maxHeight, partitions) {
  const verticalTransform = _.clamp(preClampTransform, 0, maxHeight);
  const topPartitionIndex = _.findIndex(
    partitions, partitionStartingIndex => partitionStartingIndex > verticalTransform
  ) - 1;
  return { topPartitionIndex, verticalTransform };
}

/**
 * helper function that returns a very strict width object for gutters
 * @param  {Number} [width=0] the width we wish to express as a style object
 * @return {object}           a style object representing a the given width
 */
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
