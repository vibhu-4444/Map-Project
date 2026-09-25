/**
 * Furniture Intelligence & Parametric Catalog
 * Real-world dimensional footprints for residential space planning and collision checking.
 */

export const FURNITURE_CATALOG = {
  // Bedroom
  bed_king: {
    id: 'bed_king',
    name: 'King Size Bed',
    category: 'bedroom',
    width: 1980,  // 6' - 6"
    length: 2080, // 6' - 10"
    height: 900,
    color: '#6366f1',
    symbol: 'bed'
  },
  bed_queen: {
    id: 'bed_queen',
    name: 'Queen Size Bed',
    category: 'bedroom',
    width: 1520,  // 5' - 0"
    length: 2000, // 6' - 7"
    height: 900,
    color: '#818cf8',
    symbol: 'bed'
  },
  nightstand: {
    id: 'nightstand',
    name: 'Bedside Table',
    category: 'bedroom',
    width: 450,
    length: 450,
    height: 550,
    color: '#4f46e5',
    symbol: 'box'
  },
  wardrobe: {
    id: 'wardrobe',
    name: '3-Door Wardrobe',
    category: 'bedroom',
    width: 600,
    length: 1800,
    height: 2100,
    color: '#4338ca',
    symbol: 'wardrobe'
  },
  study_desk: {
    id: 'study_desk',
    name: 'Study Desk & Chair',
    category: 'bedroom',
    width: 600,
    length: 1200,
    height: 750,
    color: '#3730a3',
    symbol: 'desk'
  },

  // Living
  sofa_3seater: {
    id: 'sofa_3seater',
    name: '3-Seater Sofa',
    category: 'living',
    width: 2100,
    length: 850,
    height: 850,
    color: '#059669',
    symbol: 'sofa'
  },
  sofa_2seater: {
    id: 'sofa_2seater',
    name: '2-Seater Loveseat',
    category: 'living',
    width: 1500,
    length: 850,
    height: 850,
    color: '#10b981',
    symbol: 'sofa'
  },
  coffee_table: {
    id: 'coffee_table',
    name: 'Rectangular Coffee Table',
    category: 'living',
    width: 1100,
    length: 600,
    height: 450,
    color: '#047857',
    symbol: 'table'
  },
  tv_unit: {
    id: 'tv_unit',
    name: 'Media Console / TV Unit',
    category: 'living',
    width: 1800,
    length: 450,
    height: 500,
    color: '#065f46',
    symbol: 'tv'
  },

  // Dining
  dining_table_6: {
    id: 'dining_table_6',
    name: '6-Seater Dining Table',
    category: 'dining',
    width: 1500,
    length: 900,
    height: 750,
    color: '#d97706',
    symbol: 'dining'
  },
  dining_table_4: {
    id: 'dining_table_4',
    name: '4-Seater Dining Table',
    category: 'dining',
    width: 1000,
    length: 1000,
    height: 750,
    color: '#b45309',
    symbol: 'dining'
  },

  // Kitchen
  refrigerator: {
    id: 'refrigerator',
    name: 'Double Door Refrigerator',
    category: 'kitchen',
    width: 750,
    length: 700,
    height: 1800,
    color: '#dc2626',
    symbol: 'fridge'
  },
  kitchen_sink: {
    id: 'kitchen_sink',
    name: 'Kitchen Sink & Drainboard',
    category: 'kitchen',
    width: 900,
    length: 500,
    height: 850,
    color: '#b91c1c',
    symbol: 'sink'
  },
  cooking_hob: {
    id: 'cooking_hob',
    name: '3-Burner Gas/Induction Hob',
    category: 'kitchen',
    width: 750,
    length: 500,
    height: 850,
    color: '#991b1b',
    symbol: 'hob'
  },

  // Bathroom
  water_closet: {
    id: 'water_closet',
    name: 'Wall-Hung Water Closet (WC)',
    category: 'sanitary',
    width: 400,
    length: 600,
    height: 450,
    color: '#0891b2',
    symbol: 'wc'
  },
  wash_basin: {
    id: 'wash_basin',
    name: 'Vanity Wash Basin',
    category: 'sanitary',
    width: 550,
    length: 450,
    height: 850,
    color: '#0e7490',
    symbol: 'basin'
  },
  shower_zone: {
    id: 'shower_zone',
    name: 'Glass Shower Cubicle',
    category: 'sanitary',
    width: 900,
    length: 900,
    height: 2000,
    color: '#155e75',
    symbol: 'shower'
  },

  // Parking & Vehicle
  car_footprint: {
    id: 'car_footprint',
    name: 'Mid-Size Car (Sedan / Compact SUV)',
    category: 'parking',
    width: 1800, // 5' - 11"
    length: 4500,// 14' - 9"
    height: 1600,
    color: '#475569',
    symbol: 'car'
  }
};
