/**
 * Deterministic Architectural Layout Generation Engine
 * Synthesizes physically feasible residential floor plans based on zoning rules,
 * plot setbacks, room dimensions, adjacency graphs, and architectural strategies.
 */

import { Point2D, Polygon2D, createRectanglePolygon } from '../core/geometry.js';
import { ROOM_DEFINITIONS, WALL_THICKNESS } from '../core/types.js';
import { sqmmToSqFt } from '../core/units.js';

export class LayoutGeneratorEngine {
  /**
   * Generates multiple architectural layout candidate alternatives
   * @param {Object} plot - Plot configuration
   * @param {Object} spec - House specification
   * @returns {Array} Array of candidate layout objects
   */
  static generateCandidates(plot, spec) {
    const candidates = [];

    // Candidate A: Family-Oriented (Central Living & Bedroom Privacy)
    const candidateA = this.generateSinglePlan(plot, spec, 'family-oriented');
    if (candidateA) candidates.push(candidateA);

    // Candidate B: Parking-Oriented (Dedicated Front Car Porch & Foyer)
    const candidateB = this.generateSinglePlan(plot, spec, 'parking-oriented');
    if (candidateB) candidates.push(candidateB);

    // Candidate C: Expansion / Vertical-Oriented (External-Access Staircase for Future Floors)
    const candidateC = this.generateSinglePlan(plot, spec, 'expansion-oriented');
    if (candidateC) candidates.push(candidateC);

    return candidates;
  }

