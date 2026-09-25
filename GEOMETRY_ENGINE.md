# Geometry Engine Specification — AI Residential Floor-Plan Architect

## 1. Coordinate System & Measurement Conventions

### Internal Unit of Truth: Millimeters (mm)
To prevent floating-point rounding errors and unit confusion across the codebase:
- **All coordinates, lengths, wall thicknesses, and room boundaries are represented internally in exact millimeters (`mm`) as 64-bit IEEE 754 floating-point numbers.**
- Screen pixels, feet, inches, meters, square feet, square meters, and regional units are calculated only at presentation or export boundaries.

### Coordinate Space Orientation
- **Origin `(0, 0)`**: Top-left corner of the plot boundary.
- **X-Axis**: Increases from Left to Right (West to East by default).
- **Y-Axis**: Increases from Top to Bottom (North to South by default).
- **Angles**: Expressed in degrees, clockwise from the positive X-axis (0° = East, 90° = South, 180° = West, 270° = North).

---

## 2. Core Geometric Primitives

### 2.1 Point2D
```typescript
interface Point2D {
  x: number; // in mm
  y: number; // in mm
}
```
**Methods**: Vector addition, subtraction, scalar multiplication, dot product, cross product, euclidean distance, angle to, rotation about origin/point.

### 2.2 Segment2D
```typescript
interface Segment2D {
  start: Point2D;
  end: Point2D;
}
```
**Methods**: Length, midpoint, bounding box, perpendicular vector, segment-to-segment intersection, distance to point, projection of point.

