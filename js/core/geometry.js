/**
 * Geometry Primitives & Computational Algorithms
 * Units: Exact Millimeters (mm).
 * Coordinates: X (right/east), Y (down/south).
 */

export class Point2D {
  constructor(x = 0, y = 0) {
    this.x = Number(x);
    this.y = Number(y);
  }

  add(other) {
    return new Point2D(this.x + other.x, this.y + other.y);
  }

  subtract(other) {
    return new Point2D(this.x - other.x, this.y - other.y);
  }

  multiply(scalar) {
    return new Point2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar) {
    if (scalar === 0) throw new Error('Division by zero in Point2D.divide');
    return new Point2D(this.x / scalar, this.y / scalar);
  }

  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  cross(other) {
    return this.x * other.y - this.y * other.x;
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.hypot(dx, dy);
  }

  distanceSquaredTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.length();
    return len === 0 ? new Point2D(0, 0) : this.divide(len);
  }

  perpendicular() {
    // 90 degrees counter-clockwise
    return new Point2D(-this.y, this.x);
  }

  rotate(angleRad, origin = new Point2D(0, 0)) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = this.x - origin.x;
    const dy = this.y - origin.y;
    return new Point2D(
      origin.x + (dx * cos - dy * sin),
      origin.y + (dx * sin + dy * cos)
    );
  }

  equals(other, tolerance = 1e-4) {
    return Math.abs(this.x - other.x) <= tolerance && Math.abs(this.y - other.y) <= tolerance;
  }

  clone() {
    return new Point2D(this.x, this.y);
  }

  toJSON() {
    return { x: this.x, y: this.y };
  }

  static fromJSON(json) {
    return new Point2D(json.x, json.y);
  }
}

