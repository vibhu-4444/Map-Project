# Architecture Specification — AI Residential Floor-Plan Architect

## 1. Architectural Philosophy: Clean, Decoupled & Stitch AI Ready

The core architecture strictly follows **Clean Architecture / Hexagonal Architecture** principles.
The application logic is partitioned into concentric layers with strict dependency rules pointing inward:

```
[ Stitch AI / Custom Web UI ]
            │
            ▼
[ Application State & History Store ]
            │
            ▼
[ Computational Geometry, Feasibility & Validation Engines ]
            │
            ▼
[ Core Mathematical Primitives & Canonical Domain Models ]
```

### Why Decoupling Matters for Stitch AI Redesign
1. **Zero UI Coupling in Core Logic**: No geometric calculations, feasibility rules, area equations, or layout generation algorithms import or reference DOM nodes, HTML elements, or UI frameworks.
2. **Replaceable Presentation Layer**: The UI communicates with the system solely via clean, typed state action interfaces (e.g. `dispatch({ type: 'MOVE_ROOM', payload: { roomId, deltaX, deltaY } })`).
3. **Deterministic Single Source of Truth**: All viewports (2D Canvas, 3D WebGL, Area Tables, Validation Panel, Vector Export) read from the identical authoritative project geometry data.

---

## 2. System Layers

### 2.1 Domain Layer (`/js/core`)
- Contains the canonical mathematical primitives: `Point2D`, `Segment2D`, `Polygon2D`, `BoundingBox`.
- Encapsulates unit conversion tables and high-precision floating point arithmetic.
- Defines data contracts for `Project`, `PlotConfiguration`, `HouseSpecification`, `Floor`, `Room`, `Wall`, `Opening`, and `FurnitureInstance`.

### 2.2 Engines Layer (`/js/engines`)
- **Spatial Feasibility Engine**: Evaluates plot dimensions, setback boundary, requested room schedule, and circulation factors. Determines geometric viability before layout synthesis.
- **Layout Generation Engine**: Generates deterministic candidate floor plans based on user priority strategies (Family-Oriented, Parking-Oriented, Vertical Expansion).
- **Geometry & Constraint Validator**: Runs continuous checks for boundary containment, room-to-room overlap, wall collisions, door access clearance, window exterior placement, and stair vertical stacking.
- **Area Calculation Engine**: Computes gross plot area, built-up area (BUA), carpet area, circulation area, wall thickness area, and open setbacks.
- **Vastu-Aware Design Engine**: Computes directional octants based on plot North and scores placement of Master Bedroom, Kitchen, Pooja, Living, and Staircase.
- **Cost Estimation Engine**: Generates itemized Bill of Quantities (BoQ) estimates with configurable rate tiers.

### 2.3 Interactive 2D & 3D Editor Layer (`/js/editor`, `/js/viewer3d`)
- **2D Viewport**: Renders architectural drafting elements (double-line exterior/interior walls, door swing arcs, window panes, room stamps, dimension strings, scale bar, north arrow).
- **Interaction Controller**: Handles pointer drag-to-move, handle-drag resize, snap-to-grid, snap-to-adjacent-wall, and click selection.
- **History Store**: Implements the Command Pattern / Immutable State Snapshots supporting multi-level Undo/Redo.
- **3D Viewport**: Builds a 3D scene directly from the 2D floor-plan geometry, extruding walls to 3000mm ceiling heights, cutting out door and window openings, and populating 3D furniture blocks.

### 2.4 Services & Export Layer (`/js/services`, `/js/export`)
- **AI Requirement Parser**: Two-tier parser featuring a deterministic rule-based NLP extractor (extracting bedrooms, bathrooms, kitchen, pooja, parking, orientation, budget) with pluggable LLM API adapters.
- **Persistence Service**: Manages localStorage serialization, version upgrades, and project JSON file export/import.
- **Export Drivers**: Generates native SVG drawings, raster PNGs, styled PDF architectural drawing sheets, and DXF files.

---

## 3. Authoritative Geometry Data Flow

```
User Input / Natural Language
             │
             ▼
AI Requirement Parser
             │
             ▼
Structured HouseSpecification
             │
             ▼
Spatial Feasibility Engine ──[Infeasible]──> Feasibility Diagnostics / Suggested Reductions
             │
         [Feasible]
             ▼
Deterministic Layout Generator ────────────> Layout Strategy Candidates (A, B, C)
             │
             ▼
Authoritative Project Geometry Model
    ├── Plot Boundary & Setback Envelopes
    ├── Floors & Rooms (Polygons)
    ├── Structural & Partition Walls
    ├── Openings (Doors & Windows)
    └── Furniture Instances
             │
    ┌────────┴────────────────────────┬────────────────────────┐
    ▼                                 ▼                        ▼
2D CAD Canvas Viewport       3D WebGL Architectural Scene    Area & Cost Schedules
(Live drag, resize, snap)    (Extruded walls & openings)     (Carpet, BUA, BoQ)
    │                                 │                        │
    └─────────────────────────────────┼────────────────────────┘
                                      │
                                      ▼
                        Export Engine (SVG, PNG, PDF, DXF)
```

---

## 4. State Management Architecture

The application state is structured cleanly into five distinct slices:
1. **`project`**: Authoritative domain state (id, name, plot, spec, floors, rooms, walls, openings, furniture, cost assumptions).
2. **`editor`**: Interaction state (active floor id, selected object id, hover state, active tool, zoom scale, pan offset, snap settings, display toggles).
3. **`history`**: Undo stack, redo stack, and snapshot limit.
4. **`validation`**: Current list of errors, warnings, and informational advisories.
5. **`ui`**: Active screen/modal, theme, sidebar tab, dialog inputs.

Temporary UI state (e.g. mouse cursor coordinates or modal open/close) is never saved to the project data model.
