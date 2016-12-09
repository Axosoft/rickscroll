import {
  isValidElement,
  PropTypes as types
} from 'react';
import _ from 'lodash';

import * as constants from './constants';

export const renderableComponent = types.oneOfType([types.func, types.element]);

export const gutterConfig = types.shape({
  className: types.string,
  handleClassName: types.string,
  handleWidth: types.number,
  minPosition: types.number,
  maxPosition: types.number,
  position: types.number.isRequired,
  onResize: types.func
});

export const guttersConfig = types.shape({
  left: gutterConfig,
  right: gutterConfig
});

export const column = types.oneOf(_.values(constants.columns));

export const headerType = types.oneOf(_.values(constants.headerType));

export const horizontalScrollConfig = types.shape({
  className: types.string,
  contentWidth: types.number.isRequired,
  onScroll: types.function,
  passthroughOffsets: types.bool,
  scaleWithCenterContent: types.bool,
  scrollbarHeight: types.number
});

export const rowGutter = types.shape({
  className: types.string,
  contentComponent: renderableComponent.isRequired,
  handleClassName: types.string,
  props: types.object
});

export const gutters = types.shape({
  left: rowGutter,
  right: rowGutter
});

export const row = types.shape({
  className: types.string,
  contentClassName: types.string,
  contentComponent: renderableComponent.isRequired,
  gutters,
  height: types.number.isRequired,
  key: types.string,
  props: types.object
});

export const scrollTo = types.shape({
  location: types.shape({
    x: types.number,
    y: types.number
  }),
  preserveHorizontal: types.bool,
  preserveVertical: types.bool,
  type: types.oneOf(_.values(constants.scrollType))
});

export const verticalScrollConfig = types.shape({
  className: types.string,
  onScroll: types.function,
  scrollbarWidth: types.number
});

function findInvalid(container, fn) {
  let invalid = null;
  _.forEach(container, (innerContainer, index) => {
    invalid = fn(innerContainer, index);
    if (invalid) {
      return false;
    }
    return true;
  });

  return invalid;
}

function validateRenderable(props, propName, location) {
  if (!_.isFunction(props[propName]) && !isValidElement(props[propName])) {
    return new Error(`Invalid ${location} \`${propName}\` supplied to \`Rickscroll\`.`);
  }
  return null;
}

function validateGutter(props, side, location) {
  const { [side]: gutterProp } = props;
  const fullLocation = `${location}.side`;

  if (_.isUndefined(gutterProp)) {
    return null;
  }

  if (!_.isObject(gutterProp)) {
    return new Error(`Invalid ${location} \`${side}\` supplied to \`Rickscroll\`.`);
  }

  if (!_.isUndefined(gutterProp.className) && !_.isString(gutterProp.className)) {
    return new Error(`Invalid ${fullLocation} \`className\` supplied to \`Rickscroll\`.`);
  }

  const invalid = validateRenderable(gutterProp, 'contentComponent', fullLocation);
  if (invalid) {
    return invalid;
  }

  if (!_.isUndefined(gutterProp.handleClassName) && !_.isString(gutterProp.handleClassName)) {
    return new Error(`Invalid ${fullLocation} \`handleClassName\` supplied to \`Rickscroll\`.`);
  }

  if (!_.isUndefined(gutterProp.props) && !_.isObject(gutterProp.props)) {
    return new Error(`Invalid prop at ${location} \`props\` supplied to \`Rickscroll\`.`);
  }

  return null;
}

function validateGutters(props, location) {
  const { gutters: guttersProp } = props;
  const fullLocation = `${location}.gutters`;

  if (_.isUndefined(guttersProp)) {
    return null;
  }

  if (!_.isObject(guttersProp)) {
    return new Error(`Invalid ${location} \`gutters\` supplied to \`Rickscroll\`.`);
  }

  let invalid = validateGutter(props, 'left', fullLocation);
  if (invalid) {
    return invalid;
  }

  invalid = validateGutter(props, 'right', fullLocation);
  if (invalid) {
    return invalid;
  }

  return null;
}

function validateRow(props, location) {
  if (!_.isUndefined(props.className) && !_.isString(props.className)) {
    return new Error(`Invalid ${location} \`className\` supplied to \`Rickscroll\`.`);
  }

  if (!_.isUndefined(props.contentClassName) && !_.isString(props.contentClassName)) {
    return new Error(`Invalid ${location} \`contentClassName\` supplied to \`Rickscroll\`.`);
  }

  let invalid = validateRenderable(props, 'contentComponent', location);
  if (invalid) {
    return invalid;
  }

  invalid = validateGutters(props, location);
  if (invalid) {
    return invalid;
  }

  if (!_.isNumber(props.height)) {
    return new Error(`Invalid prop at ${location} \`height\` supplied to \`Rickscroll\`.`);
  }

  if (!_.isUndefined(props.props) && !_.isObject(props.props)) {
    return new Error(`Invalid prop at ${location} \`props\` supplied to \`Rickscroll\`.`);
  }

  return null;
}

