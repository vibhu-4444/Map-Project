# AI Residential Floor-Plan Architect

An intelligent, modular, and genuinely functional residential floor-planning, spatial feasibility, interactive editing, validation, 3D visualization, and architectural export platform.

---

## Overview

AI Residential Floor-Plan Architect allows homeowners, civil engineers, and architects to:
1. Define plot geometries, orientation, road access, and setback constraints.
2. Enter natural language residential requirements (e.g. *"3BHK with south-west master bedroom, open kitchen, pooja room, and front car porch"*).
3. Perform rigorous deterministic spatial feasibility checks before generating layouts.
4. Synthesize multiple feasible architectural layout alternatives (Family-Oriented, Parking-Oriented, Future Expansion).
5. Interactively inspect and edit the floor plan in a precision 2D CAD-style canvas with live constraint validation and area updates.
6. Place and arrange residential furniture with collision footprint checking.
7. Plan multi-floor buildings with vertical circulation alignment.
8. Evaluate Vastu-directional alignments with actionable advisories.
9. Estimate construction costs through configurable work-package rate breakdowns.
10. Explore the floor plan in interactive 3D with extruded walls, slabs, openings, and furniture.
11. Export production-grade vector SVG, high-resolution PNG, printable PDF drawing sheets, and standard DXF files.

---

## Architectural Principles & Stitch AI Compatibility

The platform is designed using Clean Architecture principles to guarantee that **the entire UI/UX can be redesigned later using Stitch AI** without modifying the core geometry engine, feasibility calculator, layout generator, validation rules, AI services, or export exporters.

- **Presentation Layer**: Pure view components; no business or geometric logic.
- **Application State**: Predictable state store with immutable undo/redo history.
- **Domain & Engines**: Framework-agnostic, deterministic computational geometry and validation algorithms.
- **Services Layer**: Pluggable AI parser, local/cloud persistence, and export drivers.

---

## Technology Stack

- **Frontend Core**: Modern modular JavaScript / TypeScript, HTML5 Canvas, and SVG.
- **Styling**: Vanilla CSS design system with Dark Architectural Studio aesthetics, CSS tokens, and responsive layout.
- **3D Engine**: WebGL / Three.js 3D rendering pipeline derived directly from authoritative 2D geometry.
- **Computational Geometry**: In-house deterministic polygon clipping, collision detection, and spatial partitioning engine.
- **Persistence**: Structured local storage with JSON project export/import; cloud-ready normalized schema.
- **Testing**: Deterministic unit test suite covering geometry math, feasibility calculations, and validation rules.

---

## Quick Start & Running Locally

1. Open `index.html` in any modern web browser directly, or serve it via any static HTTP server:
   ```powershell
   # If Python is installed:
   python -m http.server 3000

   # Or using PowerShell native server:
   powershell -ExecutionPolicy Bypass -File ./serve.ps1
   ```
2. Navigate to `http://localhost:3000` to access the full interactive studio.

---

## Project Structure

```
ai-residential-floorplan-architect/
├── index.html                  # Main application entry point & modular UI shell
├── serve.ps1                   # Lightweight PowerShell HTTP development server
├── css/
│   ├── studio.css              # Core architectural studio design system
│   ├── editor.css              # 2D canvas and 3D viewport styles
│   └── components.css          # Panels, modals, forms, and validation cards
├── js/
│   ├── core/
│   │   ├── units.js            # Precise metric/imperial/Indian unit conversions
│   │   ├── geometry.js         # Point, Segment, Polygon, Raycasting, BoundingBox
│   │   └── types.js            # Canonical domain data models & schemas
│   ├── engines/
│   │   ├── feasibility.js      # Deterministic spatial feasibility engine
│   │   ├── layout-generator.js # Multi-strategy candidate layout generator
│   │   ├── validator.js        # Live spatial constraint & code validator
│   │   ├── area-calculator.js  # Room schedule and gross/carpet/built-up metrics
│   │   ├── vastu.js            # Vastu quadrant scoring & design recommendations
│   │   └── cost-estimator.js   # BoQ construction cost estimation engine
│   ├── editor/
│   │   ├── canvas2d.js         # Interactive SVG/Canvas 2D floor-plan viewport
│   │   ├── interaction.js      # Room drag, resize, door/window placement, snapping
│   │   ├── history.js          # Robust undo/redo command stack
│   │   └── furniture-catalog.js# Parametric furniture library with collision footprints
│   ├── viewer3d/
│   │   └── viewer3d.js         # Direct WebGL 3D architectural visualizer
│   ├── export/
│   │   ├── svg-exporter.js     # Vector architectural drawing exporter
│   │   ├── png-exporter.js     # High-resolution raster image exporter
│   │   ├── pdf-exporter.js     # Printable drawing sheet with title block & schedule
│   │   └── dxf-exporter.js     # AutoCAD R12/2000 standard DXF generator
│   ├── services/
│   │   ├── ai-parser.js        # Requirement parser (deterministic rule-based + LLM)
│   │   └── storage.js          # Project persistence and sample presets
│   └── app.js                  # Master application orchestrator & UI controller
├── tests/
│   ├── test-geometry.js        # Unit tests for geometry primitives and collisions
│   ├── test-feasibility.js     # Unit tests for spatial feasibility engine
│   └── run-tests.html          # Interactive browser test runner
├── README.md
├── ARCHITECTURE.md
├── GEOMETRY_ENGINE.md
├── API.md
├── ROADMAP.md
└── DECISIONS.md
```

---

## Known Limitations & Development Roadmap

See [ROADMAP.md](file:///C:/Users/CP/.gemini/antigravity-ide/scratch/ai-residential-floorplan-architect/ROADMAP.md) for detailed development phases and status.