  /**
   * Generates a single deterministic floor-plan candidate for a given strategy
   */
  static generateSinglePlan(plot, spec, strategy) {
    const plotWidth = plot.widthMm;
    const plotLength = plot.lengthMm;
    const setbacks = plot.setbacks || { frontMm: 1524, rearMm: 1219, leftMm: 914, rightMm: 914 };

    // Buildable envelope coordinates in world space (mm)
    const envX = setbacks.leftMm;
    const envY = setbacks.frontMm;
    const envWidth = Math.max(3000, plotWidth - (setbacks.leftMm + setbacks.rightMm));
    const envLength = Math.max(4000, plotLength - (setbacks.frontMm + setbacks.rearMm));

    const rooms = [];
    const walls = [];
    const openings = [];
    const furniture = [];

    // Layout Synthesis using Architectural Grid Partitioning
    // Divide buildable space into 3 primary longitudinal zones:
    // Front Zone (Road / Public Entrance), Middle Zone (Living / Dining / Core), Rear Zone (Private Bedrooms)
    const numBedrooms = Math.max(1, spec.bedrooms || 3);
    const hasParking = spec.parking?.required || strategy === 'parking-oriented';
    const isMultiFloor = (spec.floorsCount || 1) > 1 || strategy === 'expansion-oriented';

    let frontDepth = Math.round(envLength * (hasParking ? 0.28 : 0.22));
    let rearDepth = Math.round(envLength * 0.42);
    let midDepth = Math.max(3000, envLength - frontDepth - rearDepth);

    // Coordinate trackers
    let curY = envY;

    // ==========================================
    // 1. FRONT ZONE: Entrance, Parking, Porch / Foyer / Study
    // ==========================================
    if (strategy === 'parking-oriented' || hasParking) {
      const parkingWidth = Math.min(3650, Math.round(envWidth * 0.42)); // ~12 ft
      const foyerWidth = envWidth - parkingWidth;

      // Car Parking / Porch (Left or Right based on strategy)
      const parkX = strategy === 'parking-oriented' ? envX : envX + foyerWidth;
      const foyerX = strategy === 'parking-oriented' ? envX + parkingWidth : envX;

      rooms.push(this.createRoom({
        id: 'rm_parking',
        name: 'Car Parking / Porch',
        type: 'parking',
        x: parkX,
        y: curY,
        width: parkingWidth,
        height: frontDepth
      }));

      // Entrance Verandah / Foyer
      rooms.push(this.createRoom({
        id: 'rm_foyer',
        name: 'Entry Verandah',
        type: 'foyer',
        x: foyerX,
        y: curY,
        width: foyerWidth,
        height: frontDepth
      }));
    } else {
      // No parking: Front features Foyer and Drawing/Study Room
      const drawWidth = Math.round(envWidth * 0.60);
      const foyerWidth = envWidth - drawWidth;

      rooms.push(this.createRoom({
        id: 'rm_drawing',
        name: spec.studyRoom ? 'Study Room' : 'Formal Drawing',
        type: spec.studyRoom ? 'study' : 'living',
        x: envX,
        y: curY,
        width: drawWidth,
        height: frontDepth
      }));

      rooms.push(this.createRoom({
        id: 'rm_foyer',
        name: 'Entry Foyer',
        type: 'foyer',
        x: envX + drawWidth,
        y: curY,
        width: foyerWidth,
        height: frontDepth
      }));
    }

    curY += frontDepth;

    // ==========================================
    // 2. MIDDLE ZONE: Living, Dining, Kitchen, Pooja, Staircase
    // ==========================================
    if (strategy === 'expansion-oriented' || isMultiFloor) {
      // Future Expansion Strategy: Place staircase on exterior edge with independent entry
      const stairWidth = 2440; // 8 ft dog-legged staircase
      const livingWidth = Math.round((envWidth - stairWidth) * 0.58);
      const diningKitchenWidth = envWidth - stairWidth - livingWidth;

      // Staircase (on outer flank)
      rooms.push(this.createRoom({
        id: 'rm_stair',
        name: 'Staircase (Upper Floors)',
        type: 'staircase',
        x: envX,
        y: curY,
        width: stairWidth,
        height: midDepth
      }));

      // Central Living Hall
      rooms.push(this.createRoom({
        id: 'rm_living',
        name: 'Living Hall',
        type: 'living',
        x: envX + stairWidth,
        y: curY,
        width: livingWidth,
        height: midDepth
      }));

      // Split Dining and Kitchen vertically in the remaining bay
      const diningHeight = Math.round(midDepth * 0.52);
      const kitchenHeight = midDepth - diningHeight;

      rooms.push(this.createRoom({
        id: 'rm_dining',
        name: 'Dining Room',
        type: 'dining',
        x: envX + stairWidth + livingWidth,
        y: curY,
        width: diningKitchenWidth,
        height: diningHeight
      }));

      rooms.push(this.createRoom({
        id: 'rm_kitchen',
        name: 'Kitchen',
        type: 'kitchen',
        x: envX + stairWidth + livingWidth,
        y: curY + diningHeight,
        width: diningKitchenWidth,
        height: kitchenHeight
      }));
    } else {
      // Family / Parking Strategy: Open, expansive Living & Dining
      const livingWidth = Math.round(envWidth * 0.55);
      const serviceWidth = envWidth - livingWidth;

      // Living Hall
      rooms.push(this.createRoom({
        id: 'rm_living',
        name: 'Family Living Hall',
        type: 'living',
        x: envX,
        y: curY,
        width: livingWidth,
        height: midDepth
      }));

      // Service Flank: Dining + Kitchen + Pooja/Common Bath
      const diningHeight = Math.round(midDepth * 0.48);
      const kitchenHeight = Math.round(midDepth * 0.38);
      const poojaHeight = midDepth - diningHeight - kitchenHeight;

      rooms.push(this.createRoom({
        id: 'rm_dining',
        name: 'Dining Area',
        type: 'dining',
        x: envX + livingWidth,
        y: curY,
        width: serviceWidth,
        height: diningHeight
      }));

      rooms.push(this.createRoom({
        id: 'rm_kitchen',
        name: 'Modular Kitchen',
        type: 'kitchen',
        x: envX + livingWidth,
        y: curY + diningHeight,
        width: serviceWidth,
        height: kitchenHeight
      }));

      if (spec.poojaRoom && poojaHeight >= 1200) {
        rooms.push(this.createRoom({
          id: 'rm_pooja',
          name: 'Pooja Room',
          type: 'pooja',
          x: envX + livingWidth,
          y: curY + diningHeight + kitchenHeight,
          width: serviceWidth,
          height: poojaHeight
        }));
      }
    }

    curY += midDepth;

    // ==========================================
    // 3. REAR ZONE: Master Bedroom, Bedrooms, Bathrooms
    // ==========================================
    const masterBedWidth = Math.round(envWidth * 0.52);
    const bed2Width = envWidth - masterBedWidth;

    // Subdivide Rear Zone: Bedroom space + Bathroom strip
    const bathDepth = 1830; // 6 ft bath depth
    const bedDepth = rearDepth - bathDepth;

    // Master Bedroom (South-West / Rear quadrant)
    rooms.push(this.createRoom({
      id: 'rm_master_bed',
      name: 'Master Bedroom',
      type: 'master_bedroom',
      x: envX,
      y: curY,
      width: masterBedWidth,
      height: bedDepth
    }));

    // Attached Bathroom for Master Bed
    rooms.push(this.createRoom({
      id: 'rm_att_bath',
      name: 'Attached Bath',
      type: 'attached_bathroom',
      x: envX,
      y: curY + bedDepth,
      width: Math.round(masterBedWidth * 0.5),
      height: bathDepth
    }));

    // Common Bathroom / Utility
    rooms.push(this.createRoom({
      id: 'rm_com_bath',
      name: 'Common Bath',
      type: 'common_bathroom',
      x: envX + Math.round(masterBedWidth * 0.5),
      y: curY + bedDepth,
      width: masterBedWidth - Math.round(masterBedWidth * 0.5),
      height: bathDepth
    }));

    // Bedroom 2
    rooms.push(this.createRoom({
      id: 'rm_bed_2',
      name: numBedrooms > 2 ? 'Bedroom 2' : 'Guest Bedroom',
      type: 'bedroom',
      x: envX + masterBedWidth,
      y: curY,
      width: bed2Width,
      height: bedDepth
    }));

    // Rear Balcony / Utility attached to Bedroom 2
    rooms.push(this.createRoom({
      id: 'rm_utility',
      name: spec.balcony ? 'Balcony' : 'Utility',
      type: spec.balcony ? 'balcony' : 'utility',
      x: envX + masterBedWidth,
      y: curY + bedDepth,
      width: bed2Width,
      height: bathDepth
    }));

    // If 3+ bedrooms requested and plot has ample width, or on upper floor
    if (numBedrooms >= 3 && envWidth > 9000) {
      // Additional bedroom can be accommodated
    }

    // 4. Generate Structural & Partition Walls
    const synthesizedWalls = this.synthesizeWalls(rooms, envX, envY, envWidth, envLength);

    // 5. Generate Doors & Windows based on Room Types and Exterior Perimeters
    const synthesizedOpenings = this.synthesizeOpenings(rooms, synthesizedWalls, envX, envY, envWidth, envLength);

    // 6. Populate Default Furniture
    const synthesizedFurniture = this.synthesizeFurniture(rooms);

    // 7. Calculate Area Schedule
    let totalCarpetSqFt = 0;
    for (const r of rooms) {
      totalCarpetSqFt += r.areaSqFt;
    }
    const builtUpSqFt = Math.round(totalCarpetSqFt * 1.22);

    const strategyNames = {
      'family-oriented': 'Option A: Family-Centric Layout',
      'parking-oriented': 'Option B: Front Porch & Parking Layout',
      'expansion-oriented': 'Option C: Multi-Floor & Rental Expansion'
    };

    const strategyDescriptions = {
      'family-oriented': 'Spacious interconnected living and dining spaces, private master retreat, optimal natural cross-ventilation.',
      'parking-oriented': 'Dedicated sheltered vehicular parking bay, wide entrance verandah, efficient room circulation.',
      'expansion-oriented': 'External staircase placement allowing independent upper-floor tenant or expansion access without disturbing ground floor privacy.'
    };

    return {
      id: `candidate_${strategy}_${Date.now()}`,
      strategy,
      name: strategyNames[strategy] || 'Architectural Layout',
      description: strategyDescriptions[strategy] || '',
      plotWidth,
      plotLength,
      setbacks,
      floors: [
        {
          id: 'floor_ground',
          level: 0,
          name: 'Ground Floor',
          rooms,
          walls: synthesizedWalls,
          openings: synthesizedOpenings,
          furniture: synthesizedFurniture
        }
      ],
      metrics: {
        totalCarpetSqFt: Math.round(totalCarpetSqFt),
        builtUpSqFt,
        roomCount: rooms.length
      }
    };
  }