export class BoundingBox {
  constructor(minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  get width() {
    return Math.max(0, this.maxX - this.minX);
  }

  get height() {
    return Math.max(0, this.maxY - this.minY);
  }

  get center() {
    return new Point2D((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
  }

  get area() {
    return this.width * this.height;
  }

  expandByPoint(point) {
    if (point.x < this.minX) this.minX = point.x;
    if (point.x > this.maxX) this.maxX = point.x;
    if (point.y < this.minY) this.minY = point.y;
    if (point.y > this.maxY) this.maxY = point.y;
    return this;
  }

  containsPoint(pt, tolerance = 1e-4) {
    return (
      pt.x >= this.minX - tolerance &&
      pt.x <= this.maxX + tolerance &&
      pt.y >= this.minY - tolerance &&
      pt.y <= this.maxY + tolerance
    );
  }

  intersects(other, tolerance = 1e-4) {
    return !(
      this.maxX < other.minX + tolerance ||
      this.minX > other.maxX - tolerance ||
      this.maxY < other.minY + tolerance ||
      this.minY > other.maxY - tolerance
    );
  }

  containsBox(inner, tolerance = 1e-4) {
    return (
      inner.minX >= this.minX - tolerance &&
      inner.maxX <= this.maxX + tolerance &&
      inner.minY >= this.minY - tolerance &&
      inner.maxY <= this.maxY + tolerance
    );
  }

  toPolygon() {
    return new Polygon2D([
      new Point2D(this.minX, this.minY),
      new Point2D(this.maxX, this.minY),
      new Point2D(this.maxX, this.maxY),
      new Point2D(this.minX, this.maxY)
    ]);
  }

  clone() {
    return new BoundingBox(this.minX, this.minY, this.maxX, this.maxY);
  }
}

export class Segment2D {
  constructor(start, end) {
    this.start = start instanceof Point2D ? start : new Point2D(start.x, start.y);
    this.end = end instanceof Point2D ? end : new Point2D(end.x, end.y);
  }

  get length() {
    return this.start.distanceTo(this.end);
  }

  get midpoint() {
    return new Point2D((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
  }

  get vector() {
    return this.end.subtract(this.start);
  }

  get direction() {
    return this.vector.normalize();
  }

  get normal() {
    return this.direction.perpendicular();
  }

  get boundingBox() {
    return new BoundingBox(
      Math.min(this.start.x, this.end.x),
      Math.min(this.start.y, this.end.y),
      Math.max(this.start.x, this.end.x),
      Math.max(this.start.y, this.end.y)
    );
  }

  pointAtOffset(offset) {
    const dir = this.direction;
    return new Point2D(this.start.x + dir.x * offset, this.start.y + dir.y * offset);
  }

  pointDistance(pt) {
    const l2 = this.start.distanceSquaredTo(this.end);
    if (l2 === 0) return pt.distanceTo(this.start);
    const t = Math.max(0, Math.min(1, pt.subtract(this.start).dot(this.vector) / l2));
    const projection = this.start.add(this.vector.multiply(t));
    return pt.distanceTo(projection);
  }

  projectPoint(pt) {
    const l2 = this.start.distanceSquaredTo(this.end);
    if (l2 === 0) return { point: this.start.clone(), t: 0, distance: pt.distanceTo(this.start) };
    const t = Math.max(0, Math.min(1, pt.subtract(this.start).dot(this.vector) / l2));
    const point = this.start.add(this.vector.multiply(t));
    return { point, t, distance: pt.distanceTo(point) };
  }

  intersects(other, tolerance = 1e-5) {
    const p1 = this.start;
    const p2 = this.end;
    const p3 = other.start;
    const p4 = other.end;

    const d1 = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
    const d2 = (p4.x - p3.x) * (p2.y - p3.y) - (p4.y - p3.y) * (p2.x - p3.x);
    const d3 = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    const d4 = (p2.x - p1.x) * (p4.y - p1.y) - (p2.y - p1.y) * (p4.x - p1.x);

    // Straddle check
    if (((d1 > tolerance && d2 < -tolerance) || (d1 < -tolerance && d2 > tolerance)) &&
        ((d3 > tolerance && d4 < -tolerance) || (d3 < -tolerance && d4 > tolerance))) {
      return true;
    }

    return false;
  }

  intersectionPoint(other, tolerance = 1e-5) {
    const denom = (this.end.x - this.start.x) * (other.end.y - other.start.y) -
                  (this.end.y - this.start.y) * (other.end.x - other.start.x);
    if (Math.abs(denom) < tolerance) return null; // Parallel

    const t = ((other.start.x - this.start.x) * (other.end.y - other.start.y) -
               (other.start.y - this.start.y) * (other.end.x - other.start.x)) / denom;
    const u = ((other.start.x - this.start.x) * (this.end.y - this.start.y) -
               (other.start.y - this.start.y) * (this.end.x - this.start.x)) / denom;

    if (t >= -tolerance && t <= 1 + tolerance && u >= -tolerance && u <= 1 + tolerance) {
      return new Point2D(
        this.start.x + t * (this.end.x - this.start.x),
        this.start.y + t * (this.end.y - this.start.y)
      );
    }
    return null;
  }

  clone() {
    return new Segment2D(this.start.clone(), this.end.clone());
  }
}

export class Polygon2D {
  constructor(vertices = []) {
    this.vertices = vertices.map(v => (v instanceof Point2D ? v : new Point2D(v.x, v.y)));
  }

  get vertexCount() {
    return this.vertices.length;
  }

  /**
   * Shoelace Formula for signed area
   * Positive = Counter-Clockwise (CCW), Negative = Clockwise (CW)
   */
  get signedArea() {
    const n = this.vertices.length;
    if (n < 3) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const curr = this.vertices[i];
      const next = this.vertices[(i + 1) % n];
      sum += curr.x * next.y - next.x * curr.y;
    }
    return sum / 2;
  }

  get area() {
    return Math.abs(this.signedArea);
  }

  get perimeter() {
    const n = this.vertices.length;
    if (n < 2) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += this.vertices[i].distanceTo(this.vertices[(i + 1) % n]);
    }
    return sum;
  }

  get centroid() {
    const n = this.vertices.length;
    if (n === 0) return new Point2D(0, 0);
    if (n === 1) return this.vertices[0].clone();
    if (n === 2) return new Point2D((this.vertices[0].x + this.vertices[1].x) / 2, (this.vertices[0].y + this.vertices[1].y) / 2);

    let cx = 0;
    let cy = 0;
    const factorArea = this.signedArea * 6;

    if (Math.abs(factorArea) < 1e-5) {
      // Fallback to simple average for degenerate polygons
      let sx = 0, sy = 0;
      for (const v of this.vertices) { sx += v.x; sy += v.y; }
      return new Point2D(sx / n, sy / n);
    }

    for (let i = 0; i < n; i++) {
      const curr = this.vertices[i];
      const next = this.vertices[(i + 1) % n];
      const cross = curr.x * next.y - next.x * curr.y;
      cx += (curr.x + next.x) * cross;
      cy += (curr.y + next.y) * cross;
    }

    return new Point2D(cx / factorArea, cy / factorArea);
  }

  get boundingBox() {
    const box = new BoundingBox();
    for (const v of this.vertices) {
      box.expandByPoint(v);
    }
    return box;
  }

  getEdges() {
    const edges = [];
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      edges.push(new Segment2D(this.vertices[i], this.vertices[(i + 1) % n]));
    }
    return edges;
  }

  /**
   * Raycasting Algorithm (Jordan curve theorem)
   */
  containsPoint(pt, onEdgeIncluded = true, tolerance = 1e-4) {
    const n = this.vertices.length;
    if (n < 3) return false;

    // Check AABB first
    if (!this.boundingBox.containsPoint(pt, tolerance)) return false;

    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].x, yi = this.vertices[i].y;
      const xj = this.vertices[j].x, yj = this.vertices[j].y;

      // Check if point lies directly on edge
      if (onEdgeIncluded) {
        const seg = new Segment2D(this.vertices[j], this.vertices[i]);
        if (seg.pointDistance(pt) <= tolerance) {
          return true;
        }
      }

      const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
        (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  translate(dx, dy) {
    return new Polygon2D(this.vertices.map(v => new Point2D(v.x + dx, v.y + dy)));
  }

  scale(scaleX, scaleY = scaleX, origin = null) {
    const pivot = origin || this.centroid;
    return new Polygon2D(this.vertices.map(v => {
      const dx = v.x - pivot.x;
      const dy = v.y - pivot.y;
      return new Point2D(pivot.x + dx * scaleX, pivot.y + dy * scaleY);
    }));
  }

  clone() {
    return new Polygon2D(this.vertices.map(v => v.clone()));
  }

  toJSON() {
    return { vertices: this.vertices.map(v => v.toJSON()) };
  }

  static fromJSON(json) {
    return new Polygon2D(json.vertices.map(v => Point2D.fromJSON(v)));
  }
}

/**
 * Creates an axis-aligned rectangular polygon
 */
export function createRectanglePolygon(x, y, width, height) {
  return new Polygon2D([
    new Point2D(x, y),
    new Point2D(x + width, y),
    new Point2D(x + width, y + height),
    new Point2D(x, y + height)
  ]);
}

/**
 * Robust BoundingBox extractor supporting Polygon2D instances, plain objects, and serialized vertices
 */
export function getBoundingBox(polyOrBox) {
  if (!polyOrBox) return new BoundingBox();
  if (polyOrBox instanceof BoundingBox) return polyOrBox;
  if (polyOrBox.boundingBox instanceof BoundingBox) return polyOrBox.boundingBox;
  if (polyOrBox.minX !== undefined && polyOrBox.maxX !== undefined) {
    return new BoundingBox(polyOrBox.minX, polyOrBox.minY, polyOrBox.maxX, polyOrBox.maxY);
  }
  const vertices = polyOrBox.vertices || (Array.isArray(polyOrBox) ? polyOrBox : null);
  if (Array.isArray(vertices)) {
    const box = new BoundingBox();
    for (const v of vertices) {
      box.expandByPoint(v);
    }
    return box;
  }
  return new BoundingBox();
}

/**
 * Separating Axis Theorem (SAT) / Edge Intersection for Polygon-Polygon Collision
 * Returns true if the two polygons overlap (area > 0)
 */
export function doPolygonsOverlap(polyA, polyB, tolerance = 1e-3) {
  // 1. Fast AABB Rejection
  const boxA = getBoundingBox(polyA);
  const boxB = getBoundingBox(polyB);
  if (!boxA.intersects(boxB, tolerance)) {
    return false;
  }

  const pA = polyA instanceof Polygon2D ? polyA : new Polygon2D(polyA.vertices || []);
  const pB = polyB instanceof Polygon2D ? polyB : new Polygon2D(polyB.vertices || []);

  // 2. Check if any edge intersects another edge
  const edgesA = pA.getEdges();
  const edgesB = pB.getEdges();

  for (const ea of edgesA) {
    for (const eb of edgesB) {
      if (ea.intersects(eb, tolerance)) {
        return true;
      }
    }
  }

  // 3. Check if PolyA is completely inside PolyB
  if (pA.vertices.length > 0 && pB.containsPoint(pA.vertices[0], false, tolerance)) {
    return true;
  }

  // 4. Check if PolyB is completely inside PolyA
  if (pB.vertices.length > 0 && pA.containsPoint(pB.vertices[0], false, tolerance)) {
    return true;
  }

  return false;
}

/**
 * Checks if innerPoly is strictly contained within outerPoly
 */
export function isPolygonContained(innerPoly, outerPoly, tolerance = 1e-3) {
  const boxOuter = getBoundingBox(outerPoly);
  const boxInner = getBoundingBox(innerPoly);
  if (!boxOuter.containsBox(boxInner, tolerance)) {
    return false;
  }

  const pInner = innerPoly instanceof Polygon2D ? innerPoly : new Polygon2D(innerPoly.vertices || []);
  const pOuter = outerPoly instanceof Polygon2D ? outerPoly : new Polygon2D(outerPoly.vertices || []);

  for (const v of pInner.vertices) {
    if (!pOuter.containsPoint(v, true, tolerance)) {
      return false;
    }
  }

  const innerEdges = pInner.getEdges();
  const outerEdges = pOuter.getEdges();
  for (const ie of innerEdges) {
    for (const oe of outerEdges) {
      if (ie.intersects(oe, tolerance)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Computes overlap area between two axis-aligned rectangular polygons
 */
export function getRectangleOverlapArea(rectA, rectB) {
  const boxA = getBoundingBox(rectA);
  const boxB = getBoundingBox(rectB);

  const overlapMinX = Math.max(boxA.minX, boxB.minX);
  const overlapMaxX = Math.min(boxA.maxX, boxB.maxX);
  const overlapMinY = Math.max(boxA.minY, boxB.minY);
  const overlapMaxY = Math.min(boxA.maxY, boxB.maxY);

  const overlapWidth = overlapMaxX - overlapMinX;
  const overlapHeight = overlapMaxY - overlapMinY;

  if (overlapWidth > 1e-4 && overlapHeight > 1e-4) {
    return overlapWidth * overlapHeight;
  }
  return 0;
}
