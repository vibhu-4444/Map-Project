/**
 * Construction Cost Estimation & BoQ Engine
 * Computes itemized construction cost breakdowns based on actual built-up area (BUA),
 * configurable work package rates, and finish quality tiers.
 */

export const FINISH_TIERS = {
  economy: {
    id: 'economy',
    name: 'Economy Finish',
    baseRatePerSqFt: 1750, // Standard brick, vitrified tiles, flush doors, basic sanitary
    description: 'Cost-effective RCC frame, local red bricks, ceramic flooring, standard CP fittings.'
  },
  standard: {
    id: 'standard',
    name: 'Standard Quality',
    baseRatePerSqFt: 2250, // Teak-frame doors, premium vitrified, branded CPVC plumbing, acrylic paint
    description: 'High-grade RCC, AAC blocks, 800x800mm vitrified tiles, branded sanitaryware, modular switches.'
  },
  premium: {
    id: 'premium',
    name: 'Premium Luxury',
    baseRatePerSqFt: 2950, // Italian marble, UPVC double-glazed windows, concealed cisterns, designer lights
    description: 'Italian marble living, engineered wood bedrooms, UPVC windows, Grohe/Kohler fixtures, false ceilings.'
  },
  luxury: {
    id: 'luxury',
    name: 'Ultra Luxury / Bespoke',
    baseRatePerSqFt: 3850, // Smart home automation, VRV AC provision, custom hardwood, solar backup
    description: 'Architectural concrete, full home automation, custom imported joinery, solar water & PV provisions.'
  }
};

export const WORK_PACKAGES = [
  { key: 'civilStructure', name: 'Civil & RCC Structure', sharePercent: 42, description: 'Earthwork, PCC, Footings, Columns, Beams, Slabs, and Reinforcement Steel.' },
  { key: 'masonryPlaster', name: 'Masonry & Plastering', sharePercent: 12, description: 'External 9" walls, internal 4.5" partitions, cement plastering, and waterproofing.' },
  { key: 'flooringTiling', name: 'Flooring & Wall Cladding', sharePercent: 10, description: 'Vitrified tiles, granite countertops, bathroom dado tiles, and skirting.' },
  { key: 'doorsWindows', name: 'Doors & Windows Joinery', sharePercent: 9, description: 'Main entrance security door, bedroom flush doors, aluminum/UPVC sliding windows.' },
  { key: 'plumbingSanitary', name: 'Plumbing & Sanitation', sharePercent: 8, description: 'Concealed CPVC/PVC piping, overhead water tank, sanitaryware, and fixtures.' },
  { key: 'electrical', name: 'Electrical & Lighting', sharePercent: 7, description: 'Concealed FR wiring, distribution boards, modular switches, and earthing.' },
  { key: 'paintingFinishes', name: 'Painting & Finishing', sharePercent: 6, description: 'Exterior weatherproof emulsion, interior putty, primer, and premium emulsion.' },
  { key: 'contingency', name: 'Design Fees & Contingency', sharePercent: 6, description: 'Architectural/structural design fees, municipal approvals, and unforeseen site adjustments.' }
];

export class CostEstimatorEngine {
  /**
   * Generates a detailed itemized construction cost estimate
   * @param {number} builtUpAreaSqFt - Calculated built-up area
   * @param {string} tierId - 'economy' | 'standard' | 'premium' | 'luxury'
   * @param {number} customRate - Optional custom base rate override
   * @returns {Object} Cost estimation breakdown report
   */
  static estimate(builtUpAreaSqFt, tierId = 'standard', customRate = null) {
    const tier = FINISH_TIERS[tierId] || FINISH_TIERS.standard;
    const baseRate = customRate && customRate > 500 ? customRate : tier.baseRatePerSqFt;

    const expectedCost = Math.round(builtUpAreaSqFt * baseRate);
    const minCost = Math.round(expectedCost * 0.94); // -6% market variance
    const maxCost = Math.round(expectedCost * 1.08); // +8% escalation buffer

    const packages = WORK_PACKAGES.map(pkg => {
      const pkgCost = Math.round(expectedCost * (pkg.sharePercent / 100));
      const ratePerSqFt = Math.round(baseRate * (pkg.sharePercent / 100));
      return {
        ...pkg,
        cost: pkgCost,
        ratePerSqFt,
        costFormatted: this.formatCurrency(pkgCost)
      };
    });

    return {
      tierId: tier.id,
      tierName: tier.name,
      tierDescription: tier.description,
      builtUpAreaSqFt: Math.round(builtUpAreaSqFt),
      baseRatePerSqFt: baseRate,
      range: {
        min: minCost,
        expected: expectedCost,
        max: maxCost,
        minFormatted: this.formatCurrency(minCost),
        expectedFormatted: this.formatCurrency(expectedCost),
        maxFormatted: this.formatCurrency(maxCost)
      },
      packages,
      disclaimer: 'Preliminary conceptual estimate based on prevailing regional construction indices. Site soil conditions, structural design, and contractor selection may vary final costs.'
    };
  }

  static formatCurrency(val) {
    // Formats in standard Indian Lakhs / Crores or Western Thousands
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }
}
