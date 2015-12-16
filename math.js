function Vec2(x, y) {
  this.x = x;
  this.y = y;
}

Vec2.prototype.sub = function(otherVec) {
  return new Vec2(this.x - otherVec.x, this.y - otherVec.y);
};

Vec2.prototype.add = function(otherVec) {
  return new Vec2(this.x + otherVec.x, this.y + otherVec.y);
};

Vec2.prototype.toString = function() {
  return "[x: " + this.x + ", y: " + this.y + "]";
};

Vec2.prototype.copy = function() {
  return new Vec2(this.x, this.y);
};

Vec2.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.normalize = function() {
  const length = this.length();
  if (length == 0) {
    this.x = 0;
    this.y = 0;
  } else {
    this.x /= length;
    this.y /= length;
  }
};

Vec2.prototype.equal = function(v) {
  return this.x == v.x && this.y == v.y;
}

Vec2.prototype.isInverse = function(v) {
  return this.x == -v.x && this.y == -v.y;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Rect(x, y, width, height, halfWidth, halfHeight) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.halfWidth = halfWidth || (width / 2.0);
  this.halfHeight = halfHeight || (height / 2.0);
}

Rect.prototype.makeMinkowskiSumWithRect = function(anotherRect) {
  return new Rect(this.x,
    this.y,
    this.width + anotherRect.width,
    this.height + anotherRect.height,
    this.halfWidth + anotherRect.halfWidth,
    this.halfHeight + anotherRect.halfHeight);
}

Rect.prototype.containsPoint = function(aVec2) {
  return (
    (aVec2.x > this.x - this.halfWidth) &&
    (aVec2.x < this.x + this.halfWidth) &&
    (aVec2.y > this.y - this.halfHeight) &&
    (aVec2.y < this.y + this.halfHeight)
  );
};
