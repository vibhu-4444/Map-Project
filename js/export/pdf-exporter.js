/**
 * Architectural PDF Drawing Sheet Exporter
 * Generates an A3/A4 landscape architectural drawing sheet with Title Block,
 * dimensioned plan drawing, room area schedule, and standard professional disclaimers.
 */

import { formatDimension, formatArea } from '../core/units.js';

export class PdfExporter {
  static exportPrintSheet(floor, plot, project) {
    const svgCanvas = document.getElementById('cad-svg-canvas');
    if (!svgCanvas) return;

    const svgHtml = svgCanvas.outerHTML;
    const rooms = floor.rooms || [];

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print the architectural drawing sheet.');
      return;
    }

    let roomRows = rooms.map(r => `
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-weight: 600;">${r.name}</td>
        <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-family: monospace;">${formatDimension(r.width)} × ${formatDimension(r.height)}</td>
        <td style="padding: 6px 12px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${r.areaSqFt} sq.ft</td>
      </tr>
    `).join('');

    const totalCarpet = rooms.reduce((sum, r) => sum + (r.areaSqFt || 0), 0);
    const builtUpArea = Math.round(totalCarpet * 1.22);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.name || 'Floor Plan'} — Architectural Sheet</title>
        <style>
          @page { size: A3 landscape; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #ffffff; }
          .sheet-container { border: 3px double #0f172a; padding: 20px; min-height: 95vh; display: flex; flex-direction: column; justify-content: space-between; }
          .sheet-header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sheet-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .sheet-meta { font-size: 12px; color: #475569; }
          .main-content { display: flex; gap: 24px; flex: 1; }
          .drawing-view { flex: 2.2; border: 1px solid #e2e8f0; background: #0f172a; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 520px; }
          .drawing-view svg { width: 100%; height: 100%; max-height: 600px; }
          .schedule-view { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
          th { background: #0f172a; color: #ffffff; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .title-block { border: 2px solid #0f172a; padding: 12px; background: #f8fafc; font-size: 11px; }
          .disclaimer { font-size: 9px; color: #64748b; margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="sheet-container">
          <div class="sheet-header">
            <div>
              <div class="sheet-title">${project.name || 'RESIDENTIAL FLOOR PLAN'}</div>
              <div class="sheet-meta">ARCHITECTURAL PLANNING & SPATIAL VALIDATION DRAWING</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 14px;">SHEET: A-101 (GROUND FLOOR)</div>
              <div class="sheet-meta">DATE: ${new Date().toLocaleDateString()} | SCALE 1:50</div>
            </div>
          </div>

          <div class="main-content">
            <div class="drawing-view">
              ${svgHtml}
            </div>

            <div class="schedule-view">
              <div>
                <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 13px;">Room Area Schedule</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Space</th>
                      <th>Dimensions</th>
                      <th style="text-align: right;">Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${roomRows}
                    <tr style="background: #f1f5f9; font-weight: 700;">
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">TOTAL CARPET AREA</td>
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">-</td>
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${Math.round(totalCarpet)} sq.ft</td>
                    </tr>
                    <tr style="background: #e2e8f0; font-weight: 800;">
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">ESTIMATED BUILT-UP (BUA)</td>
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Plinth + Walls</td>
                      <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${builtUpArea} sq.ft</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="title-block">
                <div style="font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">PROJECT DATA</div>
                <div><strong>PLOT SIZE:</strong> ${formatDimension(plot.widthMm)} × ${formatDimension(plot.lengthMm)} (${Math.round((plot.widthMm * plot.lengthMm) / 92903.04)} sq.ft)</div>
                <div><strong>ORIENTATION:</strong> ${(plot.orientation || 'North').toUpperCase()} FACING</div>
                <div><strong>ROAD ACCESS:</strong> ${(plot.roadFacing || 'North').toUpperCase()} SIDE</div>
                <div><strong>ENGINEERING ENGINE:</strong> AI Residential Floor-Plan Architect v1.0</div>
              </div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>NOTICE & DISCLAIMER:</strong> This drawing represents a conceptual architectural planning schematic generated by computational spatial algorithms. All dimensions, setbacks, and wall thicknesses must be physically verified on-site by a licensed structural engineer and registered civil architect prior to structural excavation, municipal permit submission, or construction.
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}
