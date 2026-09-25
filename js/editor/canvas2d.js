/**
 * Precision 2D Architectural Floor-Plan SVG & Canvas Renderer
 * Renders plot boundaries, setbacks, double-line walls, room stamps, dimension lines,
 * door swing arcs, windows, furniture symbols, north arrow, and CAD scale bar.
 */

import { formatDimension, formatArea } from '../core/units.js';
import { ROOM_DEFINITIONS, WALL_THICKNESS } from '../core/types.js';

export class FloorPlanRenderer2D {
  constructor(svgContainer, options = {}) {
    this.container = svgContainer;
    this.options = {
      zoom: 1.0,
      panX: 40,
      panY: 40,
      showGrid: true,
      showDimensions: true,
      showFurniture: true,
      showSetbacks: true,
      showLabels: true,
      unitSystem: 'ft-in',
      areaUnit: 'sqft',
      ...options
    };

    this.selectedObjectId = null;
    this.hoverObjectId = null;
  }

  /**
   * Main render dispatch for the active floor and plot
   * @param {Object} floor - Active floor object
   * @param {Object} plot - Plot configuration
   * @param {Object} validationReport - Current validation issues
   */
  render(floor, plot, validationReport = null) {
    if (!this.container || !floor || !plot) return;

    const plotW = plot.widthMm;
    const plotL = plot.lengthMm;

    // Viewbox calculation: Pad plot dimensions by 25% for dimension lines and labels
    const pad = 2400; // 2.4 meters padding
    const vbX = -pad;
    const vbY = -pad;
    const vbW = plotW + pad * 2;
    const vbH = plotL + pad * 2;

    let svgHtml = `
      <svg id="cad-svg-canvas" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" 
           style="width: 100%; height: 100%; display: block; background: #0f172a; user-select: none;"
           xmlns="http://www.w3.org/2000/svg">
        
        <defs>
          <!-- Grid Pattern -->
          <pattern id="grid-minor" width="304.8" height="304.8" patternUnits="userSpaceOnUse">
            <path d="M 304.8 0 L 0 0 0 304.8" fill="none" stroke="#1e293b" stroke-width="6"/>
          </pattern>
          <pattern id="grid-major" width="1524" height="1524" patternUnits="userSpaceOnUse">
            <rect width="1524" height="1524" fill="url(#grid-minor)"/>
            <path d="M 1524 0 L 0 0 0 1524" fill="none" stroke="#334155" stroke-width="14"/>
          </pattern>
          
          <!-- Drop Shadows & Filters -->
          <filter id="shadow-room" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="15" stdDeviation="25" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <filter id="selection-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="35" flood-color="#38bdf8" flood-opacity="0.8"/>
          </filter>
        </defs>

        <!-- Dynamic Transform Group for Pan & Zoom -->
        <g id="world-layer">
          <!-- 1. Background Grid -->
          ${this.options.showGrid ? `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="url(#grid-major)" />` : ''}

          <!-- 2. Plot Boundary & Compound Wall -->
          ${this.renderPlotBoundary(plot)}

          <!-- 3. Setback Envelopes (Dashed Architectural Guide) -->
          ${this.options.showSetbacks ? this.renderSetbacks(plot) : ''}

          <!-- 4. Room Slabs & Shading -->
          ${this.renderRooms(floor.rooms || [])}

          <!-- 5. Furniture Layout Symbols -->
          ${this.options.showFurniture ? this.renderFurniture(floor.furniture || []) : ''}

          <!-- 6. Architectural Structural & Partition Walls -->
          ${this.renderWalls(floor.walls || [], floor.rooms || [])}

          <!-- 7. Door & Window Openings with Swing Arcs -->
          ${this.renderOpenings(floor.openings || [])}

          <!-- 8. Room Label Stamps & Area Badges -->
          ${this.options.showLabels ? this.renderRoomLabels(floor.rooms || []) : ''}

          <!-- 9. Architectural Dimension Lines & Ticks -->
          ${this.options.showDimensions ? this.renderDimensionLines(plot, floor.rooms || []) : ''}

          <!-- 10. Architectural Annotations (North Arrow, Road, Scale) -->
          ${this.renderPlotAnnotations(plot)}
        </g>
      </svg>
    `;

    this.container.innerHTML = svgHtml;
  }

  renderPlotBoundary(plot) {
    const w = plot.widthMm;
    const l = plot.lengthMm;
    return `
      <!-- Plot Boundary -->
      <g id="layer-plot">
        <rect x="0" y="0" width="${w}" height="${l}" 
              fill="#0b1120" stroke="#475569" stroke-width="32" stroke-dasharray="80 30" rx="10"/>
        <rect x="-80" y="-80" width="${w + 160}" height="${l + 160}" 
              fill="none" stroke="#334155" stroke-width="12"/>
      </g>
    `;
  }

