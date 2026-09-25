/**
 * Unit Tests for Geometry Constraint Validator
 */

import { GeometryValidator } from '../js/engines/validator.js';
import { LayoutGeneratorEngine } from '../js/engines/layout-generator.js';
import { feetToMm } from '../js/core/units.js';
import { createRectanglePolygon } from '../js/core/geometry.js';

export function runValidatorTests(assert) {
  const plot = {
    widthMm: feetToMm(35),
    lengthMm: feetToMm(50),
    orientation: 'north',
    roadFacing: 'north',
    setbacks: {
      frontMm: feetToMm(5),
      rearMm: feetToMm(4),
      leftMm: feetToMm(3),
      rightMm: feetToMm(3)
    }
  };

  const spec = {
    bedrooms: 3,
    bathrooms: { total: 2, attached: 1, common: 1 },
    parking: { required: true },
    diningRoom: true,
    poojaRoom: true
  };

  // Test 1: Synthesized plan passes hard geometric errors
  const candidates = LayoutGeneratorEngine.generateCandidates(plot, spec);
  assert.ok(candidates.length >= 3, 'Synthesizes at least 3 strategy alternatives');

  const planA = candidates[0].floors[0];
  const reportA = GeometryValidator.validateFloor(planA, plot);
  assert.equal(reportA.errorCount, 0, 'Synthesized Candidate A has 0 geometric errors');
  assert.ok(reportA.isValid, 'Synthesized Candidate A is geometrically valid');

  // Test 2: Manually inject room overlap error
  const invalidFloor = JSON.parse(JSON.stringify(planA));
  // Shift bedroom 2 directly over master bedroom
  invalidFloor.rooms[invalidFloor.rooms.length - 1].x = invalidFloor.rooms[0].x + 500;
  invalidFloor.rooms[invalidFloor.rooms.length - 1].y = invalidFloor.rooms[0].y + 500;
  invalidFloor.rooms[invalidFloor.rooms.length - 1].polygon = createRectanglePolygon(
    invalidFloor.rooms[invalidFloor.rooms.length - 1].x,
    invalidFloor.rooms[invalidFloor.rooms.length - 1].y,
    invalidFloor.rooms[invalidFloor.rooms.length - 1].width,
    invalidFloor.rooms[invalidFloor.rooms.length - 1].height
  );

  const invalidReport = GeometryValidator.validateFloor(invalidFloor, plot);
  assert.ok(invalidReport.errorCount > 0, 'Injected room collision properly caught as ERROR');
  assert.ok(invalidReport.issues.some(i => i.ruleId === 'ERR_ROOM_OVERLAP'), 'ERR_ROOM_OVERLAP issue reported');
}
