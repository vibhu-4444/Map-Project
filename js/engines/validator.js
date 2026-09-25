/**
 * Geometry & Architectural Constraint Validator
 * Performs continuous geometric audits: boundary containment, room overlaps,
 * minimum residential dimensions, ventilation codes, door clearances, and multi-floor alignment.
 */

import { doPolygonsOverlap, getRectangleOverlapArea, createRectanglePolygon } from '../core/geometry.js';
import { ROOM_DEFINITIONS } from '../core/types.js';
import { formatDimension } from '../core/units.js';

export class GeometryValidator {
  /**
   * Performs a comprehensive validation audit on a project floor or candidate
   * @param {Object} floor - Floor object containing rooms, walls, openings
   * @param {Object} plot - Plot configuration
   * @returns {Object} ValidationReport
   */
  static validateFloor(floor, plot) {
    const issues = [];
    const rooms = floor.rooms || [];
    const openings = floor.openings || [];

    const plotWidth = plot.widthMm;
    const plotLength = plot.lengthMm;
    const setbacks = plot.setbacks || { frontMm: 1524, rearMm: 1219, leftMm: 914, rightMm: 914 };

    // Outer Plot Boundary Polygon
    const plotPolygon = createRectanglePolygon(0, 0, plotWidth, plotLength);

    // Inner Setback / Buildable Envelope Polygon
    const envX = setbacks.leftMm;
    const envY = setbacks.frontMm;
    const envW = Math.max(0, plotWidth - (setbacks.leftMm + setbacks.rightMm));
    const envL = Math.max(0, plotLength - (setbacks.frontMm + setbacks.rearMm));
    const setbackPolygon = createRectanglePolygon(envX, envY, envW, envL);

    // 1. Plot & Setback Boundary Containment Check
    for (const room of rooms) {
      // Check if room extends outside plot boundary
      if (room.x < -10 || room.y < -10 ||
          (room.x + room.width) > plotWidth + 10 ||
          (room.y + room.height) > plotLength + 10) {
        issues.push({
          id: `iss_bounds_${room.id}`,
          ruleId: 'ERR_PLOT_OUT_OF_BOUNDS',
          severity: 'error',
          category: 'bounds',
          affectedObjectId: room.id,
          message: `${room.name} extends outside the legal plot boundary.`,
          suggestion: 'Move or resize the room to fit entirely inside the plot perimeter.'
        });
      }
      // Check if room encroaches on mandatory setbacks (except parking which can occupy front setback)
      else if (room.type !== 'parking' && room.type !== 'foyer') {
        const encroachesLeft = room.x < envX - 10;
        const encroachesRight = (room.x + room.width) > (envX + envW + 10);
        const encroachesFront = room.y < envY - 10;
        const encroachesRear = (room.y + room.height) > (envY + envL + 10);

        if (encroachesLeft || encroachesRight || encroachesFront || encroachesRear) {
          issues.push({
            id: `iss_setback_${room.id}`,
            ruleId: 'WARN_SETBACK_ENCROACHMENT',
            severity: 'warning',
            category: 'bounds',
            affectedObjectId: room.id,
            message: `${room.name} encroaches into mandatory setbacks.`,
            suggestion: `Ensure setbacks are respected: Front ${formatDimension(setbacks.frontMm)}, Rear ${formatDimension(setbacks.rearMm)}, Sides ${formatDimension(setbacks.leftMm)}.`
          });
        }
      }
    }

    // 2. Room-to-Room Geometric Collision / Overlap Check
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const roomA = rooms[i];
        const roomB = rooms[j];

        const overlapArea = getRectangleOverlapArea(roomA.polygon, roomB.polygon);
        // Overlap threshold: > 1000 mm² (~1.5 sq.inch) to disregard touch boundaries
        if (overlapArea > 1000) {
          issues.push({
            id: `iss_overlap_${roomA.id}_${roomB.id}`,
            ruleId: 'ERR_ROOM_OVERLAP',
            severity: 'error',
            category: 'overlap',
            affectedObjectId: roomA.id,
            message: `Geometric collision: ${roomA.name} and ${roomB.name} overlap by ${(overlapArea / 1e6).toFixed(2)} m².`,
            suggestion: 'Separate or resize these rooms so they share a boundary wall without overlapping.'
          });
        }
      }
    }

    // 3. Minimum Room Dimensions & Proportions Check
    for (const room of rooms) {
      const def = ROOM_DEFINITIONS[room.type];
      if (def) {
        const minW = Math.min(room.width, room.height);
        const minSpanRequired = def.minWidthMm;

        if (minW < minSpanRequired * 0.88) {
          issues.push({
            id: `iss_dim_${room.id}`,
            ruleId: 'WARN_MIN_DIMENSION',
            severity: 'warning',
            category: 'dimensions',
            affectedObjectId: room.id,
            message: `${room.name} span (${formatDimension(minW)}) is narrower than standard residential code minimum (${formatDimension(minSpanRequired)}).`,
            suggestion: `Expand width to at least ${formatDimension(minSpanRequired)} for comfortable furniture placement and circulation.`
          });
        }

        // Aspect ratio check (avoid long tunnel-like rooms)
        const maxSpan = Math.max(room.width, room.height);
        const aspectRatio = maxSpan / Math.max(1, minW);
        if (aspectRatio > 2.8 && !['corridor', 'balcony', 'utility'].includes(room.type)) {
          issues.push({
            id: `iss_aspect_${room.id}`,
            ruleId: 'WARN_ASPECT_RATIO',
            severity: 'info',
            category: 'dimensions',
            affectedObjectId: room.id,
            message: `${room.name} has an elongated aspect ratio (${aspectRatio.toFixed(1)}:1).`,
            suggestion: 'Residential spaces function best with an aspect ratio between 1:1 and 1:1.8.'
          });
        }
      }
    }

    // 4. Natural Daylighting & Cross-Ventilation Audit
    for (const room of rooms) {
      const def = ROOM_DEFINITIONS[room.type];
      if (def && def.requiresVentilation) {
        const roomWindows = openings.filter(op => op.roomId === room.id && op.type === 'window');
        if (roomWindows.length === 0) {
          issues.push({
            id: `iss_vent_${room.id}`,
            ruleId: 'WARN_NO_NATURAL_VENTILATION',
            severity: 'warning',
            category: 'ventilation',
            affectedObjectId: room.id,
            message: `${room.name} has no designated exterior window for natural ventilation.`,
            suggestion: 'Place a window on an exterior wall facing the plot setback or light shaft.'
          });
        }
      }
    }

    // 5. Door Access Clearance Audit
    for (const room of rooms) {
      if (room.type !== 'parking' && room.type !== 'balcony') {
        const roomDoors = openings.filter(op => op.roomId === room.id && op.type === 'door');
        if (roomDoors.length === 0) {
          issues.push({
            id: `iss_door_${room.id}`,
            ruleId: 'ERR_NO_DOOR_ACCESS',
            severity: 'error',
            category: 'circulation',
            affectedObjectId: room.id,
            message: `${room.name} has no doorway entry opening.`,
            suggestion: 'Add a door opening connecting this room to the corridor or living hall.'
          });
        }
      }
    }

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    return {
      isValid: errorCount === 0,
      errorCount,
      warningCount,
      infoCount,
      issues
    };
  }

  /**
   * Multi-floor vertical circulation alignment validation
   */
  static validateMultiFloorAlignment(groundFloor, upperFloor) {
    const issues = [];
    const groundStairs = (groundFloor.rooms || []).filter(r => r.type === 'staircase');
    const upperStairs = (upperFloor.rooms || []).filter(r => r.type === 'staircase');

    if (upperStairs.length > 0 && groundStairs.length === 0) {
      issues.push({
        id: 'iss_stair_missing_ground',
        ruleId: 'ERR_STAIR_NO_BASE',
        severity: 'error',
        category: 'circulation',
        message: 'Upper floor has a staircase but no corresponding base flight exists on the Ground Floor.',
        suggestion: 'Align staircase location on both floors to form a continuous vertical structural core.'
      });
    } else if (upperStairs.length > 0 && groundStairs.length > 0) {
      const gStair = groundStairs[0];
      const uStair = upperStairs[0];

      // Check horizontal footprint alignment
      const dx = Math.abs(gStair.x - uStair.x);
      const dy = Math.abs(gStair.y - uStair.y);

      if (dx > 300 || dy > 300) {
        issues.push({
          id: 'iss_stair_misaligned',
          ruleId: 'WARN_STAIR_MISALIGNMENT',
          severity: 'warning',
          category: 'circulation',
          message: `Staircase shaft is vertically offset between floors (dx: ${formatDimension(dx)}, dy: ${formatDimension(dy)}).`,
          suggestion: 'Snap the upper floor staircase directly above the ground floor staircase for structural alignment.'
        });
      }
    }

    return issues;
  }
}
