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
      <div class="candidate-card ${idx === this.selectedCandidateIndex ? 'active' : ''}" data-index="${idx}">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${cand.name}</div>
          <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 9.5px;">OPTION ${idx + 1}</span>
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px;">${cand.description}</div>
        <div style="display: flex; gap: 8px; font-size: 11px; font-family: var(--font-mono);">
          <span style="color: var(--accent-cyan); background: rgba(56, 189, 248, 0.08); padding: 2px 7px; border-radius: 4px;">${cand.metrics.totalCarpetSqFt} sq.ft carpet</span>
          <span style="color: var(--accent-emerald); background: rgba(16, 185, 129, 0.08); padding: 2px 7px; border-radius: 4px;">${cand.metrics.builtUpSqFt} sq.ft BUA</span>
        </div>
      </div>
    `).join('');
  }

  highlightActiveCandidateCard(index) {
    document.querySelectorAll('.candidate-card').forEach((card, idx) => {
      if (idx === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  renderFeasibilityPanel(report) {
    const badge = document.getElementById('feasibility-badge');
    const desc = document.getElementById('feasibility-desc');
    if (!badge || !desc) return;

    const badgeClass = report.verdict === 'FEASIBLE' ? 'badge-feasible' : (report.verdict === 'TIGHT_FIT' ? 'badge-warning' : 'badge-error');
    badge.className = `badge ${badgeClass}`;
    badge.innerText = report.verdict.replace('_', ' ');

    desc.innerHTML = `
      <div style="margin-bottom: 10px; color: var(--text-secondary); line-height: 1.45; font-size: 12px;">${report.diagnostics[0] || ''}</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 8px 4px; border-radius: 8px;">
          <div style="font-size: 9.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">PLOT</div>
          <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 2px;">${report.metrics.grossPlotAreaSqFt} <span style="font-size: 9px;">ft²</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 8px 4px; border-radius: 8px;">
          <div style="font-size: 9.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">BUILDABLE</div>
          <div style="font-size: 12.5px; font-weight: 700; color: var(--accent-cyan); font-family: var(--font-mono); margin-top: 2px;">${report.metrics.buildableFootprintSqFt} <span style="font-size: 9px;">ft²</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 8px 4px; border-radius: 8px;">
          <div style="font-size: 9.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">DEMAND</div>
          <div style="font-size: 12.5px; font-weight: 700; color: var(--accent-emerald); font-family: var(--font-mono); margin-top: 2px;">${report.metrics.totalRequiredBuiltUpSqFt} <span style="font-size: 9px;">ft²</span></div>
        </div>
      </div>
    `;
  }

  renderValidationPanel(report) {
    const list = document.getElementById('validation-issues-list');
    const summary = document.getElementById('validation-summary-pill');
    if (!list || !summary) return;

    if (report.isValid) {
      summary.innerHTML = `
        <div class="badge badge-feasible" style="padding: 6px 12px; font-size: 11px; width: 100%; justify-content: center;">
          <span style="font-size: 13px;">✓</span> All Spatial Constraints Satisfied (0 Errors)
        </div>
      `;
    } else {
      summary.innerHTML = `
        <div class="badge ${report.errorCount > 0 ? 'badge-error' : 'badge-warning'}" style="padding: 6px 12px; font-size: 11px; width: 100%; justify-content: center;">
          <span>⚠</span> ${report.errorCount} Error(s) • ${report.warningCount} Code Advisory
        </div>
      `;
    }

    if (!report.issues || report.issues.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px 0;">No geometric or building code violations found.</div>`;
      return;
    }

    list.innerHTML = report.issues.map(iss => {
      const cardType = iss.severity === 'error' ? 'validation-card-error' : (iss.severity === 'warning' ? 'validation-card-warning' : 'validation-card-info');
      const badgeType = iss.severity === 'error' ? 'badge-error' : (iss.severity === 'warning' ? 'badge-warning' : 'badge-feasible');
      const icon = iss.severity === 'error' ? '⛔' : (iss.severity === 'warning' ? '⚠️' : 'ℹ️');

      return `
        <div class="validation-card ${cardType}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span>${icon}</span>
              <span>${iss.message}</span>
            </div>
            <span class="badge ${badgeType}">${iss.severity.toUpperCase()}</span>
          </div>
          ${iss.suggestion ? `<div style="color: var(--text-secondary); font-size: 11px; line-height: 1.4; padding-left: 20px;">${iss.suggestion}</div>` : ''}
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
      panel.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 28px 12px; line-height: 1.5;">Click any room on the floor plan to inspect dimensions, area statement, and design properties.</div>`;
      return;
    }

    const room = this.interactionController.findRoom(this.selectedRoomId);
    if (!room) return;

    panel.innerHTML = `
      <div style="font-size: 12.5px;">
        <div style="margin-bottom: 12px;">
          <label class="form-label">ROOM DESIGNATION</label>
          <input type="text" id="prop-room-name" value="${room.name}" class="form-input" style="font-weight: 600;"/>
        </div>
        <div class="form-row" style="margin-bottom: 12px;">
          <div>
            <label class="form-label">WIDTH</label>
            <input type="text" value="${formatDimension(room.width)}" readonly class="form-input" style="color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 600;"/>
          </div>
          <div>
            <label class="form-label">LENGTH</label>
            <input type="text" value="${formatDimension(room.height)}" readonly class="form-input" style="color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 600;"/>
          </div>
        </div>
        <div style="margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">CALCULATED CARPET AREA</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--accent-emerald); font-family: var(--font-mono); margin-top: 2px;">
              ${room.areaSqFt} <span style="font-size: 11px; font-weight: 500;">sq.ft</span>
            </div>
          </div>
          <span class="badge badge-feasible">${(room.areaSqMm / 1e6).toFixed(2)} m²</span>
        </div>
        <button id="btn-delete-room" style="width: 100%; padding: 10px; background: rgba(244, 63, 94, 0.12); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s;">
          🗑 Delete Selected Space
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

    const viewNameMap = {
      editor2d: '2D Interactive Canvas',
      viewer3d: '3D Spatial Isometric Studio',
      schedule: 'Room Schedule & Area Statement',
      costs: 'Itemized Construction BoQ Estimator',
      vastu: 'Vastu Directional Alignment Audit'
    };

    const activeViewLabel = document.getElementById('active-view-name');
    if (activeViewLabel) {
      activeViewLabel.innerText = viewNameMap[tab] || '2D Interactive Canvas';
    }

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
