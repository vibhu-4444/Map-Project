/**
 * Unit Tests for Spatial Feasibility Engine
 */

import { FeasibilityEngine } from '../js/engines/feasibility.js';
import { feetToMm } from '../js/core/units.js';

export function runFeasibilityTests(assert) {
  // Test 1: Standard 35x50 plot with 3BHK program
  const plot35x50 = {
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

  const spec3BHK = {
    bedrooms: 3,
    bathrooms: { total: 2, attached: 1, common: 1 },
    diningRoom: true,
    poojaRoom: true,
    parking: { required: true },
    floorsCount: 2 // Duplex villa
  };

  const report = FeasibilityEngine.evaluate(plot35x50, spec3BHK);
  assert.equal(report.metrics.grossPlotAreaSqFt, 1750, '35x50 gross plot area equals 1750 sq.ft');
  // Buildable width: 35 - 6 = 29 ft. Buildable length: 50 - 9 = 41 ft. Footprint = 29 * 41 = 1189 sq.ft
  assert.equal(report.metrics.buildableFootprintSqFt, 1189, 'Buildable footprint equals 1189 sq.ft');
  assert.ok(report.isFeasible, '3BHK duplex program is feasible on 35x50 plot');

  // Test 2: Over-capacity check (e.g. 5 bedrooms on tiny 20x30 plot)
  const tinyPlot = {
    widthMm: feetToMm(20),
    lengthMm: feetToMm(30),
    orientation: 'north',
    roadFacing: 'north',
    setbacks: {
      frontMm: feetToMm(3),
      rearMm: feetToMm(3),
      leftMm: feetToMm(2),
      rightMm: feetToMm(2)
    }
  };

  const largeSpec = {
    bedrooms: 5,
    bathrooms: { total: 4, attached: 3, common: 1 },
    diningRoom: true,
    poojaRoom: true,
    parking: { required: true },
    floorsCount: 1
  };

  const tinyReport = FeasibilityEngine.evaluate(tinyPlot, largeSpec);
  assert.equal(tinyReport.verdict, 'OVER_CAPACITY', 'Excessive room program on tiny plot flagged OVER_CAPACITY');
  assert.ok(tinyReport.utilizationRate > 100, 'Utilization rate exceeds 100%');
  assert.ok(tinyReport.recommendations.length > 0, 'Actionable expansion recommendations generated');
}