### 2.3 Polygon2D
```typescript
interface Polygon2D {
  vertices: Point2D[]; // Ordered counter-clockwise or clockwise
}
```
**Methods**:
- **Signed Area**: Computed using the Shoelace formula (Gauss's area formula):
  $$\text{Area} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$
- **Centroid**: Center of mass derived from polygon vertices.
- **Point-in-Polygon**: Raycasting (Jordan Curve Theorem) with edge-intersection edge cases handled.
- **Bounding Box**: Axis-Aligned Bounding Box (AABB) `{ minX, minY, maxX, maxY, width, height }`.
- **Polygon-Polygon Collision**: Separating Axis Theorem (SAT) for convex polygons; decomposed edge-intersection and containment for general polygons.

### 2.4 Wall Geometry
```typescript
interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // 230mm for exterior, 115mm for interior partitions
  type: 'exterior' | 'interior' | 'partition';
  openings: Opening[];
}
```
Walls generate an oriented rectangular polygon for visual rendering and collision tests:
- Centerline segment: `start` to `end`.
- Perpendicular offset: `±(thickness / 2)` normal to the centerline.

### 2.5 Openings (Doors & Windows)
```typescript
interface Opening {
  id: string;
  wallId: string;
  type: 'door' | 'window' | 'arch';
  offset: number; // Distance in mm from wall start point along wall segment
  width: number;  // Standard: Door 900mm-1000mm, Window 1200mm-1800mm
  height: number; // Standard: 2100mm height
  swingDirection?: 'inward-left' | 'inward-right' | 'outward-left' | 'outward-right' | 'sliding';
}
```

---

## 3. Spatial Feasibility Calculation

Before generating or placing layouts, the engine calculates the feasibility envelope:

1. **Gross Plot Area**:
   $$\text{Plot Area} = \text{PolygonArea}(\text{PlotPolygon})$$
2. **Setback Envelopes**:
   User-defined or regulation-recommended setbacks (Front, Rear, Left, Right):
   $$\text{Buildable Width} = \text{Plot Width} - (\text{Left Setback} + \text{Right Setback})$$
   $$\text{Buildable Length} = \text{Plot Length} - (\text{Front Setback} + \text{Rear Setback})$$
   $$\text{Buildable Footprint} = \text{Buildable Width} \times \text{Buildable Length}$$
3. **Requested Carpet Area**:
   $$\text{Requested Carpet} = \sum_{r \in \text{RequestedRooms}} \text{MinArea}(r)$$
4. **Circulation & Wall Allowances**:
   - Circulation Factor: typically 12% - 18% of room area.
   - Wall Footprint Allowance: typically 10% - 15% of gross built-up area.
5. **Gross Required Area per Floor**:
   $$\text{Gross Required Area} = \frac{\text{Requested Carpet}}{1 - (\text{Circulation Factor} + \text{Wall Factor})}$$
6. **Feasibility Verdict**:
   - If $\text{Gross Required Area} \le \text{Buildable Footprint} \times \text{Floors}$: **FEASIBLE**.
   - If $\text{Gross Required Area} > \text{Buildable Footprint} \times \text{Floors}$: **OVER_CAPACITY** (provides exact shortfall in sq ft and suggests adding floors or reducing room sizes).

---

## 4. Deterministic Layout Generation

The Layout Generator does **not** rely on stochastic heuristics or hallucinated rectangles. It employs a deterministic spatial bin-packing and adjacency graph algorithm:

1. **Zoning Phase**:
   - **Public Zone**: Living Room, Drawing Room, Dining, Foyer, Porch (positioned near entrance & road frontage).
   - **Service Zone**: Kitchen, Utility, Common Bathroom (adjacent to dining or exterior service side).
   - **Private Zone**: Master Bedroom, Guest/Kids Bedrooms, Attached Baths (positioned in quieter rear/side quadrants).
2. **Strategy Variants**:
   - **Strategy A (Family-Oriented)**: Central living hub, maximized bedroom privacy, natural daylighting for all bedrooms.
   - **Strategy B (Parking-Oriented)**: Prioritizes front vehicular turning radius, deep car porch (min 5000mm length), consolidated interior footprint.
   - **Strategy C (Future Expansion)**: Staircase located along exterior boundary wall with independent external or lobby access so future upper floors can be rented or accessed without traversing the ground floor living area.
3. **Adjacency Enforcement**:
   - Kitchen directly adjacent to Dining Room.
   - Attached Bathrooms shared perimeter with respective Bedrooms.
   - Living Room connected to Entrance Foyer/Verandah.
4. **Perimeter Wall & Opening Synthesis**:
   - Exterior boundaries receive 230mm structural walls.
   - Rooms adjacent to plot setbacks receive exterior window openings for cross-ventilation.
   - Doors placed at optimal room access points without conflicting with furniture swing radii.

---

## 5. Constraint & Code Validator

The validator continuously inspects the active geometry model and produces structured reports:
- **`ERR_PLOT_OUT_OF_BOUNDS`**: Room or wall extends beyond plot or mandatory setback boundaries.
- **`ERR_ROOM_OVERLAP`**: Two room polygons intersect by more than 0.01 mm².
- **`ERR_WALL_COLLISION`**: Walls intersect abnormally without forming a standard T-junction or corner.
- **`WARN_MIN_DIMENSION`**: A room dimension falls below residential standard minimums (e.g. Master Bedroom width < 3000mm / 10 ft).
- **`WARN_NO_NATURAL_VENTILATION`**: Habitable room (bedroom/living) has no exterior wall or window facing an open setback.
- **`WARN_DOOR_OBSTRUCTION`**: Door swing path is blocked by a wall or furniture bounding box.
- **`WARN_STAIR_MISALIGNMENT`**: In multi-floor mode, upper floor staircase opening does not align with lower floor staircase footprint.

---

## 6. Snapping Engine

To provide professional CAD editing responsiveness:
- **Grid Snapping**: Coordinates snap to 100mm, 300mm (approx 1 ft), or 500mm increments.
- **Wall Alignment Snapping**: When moving a room, edges snap to collinear edges of neighboring rooms within a 150mm threshold.
- **Perimeter Snapping**: Rooms automatically snap flush against the inner setback boundary line.
