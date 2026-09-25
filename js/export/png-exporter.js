/**
 * High-Resolution Raster PNG Exporter
 * Renders the authoritative SVG drawing onto a high-DPI HTML5 canvas and triggers download.
 */

export class PngExporter {
  static download(floor, plot, project, scale = 2.0) {
    const svgCanvas = document.getElementById('cad-svg-canvas');
    if (!svgCanvas) return;

    const svgData = new XMLSerializer().serializeToString(svgCanvas);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (svgCanvas.clientWidth || 1200) * scale;
      canvas.height = (svgCanvas.clientHeight || 900) * scale;

      const ctx = canvas.getContext('2d');
      // Dark CAD background fill
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${(project.name || 'FloorPlan').replace(/\s+/g, '_')}_${floor.name || 'Ground'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  }
}
