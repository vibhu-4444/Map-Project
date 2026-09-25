/**
 * Vastu-Aware Architectural Design Engine
 * Directional octant mapping, space alignment scoring, and non-destructive architectural advisories.
 * Note: Treated strictly as design preferences; does not claim legal or structural authority.
 */

export const VASTU_PREFERENCES = {
  master_bedroom: {
    recommended: ['SW', 'S'],
    acceptable: ['W'],
    avoid: ['NE', 'SE'],
    zoneName: 'Nairutya (South-West)',
    rationale: 'South-West represents grounding, stability, and restful master occupancy.'
  },
  kitchen: {
    recommended: ['SE'],
    acceptable: ['NW'],
    avoid: ['NE', 'SW'],
    zoneName: 'Agni (South-East)',
    rationale: 'South-East is the fire quadrant (Agneya), ideal for cooking heat and morning solar gain.'
  },
  pooja: {
    recommended: ['NE'],
    acceptable: ['E', 'N'],
    avoid: ['S', 'SW'],
    zoneName: 'Ishanya (North-East)',
    rationale: 'North-East represents maximum early morning sunlight, tranquility, and clarity.'
  },
  living: {
    recommended: ['N', 'NE', 'E'],
    acceptable: ['NW'],
    avoid: ['SW'],
    zoneName: 'Ishanya / East / North',
    rationale: 'Welcoming natural light from the North and East for social gatherings and vitality.'
  },
  staircase: {
    recommended: ['S', 'SW', 'W'],
    acceptable: ['NW', 'SE'],
    avoid: ['NE'],
    zoneName: 'Nairutya / South / West',
    rationale: 'Heavy structural vertical cores are placed in the heavy South/West quadrants.'
  },
  water_closet: {
    recommended: ['NW', 'W'],
    acceptable: ['S'],
    avoid: ['NE'],
    zoneName: 'Vayu (North-West) / West',
    rationale: 'Drainage and sanitary services oriented away from the morning solar quadrant.'
  }
};

export class VastuEngine {
  /**
   * Evaluates the Vastu directional alignment of all rooms on a floor
   * @param {Object} floor - Floor containing rooms
   * @param {Object} plot - Plot configuration with orientation (North direction)
   * @returns {Object} Vastu compliance report and recommendations
   */
  static evaluate(floor, plot) {
    const rooms = floor.rooms || [];
    const plotWidth = plot.widthMm;
    const plotLength = plot.lengthMm;
    const orientation = plot.orientation || 'north'; // 'north' facing by default

    const findings = [];
    let totalScore = 0;
    let scorableCount = 0;

    for (const room of rooms) {
      const pref = VASTU_PREFERENCES[room.type];
      if (!pref) continue;

      scorableCount++;
      const center = room.polygon ? room.polygon.centroid : { x: room.x + room.width / 2, y: room.y + room.height / 2 };
      const octant = this.calculateOctant(center.x, center.y, plotWidth, plotLength, orientation);

      let status = 'neutral';
      let score = 50;
      let advice = '';

      if (pref.recommended.includes(octant)) {
        status = 'optimal';
        score = 100;
        advice = `Excellent alignment: ${room.name} is positioned in the ${octant} zone (${pref.zoneName}), adhering to Vastu principles.`;
      } else if (pref.acceptable.includes(octant)) {
        status = 'acceptable';
        score = 75;
        advice = `Acceptable secondary position: ${room.name} in ${octant}. Ideal quadrant is ${pref.recommended.join(' or ')}.`;
      } else if (pref.avoid.includes(octant)) {
        status = 'conflict';
        score = 25;
        advice = `Directional conflict: ${room.name} is in the ${octant} zone. Consider shifting towards ${pref.recommended.join(' or ')} if feasible.`;
      } else {
        status = 'neutral';
        score = 60;
        advice = `${room.name} is currently in ${octant}. Traditional preference is ${pref.recommended.join(' or ')}.`;
      }

      totalScore += score;
      findings.push({
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        currentOctant: octant,
        recommendedOctants: pref.recommended,
        status, // 'optimal' | 'acceptable' | 'conflict' | 'neutral'
        score,
        advice,
        rationale: pref.rationale
      });
    }

    const overallScore = scorableCount > 0 ? Math.round(totalScore / scorableCount) : 80;

    return {
      overallScore,
      overallRating: overallScore >= 85 ? 'Excellent' : overallScore >= 70 ? 'Favorable' : 'Moderate',
      findings,
      plotOrientation: orientation.toUpperCase()
    };
  }

  /**
   * Maps an (x, y) coordinate within plot boundaries to one of 8 Vastu octants (N, NE, E, SE, S, SW, W, NW)
   */
  static calculateOctant(x, y, plotWidth, plotLength, orientation = 'north') {
    // Relative coordinates [0..1]
    const rx = Math.max(0, Math.min(1, x / plotWidth));
    const ry = Math.max(0, Math.min(1, y / plotLength));

    // By default: (0,0) is North-West if top is North, Left is West
    // Top = North (ry < 0.33), Bottom = South (ry > 0.66)
    // Left = West (rx < 0.33), Right = East (rx > 0.66)
    let octant = 'C'; // Center

    if (ry <= 0.38) {
      if (rx <= 0.38) octant = 'NW';
      else if (rx >= 0.62) octant = 'NE';
      else octant = 'N';
    } else if (ry >= 0.62) {
      if (rx <= 0.38) octant = 'SW';
      else if (rx >= 0.62) octant = 'SE';
      else octant = 'S';
    } else {
      if (rx <= 0.38) octant = 'W';
      else if (rx >= 0.62) octant = 'E';
      else octant = 'C';
    }

    // Apply orientation rotation if plot faces East, South, or West
    return this.rotateOctant(octant, orientation);
  }

  static rotateOctant(octant, orientation) {
    if (octant === 'C' || orientation === 'north') return octant;

    const octantsCW = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    let steps = 0;
    if (orientation === 'east') steps = 2;       // 90 deg CW
    else if (orientation === 'south') steps = 4; // 180 deg
    else if (orientation === 'west') steps = 6;  // 270 deg

    const idx = octantsCW.indexOf(octant);
    if (idx === -1) return octant;
    return octantsCW[(idx + steps) % 8];
  }
}
