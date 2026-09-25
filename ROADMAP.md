# Development Roadmap & Status — AI Residential Floor-Plan Architect

This document records the exact development progress, completed vertical slices, currently active milestones, and future phases.

---

## Phase Status Summary

| Phase | Description | Status | Verification Check |
|-------|-------------|--------|-------------------|
| **Phase 0** | Repository & Environment Audit | **COMPLETED** | Verified runtimes, paths, tool availability |
| **Phase 1** | Architecture, Primitives, Unit Conversions & Docs | **IN PROGRESS** | Unit tests for vector math, polygon ops, conversions |
| **Phase 2** | Plot Configuration & House Specification Models | **IN PROGRESS** | Schema validation, plot boundaries, setback envelopes |
| **Phase 3** | Spatial Feasibility Engine | **PENDING** | Area calculation benchmarks, over-capacity diagnostics |
| **Phase 4** | Deterministic Layout Generator (3 Strategies) | **PENDING** | Family-Oriented, Parking-Oriented, Vertical Expansion |
| **Phase 5** | Precision 2D CAD Viewport & Interactive Editor | **PENDING** | Canvas/SVG renderer, drag, resize, snapping, undo/redo |
| **Phase 6** | Residential Furniture Intelligence & Collision Footprints | **PENDING** | Furniture catalog, rotation, collision detection |
| **Phase 7** | Multi-Floor Planning & Vertical Circulation Alignment | **PENDING** | Floor switcher, staircase shaft containment |
| **Phase 8** | Vastu-Aware Preference System | **PENDING** | Directional octant scoring, non-destructive advisories |
| **Phase 9** | Real-Time Area Calculations & Construction BoQ Cost Estimator | **PENDING** | Carpet vs BUA schedules, itemized rate tables |
| **Phase 10** | 3D WebGL Architectural Visualizer | **PENDING** | Direct 2D-to-3D wall extrusion, openings, orbit camera |
| **Phase 11** | Production-Grade Export Suite (SVG, PNG, PDF, DXF) | **PENDING** | Vector SVG, raster PNG, title block PDF, DXF layers |
| **Phase 12** | Natural Language Requirement Parser (Rule-based + AI) | **PENDING** | Entity extraction, schema validation, fallback parser |

---

## Known Limitations & Honest System Boundaries

1. **Structural Engineering**: The layout generator creates architectural space plans based on spatial conventions. It does *not* compute finite element structural load analysis, RCC column design, or shear wall placement. Professional structural engineer approval is mandatory before construction.
2. **Jurisdiction By-Laws**: The system supports user-defined setbacks and standard municipal guidance. It does *not* claim certified automated legal approval against unverified municipal building codes.
3. **AI Boundaries**: The AI parser converts natural language into structured specifications. The layout geometry is generated deterministically by the geometry engine to guarantee physical plausibility and avoid hallucinated drawings.