function validateRows(rows, locationSuffix, keySet = new Set()) {
  const initialKeyCount = keySet.size;
  const invalidRow = findInvalid(rows, (listRow, index) => {
    if (listRow.key === 0 || listRow.key) {
      // covers the case where we have a duplicate key
      if (keySet.has(listRow.key)) {
        return new Error(`Invalid props supplied to \`Rickscroll\`. Duplicate row key ${listRow.key}.`);
      }

      keySet.add(listRow.key);
    } else if (keySet.size) {
      return new Error(`Invalid props supplied to \`Rickscroll\`. Missing row key at ${index}.`);
    }

    return validateRow(listRow, `${locationSuffix}[${index}]`);
  });

  if (invalidRow) {
    return invalidRow;
  }

  // covers the case where some rows don't have a key
  if (keySet.size !== 0 && ((keySet.size - initialKeyCount) !== rows.length)) {
    return new Error('Invalid props supplied to `Rickscroll`. Missing keys on row declarations.');
  }

  return null;
}

export function list(props) {
  const { list: listProp, lists: listsProp } = props;

  if ((!listProp && !listsProp) || (listProp && listsProp)) {
    return new Error('Invalid props supplied to `Rickscroll`. Must supply at maximum one of list or lists.');
  }

  if (!listProp && listsProp) {
    return null;
  }

  if (!_.isArray(listProp)) {
    return new Error('Invalid prop `list` supplied to `Rickscroll`. Must be an array.');
  }

  return validateRows(listProp, 'list');
}

export function lists(props) {
  const { list: listProp, lists: listsProp } = props;

  if ((!listProp && !listsProp) || (listProp && listsProp)) {
    return new Error('Invalid props supplied to `Rickscroll`. Must supply at maximum one of list or lists.');
  }

  if (listProp && !listsProp) {
    return null;
  }

  if (!_.isArray(listsProp)) {
    return new Error('Invalid prop `lists` supplied to `Rickscroll`. Must be an array.');
  }

  // used to catch duplicate or missing keys
  const keySet = new Set();
  let numberOfNonHeaderRows = 0;

  const listsAreInvalid = findInvalid(listsProp, (listContainer, containerIndex) => {
    if (!_.isUndefined(props.headerClassName) && !_.isString(props.headerClassName)) {
      return new Error(`Invalid lists[${containerIndex}] \`headerClassName\` supplied to \`Rickscroll\`.`);
    }

    const invalidRenderable = validateRenderable(listContainer, 'headerComponent', `lists[${containerIndex}]`);
    if (invalidRenderable) {
      return invalidRenderable;
    }

    if (listContainer.headerKey === 0 || listContainer.headerKey) {
      if (keySet.has(listContainer.headerKey)) {
        return new Error(`Duplicate \`headerKey\` at lists[${containerIndex}] supplied to \`Rickscroll\`.`);
      }
      keySet.add(listContainer.headerKey);
    } else if (keySet.size) {
      return new Error(`Invalid props supplied to \`Rickscroll\`. Missing headerKey at lists[${containerIndex}].`);
    }

    if (!_.isUndefined(listContainer.headerProps) && !_.isObject(listContainer.headerProps)) {
      return new Error(`Invalid prop at lists[${containerIndex}] \`headerProps\` supplied to \`Rickscroll\`.`);
    }

    if (!_.isNumber(listContainer.height)) {
      return new Error(`Invalid prop at lists[${containerIndex}] \`height\` supplied to \`Rickscroll\`.`);
    }

    if (!_.isUndefined(props.initCollapsed) && !_.isBoolean(props.initCollapsed)) {
      return new Error(`Invalid lists[${containerIndex}] \`initCollapsed\` supplied to \`Rickscroll\`.`);
    }

    const initalKeyCount = keySet.size;
    const rowsInvalid = validateRows(listContainer.rows, 'lists.rows', keySet);
    if (rowsInvalid) {
      return rowsInvalid;
    }

    if (listContainer.headerKey && listContainer.rows.length && keySet.size === initalKeyCount) {
      return new Error('Invalid props supplied to `Rickscroll`. headerKey supplied, but no keys defined for ' +
        `lists[${containerIndex}] \`rows\`.`);
    }

    if (!listContainer.headerKey && keySet.size !== initalKeyCount) {
      return new Error(`Invalid props supplied to \`Rickscroll\`. No headerKey supplied to lists[${containerIndex}]`);
    }


    numberOfNonHeaderRows += listContainer.rows.length;

    return null;
  });

  if (listsAreInvalid) {
    return listsAreInvalid;
  }

  if (keySet.size !== 0 && (numberOfNonHeaderRows + listsProp.length) !== keySet.size) {
    return new Error('Invalid props supplied to `Rickscroll`. Missing keys on header declarations.');
  }

  return null;
}
