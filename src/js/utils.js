import fp from 'lodash/fp';

import * as constants from './constants';

export function avgRowHeight(config) {
  const {
    contentHeight,
    rows: { length }
  } = config;
  return fp.assign(config, {
    avgRowHeight: length && fp.ceil(contentHeight / length)
  });
}

/**
 * Initializes the reduce call to reduceRowsIntoRowConfig. The step where we convert a list prop into lists is done here
 * @param  {array} list                     List or lists prop.
 * @param  {boolean} stackHeaders           Signifies that we should do the math to calculate stacking header offsets
 * @param  {Array}  [collapsedSections=[]]  The collapsedSection state from the scrollable class
 * @return {object}                         Reduces the list/lists into consumable state for the scrollable
 */
export function buildRowConfig(list, stackHeaders, collapsedSections = []) {
  let offsetCount = constants.OFFSET_BUFFER - 1;

  if (list.length === 0) {
    return { contentHeight: 0, headers: null, partitions: [], rows: [] };
  }

  const isMultiList = Boolean(list[0] && list[0].headerComponent);

  const lists = isMultiList ? list : [{ rows: list }];

  let numRowsWithoutHeaders = 0;
  let listIterator = lists.length;
  while (listIterator--) {
    numRowsWithoutHeaders += lists[listIterator].rows.length;
  }

  const numRows = isMultiList
    ? numRowsWithoutHeaders + lists.length
    : numRowsWithoutHeaders;

  const rows = new Array(numRows);
  const rowOffsets = new Array(numRowsWithoutHeaders);
  const headers = [];
  const partitions = [];

  let controlIterator = numRows;
  let rowIterator = -1;
  let insertionIterator = 0;
  let offsetInsertionIterator = 0;
  let adjustHeaderOffset = 0;
  let contentHeight = 0;
  let listItem;

  listIterator = 0;

  while (controlIterator--) {
    if (rowIterator === -1) {
      listItem = lists[listIterator];
      rowIterator++;

      if (listItem.headerComponent) {
        offsetCount++;
        offsetCount %= constants.OFFSET_BUFFER;

        if (offsetCount === 0) {
          partitions.push(contentHeight);
        }

        headers.push({
          adjustHeaderOffset,
          index: insertionIterator,
          height: listItem.height,
          lockPosition: contentHeight - adjustHeaderOffset,
          realOffset: contentHeight
        });

        if (stackHeaders) {
          adjustHeaderOffset += listItem.height;
        }

        if (collapsedSections[listIterator] === undefined) {
          collapsedSections[listIterator] = Boolean(listItem.initCollapsed);
        }

        rows[insertionIterator++] = {
          className: listItem.headerClassName,
          contentComponent: listItem.headerComponent,
          height: listItem.height,
          isHeader: true,
          key: listItem.headerKey,
          props: listItem.headerProps
        };

        contentHeight += listItem.height;
      }

      if (isMultiList) {
        if (!listItem.rows.length) {
          listIterator++;
          rowIterator = -1;
        }
        continue;
      }
    }

    if (collapsedSections[listIterator]) {
      controlIterator -= listItem.rows.length - 1;
      continue;
    }

    const row = listItem.rows[rowIterator++];

    offsetCount++;
    offsetCount %= constants.OFFSET_BUFFER;

    if (offsetCount === 0) {
      partitions.push(contentHeight);
    }

    rows[insertionIterator++] = row;
    rowOffsets[offsetInsertionIterator++] = {
      height: row.height,
      offset: contentHeight
    };

    contentHeight += row.height;

    if (listItem.rows.length === rowIterator) {
      listIterator++;
      rowIterator = -1;
    }
  }

  return avgRowHeight({
    adjustHeaderOffset,
    collapsedSections,
    contentHeight,
    headers,
    stackHeaders,
    offsetCount,
    partitions,
    rowOffsets,
    rows
  });
}

/**
 * assign meaning to math
 * @param  {number} contentHeight the height of the content
 * @param  {number} offsetHeight  the offsetHeight from the vertical scrollbar
 * @return {number}               the difference between contentHeight and offsetHeight
 */
export function getMaxHeight(contentHeight, offsetHeight) {
  return contentHeight - offsetHeight;
}

