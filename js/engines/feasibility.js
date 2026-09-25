/**
 * Spatial Feasibility Engine
 * Deterministic geometric calculation of plot buildability, room program demand,
 * circulation allowances, and multi-floor spatial viability.
 */

import { sqmmToSqFt, sqftToSqmm, formatArea, formatDimension } from '../core/units.js';
import { ROOM_DEFINITIONS } from '../core/types.js';

export class FeasibilityEngine {
  /**
   * Evaluates spatial feasibility of a house specification on a given plot
   * @param {Object} plot - Plot configuration
   * @param {Object} spec - House specification
   * @param {Object} options - Calculation allowances
   * @returns {Object} Comprehensive feasibility analysis report
   */
  static evaluate(plot, spec, options = {}) {
    const wallFactor = options.wallFactor ?? 0.12;       // 12% structural/partition wall area
    const circulationFactor = options.circulationFactor ?? 0.15; // 15% corridors, foyers, movement
    const floorsCount = Math.max(1, spec.floorsCount || 1);

    // 1. Plot & Buildable Geometry Calculations
    const plotWidthMm = plot.widthMm;
    const plotLengthMm = plot.lengthMm;
    const grossPlotAreaSqMm = plotWidthMm * plotLengthMm;
    const grossPlotAreaSqFt = sqmmToSqFt(grossPlotAreaSqMm);

    const setbacks = plot.setbacks || { frontMm: 1524, rearMm: 1219, leftMm: 914, rightMm: 914 };
    const buildableWidthMm = Math.max(0, plotWidthMm - (setbacks.leftMm + setbacks.rightMm));
    const buildableLengthMm = Math.max(0, plotLengthMm - (setbacks.frontMm + setbacks.rearMm));
    const buildableFootprintSqMm = buildableWidthMm * buildableLengthMm;
    const buildableFootprintSqFt = sqmmToSqFt(buildableFootprintSqMm);

    const totalPlotCapacitySqFt = buildableFootprintSqFt * floorsCount;

    // 2. Room Program Demand Calculation
    const requiredRooms = this.buildRoomProgram(spec);
    let requestedCarpetSqFt = 0;
    const roomBreakdown = [];

    for (const room of requiredRooms) {
      const def = ROOM_DEFINITIONS[room.type] || { minAreaSqFt: 100, label: room.name };
      const area = room.customAreaSqFt || def.minAreaSqFt;
      requestedCarpetSqFt += area;
      roomBreakdown.push({
        id: room.id,
        name: room.name,
        type: room.type,
        minAreaSqFt: area,
        minWidthMm: def.minWidthMm || 3000,
        minHeightMm: def.minHeightMm || 3000,
        category: def.category || 'general'
      });
    }

    // 3. Multi-Floor / Staircase Allowance
    let staircaseFootprintSqFt = 0;
    if (floorsCount > 1 || spec.staircaseRequired) {
      staircaseFootprintSqFt = ROOM_DEFINITIONS.staircase.minAreaSqFt; // 80 sq.ft
    }

    // 4. Gross Required Built-Up Area (BUA)
    // Formula: (Carpet Area + Staircase) / (1 - (Circulation% + Wall%))
    const netProgramAreaSqFt = requestedCarpetSqFt + (staircaseFootprintSqFt * floorsCount);
    const totalRequiredBuiltUpSqFt = netProgramAreaSqFt / (1 - (wallFactor + circulationFactor));
    const estimatedCirculationSqFt = totalRequiredBuiltUpSqFt * circulationFactor;
    const estimatedWallAreaSqFt = totalRequiredBuiltUpSqFt * wallFactor;

    // 5. Ground Floor Footprint Demand vs Buildable Footprint
    // In multi-floor planning, ground floor carries entrance, parking, public zones, and portion of bedrooms
    const groundFloorDemandSqFt = totalRequiredBuiltUpSqFt / floorsCount;
    const groundFloorFit = groundFloorDemandSqFt <= buildableFootprintSqFt;
    const totalFit = totalRequiredBuiltUpSqFt <= totalPlotCapacitySqFt;

    const utilizationRate = totalPlotCapacitySqFt > 0
      ? (totalRequiredBuiltUpSqFt / totalPlotCapacitySqFt) * 100
      : Infinity;

    // 6. Verdict & Detailed Diagnostics
    let verdict = 'FEASIBLE';
    const diagnostics = [];
    const recommendations = [];

    if (buildableWidthMm < 4500) {
      diagnostics.push(`Buildable width is extremely narrow (${formatDimension(buildableWidthMm)}). Minimum residential room span requires at least 4.5m / 15ft.`);
      verdict = 'OVER_CAPACITY';
    }

    if (utilizationRate > 100) {
      verdict = 'OVER_CAPACITY';
      const excessSqFt = Math.round(totalRequiredBuiltUpSqFt - totalPlotCapacitySqFt);
      diagnostics.push(`Requested program exceeds maximum buildable capacity by ${excessSqFt} sq.ft (${Math.round(utilizationRate)}% utilization).`);

      if (floorsCount === 1) {
        recommendations.push(`Add a First Floor (G+1) to expand buildable vertical capacity to ${Math.round(buildableFootprintSqFt * 2)} sq.ft.`);
      } else {
        recommendations.push(`Increase floor count or reduce bedroom counts / room dimensions.`);
      }
      recommendations.push(`Adjust side setbacks from ${formatDimension(setbacks.leftMm)} to standard minimum if permitted by local bylaws.`);
    } else if (utilizationRate > 88) {
      verdict = 'TIGHT_FIT';
      diagnostics.push(`High spatial density (${Math.round(utilizationRate)}% utilization). Corridors and room sizes will be compact.`);
      recommendations.push(`Consider open-plan Living/Dining integration to minimize circulation corridors.`);
    } else {
      verdict = 'FEASIBLE';
      diagnostics.push(`Comfortable spatial fit (${Math.round(utilizationRate)}% capacity utilization). Excellent potential for spacious rooms and cross-ventilation.`);
    }

    // 7. Ground Coverage & FAR Check
    const groundCoveragePercent = (buildableFootprintSqFt / grossPlotAreaSqFt) * 100;
    const proposedFAR = totalRequiredBuiltUpSqFt / grossPlotAreaSqFt;

    return {
      verdict, // 'FEASIBLE' | 'TIGHT_FIT' | 'OVER_CAPACITY'
      isFeasible: verdict !== 'OVER_CAPACITY',
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      metrics: {
        grossPlotAreaSqFt: Math.round(grossPlotAreaSqFt),
        buildableFootprintSqFt: Math.round(buildableFootprintSqFt),
        totalPlotCapacitySqFt: Math.round(totalPlotCapacitySqFt),
        requestedCarpetSqFt: Math.round(requestedCarpetSqFt),
        estimatedCirculationSqFt: Math.round(estimatedCirculationSqFt),
        estimatedWallAreaSqFt: Math.round(estimatedWallAreaSqFt),
        totalRequiredBuiltUpSqFt: Math.round(totalRequiredBuiltUpSqFt),
        groundFloorDemandSqFt: Math.round(groundFloorDemandSqFt),
        groundCoveragePercent: Math.round(groundCoveragePercent * 10) / 10,
        proposedFAR: Math.round(proposedFAR * 100) / 100,
        floorsCount,
        dimensions: {
          plotWidth: formatDimension(plotWidthMm),
          plotLength: formatDimension(plotLengthMm),
          buildableWidth: formatDimension(buildableWidthMm),
          buildableLength: formatDimension(buildableLengthMm)
        }
      },
      roomBreakdown,
      diagnostics,
      recommendations
    };
  }

