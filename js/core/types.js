/**
 * Canonical Domain Types, Constants & Schemas
 * AI Residential Floor-Plan Architect
 */

export const ROOM_DEFINITIONS = {
  master_bedroom: {
    type: 'master_bedroom',
    label: 'Master Bedroom',
    category: 'private',
    minWidthMm: 3350,   // ~11' - 0"
    minHeightMm: 3650,  // ~12' - 0"
    minAreaSqFt: 130,
    preferredAreaSqFt: 160,
    color: '#3b82f6',   // Soft Blue
    bgLight: 'rgba(59, 130, 246, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['king_bed', 'nightstand_left', 'nightstand_right', 'wardrobe']
  },
  bedroom: {
    type: 'bedroom',
    label: 'Bedroom',
    category: 'private',
    minWidthMm: 3050,   // ~10' - 0"
    minHeightMm: 3350,  // ~11' - 0"
    minAreaSqFt: 110,
    preferredAreaSqFt: 130,
    color: '#60a5fa',
    bgLight: 'rgba(96, 165, 250, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['queen_bed', 'nightstand_left', 'wardrobe']
  },
  living: {
    type: 'living',
    label: 'Living Room',
    category: 'public',
    minWidthMm: 3650,   // ~12' - 0"
    minHeightMm: 4570,  // ~15' - 0"
    minAreaSqFt: 180,
    preferredAreaSqFt: 220,
    color: '#10b981',   // Emerald
    bgLight: 'rgba(16, 185, 129, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['sofa_3seater', 'sofa_2seater', 'coffee_table', 'tv_unit']
  },
  dining: {
    type: 'dining',
    label: 'Dining Room',
    category: 'public',
    minWidthMm: 2740,   // ~9' - 0"
    minHeightMm: 3350,  // ~11' - 0"
    minAreaSqFt: 90,
    preferredAreaSqFt: 120,
    color: '#f59e0b',   // Amber
    bgLight: 'rgba(245, 158, 11, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['dining_table_6']
  },
  kitchen: {
    type: 'kitchen',
    label: 'Kitchen',
    category: 'service',
    minWidthMm: 2440,   // ~8' - 0"
    minHeightMm: 3050,  // ~10' - 0"
    minAreaSqFt: 80,
    preferredAreaSqFt: 100,
    color: '#ef4444',   // Rose/Red
    bgLight: 'rgba(239, 68, 68, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['kitchen_counter_l', 'refrigerator']
  },
  attached_bathroom: {
    type: 'attached_bathroom',
    label: 'Attached Bath',
    category: 'sanitary',
    minWidthMm: 1520,   // ~5' - 0"
    minHeightMm: 2130,  // ~7' - 0"
    minAreaSqFt: 35,
    preferredAreaSqFt: 45,
    color: '#06b6d4',   // Cyan
    bgLight: 'rgba(6, 182, 212, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['water_closet', 'wash_basin', 'shower_zone']
  },
  common_bathroom: {
    type: 'common_bathroom',
    label: 'Common Bath',
    category: 'sanitary',
    minWidthMm: 1370,   // ~4' - 6"
    minHeightMm: 1980,  // ~6' - 6"
    minAreaSqFt: 30,
    preferredAreaSqFt: 38,
    color: '#0891b2',
    bgLight: 'rgba(8, 145, 178, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['water_closet', 'wash_basin']
  },
  pooja: {
    type: 'pooja',
    label: 'Pooja Room',
    category: 'spiritual',
    minWidthMm: 1220,   // ~4' - 0"
    minHeightMm: 1520,  // ~5' - 0"
    minAreaSqFt: 20,
    preferredAreaSqFt: 30,
    color: '#8b5cf6',   // Purple
    bgLight: 'rgba(139, 92, 246, 0.12)',
    requiresVentilation: false,
    defaultFurniture: ['pooja_mandir']
  },
  parking: {
    type: 'parking',
    label: 'Car Parking / Porch',
    category: 'outdoor',
    minWidthMm: 3050,   // ~10' - 0"
    minHeightMm: 5000,  // ~16' - 5"
    minAreaSqFt: 160,
    preferredAreaSqFt: 180,
    color: '#64748b',   // Slate
    bgLight: 'rgba(100, 116, 139, 0.15)',
    requiresVentilation: false,
    defaultFurniture: ['car_footprint']
  },
  staircase: {
    type: 'staircase',
    label: 'Staircase',
    category: 'circulation',
    minWidthMm: 2130,   // ~7' - 0" (dog-legged: 2 x 3' flight + 1' well)
    minHeightMm: 3650,  // ~12' - 0"
    minAreaSqFt: 80,
    preferredAreaSqFt: 95,
    color: '#d97706',   // Warm Ochre
    bgLight: 'rgba(217, 119, 6, 0.15)',
    requiresVentilation: true,
    defaultFurniture: ['staircase_symbol']
  },
  foyer: {
    type: 'foyer',
    label: 'Entry Foyer',
    category: 'circulation',
    minWidthMm: 1520,
    minHeightMm: 1830,
    minAreaSqFt: 30,
    preferredAreaSqFt: 45,
    color: '#a855f7',
    bgLight: 'rgba(168, 85, 247, 0.12)',
    requiresVentilation: false,
    defaultFurniture: []
  },
  balcony: {
    type: 'balcony',
    label: 'Balcony',
    category: 'outdoor',
    minWidthMm: 1220,
    minHeightMm: 2440,
    minAreaSqFt: 30,
    preferredAreaSqFt: 50,
    color: '#14b8a6',   // Teal
    bgLight: 'rgba(20, 184, 166, 0.12)',
    requiresVentilation: true,
    defaultFurniture: []
  },
  utility: {
    type: 'utility',
    label: 'Utility / Wash',
    category: 'service',
    minWidthMm: 1220,
    minHeightMm: 2130,
    minAreaSqFt: 25,
    preferredAreaSqFt: 35,
    color: '#f43f5e',
    bgLight: 'rgba(244, 63, 94, 0.12)',
    requiresVentilation: true,
    defaultFurniture: ['washing_machine']
  }
};

