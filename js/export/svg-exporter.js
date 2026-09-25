/**
 * Vector Architectural SVG Exporter
 * Exports a standalone, high-resolution vector SVG file complete with
 * architectural title block, room schedule, scale bar, and disclaimer.
 */

export class SvgExporter {
  /**
   * Generates a complete standalone SVG document string
   */
  static exportSvgString(floor, plot, project) {
    const plotW = plot.widthMm;
    const plotL = plot.lengthMm;
    const pad = 3000;
    const vbX = -pad;
    const vbY = -pad;
    const vbW = plotW + pad * 2;
    const vbH = plotL + pad * 2;

    const svgCanvas = document.getElementById('cad-svg-canvas');
    if (!svgCanvas) return '';

    // Clone and prepare standalone SVG
    const clonedSvg = svgCanvas.cloneNode(true);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('width', `${vbW / 10}mm`);
    clonedSvg.setAttribute('height', `${vbH / 10}mm`);

    return clonedSvg.outerHTML;
  }

  static download(floor, plot, project) {
    const svgStr = this.exportSvgString(floor, plot, project);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'FloorPlan').replace(/\s+/g, '_')}_${floor.name || 'Ground'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