  /**
   * Converts a structured house specification into an itemized room list
   */
  static buildRoomProgram(spec) {
    const rooms = [];
    let counter = 1;

    // Living Room
    rooms.push({ id: `room_${counter++}`, name: 'Living Room', type: 'living' });

    // Dining Room
    if (spec.diningRoom !== false) {
      rooms.push({ id: `room_${counter++}`, name: 'Dining Room', type: 'dining' });
    }

    // Kitchen
    rooms.push({ id: `room_${counter++}`, name: 'Kitchen', type: 'kitchen' });

    // Master Bedroom
    rooms.push({ id: `room_${counter++}`, name: 'Master Bedroom', type: 'master_bedroom' });

    // Additional Bedrooms
    const bedroomCount = Math.max(1, spec.bedrooms || 3);
    for (let b = 2; b <= bedroomCount; b++) {
      rooms.push({ id: `room_${counter++}`, name: `Bedroom ${b}`, type: 'bedroom' });
    }

    // Bathrooms
    const attachedBaths = spec.bathrooms?.attached ?? 1;
    for (let a = 1; a <= attachedBaths; a++) {
      rooms.push({ id: `room_${counter++}`, name: `Attached Bath ${a}`, type: 'attached_bathroom' });
    }

    const commonBaths = spec.bathrooms?.common ?? 1;
    for (let c = 1; c <= commonBaths; c++) {
      rooms.push({ id: `room_${counter++}`, name: `Common Bath ${c}`, type: 'common_bathroom' });
    }

    // Pooja Room
    if (spec.poojaRoom) {
      rooms.push({ id: `room_${counter++}`, name: 'Pooja Room', type: 'pooja' });
    }

    // Study Room
    if (spec.studyRoom) {
      rooms.push({ id: `room_${counter++}`, name: 'Study Room', type: 'study' });
    }

    // Parking / Car Porch
    if (spec.parking?.required) {
      rooms.push({ id: `room_${counter++}`, name: 'Car Parking', type: 'parking' });
    }

    // Balcony
    if (spec.balcony) {
      rooms.push({ id: `room_${counter++}`, name: 'Balcony', type: 'balcony' });
    }

    return rooms;
  }
}