/**
 * Standard Wall Thicknesses in Millimeters (mm)
 */
export const WALL_THICKNESS = {
  exterior: 230,   // Standard 9-inch brick/block wall
  interior: 115,   // Standard 4.5-inch partition wall
  boundary: 150    // Plot compound wall
};

/**
 * Creates a default new project data model
 */
export function createDefaultProject(customName = 'Modern 3BHK Residence') {
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: customName,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    version: '1.0.0',
    plot: {
      widthMm: 10668,   // 35 ft
      lengthMm: 15240,  // 50 ft (35x50 = 1750 sq.ft)
      orientation: 'north', // North facing
      roadFacing: 'north',
      setbacks: {
        frontMm: 1524,  // 5 ft front
        rearMm: 1219,   // 4 ft rear
        leftMm: 914,    // 3 ft left
        rightMm: 914    // 3 ft right
      }
    },
    specification: {
      bedrooms: 3,
      bathrooms: { total: 2, attached: 1, common: 1 },
      kitchen: { priority: 'large', style: 'open' },
      parking: { required: true, vehicleCount: 1, type: 'car' },
      poojaRoom: true,
      studyRoom: false,
      diningRoom: true,
      balcony: true,
      floorsCount: 1,
      designPriority: 'family-oriented',
      vastuMode: 'vastu-aware'
    },
    floors: [],
    selectedFloorId: null,
    settings: {
      measurementUnit: 'ft-in',
      areaUnit: 'sqft',
      gridSnapSizeMm: 304.8, // 1 ft snap
      snapToGrid: true,
      snapToWalls: true,
      showDimensions: true,
      showFurniture: true,
      showGrid: true,
      showSetbacks: true,
      showRoomNames: true,
      showAreas: true
    },
    costAssumptions: {
      finishTier: 'standard', // economy, standard, premium, luxury
      baseRatePerSqFt: 2200,   // INR / USD equivalent configurable
      breakdownPercents: {
        civilStructure: 42,
        masonryPlaster: 12,
        flooringTiling: 10,
        doorsWindows: 9,
        plumbingSanitary: 8,
        electrical: 7,
        paintingFinishes: 6,
        contingency: 6
      }
    }
  };
}
