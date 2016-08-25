const { isValidElement, PropTypes: types } = require('react');
const _ = require('lodash');

const renderableComponent = types.oneOfType([types.func, types.element]);

const gutterConfig = types.shape({
  handleWidth: types.number,
  minWidth: types.number,
  width: types.number
});

const guttersConfig = types.shape({
  left: gutterConfig,
  onGutterResize: types.func,
  right: gutterConfig
});

const headerConfig = types.shape({
  clickToScroll: types.bool,
  lockHeaders: types.bool
});

const horizontalScrollConfig = types.shape({
  contentWidth: types.number.isRequired,
  scrollbarHeight: types.number
});

const rowGutter = types.shape({
  componentClass: renderableComponent.isRequired,
  handleClassName: types.string
});

const gutters = types.shape({
  left: rowGutter,
  right: rowGutter
});

const row = types.shape({
  contentComponent: renderableComponent.isRequired,
  gutters,
  height: types.number.isRequired
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

  const invalid = validateRenderable(gutterProp, 'componentClass', fullLocation);
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

function list(props) {
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

  return findInvalid(listProp, (listRow, index) => validateRow(listRow, `list[${index}]`)) || null;
}

function lists(props) {
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

  return findInvalid(listsProp, (listContainer, containerIndex) => {
    let invalid = validateRenderable(listContainer, 'headerComponent', `lists[${containerIndex}]`);
    if (invalid) {
      return invalid;
    }

    if (!_.isUndefined(listContainer.headerProps) && !_.isObject(listContainer.headerProps)) {
      return new Error(`Invalid prop at lists[${containerIndex}] \`headerProps\` supplied to \`Rickscroll\`.`);
    }

    if (!_.isNumber(listContainer.height)) {
      return new Error(`Invalid prop at lists[${containerIndex}] \`height\` supplied to \`Rickscroll\`.`);
    }

    invalid = findInvalid(listContainer.rows, (listRow, rowIndex) => validateRow(listRow, `lists.rows[${rowIndex}]`));
    if (invalid) {
      return invalid;
    }

    return null;
  });
}

const scrollTo = types.shape({
  x: types.number,
  y: types.number
});

const verticalScrollConfig = types.shape({
  scrollbarWidth: types.number
});

module.exports = {
  gutterConfig,
  gutters,
  guttersConfig,
  headerConfig,
  horizontalScrollConfig,
  list,
  lists,
  renderableComponent,
  row,
  rowGutter,
  scrollTo,
  verticalScrollConfig
};
