/**
 * Area Calculation & Room Schedule Engine
 * Computes exact carpet areas, built-up areas (BUA), wall footprints,
 * circulation metrics, open setbacks, and room schedule tables from authoritative geometry.
 */

import { sqmmToSqFt, sqmmToSqM, formatArea, formatDimension } from '../core/units.js';

export class AreaCalculatorEngine {
  /**
   * Generates a complete area breakdown report for a project
   * @param {Object} project - Project state containing plot and floors
   * @param {string} unitSystem - 'sqft' | 'sqm' | 'sqyd' | 'cent'
   * @returns {Object} Comprehensive area schedule and summary
   */
  static computeProjectAreas(project, unitSystem = 'sqft') {
    const plot = project.plot;
    const plotAreaSqMm = plot.widthMm * plot.lengthMm;
    const plotAreaSqFt = sqmmToSqFt(plotAreaSqMm);

    const floors = project.floors || [];
    const floorSchedules = [];

    let totalProjectCarpetSqFt = 0;
    let totalProjectWallSqFt = 0;
    let totalProjectBuiltUpSqFt = 0;
    let totalCirculationSqFt = 0;
    let totalParkingSqFt = 0;

    for (const floor of floors) {
      const schedule = this.computeFloorSchedule(floor, unitSystem);
      floorSchedules.push(schedule);

      totalProjectCarpetSqFt += schedule.totalCarpetSqFt;
      totalProjectWallSqFt += schedule.wallAreaSqFt;
      totalProjectBuiltUpSqFt += schedule.builtUpSqFt;
      totalCirculationSqFt += schedule.circulationSqFt;
      totalParkingSqFt += schedule.parkingSqFt;
    }

    // Ground floor footprint for ground coverage calculation
    const groundFloor = floors.find(f => f.level === 0) || floors[0];
    const groundCoverageSqFt = groundFloor
      ? floorSchedules.find(s => s.floorId === groundFloor.id)?.builtUpSqFt || 0
      : 0;

    const groundCoveragePercent = plotAreaSqFt > 0
      ? Math.round((groundCoverageSqFt / plotAreaSqFt) * 1000) / 10
      : 0;

    const floorAreaRatio = plotAreaSqFt > 0
      ? Math.round((totalProjectBuiltUpSqFt / plotAreaSqFt) * 100) / 100
      : 0;

    const openSetbackAreaSqFt = Math.max(0, plotAreaSqFt - groundCoverageSqFt);

    return {
      unitSystem,
      summary: {
        plotArea: formatArea(plotAreaSqMm, unitSystem),
        plotAreaSqFt: Math.round(plotAreaSqFt),
        totalBuiltUpArea: formatArea(totalProjectBuiltUpSqFt * 92903.04, unitSystem),
        totalBuiltUpAreaSqFt: Math.round(totalProjectBuiltUpSqFt),
        totalCarpetArea: formatArea(totalProjectCarpetSqFt * 92903.04, unitSystem),
        totalCarpetAreaSqFt: Math.round(totalProjectCarpetSqFt),
        groundCoveragePercent,
        floorAreaRatio,
        openAreaSqFt: Math.round(openSetbackAreaSqFt),
        parkingAreaSqFt: Math.round(totalParkingSqFt),
        efficiencyRatioPercent: totalProjectBuiltUpSqFt > 0
          ? Math.round((totalProjectCarpetSqFt / totalProjectBuiltUpSqFt) * 100)
          : 0
      },
      floors: floorSchedules
    };
  }

  /**
   * Generates room-by-room area schedule for a single floor
   */
  static computeFloorSchedule(floor, unitSystem = 'sqft') {
    const rooms = floor.rooms || [];
    const walls = floor.walls || [];

    let totalCarpetSqMm = 0;
    let circulationSqMm = 0;
    let parkingSqMm = 0;
    const roomItems = [];

    // Calculate room areas from actual polygon geometry
    for (const room of rooms) {
      const areaSqMm = room.polygon ? room.polygon.area : room.width * room.height;
      const areaSqFt = sqmmToSqFt(areaSqMm);
      const areaSqM = sqmmToSqM(areaSqMm);

      totalCarpetSqMm += areaSqMm;

      if (['foyer', 'corridor', 'staircase'].includes(room.type)) {
        circulationSqMm += areaSqMm;
      }
      if (room.type === 'parking') {
        parkingSqMm += areaSqMm;
      }

      roomItems.push({
        id: room.id,
        name: room.name,
        type: room.type,
        widthMm: room.width,
        heightMm: room.height,
        dimensionFormatted: `${formatDimension(room.width)} × ${formatDimension(room.height)}`,
        areaSqFt: Math.round(areaSqFt * 10) / 10,
        areaSqM: Math.round(areaSqM * 10) / 10,
        areaFormatted: formatArea(areaSqMm, unitSystem),
        percentage: 0 // populated below
      });
    }

    // Populate carpet percentage
    const totalCarpetSqFt = sqmmToSqFt(totalCarpetSqMm);
    for (const item of roomItems) {
      item.percentage = totalCarpetSqFt > 0
        ? Math.round((item.areaSqFt / totalCarpetSqFt) * 1000) / 10
        : 0;
    }

    // Calculate wall area: Sum of (wall length * thickness)
    let wallAreaSqMm = 0;
    for (const wall of walls) {
      const len = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      wallAreaSqMm += len * (wall.thickness || 150);
    }
    // Deduplicate corner overlaps approximation factor: ~0.85
    wallAreaSqMm = wallAreaSqMm * 0.85;

    // Built-up area = carpet area + wall area
    const wallAreaSqFt = sqmmToSqFt(wallAreaSqMm);
    const builtUpSqFt = totalCarpetSqFt + wallAreaSqFt;

    return {
      floorId: floor.id,
      floorName: floor.name || `Floor ${floor.level}`,
      level: floor.level,
      roomCount: rooms.length,
      rooms: roomItems,
      totalCarpetSqFt: Math.round(totalCarpetSqFt),
      wallAreaSqFt: Math.round(wallAreaSqFt),
      builtUpSqFt: Math.round(builtUpSqFt),
      circulationSqFt: Math.round(sqmmToSqFt(circulationSqMm)),
      parkingSqFt: Math.round(sqmmToSqFt(parkingSqMm))
    };
  }
}
