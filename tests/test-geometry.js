/**
 * Unit Tests for Computational Geometry Primitives & Algorithms
 */

import { Point2D, Segment2D, Polygon2D, createRectanglePolygon, doPolygonsOverlap, getRectangleOverlapArea } from '../js/core/geometry.js';
import { feetToMm, mmToFeet, sqmmToSqFt } from '../js/core/units.js';

export function runGeometryTests(assert) {
  // Test 1: Point2D arithmetic and distance
  const p1 = new Point2D(0, 0);
  const p2 = new Point2D(3000, 4000);
  assert.equal(p1.distanceTo(p2), 5000, 'Point2D 3-4-5 triangle euclidean distance in mm');
  assert.ok(p1.add(new Point2D(100, 200)).equals(new Point2D(100, 200)), 'Point2D vector addition');

  // Test 2: Segment2D intersection
  const s1 = new Segment2D(new Point2D(0, 500), new Point2D(1000, 500));
  const s2 = new Segment2D(new Point2D(500, 0), new Point2D(500, 1000));
  assert.ok(s1.intersects(s2), 'Perpendicular intersecting segments detected');

  const s3 = new Segment2D(new Point2D(0, 0), new Point2D(1000, 0));
  const s4 = new Segment2D(new Point2D(0, 100), new Point2D(1000, 100));
  assert.ok(!s3.intersects(s4), 'Parallel non-intersecting segments correctly rejected');

  // Test 3: Polygon2D Shoelace area calculation
  // 10ft x 10ft rectangle = 3048mm x 3048mm = 9,290,304 mm² = 100 sq.ft
  const rectPoly = createRectanglePolygon(0, 0, 3048, 3048);
  const areaSqFt = sqmmToSqFt(rectPoly.area);
  assert.ok(Math.abs(areaSqFt - 100) < 0.01, 'Polygon2D Shoelace exact area matches 100 sq.ft');

  // Test 4: Point-in-Polygon Raycasting
  assert.ok(rectPoly.containsPoint(new Point2D(1500, 1500)), 'Interior point correctly identified inside polygon');
  assert.ok(!rectPoly.containsPoint(new Point2D(4000, 4000)), 'Exterior point correctly identified outside polygon');

  // Test 5: Polygon-Polygon Overlap / Collision Detection
  const boxA = createRectanglePolygon(0, 0, 3000, 3000);
  const boxB = createRectanglePolygon(2000, 2000, 3000, 3000); // 1000x1000 overlap
  assert.ok(doPolygonsOverlap(boxA, boxB), 'Overlapping polygons correctly flagged');
  const overlapArea = getRectangleOverlapArea(boxA, boxB);
  assert.equal(overlapArea, 1000000, 'Overlap area correctly calculated as 1,000,000 mm² (1 m²)');

  const boxC = createRectanglePolygon(5000, 5000, 1000, 1000); // Disjoint
  assert.ok(!doPolygonsOverlap(boxA, boxC), 'Disjoint polygons correctly reported non-overlapping');
}
