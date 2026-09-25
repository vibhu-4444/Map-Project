/**
 * Automated CLI Test Suite Runner
 * Executes unit tests for computational geometry, spatial feasibility, and architectural validator.
 */

import { runGeometryTests } from './test-geometry.js';
import { runFeasibilityTests } from './test-feasibility.js';
import { runValidatorTests } from './test-validator.js';

let passed = 0;
let failed = 0;
const errors = [];

const assert = {
  ok(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${message}`);
    } else {
      failed++;
      errors.push(`FAIL: ${message}`);
      console.error(`  ✗ FAIL: ${message}`);
    }
  },
  equal(actual, expected, message) {
    if (actual === expected) {
      passed++;
      console.log(`  ✓ PASS: ${message}`);
    } else {
      failed++;
      const msg = `${message} (Expected: ${expected}, Actual: ${actual})`;
      errors.push(`FAIL: ${msg}`);
      console.error(`  ✗ FAIL: ${msg}`);
    }
  }
};

console.log('========================================================');
console.log(' AI Residential Floor-Plan Architect — Unit Test Runner');
console.log('========================================================\n');

console.log('>> Running Computational Geometry Tests...');
try {
  runGeometryTests(assert);
} catch (e) {
  failed++;
  console.error('  ✗ Exception in geometry tests:', e);
}

console.log('\n>> Running Spatial Feasibility Engine Tests...');
try {
  runFeasibilityTests(assert);
} catch (e) {
  failed++;
  console.error('  ✗ Exception in feasibility tests:', e);
}

console.log('\n>> Running Constraint & Code Validator Tests...');
try {
  runValidatorTests(assert);
} catch (e) {
  failed++;
  console.error('  ✗ Exception in validator tests:', e);
}

console.log('\n--------------------------------------------------------');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('--------------------------------------------------------');

if (failed > 0) {
  console.error('\nTest Suite Failed with errors:');
  errors.forEach(e => console.error(` - ${e}`));
  process.exit(1);
} else {
  console.log('\n✓ All Test Suites Passed Successfully!');
  process.exit(0);
}
