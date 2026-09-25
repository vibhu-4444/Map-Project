/**
 * Master Application Orchestrator & State Controller
 * AI Residential Floor-Plan Architect
 */

import { feetToMm, mmToFeet, formatDimension, formatArea } from './core/units.js';
import { createDefaultProject, ROOM_DEFINITIONS } from './core/types.js';
import { FeasibilityEngine } from './engines/feasibility.js';
import { LayoutGeneratorEngine } from './engines/layout-generator.js';
import { GeometryValidator } from './engines/validator.js';
import { AreaCalculatorEngine } from './engines/area-calculator.js';
import { VastuEngine } from './engines/vastu.js';
import { CostEstimatorEngine, FINISH_TIERS } from './engines/cost-estimator.js';
import { FloorPlanRenderer2D } from './editor/canvas2d.js';
import { CanvasInteractionController } from './editor/interaction.js';
import { HistoryStore } from './editor/history.js';
import { ArchitecturalViewer3D } from './viewer3d/viewer3d.js';
import { SvgExporter } from './export/svg-exporter.js';
import { PngExporter } from './export/png-exporter.js';
import { PdfExporter } from './export/pdf-exporter.js';
import { DxfExporter } from './export/dxf-exporter.js';
import { AIRequirementParser } from './services/ai-parser.js';
import { StorageService } from './services/storage.js';
import { PillNav } from './components/PillNav.js';

export class FloorPlanArchitectApp {
  constructor() {
    this.project = StorageService.createPreset35x50();
    this.candidates = [];
    this.selectedCandidateIndex = 0;
    this.activeFloorIndex = 0;
    this.selectedRoomId = null;
    this.activeTab = 'editor2d'; // 'editor2d' | 'viewer3d' | 'feasibility' | 'costs' | 'vastu'

    this.history = new HistoryStore();
    this.renderer2d = null;
    this.interactionController = null;
    this.viewer3d = null;
    this.pillNav = null;

    this.initDOM();
    this.initEngines();
    this.bindEvents();
    this.generateInitialLayouts();
  }

  initDOM() {
    const canvasContainer = document.getElementById('cad-viewport-container');
    if (canvasContainer) {
      this.renderer2d = new FloorPlanRenderer2D(canvasContainer, this.project.settings);
    }

    const viewer3dContainer = document.getElementById('viewer3d-container');
    if (viewer3dContainer) {
      this.viewer3d = new ArchitecturalViewer3D(viewer3dContainer);
    }

    this.initPillNav();
  }

  initPillNav() {
    const container = document.getElementById('main-pill-nav-container');
    if (!container) return;

    this.pillNav = new PillNav({
      container,
      logo: '📐',
      logoAlt: 'Craft Your Archi',
      baseColor: '#38bdf8',
      pillColor: '#090d16',
      hoveredPillTextColor: '#030712',
      pillTextColor: '#cbd5e1',
      activeHref: '#editor2d',
      items: [
        { label: '📐 2D CAD Plan', href: '#editor2d', tab: 'editor2d' },
        { label: '🧊 3D Studio', href: '#viewer3d', tab: 'viewer3d' },
        { label: '📊 Room Schedule', href: '#schedule', tab: 'schedule' },
        { label: '💰 Cost Estimator', href: '#costs', tab: 'costs' },
        { label: '🧭 Vastu Audit', href: '#vastu', tab: 'vastu' }
      ],
      onItemClick: (item, e) => {
        if (e) e.preventDefault();
        if (item.tab) {
          this.switchTab(item.tab);
        }
      }
    });
  }

  initEngines() {
    this.interactionController = new CanvasInteractionController(
      document.getElementById('cad-viewport-container'),
      this.renderer2d,
      this,
      () => this.handleGeometryModified()
    );
  }

  getActiveFloor() {
    if (!this.project.floors || this.project.floors.length === 0) return null;
    return this.project.floors[this.activeFloorIndex] || this.project.floors[0];
  }

  getPlot() {
    return this.project.plot;
  }

  setSelectedRoomId(id) {
    this.selectedRoomId = id;
    this.updatePropertiesPanel();
  }

  bindEvents() {
    // Navigation / Tab Switchers
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Undo / Redo Buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => this.handleUndo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.handleRedo());

