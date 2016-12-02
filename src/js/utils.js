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
 * @param  {number} offsetBuffer            The number of rows per partition
 * @param  {boolean} stackHeaders           Signifies that we should do the math to calculate stacking header offsets
 * @param  {Array}  [collapsedSections=[]]  The collapsedSection state from the scrollable class
 * @return {object}                         Reduces the list/lists into consumable state for the scrollable
 */
export function buildRowConfig(list, offsetBuffer, stackHeaders, collapsedSections = []) {
  let offsetCount = offsetBuffer - 1;

  if (list.length === 0) {
    return { contentHeight: 0, headers: null, partitions: [], rows: [] };
  }

  const isMultiList = Boolean(list[0] && list[0].headerComponent);

  const lists = isMultiList ? list : [{ rows: list }];

  let numRows = 0;
  let listIterator = lists.length;

  while (listIterator--) {
    numRows += 1 + lists[listIterator].rows.length;
  }

  if (!isMultiList) {
    numRows--;
  }

  const rows = new Array(numRows);
  const headers = [];
  const partitions = [];

  let controlIterator = numRows;
  let rowIterator = -1;
  let insertionIterator = 0;
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
        offsetCount %= offsetBuffer;

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

        contentHeight += listItem.height;
        rows[insertionIterator++] = {
          className: listItem.headerClassName,
          contentComponent: listItem.headerComponent,
          height: listItem.height,
          isHeader: true,
          key: listItem.headerKey,
          props: listItem.headerProps
        };
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
    offsetCount %= offsetBuffer;

    if (offsetCount === 0) {
      partitions.push(contentHeight);
    }

    contentHeight += row.height;

    rows[insertionIterator++] = row;

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
    offsetBuffer,
    offsetCount,
    partitions,
    rows
  });
}

export const triggerAnimationFrameCreator = callback => {
  let needFrame = false;
  let renderingFrame = false;
  let oldParams = [];

  const triggerAnimationFrame = (...params) => {
    if (renderingFrame) {
      needFrame = true;
      oldParams = params;
    } else {
      renderingFrame = true;
      needFrame = false;
      requestAnimationFrame(() => {
        callback(...params);
        renderingFrame = false;
      });
      if (needFrame) {
        needFrame = false;
        triggerAnimationFrame(...oldParams);
      }
    }
  };

  return triggerAnimationFrame;
};

/**
 * assign meaning to math
 * @param  {number} contentHeight the height of the content
 * @param  {number} offsetHeight  the offsetHeight from the vertical scrollbar
 * @return {number}               the difference between contentHeight and offsetHeight
 */
export function getMaxHeight(contentHeight, offsetHeight) {
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
export function getResizeWidth(side, minWidth = 0, baseWidth, startingPosition, currentPosition) {
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
