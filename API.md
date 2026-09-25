# API & Service Interface Specification — Craft Your Archi

This document specifies the internal and service boundary interfaces for the platform. In keeping with Clean Architecture, these interfaces can be backed by client-side Web Workers, in-process engines, or remote REST/GraphQL services without altering the consumer code.

---

## 1. Natural Language Requirement Parser

### `POST /api/requirements/parse` or `AIParserService.parse(text: string, options?: ParseOptions)`

**Request / Input:**
```typescript
interface ParseRequirementsRequest {
  naturalLanguagePrompt: string;
  context?: {
    plotWidth?: number;
    plotLength?: number;
    floorCount?: number;
  };
}
```

**Response / Output:**
```typescript
interface ParseRequirementsResponse {
  success: boolean;
  specification: HouseSpecification;
  extractedEntities: {
    bedrooms: number;
    bathrooms: { total: number; attached: number; common: number };
    kitchen: { priority: 'standard' | 'large'; style: 'closed' | 'open' };
    parking: { required: boolean; vehicleCount: number; type: 'car' | 'two-wheeler' };
    poojaRoom: boolean;
    studyRoom: boolean;
    diningRoom: boolean;
    balcony: boolean;
    staircase: 'internal' | 'external' | 'none';
  };
  inferredPreferences: string[];
  missingInformationPrompts: string[];
  rawText: string;
}
```

---

## 2. Spatial Feasibility Service

### `POST /api/feasibility/check` or `FeasibilityEngine.check(plot: PlotConfig, spec: HouseSpecification)`

**Request / Input:**
```typescript
interface FeasibilityCheckRequest {
  plot: PlotConfiguration;
  specification: HouseSpecification;
  floorsCount: number;
  assumptions?: {
    wallThicknessFactor?: number;   // default: 0.12 (12%)
    circulationFactor?: number;     // default: 0.15 (15%)
  };
}
```

**Response / Output:**
```typescript
interface FeasibilityCheckResponse {
  isFeasible: boolean;
  verdict: 'FEASIBLE' | 'TIGHT_FIT' | 'OVER_CAPACITY';
  metrics: {
    grossPlotAreaSqFt: number;
    buildableFootprintSqFt: number;
    totalRequestedCarpetSqFt: number;
    estimatedCirculationSqFt: number;
    estimatedWallFootprintSqFt: number;
    totalRequiredBuiltUpSqFt: number;
    availableCapacitySqFt: number;
    utilizationPercentage: number;
  };
  diagnostics: string[];
  recommendations: string[];
}
```

---

## 3. Layout Generation Service

### `POST /api/layouts/generate` or `LayoutGeneratorEngine.generate(request: GenerateLayoutRequest)`

**Request / Input:**
```typescript
interface GenerateLayoutRequest {
  plot: PlotConfiguration;
  specification: HouseSpecification;
  strategy: 'family-oriented' | 'parking-oriented' | 'expansion-oriented' | 'all';
  vastuAware?: boolean;
}
```

**Response / Output:**
```typescript
interface GenerateLayoutResponse {
  candidates: LayoutCandidate[];
}

interface LayoutCandidate {
  id: string;
  name: string;
  strategy: 'family-oriented' | 'parking-oriented' | 'expansion-oriented';
  description: string;
  floors: FloorPlan[];
  metrics: AreaSchedule;
  validationReport: ValidationReport;
  vastuScore?: number;
}
```

---

## 4. Geometry Validation Service

### `POST /api/validate` or `GeometryValidator.validate(project: Project)`

**Output:**
```typescript
interface ValidationReport {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: 'bounds' | 'overlap' | 'dimensions' | 'ventilation' | 'circulation' | 'vastu';
  affectedObjectId?: string;
  message: string;
  suggestion?: string;
}
```

---

## 5. Export Service

### `POST /api/export` or `ExportEngine.export(project: Project, format: 'svg' | 'png' | 'pdf' | 'dxf')`

- Supports binary blob download or vector string output.
- Generates layers, dimension annotations, title blocks, schedules, and standard disclaimer.
