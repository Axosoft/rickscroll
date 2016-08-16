module.exports = {
  getMaxHeight(rowHeight, numRows, offsetHeight) {
    return (rowHeight * numRows) - offsetHeight;
  },

  getScrollValues(preClampTransform, rowHeight, maxHeight, offsetBuffer) {
    const verticalTransform = _.clamp(preClampTransform, 0, maxHeight);
    const topIndex = _.floor(verticalTransform / (rowHeight * offsetBuffer)) * offsetBuffer;
    return { topIndex, verticalTransform };
  }
};
