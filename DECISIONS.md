# Architecture Decision Records (ADR) — AI Residential Floor-Plan Architect

## ADR-001: Millimeter (`mm`) as the Canonical Unit of Truth
- **Context**: Floor plans mix feet/inches (common in India and US), meters (civil engineering), and pixels (screens). Conversions between floats create cumulative rounding drifts and non-closed polygons.
- **Decision**: All coordinates, widths, lengths, and wall offsets are stored strictly in integer/floating millimeters (`mm`). Display conversions to feet, inches, meters, sq ft, sq m, and cents occur strictly at presentation time.
- **Consequences**: Deterministic polygon operations; no roundoff gaps between adjacent walls.

## ADR-002: Complete UI/UX Decoupling for Future Stitch AI Redesign
- **Context**: The user specified that the entire presentation layer will be redesigned later using Stitch AI.
- **Decision**: Strict boundary between the presentation layer (UI) and the underlying domain/engine layer. The geometry engine, feasibility engine, validator, export engines, and AI services have ZERO dependencies on React, Vue, DOM elements, or CSS classes.
- **Consequences**: A new UI built in Stitch AI can drop in by simply subscribing to the application state and dispatching actions.

## ADR-003: Deterministic Geometry Generation vs. Generative Diffusion/LLMs
- **Context**: LLMs hallucinate non-closed rooms, zero-thickness walls, overlapping spaces, and impossible dimensions when generating direct image or SVG floor plans.
- **Decision**: The AI's role is strictly limited to Natural Language Understanding (extracting structured requirements into a JSON HouseSpecification). The actual physical floor plan is synthesized deterministically by a computational geometry engine respecting setback boundaries, room dimensions, adjacency graphs, and wall thickness.
- **Consequences**: 100% physically valid, dimensionally accurate, editable architectural layouts.

## ADR-004: Hybrid SVG / Canvas 2D Viewport
- **Context**: Architectural floor plans require crisp vector precision, dimension text, door swing curves, and fast interactive dragging.
- **Decision**: Use scalable SVG elements with dynamic canvas overlays for high-performance CAD interaction. SVG allows direct vector export without rasterization loss.
- **Consequences**: Crisp rendering at any zoom level, native vector export capability, and standard DOM event handling for room selection.

## ADR-005: 3D Visualization Derived Strictly from 2D Geometry
- **Context**: 3D models can easily desynchronize from 2D plans if maintained as separate assets.
- **Decision**: The 3D scene is generated on-demand by extruding the validated 2D room polygons and wall segments into 3D meshes (with wall height = 3000mm, door openings at 2100mm, window sill/lintel cutouts).
- **Consequences**: Every edit in the 2D floor plan is instantly and accurately reflected in the 3D view.