  /**
   * Helper to construct a room domain object with polygon and dimensions
   */
  static createRoom({ id, name, type, x, y, width, height }) {
    const polygon = createRectanglePolygon(x, y, width, height);
    const areaSqMm = width * height;
    const areaSqFt = Math.round(sqmmToSqFt(areaSqMm) * 10) / 10;
    const def = ROOM_DEFINITIONS[type] || {};

    return {
      id,
      name,
      type,
      x,
      y,
      width,
      height,
      polygon,
      areaSqMm,
      areaSqFt,
      color: def.color || '#3b82f6',
      bgLight: def.bgLight || 'rgba(59, 130, 246, 0.12)',
      openings: [],
      furniture: []
    };
  }

  /**
   * Generates continuous exterior and interior wall segments from room polygons
   */
  static synthesizeWalls(rooms, envX, envY, envWidth, envLength) {
    const walls = [];
    let wallCounter = 1;

    // Collect all edges from all rooms
    for (const room of rooms) {
      const edges = room.polygon.getEdges();
      for (const edge of edges) {
        // Determine if edge is on exterior perimeter
        const isExterior =
          Math.abs(edge.start.x - envX) < 10 && Math.abs(edge.end.x - envX) < 10 ||
          Math.abs(edge.start.x - (envX + envWidth)) < 10 && Math.abs(edge.end.x - (envX + envWidth)) < 10 ||
          Math.abs(edge.start.y - envY) < 10 && Math.abs(edge.end.y - envY) < 10 ||
          Math.abs(edge.start.y - (envY + envLength)) < 10 && Math.abs(edge.end.y - (envY + envLength)) < 10;

        // Deduplicate overlapping collinear segments
        const existing = walls.find(w =>
          (w.start.equals(edge.start, 15) && w.end.equals(edge.end, 15)) ||
          (w.start.equals(edge.end, 15) && w.end.equals(edge.start, 15))
        );

        if (!existing) {
          walls.push({
            id: `wall_${wallCounter++}`,
            start: edge.start.clone(),
            end: edge.end.clone(),
            thickness: isExterior ? WALL_THICKNESS.exterior : WALL_THICKNESS.interior,
            type: isExterior ? 'exterior' : 'interior'
          });
        }
      }
    }

    return walls;
  }