export const getResizeValues = fp.cond([
  // Dynamic column : LEFT ---------------------------------------------------------------------------------------------
  [ // resizing LEFT side
    fp.isMatch({
      dynamicColumn: constants.columns.LEFT,
      side: constants.columns.LEFT
    }),
    ({ leftHandleWidth, rightExists, rightHandlePosition, rightHandleWidth, width }) => ({
      max: width - leftHandleWidth,
      mod: 1,
      min: rightExists
        ? rightHandlePosition + rightHandleWidth
        : 0
    })
  ],
  [ // resizing RIGHT side
    fp.isMatch({
      dynamicColumn: constants.columns.LEFT,
      side: constants.columns.RIGHT
    }),
    ({ leftExists, leftHandlePosition, rightHandleWidth, width }) => ({
      max: leftExists
        ? leftHandlePosition - rightHandleWidth
        : width - rightHandleWidth,
      mod: 1,
      min: 0
    })
  ],
  // dynamic column : RIGHT --------------------------------------------------------------------------------------------
  [ // resizing LEFT side
    fp.isMatch({
      dynamicColumn: constants.columns.RIGHT,
      side: constants.columns.LEFT
    }),
    ({ leftHandleWidth, rightExists, rightHandlePosition, width }) => ({
      max: rightExists
        ? rightHandlePosition - leftHandleWidth
        : width - leftHandleWidth,
      mod: -1,
      min: 0
    })
  ],
  [ // resizing RIGHT side
    fp.isMatch({
      dynamicColumn: constants.columns.RIGHT,
      side: constants.columns.RIGHT
    }),
    ({ leftExists, leftHandlePosition, leftHandleWidth, rightHandleWidth, width }) => ({
      max: width - rightHandleWidth,
      mod: -1,
      min: leftExists
        ? leftHandlePosition + leftHandleWidth
        : 0
    })
  ],
  // dynamic column : MIDDLE -------------------------------------------------------------------------------------------
  [ // resizing LEFT side
    fp.isMatch({
      dynamicColumn: constants.columns.MIDDLE,
      side: constants.columns.LEFT
    }),
    ({ leftHandleWidth, rightExists, rightHandlePosition, rightHandleWidth, width }) => ({
      max: rightExists
        ? width - (rightHandlePosition + rightHandleWidth) - leftHandleWidth
        : width - leftHandleWidth,
      mod: -1,
      min: 0
    })
  ],
  [ // resizing RIGHT side
    fp.isMatch({
      dynamicColumn: constants.columns.MIDDLE,
      side: constants.columns.RIGHT
    }),
    ({ leftExists, leftHandlePosition, leftHandleWidth, rightHandleWidth, width }) => ({
      max: leftExists
        ? width - (leftHandlePosition + leftHandleWidth) - rightHandleWidth
        : width - rightHandleWidth,
      mod: 1,
      min: 0
    })
  ]
]);

const getMiddleColumnWidths = ({ leftHandlePosition, rightHandlePosition }) => ({
  leftGutterWidth: leftHandlePosition,
  rightGutterWidth: rightHandlePosition
});
export const getGutterWidths = fp.cond([
  [
    fp.isMatch({ dynamicColumn: constants.columns.LEFT }),
    ({ leftHandlePosition, leftHandleWidth, rightHandlePosition, width }) => ({
      leftGutterWidth: width - leftHandlePosition - leftHandleWidth,
      rightGutterWidth: rightHandlePosition
    })
  ],
  [
    fp.isMatch({ dynamicColumn: constants.columns.RIGHT }),
    ({ leftHandlePosition, rightHandlePosition, rightHandleWidth, width }) => ({
      leftGutterWidth: leftHandlePosition,
      rightGutterWidth: width - rightHandlePosition - rightHandleWidth
    })
  ],
  [fp.isMatch({ dynamicColumn: constants.columns.MIDDLE }), getMiddleColumnWidths],
  [fp.stubTrue, getMiddleColumnWidths]
]);

/**
 * calculates which partition is the top of our renderable content and clamps verticalTransform to within min/max values
 * @param  {number} preClampTransform vertical transform before we clamp it between min / max values
 * @param  {number} maxHeight         maximum height our vertical transform can reach
 * @param  {array} partitions         list of numbers which represent the starting vertical transformation of partitions
 *                                    by index (partitions[5] is the starting vertical transform of the 6th partition)
 * @return {object}                   topPartionIndex and the clamped verticalTransform
 */
export function getVerticalScrollValues(preClampTransform, maxHeight, partitions) {
  const verticalTransform = fp.clamp(0, maxHeight, preClampTransform);
  const topPartitionIndex = fp.findIndex(
    partitionStartingIndex => partitionStartingIndex > verticalTransform,
    partitions
  ) - 1;
  return { topPartitionIndex, verticalTransform };
}

/**
 * helper function that returns a very strict width object for gutters
 * @param  {Number} [width=0] the width we wish to express as a style object
 * @return {object}           a style object representing a the given width
 */
export function getWidthStyle(width = 0) {
  return fp.isNumber(width) && width > 0 ? {
    minWidth: `${width}px`,
    width: `${width}px`
  } : undefined;
}

export const returnWidthIfComponentExists = (width, component) =>
  component ? width : 0;
