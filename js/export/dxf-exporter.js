/**
 * AutoCAD R12 / 2000 Compatible ASCII DXF Exporter
 * Generates industry-standard CAD layers (A-WALL-EXTR, A-WALL-INTR, A-DOOR, A-GLAZ, A-FURN, A-ANNO-TEXT)
 * with exact millimeter coordinates for import into AutoCAD, Revit, SketchUp, or BricsCAD.
 */

export class DxfExporter {
  /**
   * Generates standard ASCII DXF string
   */
  static generateDxf(floor, plot, project) {
    const lines = [];

    // Header Section
    lines.push('  0', 'SECTION', '  2', 'HEADER', '  9', '$ACADVER', '  1', 'AC1009', '  0', 'ENDSEC');

    // Tables Section (Layers)
    lines.push('  0', 'SECTION', '  2', 'TABLES', '  0', 'TABLE', '  2', 'LAYER', ' 70', '6');
    lines.push(this.dxfLayer('A-WALL-EXTR', 7));   // White / Black
    lines.push(this.dxfLayer('A-WALL-INTR', 8));   // Gray
    lines.push(this.dxfLayer('A-DOOR', 4));        // Cyan
    lines.push(this.dxfLayer('A-GLAZ', 3));        // Green
    lines.push(this.dxfLayer('A-FURN', 1));        // Red
    lines.push(this.dxfLayer('A-ANNO-TEXT', 2));   // Yellow
    lines.push('  0', 'ENDTAB', '  0', 'ENDSEC');

    // Entities Section
    lines.push('  0', 'SECTION', '  2', 'ENTITIES');

    // 1. Export Walls
    const walls = floor.walls || [];
    for (const wall of walls) {
      const layer = wall.type === 'exterior' ? 'A-WALL-EXTR' : 'A-WALL-INTR';
      lines.push(
        '  0', 'LINE',
        '  8', layer,
        ' 10', wall.start.x.toFixed(2),
        ' 20', (-wall.start.y).toFixed(2), // Invert Y for standard CAD Cartesian orientation
        ' 30', '0.0',
        ' 11', wall.end.x.toFixed(2),
        ' 21', (-wall.end.y).toFixed(2),
        ' 31', '0.0'
      );
    }

    // 2. Export Rooms & Labels
    const rooms = floor.rooms || [];
    for (const room of rooms) {
      // Room Center Label
      const cx = room.x + room.width / 2;
      const cy = -(room.y + room.height / 2);
      lines.push(
        '  0', 'TEXT',
        '  8', 'A-ANNO-TEXT',
        ' 10', cx.toFixed(2),
        ' 20', cy.toFixed(2),
        ' 30', '0.0',
        ' 40', '250.0', // 250mm text height
        '  1', room.name
      );
    }

    // 3. Export Furniture
    const furniture = floor.furniture || [];
    for (const fn of furniture) {
      const x1 = fn.x;
      const y1 = -fn.y;
      const x2 = fn.x + fn.width;
      const y2 = -(fn.y + fn.length);

      // 4 line boundary
      this.addDxfRect(lines, 'A-FURN', x1, y1, x2, y2);
    }

    // End Entities & File
    lines.push('  0', 'ENDSEC', '  0', 'EOF');

    return lines.join('\n');
  }

  static dxfLayer(name, color) {
    return [
      '  0', 'LAYER',
      '  2', name,
      ' 70', '0',
      ' 62', String(color),
      '  6', 'CONTINUOUS'
    ].join('\n');
  }

  static addDxfRect(lines, layer, x1, y1, x2, y2) {
    // Top
    lines.push('  0', 'LINE', '  8', layer, ' 10', x1.toFixed(2), ' 20', y1.toFixed(2), ' 30', '0.0', ' 11', x2.toFixed(2), ' 21', y1.toFixed(2), ' 31', '0.0');
    // Right
    lines.push('  0', 'LINE', '  8', layer, ' 10', x2.toFixed(2), ' 20', y1.toFixed(2), ' 30', '0.0', ' 11', x2.toFixed(2), ' 21', y2.toFixed(2), ' 31', '0.0');
    // Bottom
    lines.push('  0', 'LINE', '  8', layer, ' 10', x2.toFixed(2), ' 20', y2.toFixed(2), ' 30', '0.0', ' 11', x1.toFixed(2), ' 21', y2.toFixed(2), ' 31', '0.0');
    // Left
    lines.push('  0', 'LINE', '  8', layer, ' 10', x1.toFixed(2), ' 20', y2.toFixed(2), ' 30', '0.0', ' 11', x1.toFixed(2), ' 21', y1.toFixed(2), ' 31', '0.0');
  }

  static download(floor, plot, project) {
    const dxfString = this.generateDxf(floor, plot, project);
    const blob = new Blob([dxfString], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'FloorPlan').replace(/\s+/g, '_')}_${floor.name || 'Ground'}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