  renderSetbacks(plot) {
    const sb = plot.setbacks || { frontMm: 1524, rearMm: 1219, leftMm: 914, rightMm: 914 };
    const x = sb.leftMm;
    const y = sb.frontMm;
    const w = Math.max(0, plot.widthMm - (sb.leftMm + sb.rightMm));
    const h = Math.max(0, plot.lengthMm - (sb.frontMm + sb.rearMm));

    return `
      <g id="layer-setbacks">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" 
              fill="none" stroke="#38bdf8" stroke-width="16" stroke-dasharray="50 30" opacity="0.6"/>
        <text x="${x + 60}" y="${y + 120}" fill="#38bdf8" font-size="90" font-family="'Inter', sans-serif" opacity="0.75" font-weight="600">
          BUILDABLE FOOTPRINT
        </text>
      </g>
    `;
  }

  renderRooms(rooms) {
    return `
      <g id="layer-rooms">
        ${rooms.map(room => {
          const isSelected = this.selectedObjectId === room.id;
          const filter = isSelected ? 'url(#selection-glow)' : 'url(#shadow-room)';
          const stroke = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
          const strokeWidth = isSelected ? 24 : 10;
          const bgFill = room.bgLight || 'rgba(59, 130, 246, 0.12)';

          return `
            <g class="room-element" data-room-id="${room.id}" style="cursor: pointer;">
              <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}"
                    fill="${bgFill}" stroke="${stroke}" stroke-width="${strokeWidth}"
                    filter="${filter}" rx="6"/>
              
