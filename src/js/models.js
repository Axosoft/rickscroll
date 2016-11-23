export class Point {
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
