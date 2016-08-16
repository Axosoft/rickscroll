module.exports = {
  getMaxHeight(rowHeight, numRows, offsetHeight) {
    return (rowHeight * numRows) - offsetHeight;
  },

  getScrollValues(preClampTransform, rowHeight, maxHeight, offsetBuffer) {
    const verticalTransform = _.clamp(preClampTransform, 0, maxHeight);
    const topIndex = _.floor(verticalTransform / (rowHeight * offsetBuffer)) * offsetBuffer;
    return { topIndex, verticalTransform };
  },

  Point: class {
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
};
