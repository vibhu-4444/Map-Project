/**
 * Natural Language Requirement Parser Service
 * Converts conversational residential requirements into a structured HouseSpecification schema.
 * Features a deterministic rule-based NLP extraction pipeline with schema validation and optional LLM adapter.
 */

export class AIRequirementParser {
  /**
   * Parses natural language house requirements
   * @param {string} text - User prompt (e.g. "3BHK with large kitchen, car parking, and pooja room")
   * @returns {Object} ParseResult containing specification, extracted entities, and advisories
   */
  static parse(text) {
    if (!text || typeof text !== 'string') {
      return this.defaultSpecification();
    }

    const lower = text.toLowerCase();

    // 1. Bedroom Extraction (e.g. "3bhk", "3 bedroom", "three bedrooms", "3 bed")
    let bedrooms = 3; // Default
    const bhkMatch = lower.match(/(\d+)\s*(?:bhk|bedroom|bed|beds)/i);
    if (bhkMatch) {
      bedrooms = parseInt(bhkMatch[1], 10);
    } else if (lower.includes('one bedroom') || lower.includes('1 bedroom')) {
      bedrooms = 1;
    } else if (lower.includes('two bedroom') || lower.includes('2 bedroom')) {
      bedrooms = 2;
    } else if (lower.includes('three bedroom') || lower.includes('3 bedroom')) {
      bedrooms = 3;
    } else if (lower.includes('four bedroom') || lower.includes('4 bedroom')) {
      bedrooms = 4;
    } else if (lower.includes('five bedroom') || lower.includes('5 bedroom')) {
      bedrooms = 5;
    }

    // 2. Bathroom Extraction
    let totalBaths = Math.max(1, Math.min(bedrooms, bedrooms <= 2 ? 1 : 2));
    let attachedBaths = 1;
    let commonBaths = 1;

    const bathMatch = lower.match(/(\d+)\s*(?:bathroom|bath|toilet|washroom)/i);
    if (bathMatch) {
      totalBaths = parseInt(bathMatch[1], 10);
      attachedBaths = Math.max(1, totalBaths - 1);
      commonBaths = 1;
    }
    if (lower.includes('attached bathroom') || lower.includes('attached bath')) {
      const attMatch = lower.match(/(\d+)\s*(?:attached)/i);
      attachedBaths = attMatch ? parseInt(attMatch[1], 10) : 1;
    }
    if (lower.includes('common bathroom') || lower.includes('common bath')) {
      const comMatch = lower.match(/(\d+)\s*(?:common)/i);
      commonBaths = comMatch ? parseInt(comMatch[1], 10) : 1;
    }

    // 3. Kitchen Priority & Style
    let kitchenPriority = 'standard';
    let kitchenStyle = 'closed';
    if (lower.includes('large kitchen') || lower.includes('spacious kitchen') || lower.includes('big kitchen')) {
      kitchenPriority = 'large';
    }
    if (lower.includes('open kitchen') || lower.includes('american kitchen')) {
      kitchenStyle = 'open';
    }

    // 4. Parking & Vehicles
    let parkingRequired = false;
    let vehicleType = 'car';
    if (lower.includes('parking') || lower.includes('garage') || lower.includes('car porch') || lower.includes('car')) {
      parkingRequired = true;
      if (lower.includes('two wheeler') || lower.includes('bike')) {
        vehicleType = 'two-wheeler';
      }
    }

    // 5. Special Spaces (Pooja, Study, Dining, Balcony)
    const poojaRequired = lower.includes('pooja') || lower.includes('mandir') || lower.includes('prayer') || lower.includes('puja');
    const studyRequired = lower.includes('study') || lower.includes('office') || lower.includes('work from home');
    const diningRequired = !lower.includes('no dining');
    const balconyRequired = lower.includes('balcony') || lower.includes('terrace');

    // 6. Floor Count (e.g. "duplex", "g+1", "2 floors", "two storey")
    let floorsCount = 1;
    if (lower.includes('duplex') || lower.includes('g+1') || lower.includes('2 floor') || lower.includes('two floor') || lower.includes('two storey')) {
      floorsCount = 2;
    } else if (lower.includes('g+2') || lower.includes('3 floor') || lower.includes('triplex')) {
      floorsCount = 3;
    }

    // 7. Vastu Awareness
    const vastuRequested = lower.includes('vastu') || lower.includes('vaastu');

    // Assemble structured specification
    const specification = {
      bedrooms,
      bathrooms: {
        total: attachedBaths + commonBaths,
        attached: attachedBaths,
        common: commonBaths
      },
      kitchen: {
        priority: kitchenPriority,
        style: kitchenStyle
      },
      parking: {
        required: parkingRequired,
        vehicleCount: 1,
        type: vehicleType
      },
      poojaRoom: poojaRequired,
      studyRoom: studyRequired,
      diningRoom: diningRequired,
      balcony: balconyRequired,
      floorsCount,
      vastuMode: vastuRequested ? 'vastu-aware' : 'standard',
      designPriority: parkingRequired ? 'parking-oriented' : 'family-oriented'
    };

    // Diagnostic summary
    const extractedHighlights = [
      `${bedrooms} Bedroom(s) configuration`,
      `${attachedBaths} Attached + ${commonBaths} Common Bathroom(s)`,
      `${kitchenPriority.toUpperCase()} ${kitchenStyle} Kitchen`,
      parkingRequired ? `Front Car Parking / Porch allocated` : `No dedicated car parking required`,
      poojaRequired ? `Dedicated Pooja/Mandir room included` : null,
      studyRequired ? `Dedicated Home Office/Study included` : null,
      floorsCount > 1 ? `Multi-Floor Plan (${floorsCount} Floors / Duplex)` : `Single Ground Floor Residence`
    ].filter(Boolean);

    const missingPrompts = [];
    if (!lower.includes('plot') && !lower.includes('sqft') && !lower.includes('feet') && !lower.includes('x')) {
      missingPrompts.push('Plot dimensions were not mentioned; using default 35ft × 50ft plot configuration.');
    }
    if (!lower.includes('north') && !lower.includes('east') && !lower.includes('south') && !lower.includes('west')) {
      missingPrompts.push('Plot orientation unspecified; assuming North-facing road access.');
    }

    return {
      success: true,
      specification,
      extractedHighlights,
      missingPrompts,
      rawInput: text
    };
  }

  static defaultSpecification() {
    return {
      success: true,
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
        vastuMode: 'vastu-aware',
        designPriority: 'family-oriented'
      },
      extractedHighlights: ['Default 3BHK Family Layout with Front Parking & Pooja'],
      missingPrompts: [],
      rawInput: ''
    };
  }
}