  /**
   * Places doors and windows intelligently based on room adjacencies
   */
  static synthesizeOpenings(rooms, walls, envX, envY, envWidth, envLength) {
    const openings = [];
    let opCounter = 1;

    for (const room of rooms) {
      // 1. Exterior Windows: Place on exterior walls of habitable rooms
      if (['master_bedroom', 'bedroom', 'living', 'kitchen', 'dining', 'study'].includes(room.type)) {
        // Check if room touches exterior boundary
        const edges = room.polygon.getEdges();
        for (const edge of edges) {
          const isExterior =
            (Math.abs(edge.start.x - envX) < 20 && Math.abs(edge.end.x - envX) < 20) ||
            (Math.abs(edge.start.x - (envX + envWidth)) < 20 && Math.abs(edge.end.x - (envX + envWidth)) < 20) ||
            (Math.abs(edge.start.y - envY) < 20 && Math.abs(edge.end.y - envY) < 20) ||
            (Math.abs(edge.start.y - (envY + envLength)) < 20 && Math.abs(edge.end.y - (envY + envLength)) < 20);

          if (isExterior && edge.length >= 1500) {
            // Find corresponding wall
            const wall = walls.find(w =>
              (w.start.equals(edge.start, 50) && w.end.equals(edge.end, 50)) ||
              (w.start.equals(edge.end, 50) && w.end.equals(edge.start, 50))
            );

            if (wall) {
              const winWidth = room.type === 'kitchen' ? 1200 : 1500;
              const offset = Math.max(300, (edge.length - winWidth) / 2);
              openings.push({
                id: `win_${opCounter++}`,
                wallId: wall.id,
                roomId: room.id,
                type: 'window',
                offset,
                width: winWidth,
                height: 1200,
                position: edge.pointAtOffset(offset)
              });
              break; // One primary window per room
            }
          }
        }
      }

      // 2. Interior Doors: Place on interior wall connected to corridor or living/foyer
      const doorWidth = room.type.includes('bath') ? 750 : (room.type === 'foyer' || room.type === 'living' ? 1000 : 900);
      const edges = room.polygon.getEdges();

      for (const edge of edges) {
        // Interior edge check
        const isExterior =
          (Math.abs(edge.start.x - envX) < 20 && Math.abs(edge.end.x - envX) < 20) ||
          (Math.abs(edge.start.x - (envX + envWidth)) < 20 && Math.abs(edge.end.x - (envX + envWidth)) < 20) ||
          (Math.abs(edge.start.y - envY) < 20 && Math.abs(edge.end.y - envY) < 20) ||
          (Math.abs(edge.start.y - (envY + envLength)) < 20 && Math.abs(edge.end.y - (envY + envLength)) < 20);

        if (!isExterior && edge.length >= doorWidth + 300) {
          const wall = walls.find(w =>
            (w.start.equals(edge.start, 50) && w.end.equals(edge.end, 50)) ||
            (w.start.equals(edge.end, 50) && w.end.equals(edge.start, 50))
          );

          if (wall) {
            const offset = 200; // 200mm from corner
            openings.push({
              id: `door_${opCounter++}`,
              wallId: wall.id,
              roomId: room.id,
              type: 'door',
              offset,
              width: doorWidth,
              height: 2100,
              swingDirection: 'inward-left',
              position: edge.pointAtOffset(offset)
            });
            break; // One main door
          }
        }
      }
    }

    return openings;
  }