              <!-- Selection Highlight Corners -->
              ${isSelected ? `
                <circle cx="${room.x}" cy="${room.y}" r="45" fill="#38bdf8" stroke="#ffffff" stroke-width="12" class="handle-nw" style="cursor: nwse-resize;"/>
                <circle cx="${room.x + room.width}" cy="${room.y}" r="45" fill="#38bdf8" stroke="#ffffff" stroke-width="12" class="handle-ne" style="cursor: nesw-resize;"/>
                <circle cx="${room.x + room.width}" cy="${room.y + room.height}" r="45" fill="#38bdf8" stroke="#ffffff" stroke-width="12" class="handle-se" style="cursor: nwse-resize;"/>
                <circle cx="${room.x}" cy="${room.y + room.height}" r="45" fill="#38bdf8" stroke="#ffffff" stroke-width="12" class="handle-sw" style="cursor: nesw-resize;"/>
              ` : ''}
            </g>
          `;
        }).join('')}
      </g>
    `;
  }

  renderWalls(walls, rooms) {
    return `
      <g id="layer-walls">
        ${walls.map(w => {
          const thickness = w.thickness || (w.type === 'exterior' ? 230 : 115);
          const strokeColor = w.type === 'exterior' ? '#e2e8f0' : '#cbd5e1';
          return `
            <line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}"
                  stroke="${strokeColor}" stroke-width="${thickness}" stroke-linecap="square"/>
          `;
        }).join('')}
      </g>
    `;
  }

  renderOpenings(openings) {
    return `
      <g id="layer-openings">
        ${openings.map(op => {
          if (!op.position) return '';
          const x = op.position.x;
          const y = op.position.y;
          const w = op.width || 900;

          if (op.type === 'door') {
            // Door leaf + 90-degree swing arc
            return `
              <g class="door-opening" data-opening-id="${op.id}">
                <!-- Door Clear Opening -->
                <circle cx="${x}" cy="${y}" r="15" fill="#38bdf8"/>
                <!-- Door Leaf Line -->
                <line x1="${x}" y1="${y}" x2="${x + w * 0.7}" y2="${y + w * 0.7}" stroke="#f8fafc" stroke-width="20"/>
                <!-- Swing Arc -->
                <path d="M ${x + w} ${y} A ${w} ${w} 0 0 1 ${x} ${y + w}" 
                      fill="none" stroke="#38bdf8" stroke-width="12" stroke-dasharray="20 15" opacity="0.85"/>
              </g>
            `;
          } else if (op.type === 'window') {
            // Double line architectural window symbol
            return `
              <g class="window-opening" data-opening-id="${op.id}">
                <rect x="${x - w / 2}" y="${y - 40}" width="${w}" height="80" 
                      fill="#0284c7" stroke="#38bdf8" stroke-width="12" rx="4"/>
                <line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="#ffffff" stroke-width="14"/>
              </g>
            `;
          }
          return '';
        }).join('')}
      </g>
    `;
  }

  renderFurniture(furnitureList) {
    return `
      <g id="layer-furniture" opacity="0.85">
        ${furnitureList.map(fn => {
          const w = fn.width;
          const l = fn.length;
          const cx = fn.x + w / 2;
          const cy = fn.y + l / 2;

          let symbolSvg = '';
          if (fn.type.includes('bed')) {
            // Bed with pillows and mattress fold
            symbolSvg = `
              <rect x="${fn.x}" y="${fn.y}" width="${w}" height="${l}" fill="#1e1b4b" stroke="#6366f1" stroke-width="12" rx="10"/>
              <!-- Headboard -->
              <rect x="${fn.x + 20}" y="${fn.y + 20}" width="${w - 40}" height="180" fill="#312e81" stroke="#818cf8" stroke-width="8"/>
              <!-- Pillows -->
              <rect x="${fn.x + 60}" y="${fn.y + 240}" width="${w * 0.38}" height="280" fill="#4338ca" rx="8"/>
              <rect x="${fn.x + w * 0.54}" y="${fn.y + 240}" width="${w * 0.38}" height="280" fill="#4338ca" rx="8"/>
            `;
          } else if (fn.type.includes('sofa')) {
            // Sofa with armrests and cushions
            symbolSvg = `
              <rect x="${fn.x}" y="${fn.y}" width="${w}" height="${l}" fill="#064e3b" stroke="#10b981" stroke-width="12" rx="12"/>
              <rect x="${fn.x + 30}" y="${fn.y + 30}" width="150" height="${l - 60}" fill="#047857" rx="8"/>
              <rect x="${fn.x + w - 180}" y="${fn.y + 30}" width="150" height="${l - 60}" fill="#047857" rx="8"/>
            `;
          } else if (fn.type.includes('dining')) {
            // Dining Table with chairs
            symbolSvg = `
              <rect x="${fn.x}" y="${fn.y}" width="${w}" height="${l}" fill="#78350f" stroke="#f59e0b" stroke-width="12" rx="8"/>
              <!-- Chairs -->
              <circle cx="${fn.x + w * 0.25}" cy="${fn.y - 80}" r="90" fill="#92400e" stroke="#fbbf24" stroke-width="6"/>
              <circle cx="${fn.x + w * 0.75}" cy="${fn.y - 80}" r="90" fill="#92400e" stroke="#fbbf24" stroke-width="6"/>
              <circle cx="${fn.x + w * 0.25}" cy="${fn.y + l + 80}" r="90" fill="#92400e" stroke="#fbbf24" stroke-width="6"/>
              <circle cx="${fn.x + w * 0.75}" cy="${fn.y + l + 80}" r="90" fill="#92400e" stroke="#fbbf24" stroke-width="6"/>
            `;
          } else if (fn.type.includes('car')) {
            // Car Silhouette
            symbolSvg = `
              <rect x="${fn.x}" y="${fn.y}" width="${w}" height="${l}" fill="#1e293b" stroke="#64748b" stroke-width="14" rx="35"/>
              <circle cx="${fn.x + 80}" cy="${fn.y + 700}" r="90" fill="#0f172a" stroke="#94a3b8" stroke-width="10"/>
              <circle cx="${fn.x + w - 80}" cy="${fn.y + 700}" r="90" fill="#0f172a" stroke="#94a3b8" stroke-width="10"/>
              <circle cx="${fn.x + 80}" cy="${fn.y + l - 700}" r="90" fill="#0f172a" stroke="#94a3b8" stroke-width="10"/>
              <circle cx="${fn.x + w - 80}" cy="${fn.y + l - 700}" r="90" fill="#0f172a" stroke="#94a3b8" stroke-width="10"/>
              <!-- Windshield -->
              <rect x="${fn.x + 150}" y="${fn.y + 1100}" width="${w - 300}" height="450" fill="#334155" rx="8"/>
            `;
          } else {
            // Generic Furniture Box
            symbolSvg = `
              <rect x="${fn.x}" y="${fn.y}" width="${w}" height="${l}" fill="#1e293b" stroke="#94a3b8" stroke-width="10" rx="6"/>
            `;
          }

          return `<g class="furniture-symbol" data-furniture-id="${fn.id}">${symbolSvg}</g>`;
        }).join('')}
      </g>
    `;
  }

  renderRoomLabels(rooms) {
    return `
      <g id="layer-labels">
        ${rooms.map(room => {
          const cx = room.x + room.width / 2;
          const cy = room.y + room.height / 2;
          const dimText = `${formatDimension(room.width)} × ${formatDimension(room.height)}`;
          const areaText = formatArea(room.areaSqMm || (room.width * room.height), this.options.areaUnit);

          return `
            <g class="room-label" style="pointer-events: none; text-anchor: middle;">
              <!-- Room Name Badge -->
              <text x="${cx}" y="${cy - 40}" fill="#f8fafc" font-size="120" font-family="'Inter', sans-serif" font-weight="700" letter-spacing="1">
                ${room.name.toUpperCase()}
              </text>
              <!-- Room Dimensions String -->
              <text x="${cx}" y="${cy + 65}" fill="#94a3b8" font-size="90" font-family="'Inter', monospace" font-weight="500">
                ${dimText}
              </text>
              <!-- Area Stamp -->
              <rect x="${cx - 150}" y="${cy + 105}" width="300" height="60" fill="rgba(15, 23, 42, 0.75)" rx="10"/>
              <text x="${cx}" y="${cy + 150}" fill="#38bdf8" font-size="80" font-family="'Inter', monospace" font-weight="600">
                ${areaText}
              </text>
            </g>
          `;
        }).join('')}
      </g>
    `;
  }

  renderDimensionLines(plot, rooms) {
    const w = plot.widthMm;
    const l = plot.lengthMm;
    const offset = 900; // Dimension line offset outside plot

    return `
      <g id="layer-dimensions" stroke="#64748b" stroke-width="10" fill="#94a3b8" font-size="90" font-family="'Inter', monospace">
        <!-- Top Dimension: Plot Width -->
        <line x1="0" y1="${-offset}" x2="${w}" y2="${-offset}"/>
        <!-- Ticks -->
        <line x1="0" y1="${-offset - 120}" x2="0" y2="${-offset + 120}"/>
        <line x1="${w}" y1="${-offset - 120}" x2="${w}" y2="${-offset + 120}"/>
        <text x="${w / 2}" y="${-offset - 60}" text-anchor="middle" font-weight="600">
          PLOT WIDTH: ${formatDimension(w)}
        </text>

        <!-- Left Dimension: Plot Length -->
        <line x1="${-offset}" y1="0" x2="${-offset}" y2="${l}"/>
        <line x1="${-offset - 120}" y1="0" x2="${-offset + 120}" y2="0"/>
        <line x1="${-offset - 120}" y1="${l}" x2="${-offset + 120}" y2="${l}"/>
        <g transform="translate(${-offset - 60}, ${l / 2}) rotate(-90)">
          <text x="0" y="0" text-anchor="middle" font-weight="600">
            PLOT DEPTH: ${formatDimension(l)}
          </text>
        </g>
      </g>
    `;
  }

  renderPlotAnnotations(plot) {
    const w = plot.widthMm;
    const l = plot.lengthMm;
    const orientation = (plot.orientation || 'north').toUpperCase();

    return `
      <g id="layer-annotations">
        <!-- North Arrow Compass -->
        <g transform="translate(${w + 1400}, 0)">
          <circle cx="0" cy="0" r="380" fill="#0f172a" stroke="#38bdf8" stroke-width="16"/>
          <!-- Compass Arrow -->
          <polygon points="0,-320 -90,160 0,60" fill="#ef4444"/>
          <polygon points="0,-320 90,160 0,60" fill="#f8fafc"/>
          <text x="0" y="-360" text-anchor="middle" fill="#f8fafc" font-size="140" font-family="'Inter', sans-serif" font-weight="800">
            N
          </text>
          <text x="0" y="240" text-anchor="middle" fill="#94a3b8" font-size="80" font-family="'Inter', sans-serif">
            ${orientation} FACING
          </text>
        </g>

        <!-- Road Facing Indicator -->
        <g transform="translate(${w / 2}, ${-1800})">
          <rect x="-1200" y="-140" width="2400" height="280" fill="#1e293b" stroke="#334155" stroke-width="12" rx="16"/>
          <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#facc15" stroke-width="20" stroke-dasharray="80 50"/>
          <text x="0" y="70" text-anchor="middle" fill="#f8fafc" font-size="110" font-family="'Inter', sans-serif" font-weight="700" letter-spacing="2">
            MAIN ROAD ACCESS (FRONT)
          </text>
        </g>

        <!-- Scale Bar Indicator -->
        <g transform="translate(0, ${l + 1400})">
          <rect x="0" y="0" width="3048" height="60" fill="#f8fafc"/>
          <rect x="0" y="0" width="1524" height="60" fill="#0f172a" stroke="#f8fafc" stroke-width="8"/>
          <text x="0" y="140" fill="#94a3b8" font-size="90" font-family="'Inter', monospace">0</text>
          <text x="1524" y="140" fill="#94a3b8" font-size="90" font-family="'Inter', monospace">5′-0″</text>
          <text x="3048" y="140" fill="#94a3b8" font-size="90" font-family="'Inter', monospace">10′-0″ (3.05 m)</text>
          <text x="1524" y="-40" text-anchor="middle" fill="#38bdf8" font-size="90" font-family="'Inter', sans-serif" font-weight="600">
            SCALE BAR 1:50
          </text>
        </g>
      </g>
    `;
  }

  setSelectedObject(id) {
    this.selectedObjectId = id;
  }
}