    // Presets Dropdown / Load
    document.getElementById('select-preset')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'preset_30x40') this.loadProject(StorageService.createPreset30x40());
      else if (val === 'preset_35x50') this.loadProject(StorageService.createPreset35x50());
      else if (val === 'preset_40x60') this.loadProject(StorageService.createPreset40x60());
    });

    // AI Natural Language Parse Button
    document.getElementById('btn-ai-parse')?.addEventListener('click', () => {
      const promptInput = document.getElementById('input-ai-prompt');
      if (promptInput) {
        this.handleAIParsing(promptInput.value);
      }
    });

    // Generate Layout Alternatives Button
    document.getElementById('btn-generate-layouts')?.addEventListener('click', () => {
      this.generateInitialLayouts();
    });

    // Plot Dimension Inputs
    ['input-plot-w', 'input-plot-l', 'select-orientation', 'input-sb-front', 'input-sb-rear', 'input-sb-left', 'input-sb-right'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.handlePlotInputChange());
    });

    // Strategy Candidate Cards
    document.getElementById('candidates-list')?.addEventListener('click', (e) => {
      const card = e.target.closest('.candidate-card');
      if (card) {
        const idx = parseInt(card.getAttribute('data-index'), 10);
        this.selectCandidate(idx);
      }
    });

    // Finish Tier Buttons for Cost Estimator
    document.querySelectorAll('.tier-btn')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tier = e.currentTarget.getAttribute('data-tier');
        this.updateCostEstimator(tier);
      });
    });

    // Export Buttons
    document.getElementById('btn-export-svg')?.addEventListener('click', () => this.exportFile('svg'));
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.exportFile('png'));
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportFile('pdf'));
    document.getElementById('btn-export-dxf')?.addEventListener('click', () => this.exportFile('dxf'));
    document.getElementById('btn-export-json')?.addEventListener('click', () => StorageService.exportProjectFile(this.project));

    // Display Toggles
    ['toggle-grid', 'toggle-dims', 'toggle-furniture', 'toggle-setbacks'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const key = id.replace('toggle-', '');
        if (key === 'grid') this.renderer2d.options.showGrid = e.target.checked;
        if (key === 'dims') this.renderer2d.options.showDimensions = e.target.checked;
        if (key === 'furniture') this.renderer2d.options.showFurniture = e.target.checked;
        if (key === 'setbacks') this.renderer2d.options.showSetbacks = e.target.checked;
        this.renderAll();
      });
    });
  }

  loadProject(newProject) {
    this.project = newProject;
    this.history.clear();
    this.syncPlotFormInputs();
    this.generateInitialLayouts();
  }

  syncPlotFormInputs() {
    const plot = this.project.plot;
    const wFt = Math.round(mmToFeet(plot.widthMm));
    const lFt = Math.round(mmToFeet(plot.lengthMm));
    const setW = document.getElementById('input-plot-w');
    const setL = document.getElementById('input-plot-l');
    const setOr = document.getElementById('select-orientation');
    if (setW) setW.value = wFt;
    if (setL) setL.value = lFt;
    if (setOr) setOr.value = plot.orientation || 'north';
  }

  handlePlotInputChange() {
    const wFt = parseFloat(document.getElementById('input-plot-w')?.value || 35);
    const lFt = parseFloat(document.getElementById('input-plot-l')?.value || 50);
    const orientation = document.getElementById('select-orientation')?.value || 'north';

    const frontFt = parseFloat(document.getElementById('input-sb-front')?.value || 5);
    const rearFt = parseFloat(document.getElementById('input-sb-rear')?.value || 4);
    const leftFt = parseFloat(document.getElementById('input-sb-left')?.value || 3);
    const rightFt = parseFloat(document.getElementById('input-sb-right')?.value || 3);

    this.project.plot = {
      widthMm: feetToMm(wFt),
      lengthMm: feetToMm(lFt),
      orientation,
      roadFacing: orientation,
      setbacks: {
        frontMm: feetToMm(frontFt),
        rearMm: feetToMm(rearFt),
        leftMm: feetToMm(leftFt),
        rightMm: feetToMm(rightFt)
      }
    };

    this.generateInitialLayouts();
  }

  handleAIParsing(promptText) {
    const parseResult = AIRequirementParser.parse(promptText);
    this.project.specification = parseResult.specification;

    // Show AI status banner
    const banner = document.getElementById('ai-response-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px;">AI Requirement Parser: Structured Specification Extracted</div>
        <div style="color: #cbd5e1; font-size: 13px;">${parseResult.extractedHighlights.join(' • ')}</div>
      `;
    }

    this.generateInitialLayouts();
  }

  generateInitialLayouts() {
    // 1. Evaluate Spatial Feasibility
    const feasibilityReport = FeasibilityEngine.evaluate(this.project.plot, this.project.specification);
    this.renderFeasibilityPanel(feasibilityReport);

    // 2. Generate Deterministic Layout Candidates
    this.candidates = LayoutGeneratorEngine.generateCandidates(this.project.plot, this.project.specification);

    // Render candidate cards in UI
    this.renderCandidateCards();

    // Select first candidate by default
    if (this.candidates.length > 0) {
      this.selectCandidate(0);
    }
  }

  selectCandidate(index) {
    if (!this.candidates[index]) return;
    this.selectedCandidateIndex = index;
    const candidate = this.candidates[index];

    // Load candidate floors into project state
    this.project.floors = candidate.floors;
    this.activeFloorIndex = 0;

    // Push initial state to history stack
    this.history.pushState(this.project);

    this.renderAll();
    this.highlightActiveCandidateCard(index);
  }

  handleGeometryModified() {
    // Push updated snapshot to history
    this.history.pushState(this.project);

    // Update Undo/Redo button states
    this.updateHistoryButtons();

    // Re-run validation, area calculations, Vastu, and 3D
    this.renderAll();
  }

  handleUndo() {
    const prevState = this.history.undo();
    if (prevState) {
      this.project = prevState;
      this.renderAll();
      this.updateHistoryButtons();
    }
  }

  handleRedo() {
    const nextState = this.history.redo();
    if (nextState) {
      this.project = nextState;
      this.renderAll();
      this.updateHistoryButtons();
    }
  }

  updateHistoryButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = !this.history.canUndo();
    if (btnRedo) btnRedo.disabled = !this.history.canRedo();
  }

  renderAll() {
    const floor = this.getActiveFloor();
    const plot = this.getPlot();
    if (!floor || !plot) return;

    // 1. Validate Floor Geometry
    const validationReport = GeometryValidator.validateFloor(floor, plot);
    this.renderValidationPanel(validationReport);

    // 2. Render 2D CAD Viewport
    if (this.renderer2d) {
      this.renderer2d.render(floor, plot, validationReport);
    }

    // 3. Render 3D Scene
    if (this.viewer3d) {
      this.viewer3d.updateGeometry(floor, plot);
    }

    // 4. Update Area Schedule Table & Metrics
    const areaReport = AreaCalculatorEngine.computeProjectAreas(this.project, this.project.settings.areaUnit);
    this.renderAreaSchedule(areaReport);

    // 5. Update Vastu Alignment
    const vastuReport = VastuEngine.evaluate(floor, plot);
    this.renderVastuPanel(vastuReport);

    // 6. Update Construction Cost Estimator
    this.updateCostEstimator(this.project.costAssumptions.finishTier || 'standard');

    // 7. Update Properties Panel
    this.updatePropertiesPanel();

    this.updateHistoryButtons();
  }

  renderCandidateCards() {
    const container = document.getElementById('candidates-list');
    if (!container) return;

    container.innerHTML = this.candidates.map((cand, idx) => `
      <div class="candidate-card ${idx === this.selectedCandidateIndex ? 'active' : ''}" data-index="${idx}" style="cursor: pointer; padding: 12px; margin-bottom: 8px; border-radius: 8px; background: #1e293b; border: 1px solid #334155;">
        <div style="font-weight: 700; font-size: 13px; color: #f8fafc; margin-bottom: 4px;">${cand.name}</div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 6px;">${cand.description}</div>
        <div style="display: flex; gap: 8px; font-size: 11px; font-family: monospace;">
          <span style="color: #38bdf8;">${cand.metrics.totalCarpetSqFt} sq.ft carpet</span>
          <span style="color: #cbd5e1;">•</span>
          <span style="color: #10b981;">${cand.metrics.builtUpSqFt} sq.ft BUA</span>
        </div>
      </div>
    `).join('');
  }

  highlightActiveCandidateCard(index) {
    document.querySelectorAll('.candidate-card').forEach((card, idx) => {
      if (idx === index) {
        card.style.borderColor = '#38bdf8';
        card.style.background = '#0f2942';
      } else {
        card.style.borderColor = '#334155';
        card.style.background = '#1e293b';
      }
    });
  }

  renderFeasibilityPanel(report) {
    const badge = document.getElementById('feasibility-badge');
    const desc = document.getElementById('feasibility-desc');
    if (!badge || !desc) return;

    const colors = {
      FEASIBLE: '#10b981',
      TIGHT_FIT: '#f59e0b',
      OVER_CAPACITY: '#ef4444'
    };

    badge.style.background = colors[report.verdict] || '#64748b';
    badge.innerText = report.verdict.replace('_', ' ');

    desc.innerHTML = `
      <div style="margin-bottom: 6px;">${report.diagnostics[0] || ''}</div>
      <div style="display: flex; gap: 12px; font-size: 11px; color: #94a3b8;">
        <span>Plot: <strong>${report.metrics.grossPlotAreaSqFt} sq.ft</strong></span>
        <span>Buildable: <strong>${report.metrics.buildableFootprintSqFt} sq.ft</strong></span>
        <span>Demand: <strong>${report.metrics.totalRequiredBuiltUpSqFt} sq.ft</strong></span>
      </div>
    `;
  }

  renderValidationPanel(report) {
    const list = document.getElementById('validation-issues-list');
    const summary = document.getElementById('validation-summary-pill');
    if (!list || !summary) return;

    if (report.isValid) {
      summary.innerHTML = `<span style="color: #10b981; font-weight: 600;">✓ All Spatial Constraints Satisfied (0 Errors)</span>`;
    } else {
      summary.innerHTML = `<span style="color: #ef4444; font-weight: 700;">⚠ ${report.errorCount} Error(s), ${report.warningCount} Warning(s)</span>`;
    }

    list.innerHTML = report.issues.map(iss => {
      const color = iss.severity === 'error' ? '#ef4444' : (iss.severity === 'warning' ? '#f59e0b' : '#38bdf8');
      return `
        <div style="padding: 8px 12px; border-left: 4px solid ${color}; background: #1e293b; margin-bottom: 6px; border-radius: 4px; font-size: 12px;">
          <div style="font-weight: 600; color: #f8fafc;">${iss.message}</div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${iss.suggestion || ''}</div>
        </div>
      `;
    }).join('');
  }

  renderAreaSchedule(areaReport) {
    const container = document.getElementById('area-schedule-tbody');
    const summaryCard = document.getElementById('area-summary-metrics');
    if (!container || !summaryCard) return;

    summaryCard.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;">
        <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
          <div style="font-size: 11px; color: #94a3b8;">PLOT AREA</div>
          <div style="font-size: 16px; font-weight: 700; color: #f8fafc;">${areaReport.summary.plotArea}</div>
        </div>
        <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
          <div style="font-size: 11px; color: #94a3b8;">CARPET AREA</div>
          <div style="font-size: 16px; font-weight: 700; color: #38bdf8;">${areaReport.summary.totalCarpetArea}</div>
        </div>
        <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
          <div style="font-size: 11px; color: #94a3b8;">BUILT-UP (BUA)</div>
          <div style="font-size: 16px; font-weight: 700; color: #10b981;">${areaReport.summary.totalBuiltUpArea}</div>
        </div>
      </div>
    `;

    const floorSchedule = areaReport.floors[0];
    if (floorSchedule && floorSchedule.rooms) {
      container.innerHTML = floorSchedule.rooms.map(r => `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 10px; font-weight: 600; color: #f8fafc;">${r.name}</td>
          <td style="padding: 6px 10px; color: #cbd5e1; font-family: monospace;">${r.dimensionFormatted}</td>
          <td style="padding: 6px 10px; text-align: right; color: #38bdf8; font-family: monospace;">${r.areaFormatted}</td>
          <td style="padding: 6px 10px; text-align: right; color: #94a3b8; font-family: monospace;">${r.percentage}%</td>
        </tr>
      `).join('');
    }
  }

  renderVastuPanel(report) {
    const scoreVal = document.getElementById('vastu-score-val');
    const findingsList = document.getElementById('vastu-findings-list');
    if (!scoreVal || !findingsList) return;

    scoreVal.innerText = `${report.overallScore}% (${report.overallRating})`;
    findingsList.innerHTML = report.findings.map(f => {
      const color = f.status === 'optimal' ? '#10b981' : (f.status === 'conflict' ? '#ef4444' : '#f59e0b');
      return `
        <div style="padding: 8px 10px; background: #1e293b; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid ${color}; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span style="color: #f8fafc;">${f.roomName}</span>
            <span style="color: ${color}; font-family: monospace;">${f.currentOctant} (${f.score}%)</span>
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${f.advice}</div>
        </div>
      `;
    }).join('');
  }

  updateCostEstimator(tierId = 'standard') {
    this.project.costAssumptions.finishTier = tierId;
    const floor = this.getActiveFloor();
    if (!floor) return;

    const areaReport = AreaCalculatorEngine.computeProjectAreas(this.project);
    const buaSqFt = areaReport.summary.totalBuiltUpAreaSqFt || 1500;
    const estimate = CostEstimatorEngine.estimate(buaSqFt, tierId);

    const costExpected = document.getElementById('cost-expected-val');
    const costRange = document.getElementById('cost-range-val');
    const pkgTable = document.getElementById('cost-packages-tbody');

    if (costExpected) costExpected.innerText = estimate.range.expectedFormatted;
    if (costRange) costRange.innerText = `Range: ${estimate.range.minFormatted} — ${estimate.range.maxFormatted} (₹${estimate.baseRatePerSqFt}/sq.ft)`;

    if (pkgTable) {
      pkgTable.innerHTML = estimate.packages.map(pkg => `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 10px; font-weight: 600; color: #f8fafc;">${pkg.name}</td>
          <td style="padding: 6px 10px; color: #94a3b8;">${pkg.sharePercent}%</td>
          <td style="padding: 6px 10px; text-align: right; color: #10b981; font-weight: 600; font-family: monospace;">${pkg.costFormatted}</td>
        </tr>
      `).join('');
    }
  }

  updatePropertiesPanel() {
    const panel = document.getElementById('properties-panel-content');
    if (!panel) return;

    if (!this.selectedRoomId) {
      panel.innerHTML = `<div style="color: #64748b; font-size: 13px; text-align: center; padding: 24px 0;">Click any room on the floor plan to inspect and edit its properties.</div>`;
      return;
    }

    const room = this.interactionController.findRoom(this.selectedRoomId);
    if (!room) return;

    panel.innerHTML = `
      <div style="font-size: 13px;">
        <div style="margin-bottom: 10px;">
          <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px;">ROOM NAME</label>
          <input type="text" id="prop-room-name" value="${room.name}" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 6px 8px; border-radius: 4px;"/>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
          <div>
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px;">WIDTH</label>
            <input type="text" value="${formatDimension(room.width)}" readonly style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #38bdf8; padding: 6px 8px; border-radius: 4px; font-family: monospace;"/>
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px;">LENGTH</label>
            <input type="text" value="${formatDimension(room.height)}" readonly style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #38bdf8; padding: 6px 8px; border-radius: 4px; font-family: monospace;"/>
          </div>
        </div>
        <div style="margin-bottom: 12px; background: #0f172a; padding: 8px; border-radius: 4px;">
          <div style="font-size: 11px; color: #94a3b8;">CALCULATED CARPET AREA</div>
          <div style="font-size: 15px; font-weight: 700; color: #10b981; font-family: monospace;">${room.areaSqFt} sq.ft (${(room.areaSqMm / 1e6).toFixed(2)} m²)</div>
        </div>
        <button id="btn-delete-room" style="width: 100%; padding: 8px; background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Delete Selected Space
        </button>
      </div>
    `;

    document.getElementById('prop-room-name')?.addEventListener('input', (e) => {
      room.name = e.target.value;
      this.renderer2d.render(this.getActiveFloor(), this.getPlot());
    });

    document.getElementById('btn-delete-room')?.addEventListener('click', () => {
      const floor = this.getActiveFloor();
      if (floor) {
        floor.rooms = floor.rooms.filter(r => r.id !== room.id);
        this.selectedRoomId = null;
        this.handleGeometryModified();
      }
    });
  }

  switchTab(tab) {
    this.activeTab = tab;

    if (this.pillNav) {
      this.pillNav.setActiveHref(`#${tab}`);
    }

    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
        btn.style.color = '#38bdf8';
        btn.style.borderBottom = '2px solid #38bdf8';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#94a3b8';
        btn.style.borderBottom = 'none';
      }
    });

    // Toggle panels
    const cadView = document.getElementById('cad-viewport-container');
    const view3d = document.getElementById('viewer3d-container');
    const scheduleView = document.getElementById('schedule-view-container');
    const costView = document.getElementById('cost-view-container');
    const vastuView = document.getElementById('vastu-view-container');

    if (cadView) cadView.style.display = tab === 'editor2d' ? 'block' : 'none';
    if (view3d) {
      view3d.style.display = tab === 'viewer3d' ? 'block' : 'none';
      if (tab === 'viewer3d') this.viewer3d.resizeCanvas();
    }
    if (scheduleView) scheduleView.style.display = tab === 'schedule' ? 'block' : 'none';
    if (costView) costView.style.display = tab === 'costs' ? 'block' : 'none';
    if (vastuView) vastuView.style.display = tab === 'vastu' ? 'block' : 'none';
  }

  exportFile(format) {
    const floor = this.getActiveFloor();
    const plot = this.getPlot();
    if (!floor || !plot) return;

    if (format === 'svg') SvgExporter.download(floor, plot, this.project);
    else if (format === 'png') PngExporter.download(floor, plot, this.project);
    else if (format === 'pdf') PdfExporter.exportPrintSheet(floor, plot, this.project);
    else if (format === 'dxf') DxfExporter.download(floor, plot, this.project);
  }
}

// Auto-boot on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
  window.floorPlanApp = new FloorPlanArchitectApp();
});