  /**
   * Places default furniture items with accurate bounding dimensions
   */
  static synthesizeFurniture(rooms) {
    const furniture = [];
    let fnCounter = 1;

    for (const room of rooms) {
      if (room.type === 'master_bedroom') {
        // King Bed centered along headboard wall
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'King Size Bed',
          type: 'bed_king',
          x: room.x + Math.round((room.width - 1980) / 2),
          y: room.y + 200,
          width: 1980,
          length: 2080,
          rotation: 0
        });
        // Wardrobe
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Wardrobe',
          type: 'wardrobe',
          x: room.x + room.width - 650,
          y: room.y + 300,
          width: 600,
          length: 1800,
          rotation: 90
        });
      } else if (room.type === 'bedroom') {
        // Queen Bed
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Queen Bed',
          type: 'bed_queen',
          x: room.x + Math.round((room.width - 1520) / 2),
          y: room.y + 200,
          width: 1520,
          length: 2000,
          rotation: 0
        });
      } else if (room.type === 'living') {
        // 3-Seater Sofa
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: '3-Seater Sofa',
          type: 'sofa_3seater',
          x: room.x + 400,
          y: room.y + 400,
          width: 2100,
          length: 850,
          rotation: 0
        });
        // Coffee Table
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Coffee Table',
          type: 'coffee_table',
          x: room.x + 800,
          y: room.y + 1450,
          width: 1100,
          length: 600,
          rotation: 0
        });
        // TV Unit
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Media Console',
          type: 'tv_unit',
          x: room.x + 500,
          y: room.y + room.height - 500,
          width: 1800,
          length: 450,
          rotation: 0
        });
      } else if (room.type === 'dining') {
        // 6-Seater Dining Table
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Dining Table (6 Seater)',
          type: 'dining_table_6',
          x: room.x + Math.round((room.width - 1500) / 2),
          y: room.y + Math.round((room.height - 900) / 2),
          width: 1500,
          length: 900,
          rotation: 0
        });
      } else if (room.type === 'parking') {
        // Car Footprint
        furniture.push({
          id: `fn_${fnCounter++}`,
          roomId: room.id,
          name: 'Sedan / SUV Parking Footprint',
          type: 'car_footprint',
          x: room.x + Math.round((room.width - 1800) / 2),
          y: room.y + Math.round((room.height - 4500) / 2),
          width: 1800,
          length: 4500,
          rotation: 0
        });
      }
    }

    return furniture;
  }
}
